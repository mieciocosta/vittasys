const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function calcMes(nasc, meses) {
  if (!nasc || meses == null) return null;
  const d = new Date(nasc);
  d.setMonth(d.getMonth() + meses);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
}

r.get('/', async (req, res, next) => { try {
  const { mes, margem_pct = '20' } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const margemPct = Math.max(0, Math.min(100, parseInt(margem_pct) || 20));
  const [anoN, mesN] = mes.split('-').map(Number);
  const mesExtenso  = `${MESES_PT[mesN - 1]} de ${anoN}`;
  const refInicio   = new Date(anoN, mesN - 1, 1);
  const refFim      = new Date(anoN, mesN, 0, 23, 59, 59);

  // ── 1. DOSES PREVISTAS DE PLANOS ATIVOS ──────────────────────────────
  const todasDosesPendentes = await prisma.planoContratadoDose.findMany({
    where: { status: 'pendente', planoContratado: { statusContrato: 'ativo', cliente: { status: 'ativo' } } },
    select: {
      id: true, doseNumero: true, mesPrevisto: true, competencia: true,
      vacinaId: true,
      vacina: { select: { id: true, nome: true } },
      planoContratado: {
        select: {
          id: true, nomePlano: true,
          cliente: { select: { id: true, pacienteNascimento: true, dataNascimento: true } }
        }
      }
    }
  });

  // Filtrar: doses previstas PARA o mês alvo
  const dosesNoMes = todasDosesPendentes.filter(d => {
    if (d.competencia) return d.competencia === mes;
    if (d.mesPrevisto == null) return false;
    const nasc = d.planoContratado.cliente.pacienteNascimento || d.planoContratado.cliente.dataNascimento;
    return calcMes(nasc, d.mesPrevisto) === mes;
  });

  // Todas as doses reservadas para qualquer mês futuro (estoque comprometido)
  const dosesReservadas = todasDosesPendentes.filter(d => {
    if (d.competencia) return d.competencia >= mes;
    if (d.mesPrevisto == null) return false;
    const nasc = d.planoContratado.cliente.pacienteNascimento || d.planoContratado.cliente.dataNascimento;
    const m = calcMes(nasc, d.mesPrevisto);
    return m && m >= mes;
  });

  // ── 2. MÉDIA HISTÓRICA (últimos 6 meses de aplicações) ───────────────
  const seisAtras = new Date(refInicio);
  seisAtras.setMonth(seisAtras.getMonth() - 6);

  const aplicacoesHistoricas = await prisma.movimentacao.groupBy({
    by: ['vacinaId'],
    where: {
      tipo: 'aplicacao',
      status: { in: ['concluido','aprovado'] },
      dataHora: { gte: seisAtras, lt: refInicio },
      vacinaId: { not: null }
    },
    _sum: { quantidade: true },
    _count: { id: true }
  });

  // Média mensal por vacina (dividido por 6 meses)
  const mediaMap = {};
  for (const h of aplicacoesHistoricas) {
    mediaMap[h.vacinaId] = Math.round((h._sum.quantidade || 0) / 6);
  }

  // ── 3. ESTOQUE ATUAL ─────────────────────────────────────────────────
  const lotes = await prisma.lote.findMany({
    where: { status: { not: 'inativo' } },
    select: {
      id: true, numeroLote: true, validade: true,
      quantidadeDisponivel: true, fabricante: true,
      vacina: { select: { id: true, nome: true } }
    }
  });

  const estoqueMap = {}; // vacinaId → { disponivel, lotes: [], vencendo: [] }
  for (const l of lotes) {
    const vid = l.vacina.id;
    if (!estoqueMap[vid]) estoqueMap[vid] = { disponivel: 0, lotes: [], vencendo: [] };
    estoqueMap[vid].disponivel += l.quantidadeDisponivel;
    estoqueMap[vid].lotes.push(l);
    // Lotes vencendo nos próximos 60 dias
    if (l.validade) {
      const diffDias = (new Date(l.validade) - refInicio) / (1000*60*60*24);
      if (diffDias <= 60 && diffDias > 0) estoqueMap[vid].vencendo.push({ lote: l.numeroLote, validade: l.validade, qtd: l.quantidadeDisponivel });
    }
  }

  // ── 4. MONTAR RESULTADO POR VACINA ───────────────────────────────────
  // Universo de vacinas = todas com doses no mês + todas com histórico + todas com estoque
  const vacinaIds = new Set([
    ...dosesNoMes.map(d => d.vacinaId),
    ...Object.keys(mediaMap).map(Number),
    ...Object.keys(estoqueMap).map(Number)
  ]);

  // Nomes das vacinas
  const vacinasInfo = await prisma.vacina.findMany({
    where: { id: { in: [...vacinaIds] } },
    select: { id: true, nome: true }
  });
  const vacinaNomeMap = Object.fromEntries(vacinasInfo.map(v => [v.id, v.nome]));

  // Reservas por vacina (doses futuras comprometidas)
  const reservasMap = {};
  for (const d of dosesReservadas) {
    reservasMap[d.vacinaId] = (reservasMap[d.vacinaId] || 0) + 1;
  }

  // Doses do mês por vacina
  const demandaPlanosMap = {};
  const pacientesMap = {};
  for (const d of dosesNoMes) {
    demandaPlanosMap[d.vacinaId] = (demandaPlanosMap[d.vacinaId] || 0) + 1;
    if (!pacientesMap[d.vacinaId]) pacientesMap[d.vacinaId] = [];
    const nasc = d.planoContratado.cliente.pacienteNascimento || d.planoContratado.cliente.dataNascimento;
    pacientesMap[d.vacinaId].push({
      plano: d.planoContratado.nomePlano,
      dose: d.doseNumero
    });
  }

  const tabela = [];
  for (const vid of vacinaIds) {
    const nome = vacinaNomeMap[vid] || `Vacina #${vid}`;
    const demandaPlanos = demandaPlanosMap[vid] || 0;
    const mediaHist     = mediaMap[vid] || 0;

    // Demanda total = doses de planos + média histórica de espontâneos (não atrelados a plano)
    // Evita dupla contagem: histórico já inclui doses de planos, então usa max
    const demandaPrevista = Math.max(demandaPlanos, Math.round(mediaHist));

    const estoqueAtual = estoqueMap[vid]?.disponivel || 0;
    const dosesReserv  = reservasMap[vid] || 0;
    const estoqueDisp  = Math.max(0, estoqueAtual - dosesReserv);
    const margem       = Math.ceil(demandaPrevista * margemPct / 100);
    const sugestao     = Math.max(0, demandaPrevista + margem - estoqueDisp);
    const vencendo     = estoqueMap[vid]?.vencendo || [];

    // Status
    let status = 'ok';
    if (sugestao > 0 && sugestao <= demandaPrevista * 0.5) status = 'atencao';
    if (sugestao > demandaPrevista * 0.5) status = 'urgente';
    if (vencendo.length > 0 && status === 'ok') status = 'atencao';

    // Só inclui vacinas com algum dado relevante
    if (demandaPrevista === 0 && estoqueAtual === 0) continue;

    tabela.push({
      vacina_id: vid, nome, demanda_prevista: demandaPrevista,
      demanda_planos: demandaPlanos, media_historica: mediaHist,
      estoque_atual: estoqueAtual, doses_reservadas: dosesReserv,
      estoque_disponivel: estoqueDisp, margem_seguranca: margem,
      sugestao_compra: sugestao, status,
      lotes_vencendo: vencendo,
      pacientes_sample: (pacientesMap[vid] || []).slice(0, 3)
    });
  }

  // Ordenar: urgente > atencao > ok; depois por sugestao desc
  const ord = { urgente: 0, atencao: 1, ok: 2 };
  tabela.sort((a, b) => (ord[a.status] - ord[b.status]) || (b.sugestao_compra - a.sugestao_compra));

  res.json({
    mes, mes_extenso: mesExtenso,
    margem_pct: margemPct,
    totais: {
      vacinas: tabela.length,
      urgentes: tabela.filter(v => v.status === 'urgente').length,
      atencao:  tabela.filter(v => v.status === 'atencao').length,
      ok:       tabela.filter(v => v.status === 'ok').length,
      total_sugestao: tabela.reduce((s, v) => s + v.sugestao_compra, 0)
    },
    tabela
  });
} catch (e) { console.error('estimativas:', e.message, e.stack); next(e) }});

module.exports = r;
