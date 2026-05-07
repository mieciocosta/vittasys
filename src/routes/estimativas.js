const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Adiciona N meses inteiros a uma data, retorna nova Date
function somarMeses(base, n) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + Math.round(n));
  return d;
}

// Retorna 'YYYY-MM' de uma data
function toMesStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// ═══════════════════════════════════════════════════════════════════════════
r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const mesExtenso   = `${MESES_PT[mesN - 1]} de ${anoN}`;
  const refInicio    = new Date(anoN, mesN - 1, 1);

  // ── 1. Todos os planos ativos com vacinas do calendário ───────────────
  const planos = await prisma.planoContratado.findMany({
    where: { statusContrato: 'ativo' },
    select: {
      id: true,
      nomePlano: true,
      idadeInicio: true,
      idadeFim: true,
      // Vacinas do template (calendário vacinal do plano)
      plano: {
        select: {
          vacinas: {
            select: {
              vacinaId: true,
              doses: true,
              mesPrevInicio: true,
              mesPrevFim: true,
              vacina: { select: { id: true, nome: true } }
            }
          }
        }
      },
      // Cliente com data de nascimento
      cliente: {
        select: {
          id: true,
          nome: true,
          status: true,
          dataNascimento: true,
          pacienteNome: true,
          pacienteNascimento: true,
          // Doses já aplicadas a este cliente (para não contar novamente)
          movimentacoes: {
            where: { tipo: 'aplicacao', status: { in: ['concluido', 'aprovado'] } },
            select: { vacinaId: true, id: true }
          }
        }
      }
    }
  });

  // ── 2. Para cada plano, calcular quais vacinas estão previstas no mês ─
  const previsoes = []; // { vacinaId, vacinaNome, clienteId, ..., dataPrevista }

  let dbgSemNascimento = 0;
  let dbgSemCalendario = 0;
  let dbgTotalCalc     = 0;

  for (const pc of planos) {
    if (pc.cliente.status !== 'ativo') continue;

    // Data de nascimento do paciente
    const nasc = pc.cliente.pacienteNascimento || pc.cliente.dataNascimento;
    if (!nasc) { dbgSemNascimento++; continue; }

    // Calendário vacinal do plano (template)
    const calendario = pc.plano?.vacinas || [];
    if (!calendario.length) { dbgSemCalendario++; continue; }

    // Vacinas já aplicadas a este cliente (Set de vacinaId)
    // Para decidir qual dose vem a seguir, contar por vacina
    const aplicadasCount = {};
    for (const m of pc.cliente.movimentacoes) {
      if (m.vacinaId) aplicadasCount[m.vacinaId] = (aplicadasCount[m.vacinaId] || 0) + 1;
    }

    dbgTotalCalc++;

    for (const pv of calendario) {
      const vid          = pv.vacinaId;
      const totalDoses   = pv.doses || 1;
      const inicio       = pv.mesPrevInicio ?? 0;
      const fim          = pv.mesPrevFim    ?? inicio;
      const jaAplicadas  = aplicadasCount[vid] || 0;

      if (jaAplicadas >= totalDoses) continue; // todas as doses já foram aplicadas

      // Para cada dose ainda pendente, calcular se cai no mês alvo
      for (let doseNum = jaAplicadas + 1; doseNum <= totalDoses; doseNum++) {
        // Interpola a idade esperada para esta dose
        // doses=1: idade = inicio
        // doses=2: D1=inicio, D2=fim
        // doses=3: D1=inicio, D2=meio, D3=fim
        const idadeEsperada = totalDoses === 1
          ? inicio
          : inicio + (fim - inicio) * (doseNum - 1) / (totalDoses - 1);

        // Data prevista = nascimento + idadeEsperada meses
        const dataPrev  = somarMeses(nasc, idadeEsperada);
        const mesDose   = toMesStr(dataPrev);

        if (mesDose === mes) {
          previsoes.push({
            vacinaId:       vid,
            vacinaNome:     pv.vacina.nome,
            clienteId:      pc.cliente.id,
            clienteNome:    pc.cliente.nome,
            pacienteNome:   pc.cliente.pacienteNome || pc.cliente.nome,
            planoNome:      pc.nomePlano,
            doseNumero:     doseNum,
            totalDoses,
            idadeEsperada:  Math.round(idadeEsperada),
            dataPrevista:   dataPrev.toISOString().slice(0, 10),
            mesDose
          });
          // Só adicionar a próxima dose pendente (não todas as futuras)
          break;
        }

        // Se a dose esperada já passou do mês alvo, não há mais doses futuras neste mês
        if (mesDose > mes) break;
      }
    }
  }

  // ── 3. Deduplicar: um cliente+vacina conta apenas uma vez no mês ─────
  const seen    = new Set();
  const dedupPrevisoes = previsoes.filter(p => {
    const key = `${p.vacinaId}-${p.clienteId}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  // ── 4. Estoque atual por vacina ───────────────────────────────────────
  const lotes = await prisma.lote.findMany({
    where: { status: { not: 'inativo' } },
    select: {
      id: true, numeroLote: true, validade: true,
      quantidadeDisponivel: true,
      vacina: { select: { id: true, nome: true } }
    }
  });
  const estoqueMap  = {};
  const vencendoMap = {};
  for (const l of lotes) {
    const vid = l.vacina.id;
    if (!estoqueMap[vid]) { estoqueMap[vid] = 0; vencendoMap[vid] = []; }
    estoqueMap[vid] += l.quantidadeDisponivel;
    if (l.validade) {
      const dias = (new Date(l.validade) - refInicio) / (1000*60*60*24);
      if (dias > 0 && dias <= 60)
        vencendoMap[vid].push(`${l.numeroLote} (${new Date(l.validade).toLocaleDateString('pt-BR')})`);
    }
  }

  // ── 5. Reservas: total de doses previstas a partir do mês alvo ────────
  // Para cada vacina, soma todas as previsões futuras (este mês + meses seguintes)
  // Representa estoque já comprometido
  const reservasPorVacina = {};
  for (const pc of planos) {
    if (pc.cliente.status !== 'ativo') continue;
    const nasc = pc.cliente.pacienteNascimento || pc.cliente.dataNascimento;
    if (!nasc || !pc.plano?.vacinas?.length) continue;
    const aplicadasCount = {};
    for (const m of pc.cliente.movimentacoes) {
      if (m.vacinaId) aplicadasCount[m.vacinaId] = (aplicadasCount[m.vacinaId] || 0) + 1;
    }
    for (const pv of pc.plano.vacinas) {
      const vid = pv.vacinaId;
      const totalDoses  = pv.doses || 1;
      const inicio      = pv.mesPrevInicio ?? 0;
      const fim         = pv.mesPrevFim    ?? inicio;
      const jaAplicadas = aplicadasCount[vid] || 0;
      for (let dn = jaAplicadas + 1; dn <= totalDoses; dn++) {
        const idadeEsp = totalDoses === 1 ? inicio : inicio + (fim - inicio) * (dn - 1) / (totalDoses - 1);
        const mDose    = toMesStr(somarMeses(nasc, idadeEsp));
        if (mDose >= mes) {
          reservasPorVacina[vid] = (reservasPorVacina[vid] || 0) + 1;
        }
      }
    }
  }

  // ── 6. Agrupar previsões por vacina ───────────────────────────────────
  const vacinaMap = {};
  for (const p of dedupPrevisoes) {
    const vid = p.vacinaId;
    if (!vacinaMap[vid]) {
      vacinaMap[vid] = {
        vacina_id: vid,
        nome:      p.vacinaNome,
        quantidade: 0,
        pacientes: []
      };
    }
    vacinaMap[vid].quantidade++;
    vacinaMap[vid].pacientes.push({
      paciente_nome:    p.pacienteNome,
      responsavel:      p.clienteNome,
      plano_nome:       p.planoNome,
      dose_numero:      p.doseNumero,
      total_doses:      p.totalDoses,
      idade_esperada:   p.idadeEsperada,
      data_prevista:    p.dataPrevista
    });
  }

  // ── 7. Montar tabela final ────────────────────────────────────────────
  const tabela = Object.values(vacinaMap).map(v => {
    const estAtual   = estoqueMap[v.vacina_id] || 0;
    const reserv     = reservasPorVacina[v.vacina_id] || 0;
    const disponivel = Math.max(0, estAtual - reserv);
    const sugestao   = Math.max(0, v.quantidade - disponivel);
    const venc       = vencendoMap[v.vacina_id] || [];

    let status = 'ok';
    if (sugestao >= v.quantidade) status = 'urgente';
    else if (sugestao > 0 || venc.length) status = 'atencao';

    v.pacientes.sort((a, b) =>
      (a.data_prevista || '').localeCompare(b.data_prevista || '') ||
      a.paciente_nome.localeCompare(b.paciente_nome));

    return { ...v, estoque_atual: estAtual, doses_reservadas: reserv,
      estoque_disponivel: disponivel, sugestao_compra: sugestao,
      status, lotes_vencendo: venc };
  }).sort((a, b) => {
    const ord = { urgente:0, atencao:1, ok:2 };
    return (ord[a.status] - ord[b.status]) || (b.sugestao_compra - a.sugestao_compra);
  });

  res.json({
    mes, mes_extenso: mesExtenso,
    totais: {
      vacinas: tabela.length,
      doses_previstas: dedupPrevisoes.length,
      urgentes: tabela.filter(v=>v.status==='urgente').length,
      atencao:  tabela.filter(v=>v.status==='atencao').length,
      ok:       tabela.filter(v=>v.status==='ok').length
    },
    tabela,
    debug: {
      planos_ativos_total:   planos.length,
      planos_cliente_ativo:  planos.filter(p=>p.cliente.status==='ativo').length,
      planos_sem_nascimento: dbgSemNascimento,
      planos_sem_calendario: dbgSemCalendario,
      planos_calculados:     dbgTotalCalc,
      previsoes_brutas:      previsoes.length,
      previsoes_dedup:       dedupPrevisoes.length
    }
  });
} catch (e) { console.error('estimativas error:', e.message, e.stack); next(e) }});

module.exports = r;
