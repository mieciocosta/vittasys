const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function idadeMeses(nasc, ref) {
  if (!nasc) return null;
  return Math.floor((new Date(ref) - new Date(nasc)) / (1000*60*60*24*30.44));
}
function fmtIdade(m) {
  if (m === null || m < 0) return '-';
  if (m < 24) return m + (m === 1 ? ' mês' : ' meses');
  const a = Math.floor(m / 12);
  return a + (a === 1 ? ' ano' : ' anos');
}

r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const refDate    = new Date(anoN, mesN - 1, 1);
  const mesExtenso = `${MESES_PT[mesN - 1]} de ${anoN}`;

  // ── 1. Planos contratados ativos + cliente + plano template + vacinas ─
  const planosAtivos = await prisma.planoContratado.findMany({
    where: { statusContrato: 'ativo', cliente: { status: 'ativo' } },
    select: {
      id: true, nomePlano: true, planoId: true,
      // Vacinas do plano contratado personalizado (se tipoPlano = 'personalizado')
      doses: {
        where: { status: 'pendente' },
        select: { vacinaId: true, doseNumero: true, mesPrevisto: true,
          vacina: { select: { id: true, nome: true, fabricante: true } } }
      },
      // Plano template com calendário vacinal
      plano: {
        select: {
          planoVacinas: {
            select: {
              vacinaId: true, doses: true,
              mesPrevInicio: true, mesPrevFim: true,
              vacina: { select: { id: true, nome: true, fabricante: true } }
            }
          }
        }
      },
      cliente: {
        select: {
          id: true, nome: true, tipoCliente: true,
          dataNascimento: true,
          pacienteNome: true, pacienteNascimento: true,
          // Vacinas já aplicadas (para não incluir o que já foi feito)
          movimentacoes: {
            where: { status: 'concluido' },
            select: { vacinaId: true }
          }
        }
      }
    }
  });

  // ── 2. Para cada plano: cruzar idade do paciente × calendário do plano ─
  const resultado = []; // { vacina, cliente, plano_nome, idade, dose_numero }

  for (const pc of planosAtivos) {
    const c = pc.cliente;
    const nasc = c.pacienteNascimento || c.dataNascimento;
    if (!nasc) continue;

    const idadeMes = idadeMeses(nasc, refDate);
    if (idadeMes === null || idadeMes < 0) continue;

    const jaRecebeu = new Set(c.movimentacoes.map(m => m.vacinaId).filter(Boolean));

    // Calendário: usar plano template se existir, senão usar doses do contrato
    const calendario = pc.plano?.planoVacinas ?? [];

    if (calendario.length > 0) {
      // Plano padrão: cruzar faixa etária com idade no mês
      for (const pv of calendario) {
        const min = pv.mesPrevInicio ?? 0;
        const max = pv.mesPrevFim ?? 999;
        if (idadeMes < min || idadeMes > max) continue;
        if (jaRecebeu.has(pv.vacinaId)) continue;

        resultado.push({
          vacina_id:       pv.vacinaId,
          vacina_nome:     pv.vacina.nome,
          fabricante:      pv.vacina.fabricante || '',
          cliente_id:      c.id,
          cliente_nome:    c.nome,
          nome_paciente:   c.pacienteNome || c.nome,
          idade:           fmtIdade(idadeMes),
          plano_nome:      pc.nomePlano,
          dose_numero:     pv.doses ?? 1,
          faixa:           `${min}–${max} meses`
        });
      }
    } else if (pc.doses.length > 0) {
      // Plano personalizado: usar doses pendentes → verificar faixa por mesPrevisto
      for (const d of pc.doses) {
        if (!d.vacinaId) continue;
        if (jaRecebeu.has(d.vacinaId)) continue;
        const mprev = d.mesPrevisto ?? idadeMes;
        // Considera dose prevista para este mês se mesPrevisto bate com a idade atual
        if (Math.abs(mprev - idadeMes) > 1) continue; // tolerância ±1 mês

        resultado.push({
          vacina_id:    d.vacinaId,
          vacina_nome:  d.vacina.nome,
          fabricante:   d.vacina.fabricante || '',
          cliente_id:   c.id,
          cliente_nome: c.nome,
          nome_paciente:c.pacienteNome || c.nome,
          idade:        fmtIdade(idadeMes),
          plano_nome:   pc.nomePlano,
          dose_numero:  d.doseNumero ?? 1,
          faixa:        `~${mprev} meses`
        });
      }
    }
  }

  // ── 3. Deduplicar: um paciente pode ter mais de um plano → 1 entrada por (cliente, vacina) ─
  const seen = new Set();
  const dedup = resultado.filter(d => {
    const key = `${d.vacina_id}-${d.cliente_id}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  // ── 4. Agrupar por vacina ─────────────────────────────────────────────
  const vacinaMap = {};
  for (const d of dedup) {
    const vid = d.vacina_id;
    if (!vacinaMap[vid]) {
      vacinaMap[vid] = {
        vacina_id: vid, vacina_nome: d.vacina_nome,
        fabricante: d.fabricante, quantidade: 0, pacientes: []
      };
    }
    vacinaMap[vid].quantidade++;
    vacinaMap[vid].pacientes.push({
      cliente_id:       d.cliente_id,
      nome_responsavel: d.cliente_nome,
      nome_paciente:    d.nome_paciente,
      idade:            d.idade,
      dose_numero:      d.dose_numero,
      plano_nome:       d.plano_nome,
      faixa:            d.faixa
    });
  }

  const vacinas = Object.values(vacinaMap).sort((a, b) => b.quantidade - a.quantidade);

  res.json({
    mes, mes_extenso: mesExtenso,
    total_doses:     dedup.length,
    total_pacientes: new Set(dedup.map(d => d.cliente_id)).size,
    total_vacinas:   vacinas.length,
    vacinas
  });
} catch (e) { console.error('estimativas:', e.message, e.stack); next(e) }});

module.exports = r;
