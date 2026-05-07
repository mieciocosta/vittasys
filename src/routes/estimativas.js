const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Retorna 'YYYY-MM' adicionando meses a uma data base
function addMeses(base, n) {
  if (!base) return null;
  const d = new Date(base);
  d.setMonth(d.getMonth() + n);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

// Tenta determinar o mês previsto de uma dose usando todas as fontes disponíveis
function mesDaDose(dose, planoContratado) {
  // 1ª prioridade: competencia já calculada e armazenada
  if (dose.competencia) return dose.competencia;

  // 2ª prioridade: dataInicioPlano + mesPrevisto (como foi salvo originalmente)
  if (planoContratado.dataInicioPlano && dose.mesPrevisto != null) {
    return addMeses(planoContratado.dataInicioPlano, dose.mesPrevisto);
  }

  // 3ª prioridade: nascimento do paciente + mesPrevisto
  const c = planoContratado.cliente;
  const nasc = c.pacienteNascimento || c.dataNascimento;
  if (nasc && dose.mesPrevisto != null) {
    return addMeses(nasc, dose.mesPrevisto);
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
r.get('/', async (req, res, next) => { try {
  const { mes, margem_pct = '20' } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const margemPct  = Math.max(0, Math.min(200, parseInt(margem_pct) || 20));
  const [anoN, mesN] = mes.split('-').map(Number);
  const mesExtenso = `${MESES_PT[mesN - 1]} de ${anoN}`;
  const refInicio  = new Date(anoN, mesN - 1, 1);

  // ── 1. TODAS as doses pendentes de planos ativos ─────────────────────
  const todasDoses = await prisma.planoContratadoDose.findMany({
    where: {
      status: 'pendente',
      planoContratado: { statusContrato: 'ativo', cliente: { status: 'ativo' } }
    },
    select: {
      id: true, doseNumero: true, mesPrevisto: true, competencia: true,
      vacinaId: true,
      vacina: { select: { id: true, nome: true } },
      planoContratado: {
        select: {
          id: true, nomePlano: true, dataInicioPlano: true, statusContrato: true,
          cliente: {
            select: {
              id: true, nome: true,
              dataNascimento: true, pacienteNome: true, pacienteNascimento: true
            }
          }
        }
      }
    }
  });

  // Filtra doses cujo mês previsto é o mês alvo
  const dosesDoMes = todasDoses.filter(d => {
    const m = mesDaDose(d, d.planoContratado);
    return m === mes;
  });

  // ── 2. AGENDAMENTOS para o mês (movimentações pendentes do tipo aplicacao) ─
  const agendamentos = await prisma.movimentacao.findMany({
    where: {
      tipo: 'aplicacao',
      status: 'pendente',
      dataHora: {
        gte: new Date(anoN, mesN - 1, 1),
        lte: new Date(anoN, mesN - 1, 31, 23, 59, 59)
      },
      vacinaId: { not: null }
    },
    select: {
      id: true, vacinaId: true, dataHora: true, quantidade: true, observacoes: true,
      vacina: { select: { id: true, nome: true } },
      cliente: { select: { id: true, nome: true, pacienteNome: true } },
      planoContratadoId: true
    }
  });

  // ── 3. HISTÓRICO: média dos últimos 6 meses por vacina ───────────────
  const seisAtras = new Date(refInicio);
  seisAtras.setMonth(seisAtras.getMonth() - 6);

  const historico = await prisma.movimentacao.groupBy({
    by: ['vacinaId'],
    where: {
      tipo: 'aplicacao',
      status: { in: ['concluido', 'aprovado'] },
      dataHora: { gte: seisAtras, lt: refInicio },
      vacinaId: { not: null }
    },
    _sum: { quantidade: true }
  });
  const mediaMap = {};
  for (const h of historico) {
    mediaMap[h.vacinaId] = Math.round((h._sum.quantidade || 0) / 6);
  }

  // ── 4. ESTOQUE atual por vacina ───────────────────────────────────────
  const lotes = await prisma.lote.findMany({
    where: { status: { not: 'inativo' } },
    select: {
      id: true, numeroLote: true, validade: true,
      quantidadeDisponivel: true,
      vacina: { select: { id: true, nome: true } }
    }
  });
  const estoqueMap = {};
  for (const l of lotes) {
    const vid = l.vacina.id;
    if (!estoqueMap[vid]) estoqueMap[vid] = { disponivel: 0, vencendo: [] };
    estoqueMap[vid].disponivel += l.quantidadeDisponivel;
    if (l.validade) {
      const diasVenc = (new Date(l.validade) - refInicio) / (1000*60*60*24);
      if (diasVenc <= 60 && diasVenc > 0)
        estoqueMap[vid].vencendo.push({ lote: l.numeroLote, validade: l.validade, qtd: l.quantidadeDisponivel });
    }
  }

  // ── 5. RESERVAS: todas as doses futuras de planos (estoque comprometido) ─
  const reservasMap = {};
  for (const d of todasDoses) {
    const m = mesDaDose(d, d.planoContratado);
    if (m && m >= mes) {
      reservasMap[d.vacinaId] = (reservasMap[d.vacinaId] || 0) + 1;
    }
  }

  // ── 6. MONTAR VACINAS: universo = todas com doses no mês + agendamentos + histórico ─
  const vacinaIds = new Set([
    ...dosesDoMes.map(d => d.vacinaId),
    ...agendamentos.map(a => a.vacinaId).filter(Boolean),
    ...Object.keys(mediaMap).map(Number)
  ]);

  // Buscar nomes das vacinas que aparecem só no histórico/agendamentos
  const vacinasInfo = await prisma.vacina.findMany({
    where: { id: { in: [...vacinaIds] } },
    select: { id: true, nome: true }
  });
  const vacinaNomeMap = Object.fromEntries(vacinasInfo.map(v => [v.id, v.nome]));

  // ── 7. DEDUPLICAÇÃO e detalhes por vacina ────────────────────────────
  // Para cada dose de plano, verificar se já existe agendamento para mesma vacina+cliente
  const agendPorClienteVacina = new Set(
    agendamentos
      .filter(a => a.planoContratadoId)
      .map(a => `${a.vacinaId}-${a.cliente?.id}`)
  );

  const tabela = [];
  for (const vid of vacinaIds) {
    const nome = vacinaNomeMap[vid] || `Vacina #${vid}`;

    // Doses de planos para este mês
    const dosesPlanoVac = dosesDoMes.filter(d => d.vacinaId === vid);

    // Deduplicar: se dose de plano já tem agendamento, marcar como "prevista e agendada"
    let qtdPlanos = 0;
    let qtdAgendasNaoPlano = 0;
    const detalhes = [];

    for (const d of dosesPlanoVac) {
      const c = d.planoContratado.cliente;
      const chave = `${vid}-${c.id}`;
      const temAgendamento = agendPorClienteVacina.has(chave);
      qtdPlanos++;

      const dataPrevista = mesDaDose(d, d.planoContratado);
      const nasc = c.pacienteNascimento || c.dataNascimento;
      let idadeStr = '-';
      if (nasc && d.mesPrevisto != null) {
        const m = d.mesPrevisto;
        idadeStr = m < 24 ? `${m}m` : `${Math.floor(m/12)}a${m%12>0?m%12+'m':''}`;
      }

      detalhes.push({
        fonte: temAgendamento ? 'plano_e_agendado' : 'plano',
        paciente_nome: c.pacienteNome || c.nome,
        responsavel_nome: c.nome,
        plano_nome: d.planoContratado.nomePlano,
        dose_numero: d.doseNumero,
        data_prevista_mes: dataPrevista,
        idade_prevista: idadeStr,
        status_dose: temAgendamento ? 'Prevista e Agendada' : 'Prevista no plano',
        agendada: temAgendamento,
        aplicada: false
      });
    }

    // Agendamentos SEM vínculo com plano ativo
    const agendSemPlano = agendamentos.filter(a => a.vacinaId === vid && !a.planoContratadoId);
    qtdAgendasNaoPlano = agendSemPlano.reduce((s, a) => s + (a.quantidade||1), 0);
    for (const a of agendSemPlano) {
      detalhes.push({
        fonte: 'agendamento',
        paciente_nome: a.cliente?.pacienteNome || a.cliente?.nome || '—',
        responsavel_nome: a.cliente?.nome || '—',
        plano_nome: '—',
        dose_numero: 1,
        data_prevista_mes: a.dataHora?.toISOString?.()?.slice(0,7) || mes,
        idade_prevista: '-',
        status_dose: 'Agendado',
        agendada: true,
        aplicada: false
      });
    }

    const qtdHistorico   = mediaMap[vid] || 0;
    const demandaPlanos  = qtdPlanos;  // doses de planos (sem dupla contagem)
    const demandaAgendas = qtdAgendasNaoPlano;
    const demandaTotal   = demandaPlanos + demandaAgendas + qtdHistorico;

    const estoqueAtual   = estoqueMap[vid]?.disponivel || 0;
    const dosesReserv    = reservasMap[vid] || 0;
    const estoqueDisp    = Math.max(0, estoqueAtual - dosesReserv);
    const margem         = Math.ceil(demandaTotal * margemPct / 100);
    const sugestao       = Math.max(0, demandaTotal + margem - estoqueDisp);
    const vencendo       = estoqueMap[vid]?.vencendo || [];

    let status = 'ok';
    if (sugestao > demandaTotal * 0.5) status = 'urgente';
    else if (sugestao > 0 || vencendo.length > 0) status = 'atencao';

    if (demandaTotal === 0 && estoqueAtual === 0) continue;

    tabela.push({
      vacina_id: vid, nome,
      demanda_planos: demandaPlanos,
      demanda_agendas: demandaAgendas,
      media_historica: qtdHistorico,
      demanda_total: demandaTotal,
      estoque_atual: estoqueAtual,
      doses_reservadas: dosesReserv,
      estoque_disponivel: estoqueDisp,
      margem_seguranca: margem,
      sugestao_compra: sugestao,
      status,
      lotes_vencendo: vencendo,
      detalhes: detalhes.sort((a,b) => a.paciente_nome.localeCompare(b.paciente_nome))
    });
  }

  const ord = { urgente:0, atencao:1, ok:2 };
  tabela.sort((a,b) => (ord[a.status]-ord[b.status]) || (b.sugestao_compra-a.sugestao_compra));

  res.json({
    mes, mes_extenso: mesExtenso, margem_pct: margemPct,
    totais: {
      vacinas: tabela.length,
      urgentes: tabela.filter(v=>v.status==='urgente').length,
      atencao:  tabela.filter(v=>v.status==='atencao').length,
      ok:       tabela.filter(v=>v.status==='ok').length,
      total_sugestao: tabela.reduce((s,v)=>s+v.sugestao_compra, 0)
    },
    _debug: {
      total_doses_planos_sistema: todasDoses.length,
      doses_previstas_mes: dosesDoMes.length,
      agendamentos_mes: agendamentos.length
    },
    tabela
  });
} catch (e) { console.error('estimativas:', e.message, e.stack); next(e) }});

module.exports = r;
