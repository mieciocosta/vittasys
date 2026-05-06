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
  if (m < 24) return m + (m===1?' mês':' meses');
  const a = Math.floor(m/12);
  return a + (a===1?' ano':' anos');
}

r.get('/', async (req, res, next) => { try {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Use formato YYYY-MM' });

  const [anoN, mesN] = mes.split('-').map(Number);
  const refDate    = new Date(anoN, mesN - 1, 1);
  const mesExtenso = `${MESES_PT[mesN - 1]} de ${anoN}`;

  // ── Todas as doses pendentes de planos ativos ────────────────────────
  const todasDoses = await prisma.planoContratadoDose.findMany({
    where: {
      status: 'pendente',
      planoContratado: {
        statusContrato: 'ativo',
        cliente: { status: 'ativo' }
      }
    },
    select: {
      id: true, doseNumero: true, mesPrevisto: true, competencia: true, vacinaId: true,
      vacina: { select: { id: true, nome: true, fabricante: true } },
      planoContratado: {
        select: {
          nomePlano: true, dataInicioPlano: true,
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

  // ── Filtrar pelo mês alvo ────────────────────────────────────────────
  // Usa competencia se preenchida; caso contrário calcula dataInicioPlano + mesPrevisto
  const dosesDoMes = todasDoses.filter(d => {
    if (d.competencia) return d.competencia === mes;
    const ini = d.planoContratado.dataInicioPlano;
    if (!ini || d.mesPrevisto == null) return false;
    const calc = new Date(ini);
    calc.setMonth(calc.getMonth() + d.mesPrevisto);
    return calc.getFullYear() + '-' + String(calc.getMonth()+1).padStart(2,'0') === mes;
  });

  // ── Agrupar por vacina ───────────────────────────────────────────────
  const vacinaMap = {};
  for (const d of dosesDoMes) {
    const vid  = d.vacinaId;
    const pc   = d.planoContratado;
    const nasc = pc.cliente.pacienteNascimento || pc.cliente.dataNascimento;
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
      cliente_id:      pc.cliente.id,
      nome_responsavel:pc.cliente.nome,
      nome_paciente:   pc.cliente.pacienteNome || pc.cliente.nome,
      idade:           fmtIdade(idadeMeses(nasc, refDate)),
      dose_numero:     d.doseNumero,
      plano_nome:      pc.nomePlano
    });
  }

  const vacinas = Object.values(vacinaMap).sort((a, b) => b.quantidade - a.quantidade);

  res.json({
    mes, mes_extenso: mesExtenso,
    total_doses:    dosesDoMes.length,
    total_pacientes:new Set(dosesDoMes.map(d => d.planoContratado.cliente.id)).size,
    total_vacinas:  vacinas.length,
    vacinas
  });
} catch (e) { console.error('estimativas:', e.message); next(e) }});

module.exports = r;
