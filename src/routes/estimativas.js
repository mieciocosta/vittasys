const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function idadeMeses(nascimento, refDate) {
  if (!nascimento) return null;
  return Math.floor((new Date(refDate) - new Date(nascimento)) / (1000*60*60*24*30.44));
}
function fmtIdade(m) {
  if (m === null || m < 0) return '-';
  if (m < 24) return m + (m===1?' mês':' meses');
  const a = Math.floor(m/12);
  return a + (a===1?' ano':' anos');
}

r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const refDate  = new Date(anoN, mesN - 1, 1);
  const mesExtenso = `${MESES_PT[mesN - 1]} de ${anoN}`;

  // ──────────────────────────────────────────────────────────────────────
  // FONTE 1 — planos contratados: todos os doses pendentes de planos ativos
  // Filtragem de mês feita em JS para evitar problemas de SQL dinâmico
  // ──────────────────────────────────────────────────────────────────────
  const todasDoses = await prisma.planoContratadoDose.findMany({
    where: {
      status: 'pendente',
      planoContratado: { statusContrato: 'ativo', cliente: { status: 'ativo' } }
    },
    select: {
      id: true, doseNumero: true, mesPrevisto: true, competencia: true, vacinaId: true,
      vacina: { select: { id: true, nome: true, fabricante: true } },
      planoContratado: {
        select: {
          id: true, nomePlano: true, dataInicioPlano: true,
          cliente: {
            select: {
              id: true, nome: true, tipoCliente: true,
              dataNascimento: true, pacienteNome: true, pacienteNascimento: true
            }
          }
        }
      }
    }
  });

  // Filtrar: competencia = mes OU calcular por data_inicio_plano + mes_previsto
  const dosesDoMes = todasDoses.filter(d => {
    if (d.competencia) return d.competencia === mes;
    const ini = d.planoContratado.dataInicioPlano;
    if (!ini || d.mesPrevisto == null) return false;
    const calc = new Date(ini);
    calc.setMonth(calc.getMonth() + d.mesPrevisto);
    const calcMes = calc.getFullYear() + '-' + String(calc.getMonth()+1).padStart(2,'0');
    return calcMes === mes;
  });

  // ──────────────────────────────────────────────────────────────────────
  // FONTE 2 — clientes sem plano ativo: previsão por calendário vacinal
  // ──────────────────────────────────────────────────────────────────────

  // 2a) IDs de clientes que JÁ têm plano ativo
  const comPlano = await prisma.planoContratado.findMany({
    where: { statusContrato: 'ativo' }, select: { clienteId: true }
  });
  const comPlanoIds = new Set(comPlano.map(p => p.clienteId));

  // 2b) Clientes sem plano ativo e com data de nascimento
  const clientesSemPlano = await prisma.cliente.findMany({
    where: {
      status: 'ativo',
      id: { notIn: comPlanoIds.size > 0 ? [...comPlanoIds] : [0] },
      OR: [
        { dataNascimento: { not: null } },
        { pacienteNascimento: { not: null } }
      ]
    },
    select: {
      id: true, nome: true, tipoCliente: true,
      dataNascimento: true, pacienteNome: true, pacienteNascimento: true,
      movimentacoes: {
        where: { status: 'concluido' },
        select: { vacinaId: true }
      }
    }
  });

  // 2c) Calendário vacinal: todos os planoVacina com faixas etárias
  const calendario = await prisma.planoVacina.findMany({
    select: {
      vacinaId: true, mesPrevInicio: true, mesPrevFim: true,
      vacina: { select: { id: true, nome: true, fabricante: true } }
    }
  });

  // Construir mapa vacina_id → faixas etárias (deduplicar por vacina)
  const vacinaFaixas = {};
  for (const pv of calendario) {
    const vid = pv.vacinaId;
    if (!vacinaFaixas[vid]) {
      vacinaFaixas[vid] = { vacina: pv.vacina, faixas: [] };
    }
    vacinaFaixas[vid].faixas.push({
      min: pv.mesPrevInicio ?? 0,
      max: pv.mesPrevFim ?? 999
    });
  }

  // 2d) Para cada cliente sem plano: verificar quais vacinas cabem na sua idade
  const dosesEspontaneas = [];
  for (const c of clientesSemPlano) {
    const nasc = c.pacienteNascimento || c.dataNascimento;
    if (!nasc) continue;
    const idade = idadeMeses(nasc, refDate);
    if (idade === null || idade < 0 || idade > 1200) continue; // ignorar > 100 anos

    const jaRecebeu = new Set(c.movimentacoes.map(m => m.vacinaId).filter(Boolean));

    for (const [vid, vf] of Object.entries(vacinaFaixas)) {
      if (jaRecebeu.has(Number(vid))) continue; // já recebeu
      const dentroFaixa = vf.faixas.some(f => idade >= f.min && idade <= f.max);
      if (!dentroFaixa) continue;
      dosesEspontaneas.push({
        dose_id: null,
        dose_numero: 1,
        mes_previsto: null,
        competencia: null,
        vacina: vf.vacina,
        vacina_id: Number(vid),
        plano_nome: 'Calendário Vacinal',
        data_inicio_plano: null,
        cliente: c,
        nome_paciente: c.pacienteNome || c.nome,
        data_nascimento: nasc,
        fonte: 'espontaneo'
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // JUNTAR + DEDUPLICAR (cliente+vacina: preferir plano sobre espontâneo)
  // ──────────────────────────────────────────────────────────────────────
  const todos = [
    ...dosesDoMes.map(d => ({
      vacina_id: d.vacinaId,
      vacina: d.vacina,
      plano_nome: d.planoContratado.nomePlano,
      cliente_id: d.planoContratado.cliente.id,
      cliente_nome: d.planoContratado.cliente.nome,
      nome_paciente: d.planoContratado.cliente.pacienteNome || d.planoContratado.cliente.nome,
      data_nascimento: d.planoContratado.cliente.pacienteNascimento || d.planoContratado.cliente.dataNascimento,
      dose_numero: d.doseNumero,
      fonte: 'plano'
    })),
    ...dosesEspontaneas.map(d => ({
      vacina_id: d.vacina_id,
      vacina: d.vacina,
      plano_nome: d.plano_nome,
      cliente_id: d.cliente.id,
      cliente_nome: d.cliente.nome,
      nome_paciente: d.nome_paciente,
      data_nascimento: d.data_nascimento,
      dose_numero: 1,
      fonte: 'espontaneo'
    }))
  ];

  const seen = new Set();
  const dedup = todos.filter(d => {
    const key = `${d.vacina_id}-${d.cliente_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Agrupar por vacina
  const vacinaMap = {};
  for (const d of dedup) {
    const vid = d.vacina_id;
    const idade = idadeMeses(d.data_nascimento, refDate);
    if (!vacinaMap[vid]) {
      vacinaMap[vid] = {
        vacina_id: vid, vacina_nome: d.vacina.nome,
        fabricante: d.vacina.fabricante || '',
        quantidade: 0, qtd_plano: 0, qtd_espontaneo: 0,
        pacientes: []
      };
    }
    const v = vacinaMap[vid];
    v.quantidade++;
    if (d.fonte === 'plano') v.qtd_plano++; else v.qtd_espontaneo++;
    v.pacientes.push({
      cliente_id: d.cliente_id,
      nome_responsavel: d.cliente_nome,
      nome_paciente: d.nome_paciente,
      idade: fmtIdade(idade),
      dose_numero: d.dose_numero,
      plano_nome: d.plano_nome,
      fonte: d.fonte
    });
  }

  const vacinas = Object.values(vacinaMap).sort((a, b) => b.quantidade - a.quantidade);

  res.json({
    mes, mes_extenso: mesExtenso,
    total_doses: dedup.length,
    total_pacientes: new Set(dedup.map(d => d.cliente_id)).size,
    total_vacinas: vacinas.length,
    qtd_plano: dedup.filter(d => d.fonte === 'plano').length,
    qtd_espontaneo: dedup.filter(d => d.fonte === 'espontaneo').length,
    vacinas
  });
} catch (e) { console.error('estimativas:', e.message); next(e) }});

module.exports = r;
