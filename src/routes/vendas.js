const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

// GET /api/vendas/produtos — vacinas e planos disponíveis
r.get('/produtos', async (req, res, next) => { try {
  const [vacinas, planos] = await Promise.all([
    prisma.vacina.findMany({
      where: { ativo: true },
      select: { id:true, nome:true, categoria:true, valorVendaSugerido:true },
      orderBy: { nome: 'asc' }
    }),
    prisma.plano.findMany({
      where: { status: 'ativo' },
      select: { id:true, nome:true, idadeInicio:true, idadeFim:true,
        valorAvista:true, valorCartao:true, descPagamento:true,
        vacinas: { select: { vacina:{ select:{ id:true, nome:true }}, doses:true,
          mesPrevInicio:true, mesPrevFim:true } }
      },
      orderBy: { nome: 'asc' }
    })
  ]);
  res.json({ vacinas, planos });
} catch(e) { next(e) }});

// POST /api/vendas/fechar — fechar venda
r.post('/fechar', async (req, res, next) => { try {
  const { cliente, itens, forma_pagamento, vendedor_id, data_nascimento_paciente } = req.body;
  if (!cliente || !itens?.length) return res.status(400).json({ error: 'Dados incompletos' });

  // 1. Buscar ou criar cliente
  let clienteDb = null;
  if (cliente.id) {
    clienteDb = await prisma.cliente.findUnique({ where: { id: cliente.id } });
  }
  if (!clienteDb) {
    clienteDb = await prisma.cliente.create({ data: {
      nome: cliente.nome,
      telefone: cliente.telefone || null,
      pacienteNome: cliente.paciente_nome || cliente.nome,
      pacienteNascimento: data_nascimento_paciente ? new Date(data_nascimento_paciente) : null,
      status: 'ativo',
      tipo_paciente: 'plano',
      tipo_cliente: 'ativo',
    }});
  }

  const resultado = { cliente_id: clienteDb.id, planos_criados: [], comissao_total: 0 };

  // 2. Processar cada item
  for (const item of itens) {
    if (item.tipo === 'plano') {
      const plano = await prisma.plano.findUnique({
        where: { id: item.id },
        include: { vacinas: { include: { vacina: true } } }
      });
      if (!plano) continue;

      const valor = forma_pagamento === 'cartao' ? (plano.valorCartao || plano.valorAvista) : plano.valorAvista;

      // Criar plano contratado
      const pc = await prisma.planoContratado.create({ data: {
        clienteId: clienteDb.id,
        planoId: plano.id,
        nomePlano: plano.nome,
        idadeInicio: plano.idadeInicio,
        idadeFim: plano.idadeFim,
        dataInicioPlano: data_nascimento_paciente ? new Date(data_nascimento_paciente) : new Date(),
        valorBruto: valor,
        valorFinal: valor,
        statusContrato: 'ativo',
        formaPagemento: forma_pagamento || 'avista',
        vendedorId: vendedor_id || null,
      }});

      // Gerar doses futuras automaticamente
      const nasc = data_nascimento_paciente ? new Date(data_nascimento_paciente) : null;
      if (nasc) {
        for (const pv of plano.vacinas) {
          const totalDoses = pv.doses || 1;
          const inicio = pv.mesPrevInicio ?? 0;
          const fim = pv.mesPrevFim ?? inicio;
          for (let dn = 1; dn <= totalDoses; dn++) {
            const idadeEsp = totalDoses === 1 ? inicio : inicio + (fim - inicio) * (dn - 1) / Math.max(1, totalDoses - 1);
            const dataPrevisao = new Date(nasc);
            dataPrevisao.setMonth(dataPrevisao.getMonth() + Math.round(idadeEsp));
            const comp = dataPrevisao.getFullYear() + '-' + String(dataPrevisao.getMonth() + 1).padStart(2, '0');
            await prisma.planoContratadoDose.create({ data: {
              planoContratadoId: pc.id,
              vacinaId: pv.vacina.id,
              doseNumero: dn,
              mesPrevisto: Math.round(idadeEsp),
              competencia: comp,
              status: 'pendente',
            }}).catch(() => {});
          }
        }
      }

      resultado.planos_criados.push({ plano_id: pc.id, nome: plano.nome, valor });
      resultado.comissao_total += valor * 0.01;
    }

    if (item.tipo === 'vacina') {
      const ehGripe = item.nome?.toUpperCase().includes('INFLUEN') || item.nome?.toUpperCase().includes('GRIPE');
      const valor = item.valor || 0;
      resultado.comissao_total += (valor * 0.01) + (ehGripe ? 10 : 0);
    }
  }

  resultado.comissao_total = Math.round(resultado.comissao_total * 100) / 100;
  res.json({ success: true, ...resultado });
} catch(e) { next(e) }});

// GET /api/vendas/comissao — relatório de comissão do vendedor
r.get('/comissao', async (req, res, next) => { try {
  const { vendedor_id, mes } = req.query;
  const [anoN, mesN] = (mes || new Date().toISOString().slice(0,7)).split('-').map(Number);
  const inicio = new Date(anoN, mesN - 1, 1);
  const fim = new Date(anoN, mesN, 1);

  const planos = await prisma.planoContratado.findMany({
    where: {
      vendedorId: vendedor_id ? +vendedor_id : undefined,
      criadoEm: { gte: inicio, lt: fim },
      statusContrato: { not: 'cancelado' }
    },
    select: { id:true, nomePlano:true, valorFinal:true, criadoEm:true,
      cliente: { select: { nome:true } } }
  });

  const totalComissao = planos.reduce((s, p) => s + (p.valorFinal || 0) * 0.01, 0);
  res.json({ planos, total_comissao: Math.round(totalComissao * 100) / 100, mes });
} catch(e) { next(e) }});

module.exports = r;
