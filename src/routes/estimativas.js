const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtIdade(m) {
  if (m === null || m < 0) return '-';
  if (m < 24) return m + (m === 1 ? ' mês' : ' meses');
  const a = Math.floor(m / 12);
  return a + (a === 1 ? ' ano' : ' anos');
}

// Data prevista da dose = nascimento + mesPrevisto meses
function dataPrevistaDose(nascimento, mesPrevisto) {
  if (!nascimento || mesPrevisto == null) return null;
  const d = new Date(nascimento);
  d.setMonth(d.getMonth() + mesPrevisto);
  return d;
}

r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const mesExtenso = `${MESES_PT[mesN - 1]} de ${anoN}`;

  // Busca todas as doses pendentes com dados do cliente e vacina
  const doses = await prisma.planoContratadoDose.findMany({
    where: {
      status: 'pendente',
      planoContratado: {
        statusContrato: 'ativo',
        cliente: { status: 'ativo' }
      }
    },
    select: {
      id: true,
      doseNumero: true,
      mesPrevisto: true,
      competencia: true,
      vacina: { select: { id: true, nome: true, fabricante: true } },
      planoContratado: {
        select: {
          nomePlano: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              dataNascimento: true,
              pacienteNome: true,
              pacienteNascimento: true
            }
          }
        }
      }
    }
  });

  // Filtrar doses que se encaixam no mês alvo
  // Prioridade 1: competencia preenchida diretamente
  // Prioridade 2: nascimento + mesPrevisto = mês alvo
  const dosesDoMes = doses.filter(d => {
    // 1. Competencia direta
    if (d.competencia) return d.competencia === mes;

    // 2. Calcular por nascimento + mesPrevisto
    if (d.mesPrevisto == null) return false;
    const c = d.planoContratado.cliente;
    const nasc = c.pacienteNascimento || c.dataNascimento;
    if (!nasc) return false;

    const dataDose = dataPrevistaDose(nasc, d.mesPrevisto);
    if (!dataDose) return false;
    const mesCalc = dataDose.getFullYear() + '-' + String(dataDose.getMonth() + 1).padStart(2, '0');
    return mesCalc === mes;
  });

  // Agrupar por vacina
  const vacinaMap = {};
  for (const d of dosesDoMes) {
    const vid = d.vacina.id;
    const c   = d.planoContratado.cliente;
    const nasc = c.pacienteNascimento || c.dataNascimento;

    // Calcular idade atual no mês alvo
    let idadeStr = '-';
    if (nasc && d.mesPrevisto != null) {
      idadeStr = fmtIdade(d.mesPrevisto);
    }

    if (!vacinaMap[vid]) {
      vacinaMap[vid] = {
        vacina_id:   vid,
        vacina_nome: d.vacina.nome,
        fabricante:  d.vacina.fabricante || '',
        quantidade:  0,
        pacientes:   []
      };
    }
    vacinaMap[vid].quantidade++;
    vacinaMap[vid].pacientes.push({
      cliente_id:       c.id,
      nome_responsavel: c.nome,
      nome_paciente:    c.pacienteNome || c.nome,
      idade:            idadeStr,
      dose_numero:      d.doseNumero,
      plano_nome:       d.planoContratado.nomePlano
    });
  }

  const vacinas = Object.values(vacinaMap).sort((a, b) => b.quantidade - a.quantidade);

  res.json({
    mes,
    mes_extenso: mesExtenso,
    total_doses:     dosesDoMes.length,
    total_pacientes: new Set(dosesDoMes.map(d => d.planoContratado.cliente.id)).size,
    total_vacinas:   vacinas.length,
    vacinas,
    // debug info
    _debug: { total_doses_sistema: doses.length, filtradas: dosesDoMes.length }
  });
} catch (e) { console.error('estimativas:', e.message); next(e) }});

module.exports = r;
