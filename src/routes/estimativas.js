const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ─── Calcular idade em meses numa data de referência ───────────────────────
function idadeMeses(nascimento, refDate) {
  if (!nascimento) return null;
  const d = new Date(refDate);
  const n = new Date(nascimento);
  return Math.floor((d - n) / (1000 * 60 * 60 * 24 * 30.44));
}

function fmtIdade(meses) {
  if (meses === null || meses < 0) return '-';
  if (meses < 24) return meses + (meses === 1 ? ' mês' : ' meses');
  const anos = Math.floor(meses / 12);
  return anos + (anos === 1 ? ' ano' : ' anos');
}

// ═══ GET /api/estimativas ═══════════════════════════════════════════════════
r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const refDate = new Date(anoN, mesN - 1, 1); // primeiro dia do mês alvo
  const mesExtenso = `${MESES_PT[mesN - 1]} de ${anoN}`;

  // ──────────────────────────────────────────────────────────────────────
  // FONTE 1: Planos contratados ativos → doses previstas para o mês
  // Usa competencia (se preenchida) OU calcula data_inicio_plano + mes_previsto
  // ──────────────────────────────────────────────────────────────────────
  const dosesPlano = await prisma.$queryRaw`
    SELECT
      pcd.id          AS dose_id,
      pcd.dose_numero,
      pcd.mes_previsto,
      pcd.competencia,
      v.id            AS vacina_id,
      v.nome          AS vacina_nome,
      v.fabricante,
      pc.nome_plano,
      pc.data_inicio_plano,
      c.id            AS cliente_id,
      c.nome          AS cliente_nome,
      COALESCE(c.paciente_nome, c.nome)    AS nome_paciente,
      COALESCE(c.paciente_nascimento, c.data_nascimento) AS data_nascimento,
      c.tipo_cliente,
      'plano'         AS fonte
    FROM plano_contratado_doses pcd
    JOIN planos_contratados pc ON pcd.plano_contratado_id = pc.id
    JOIN clientes c            ON pc.cliente_id = c.id
    JOIN vacinas v             ON pcd.vacina_id = v.id
    WHERE pcd.status = 'pendente'
      AND pc.status_contrato = 'ativo'
      AND c.status = 'ativo'
      AND (
        pcd.competencia = ${mes}
        OR (
          pcd.competencia IS NULL
          AND pc.data_inicio_plano IS NOT NULL
          AND pcd.mes_previsto IS NOT NULL
          AND to_char(
            (pc.data_inicio_plano::date + (pcd.mes_previsto || ' months')::interval),
            'YYYY-MM'
          ) = ${mes}
        )
      )
    ORDER BY v.nome, c.nome
  `;

  // ──────────────────────────────────────────────────────────────────────
  // FONTE 2: Clientes sem plano ativo — previsão por faixa de idade
  // Pega todos os clientes ativos SEM plano ativo e verifica quais vacinas
  // do calendário vacinal (plano_vacinas) se aplicam à idade deles no mês
  // ──────────────────────────────────────────────────────────────────────
  const dosesEspontaneos = await prisma.$queryRaw`
    SELECT DISTINCT
      NULL            AS dose_id,
      1               AS dose_numero,
      pv.mes_previsto_inicio AS mes_previsto,
      NULL            AS competencia,
      v.id            AS vacina_id,
      v.nome          AS vacina_nome,
      v.fabricante,
      'Calendário Vacinal' AS nome_plano,
      NULL            AS data_inicio_plano,
      c.id            AS cliente_id,
      c.nome          AS cliente_nome,
      COALESCE(c.paciente_nome, c.nome)    AS nome_paciente,
      COALESCE(c.paciente_nascimento, c.data_nascimento) AS data_nascimento,
      c.tipo_cliente,
      'espontaneo'    AS fonte
    FROM clientes c
    JOIN plano_vacinas pv ON (
      FLOOR(
        EXTRACT(EPOCH FROM (
          DATE ${mes + '-01'} - COALESCE(c.paciente_nascimento, c.data_nascimento)::date
        )) / (60.0 * 60 * 24 * 30.44)
      ) BETWEEN COALESCE(pv.mes_previsto_inicio, 0) AND COALESCE(pv.mes_previsto_fim, 999)
    )
    JOIN vacinas v ON pv.vacina_id = v.id
    WHERE c.status = 'ativo'
      AND COALESCE(c.paciente_nascimento, c.data_nascimento) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM planos_contratados pc2
        WHERE pc2.cliente_id = c.id AND pc2.status_contrato = 'ativo'
      )
      -- Excluir vacinas já aplicadas neste cliente
      AND NOT EXISTS (
        SELECT 1 FROM movimentacoes m
        WHERE m.cliente_id = c.id
          AND m.vacina_id = v.id
          AND m.status = 'concluido'
      )
    ORDER BY v.nome, c.nome
  `;

  // ──────────────────────────────────────────────────────────────────────
  // AGREGAR resultados
  // ──────────────────────────────────────────────────────────────────────
  const todos = [...dosesPlano, ...dosesEspontaneos];

  // Deduplicar: um cliente pode aparecer em plano E espontâneo → preferir plano
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
    const vId = Number(d.vacina_id);
    const nasc = d.data_nascimento;
    const idadeMes = nasc ? idadeMeses(nasc, refDate) : null;

    if (!vacinaMap[vId]) {
      vacinaMap[vId] = {
        vacina_id: vId,
        vacina_nome: d.vacina_nome,
        fabricante: d.fabricante || '',
        qtd_plano: 0,
        qtd_espontaneo: 0,
        quantidade: 0,
        pacientes: []
      };
    }
    const v = vacinaMap[vId];
    v.quantidade++;
    if (d.fonte === 'plano') v.qtd_plano++;
    else v.qtd_espontaneo++;

    v.pacientes.push({
      cliente_id: Number(d.cliente_id),
      nome_responsavel: d.cliente_nome,
      nome_paciente: d.nome_paciente,
      idade: fmtIdade(idadeMes),
      dose_numero: Number(d.dose_numero) || 1,
      plano_nome: d.nome_plano,
      fonte: d.fonte,
    });
  }

  const vacinas = Object.values(vacinaMap).sort((a, b) => b.quantidade - a.quantidade);
  const qtdPlanoTotal = dedup.filter(d => d.fonte === 'plano').length;
  const qtdEspTotal = dedup.filter(d => d.fonte === 'espontaneo').length;

  res.json({
    mes,
    mes_extenso: mesExtenso,
    total_doses: dedup.length,
    total_pacientes: new Set(dedup.map(d => Number(d.cliente_id))).size,
    total_vacinas: vacinas.length,
    qtd_plano: qtdPlanoTotal,
    qtd_espontaneo: qtdEspTotal,
    vacinas
  });
} catch (e) { console.error('estimativas error:', e.message, e); next(e) }});

module.exports = r;
