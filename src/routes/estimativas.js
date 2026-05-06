const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

// ═══ GET /api/estimativas — Estimativa de demanda vacinal por mês ═══
r.get('/', async (req, res, next) => { try {
  const { mes } = req.query; // formato: 'YYYY-MM'
  if (!mes || !/^\d{4}-\d{2}$/.test(mes))
    return res.status(400).json({ error: 'Parâmetro mes inválido. Use formato YYYY-MM' });

  // Busca todas as doses pendentes com competencia = mes solicitado
  const doses = await prisma.planoContratadoDose.findMany({
    where: {
      competencia: mes,
      status: 'pendente',
      planoContratado: { statusContrato: 'ativo' }
    },
    include: {
      vacina: { select: { id: true, nome: true, fabricante: true } },
      planoContratado: {
        include: {
          cliente: {
            select: {
              id: true, nome: true, dataNascimento: true,
              pacienteNome: true, pacienteNascimento: true, tipoPaciente: true
            }
          }
        }
      }
    },
    orderBy: [{ vacina: { nome: 'asc' } }, { planoContratado: { cliente: { nome: 'asc' } } }]
  });

  // Agrupar por vacina
  const vacinaMap = {};
  for (const d of doses) {
    const vId = d.vacinaId;
    const nomePaciente = d.planoContratado.cliente.pacienteNome || d.planoContratado.cliente.nome;
    const nascimento = d.planoContratado.cliente.pacienteNascimento || d.planoContratado.cliente.dataNascimento;

    // Calcular idade no mês-alvo
    let idadeStr = '-';
    if (nascimento) {
      const [ano, mm] = mes.split('-').map(Number);
      const refDate = new Date(ano, mm - 1, 1);
      const birthDate = new Date(nascimento);
      const diffMs = refDate - birthDate;
      const meses = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
      if (meses < 24) idadeStr = meses + (meses === 1 ? ' mês' : ' meses');
      else {
        const anos = Math.floor(meses / 12);
        idadeStr = anos + (anos === 1 ? ' ano' : ' anos');
      }
    }

    if (!vacinaMap[vId]) {
      vacinaMap[vId] = {
        vacina_id: vId,
        vacina_nome: d.vacina.nome,
        fabricante: d.vacina.fabricante || '',
        quantidade: 0,
        pacientes: []
      };
    }
    vacinaMap[vId].quantidade++;
    vacinaMap[vId].pacientes.push({
      cliente_id: d.planoContratado.cliente.id,
      nome_responsavel: d.planoContratado.cliente.nome,
      nome_paciente: nomePaciente,
      idade: idadeStr,
      dose_numero: d.doseNumero,
      plano_nome: d.planoContratado.nomePlano,
      mes_previsto: d.mesPrevisto,
      dose_id: d.id
    });
  }

  const vacinas = Object.values(vacinaMap).sort((a, b) => b.quantidade - a.quantidade);

  // Mês por extenso
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const [anoN, mesN] = mes.split('-').map(Number);
  const mesExtenso = `${MESES[mesN - 1]} de ${anoN}`;

  res.json({
    mes,
    mes_extenso: mesExtenso,
    total_doses: doses.length,
    total_pacientes: new Set(doses.map(d => d.planoContratado.cliente.id)).size,
    total_vacinas: vacinas.length,
    vacinas
  });
} catch (e) { next(e) }});

module.exports = r;
