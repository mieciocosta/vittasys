const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const mesExtenso = `${MESES_PT[mesN - 1]} de ${anoN}`;

  // ── PASSO 1: Partir dos PLANOS ATIVOS (top-down) ─────────────────────
  // Busca todos os planos contratados ativos com cliente e doses
  const planosAtivos = await prisma.planoContratado.findMany({
    where: { statusContrato: 'ativo' },
    select: {
      id: true,
      nomePlano: true,
      dataInicioPlano: true,
      cliente: {
        select: {
          id: true,
          nome: true,
          status: true,
          dataNascimento: true,
          pacienteNome: true,
          pacienteNascimento: true
        }
      },
      doses: {
        where: { status: 'pendente' },
        select: {
          id: true,
          doseNumero: true,
          mesPrevisto: true,
          competencia: true,
          vacinaId: true,
          vacina: { select: { id: true, nome: true } }
        }
      }
    }
  });

  // ── PASSO 2: Para cada dose, determinar o mês previsto ───────────────
  // Tentativa 1: campo competencia (direto, mais confiável)
  // Tentativa 2: dataInicioPlano + mesPrevisto (como foi calculado na criação)
  // Tentativa 3: pacienteNascimento + mesPrevisto (base biológica)
  // Tentativa 4: dataNascimento + mesPrevisto (fallback)

  function getMesDose(dose, plano) {
    const mp = dose.mesPrevisto;

    // T1: competencia já está gravada
    if (dose.competencia) return dose.competencia;

    function toMes(base, n) {
      if (!base || n == null) return null;
      const d = new Date(base);
      d.setMonth(d.getMonth() + n);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    }

    // T2: dataInicioPlano + mesPrevisto
    if (plano.dataInicioPlano && mp != null)
      return toMes(plano.dataInicioPlano, mp);

    // T3: pacienteNascimento + mesPrevisto
    const c = plano.cliente;
    if (c.pacienteNascimento && mp != null)
      return toMes(c.pacienteNascimento, mp);

    // T4: dataNascimento + mesPrevisto
    if (c.dataNascimento && mp != null)
      return toMes(c.dataNascimento, mp);

    return null;
  }

  // ── PASSO 3: Coletar doses previstas para o mês alvo ─────────────────
  const dosesNoMes   = [];
  const todasPendentes = [];

  for (const plano of planosAtivos) {
    if (plano.cliente.status !== 'ativo') continue;
    for (const dose of plano.doses) {
      const mesDose = getMesDose(dose, plano);
      todasPendentes.push({ plano, dose, mesDose });
      if (mesDose === mes) {
        dosesNoMes.push({ plano, dose, mesDose });
      }
    }
  }

  // ── PASSO 4: Estoque atual por vacina ─────────────────────────────────
  const lotes = await prisma.lote.findMany({
    where: { status: { not: 'inativo' } },
    select: {
      id: true, numeroLote: true, validade: true,
      quantidadeDisponivel: true,
      vacina: { select: { id: true, nome: true } }
    }
  });
  const estoqueMap = {};
  const alertaVenc  = {};
  const refInicio   = new Date(anoN, mesN - 1, 1);

  for (const l of lotes) {
    const vid = l.vacina.id;
    if (!estoqueMap[vid]) { estoqueMap[vid] = 0; alertaVenc[vid] = []; }
    estoqueMap[vid] += l.quantidadeDisponivel;
    if (l.validade) {
      const dias = (new Date(l.validade) - refInicio) / (1000*60*60*24);
      if (dias > 0 && dias <= 60)
        alertaVenc[vid].push(`${l.numeroLote} (${new Date(l.validade).toLocaleDateString('pt-BR')})`);
    }
  }

  // ── PASSO 5: Reservas = todas as doses pendentes com mês >= mês alvo ─
  const reservasMap = {};
  for (const { dose, mesDose } of todasPendentes) {
    if (mesDose && mesDose >= mes) {
      reservasMap[dose.vacinaId] = (reservasMap[dose.vacinaId] || 0) + 1;
    }
  }

  // ── PASSO 6: Agrupar por vacina ───────────────────────────────────────
  const vacinaMap = {};
  for (const { plano, dose } of dosesNoMes) {
    const vid  = dose.vacinaId;
    const nome = dose.vacina?.nome || `Vacina #${vid}`;
    const c    = plano.cliente;
    const nasc = c.pacienteNascimento || c.dataNascimento;

    if (!vacinaMap[vid]) {
      vacinaMap[vid] = { vacina_id: vid, nome, quantidade: 0, pacientes: [] };
    }
    vacinaMap[vid].quantidade++;

    // Calcular data prevista exata
    let dataPrevista = null;
    if (dose.competencia) {
      dataPrevista = dose.competencia + '-01';
    } else if (plano.dataInicioPlano && dose.mesPrevisto != null) {
      const d = new Date(plano.dataInicioPlano);
      d.setMonth(d.getMonth() + dose.mesPrevisto);
      dataPrevista = d.toISOString().slice(0,10);
    } else if (nasc && dose.mesPrevisto != null) {
      const d = new Date(nasc);
      d.setMonth(d.getMonth() + dose.mesPrevisto);
      dataPrevista = d.toISOString().slice(0,10);
    }

    vacinaMap[vid].pacientes.push({
      paciente_nome: c.pacienteNome || c.nome,
      responsavel:   c.nome,
      plano_nome:    plano.nomePlano,
      dose_numero:   dose.doseNumero,
      data_prevista: dataPrevista,
      mes_previsto:  dose.mesPrevisto,
      competencia:   dose.competencia
    });
  }

  // ── PASSO 7: Montar tabela final ──────────────────────────────────────
  const tabela = Object.values(vacinaMap).map(v => {
    const estAtual = estoqueMap[v.vacina_id] || 0;
    const reserv   = reservasMap[v.vacina_id] || 0;
    const disponivel = Math.max(0, estAtual - reserv);
    const sugestao   = Math.max(0, v.quantidade - disponivel);

    let status = 'ok';
    if (sugestao > 0 && sugestao >= v.quantidade) status = 'urgente';
    else if (sugestao > 0) status = 'atencao';
    else if (alertaVenc[v.vacina_id]?.length) status = 'atencao';

    return {
      ...v,
      estoque_atual: estAtual,
      doses_reservadas: reserv,
      estoque_disponivel: disponivel,
      sugestao_compra: sugestao,
      status,
      lotes_vencendo: alertaVenc[v.vacina_id] || [],
      pacientes: v.pacientes.sort((a,b) =>
        (a.data_prevista||'').localeCompare(b.data_prevista||'') ||
        a.paciente_nome.localeCompare(b.paciente_nome))
    };
  }).sort((a,b) => {
    const ord = { urgente:0, atencao:1, ok:2 };
    return (ord[a.status]-ord[b.status]) || (b.sugestao_compra-a.sugestao_compra);
  });

  res.json({
    mes, mes_extenso: mesExtenso,
    totais: {
      vacinas:  tabela.length,
      urgentes: tabela.filter(v=>v.status==='urgente').length,
      atencao:  tabela.filter(v=>v.status==='atencao').length,
      ok:       tabela.filter(v=>v.status==='ok').length,
      doses_previstas: dosesNoMes.length
    },
    tabela,
    debug: {
      planos_ativos_total: planosAtivos.length,
      planos_cliente_ativo: planosAtivos.filter(p=>p.cliente.status==='ativo').length,
      doses_pendentes_total: todasPendentes.length,
      doses_com_mes_calculado: todasPendentes.filter(d=>d.mesDose).length,
      doses_sem_mes: todasPendentes.filter(d=>!d.mesDose).length,
      doses_no_mes: dosesNoMes.length,
      meses_disponiveis: [...new Set(todasPendentes.map(d=>d.mesDose).filter(Boolean))].sort().slice(0,12)
    }
  });
} catch (e) { console.error('estimativas error:', e.message, e.stack); next(e) }});

module.exports = r;
