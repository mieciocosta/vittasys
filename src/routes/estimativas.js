const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function addMeses(base, n) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + Math.round(n));
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const mesExtenso   = `${MESES_PT[mesN - 1]} de ${anoN}`;
  const refInicio    = new Date(anoN, mesN - 1, 1);

  // ── Busca todos os planos ativos com tudo que precisamos ──────────────
  const planos = await prisma.planoContratado.findMany({
    where: { statusContrato: 'ativo' },
    select: {
      id: true, nomePlano: true, planoId: true,
      // Calendário do template (para planos com template)
      plano: {
        select: {
          vacinas: {
            select: {
              vacinaId: true, doses: true,
              mesPrevInicio: true, mesPrevFim: true,
              vacina: { select: { id: true, nome: true } }
            }
          }
        }
      },
      // Doses já programadas (para planos personalizados SEM template)
      doses: {
        select: {
          vacinaId: true, doseNumero: true, mesPrevisto: true, status: true,
          vacina: { select: { id: true, nome: true } }
        }
      },
      cliente: {
        select: {
          id: true, nome: true, status: true,
          dataNascimento: true,
          pacienteNome: true, pacienteNascimento: true,
          // Vacinas já aplicadas
          movimentacoes: {
            where: { tipo: 'aplicacao', status: { in: ['concluido', 'aprovado'] } },
            select: { vacinaId: true }
          }
        }
      }
    }
  });

  const previsoes = [];
  const debug = { planos: planos.length, sem_nascimento: 0, com_template: 0, sem_template: 0, calculados: 0 };

  for (const pc of planos) {
    // Data de nascimento do paciente
    const nasc = pc.cliente.pacienteNascimento || pc.cliente.dataNascimento;
    if (!nasc) { debug.sem_nascimento++; continue; }

    // Contagem de vacinas já aplicadas
    const aplicadas = {};
    for (const m of pc.cliente.movimentacoes) {
      if (m.vacinaId) aplicadas[m.vacinaId] = (aplicadas[m.vacinaId] || 0) + 1;
    }

    debug.calculados++;

    // ── CASO A: plano tem template → usar PlanoVacina (calendário) ───
    const calendario = pc.plano?.vacinas || [];
    if (calendario.length > 0) {
      debug.com_template++;
      for (const pv of calendario) {
        const vid        = pv.vacinaId;
        const totalDoses = pv.doses || 1;
        const inicio     = pv.mesPrevInicio ?? 0;
        const fim        = pv.mesPrevFim    ?? inicio;
        const jaAplic    = aplicadas[vid]   || 0;

        for (let dn = jaAplic + 1; dn <= totalDoses; dn++) {
          const idadeEsp = totalDoses === 1 ? inicio
            : inicio + (fim - inicio) * (dn - 1) / (totalDoses - 1);
          const mesDose = addMeses(nasc, idadeEsp);

          if (mesDose === mes) {
            previsoes.push({
              vacinaId: vid, vacinaNome: pv.vacina.nome,
              clienteId: pc.cliente.id, clienteNome: pc.cliente.nome,
              pacienteNome: pc.cliente.pacienteNome || pc.cliente.nome,
              planoNome: pc.nomePlano, doseNumero: dn, totalDoses,
              idadeEsperada: Math.round(idadeEsp),
              dataPrevista: (() => { const d=new Date(nasc);d.setMonth(d.getMonth()+Math.round(idadeEsp));return d.toISOString().slice(0,10); })()
            });
            break;
          }
          if (mesDose > mes) break;
        }
      }
    } else {
      // ── CASO B: plano SEM template → usar doses programadas com dataNasc + mesPrevisto ─
      debug.sem_template++;
      const dosesPorVacina = {};
      for (const d of pc.doses) {
        if (!d.vacinaId || d.mesPrevisto == null) continue;
        if (!dosesPorVacina[d.vacinaId]) dosesPorVacina[d.vacinaId] = [];
        dosesPorVacina[d.vacinaId].push(d);
      }

      for (const [vidStr, doses] of Object.entries(dosesPorVacina)) {
        const vid     = parseInt(vidStr);
        const jaAplic = aplicadas[vid] || 0;
        const sorted  = doses.sort((a,b) => (a.mesPrevisto||0) - (b.mesPrevisto||0));

        for (const dose of sorted) {
          if (dose.status === 'aplicada') continue;
          const dn = dose.doseNumero || 1;
          if (dn <= jaAplic) continue; // já foi aplicada

          // Calcular data usando NASCIMENTO + mesPrevisto (não dataInicioPlano)
          const mesDose = addMeses(nasc, dose.mesPrevisto);
          if (mesDose === mes) {
            previsoes.push({
              vacinaId: vid, vacinaNome: dose.vacina?.nome || `Vacina #${vid}`,
              clienteId: pc.cliente.id, clienteNome: pc.cliente.nome,
              pacienteNome: pc.cliente.pacienteNome || pc.cliente.nome,
              planoNome: pc.nomePlano, doseNumero: dn, totalDoses: sorted.length,
              idadeEsperada: dose.mesPrevisto,
              dataPrevista: (() => { const d=new Date(nasc);d.setMonth(d.getMonth()+dose.mesPrevisto);return d.toISOString().slice(0,10); })()
            });
            break;
          }
          if (mesDose > mes) break;
        }
      }
    }
  }

  // Deduplicar: mesma vacina + mesmo cliente conta 1 vez
  const seen = new Set();
  const dedup = previsoes.filter(p => {
    const k = `${p.vacinaId}-${p.clienteId}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  // Estoque atual por vacina
  const lotes = await prisma.lote.findMany({
    where: { status: { not: 'inativo' } },
    select: { id: true, numeroLote: true, validade: true,
      quantidadeDisponivel: true, vacina: { select: { id: true, nome: true } } }
  });
  const estMap  = {};
  const vencMap = {};
  for (const l of lotes) {
    const vid = l.vacina.id;
    if (!estMap[vid]) { estMap[vid] = 0; vencMap[vid] = []; }
    estMap[vid] += l.quantidadeDisponivel;
    if (l.validade) {
      const dias = (new Date(l.validade) - refInicio) / (864e5);
      if (dias > 0 && dias <= 60) vencMap[vid].push(`${l.numeroLote} vence ${new Date(l.validade).toLocaleDateString('pt-BR')}`);
    }
  }

  // Agrupar por vacina
  const vacinaMap = {};
  for (const p of dedup) {
    if (!vacinaMap[p.vacinaId]) vacinaMap[p.vacinaId] = { vacina_id: p.vacinaId, nome: p.vacinaNome, quantidade: 0, pacientes: [] };
    vacinaMap[p.vacinaId].quantidade++;
    vacinaMap[p.vacinaId].pacientes.push({
      paciente_nome: p.pacienteNome, responsavel: p.clienteNome,
      plano_nome: p.planoNome, dose_numero: p.doseNumero,
      idade_esperada: p.idadeEsperada, data_prevista: p.dataPrevista
    });
  }

  const tabela = Object.values(vacinaMap).map(v => {
    const est  = estMap[v.vacina_id]  || 0;
    const sug  = Math.max(0, v.quantidade - est);
    let status = 'ok';
    if (sug >= v.quantidade) status = 'urgente';
    else if (sug > 0 || (vencMap[v.vacina_id]||[]).length) status = 'atencao';
    v.pacientes.sort((a,b) => (a.data_prevista||'').localeCompare(b.data_prevista||'') || a.paciente_nome.localeCompare(b.paciente_nome));
    return { ...v, estoque_atual: est, sugestao_compra: sug, status, lotes_vencendo: vencMap[v.vacina_id]||[] };
  }).sort((a,b) => ({ urgente:0, atencao:1, ok:2 }[a.status] - { urgente:0, atencao:1, ok:2 }[b.status]) || b.sugestao_compra - a.sugestao_compra);

  res.json({
    mes, mes_extenso: mesExtenso,
    totais: { vacinas: tabela.length, doses_previstas: dedup.length,
      urgentes: tabela.filter(v=>v.status==='urgente').length,
      atencao: tabela.filter(v=>v.status==='atencao').length,
      ok: tabela.filter(v=>v.status==='ok').length },
    tabela,
    debug: { ...debug, previsoes_brutas: previsoes.length, previsoes_dedup: dedup.length }
  });
} catch (e) { console.error('estimativas:', e.message, e.stack); next(e) }});

module.exports = r;
