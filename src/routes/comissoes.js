const { Router } = require('express');
const prisma = require('../config/database');
const r = Router();

const META = 50000;
const BONUS_BASE = 500;
const BONUS_META = 1000;
const COM = 0.01;

function calcBonusPrevisao(totalVendido) {
  if (totalVendido >= META) return BONUS_META;
  if (totalVendido >= META * 0.5) return BONUS_BASE;
  return 0;
}

// Comissão de um plano (1% do valor)
function comPlano(v) { return (v||0) * COM; }

// GET /api/comissoes/extrato?mes=2026-05&vendedor_id=X
r.get('/extrato', async (req, res, next) => { try {
  const { mes, vendedor_id } = req.query;
  const uid = req.user?.perfil === 'master' && vendedor_id ? +vendedor_id : req.user?.id;
  const [ano, mesN] = (mes || new Date().toISOString().slice(0,7)).split('-').map(Number);
  const inicio = new Date(ano, mesN-1, 1);
  const fim    = new Date(ano, mesN, 1);

  const planos = await prisma.planoContratado.findMany({
    where: { vendedorId: uid, criadoEm: { gte: inicio, lt: fim }, statusContrato: { not: 'cancelado' } },
    include: { cliente: { select: { nome:true, pacienteNome:true } }, plano: { select: { nome:true } } },
    orderBy: { criadoEm: 'desc' }
  });

  const totalVendido = planos.reduce((s,p) => s + (p.valorFinal||0), 0);
  const totalComissao = planos.reduce((s,p) => s + comPlano(p.valorFinal), 0);
  const bonusPrevisao = calcBonusPrevisao(totalVendido);
  const pctMeta = Math.min(100, (totalVendido / META) * 100);

  res.json({
    mes, vendedor_id: uid,
    totalVendido, totalComissao, bonusPrevisao, pctMeta,
    meta: META, qtdVendas: planos.length,
    totalGeral: totalComissao + bonusPrevisao,
    planos: planos.map(p => ({
      id: p.id, criadoEm: p.criadoEm,
      cliente: p.cliente?.nome, paciente: p.cliente?.pacienteNome,
      produto: p.nomePlano || p.plano?.nome,
      valorBruto: p.valorBruto, valorFinal: p.valorFinal,
      formaPagamento: p.formaPagamento,
      status: p.statusContrato,
      comissao: comPlano(p.valorFinal),
    }))
  });
} catch(e) { next(e) }});

// GET /api/comissoes/dashboard?mes=2026-05
r.get('/dashboard', async (req, res, next) => { try {
  if(req.user?.perfil !== 'master') return res.status(403).json({ error: 'Apenas master' });
  const { mes } = req.query;
  const [ano, mesN] = (mes || new Date().toISOString().slice(0,7)).split('-').map(Number);
  const inicio = new Date(ano, mesN-1, 1);
  const fim    = new Date(ano, mesN, 1);

  // Vendedores ativos
  const vendedores = await prisma.usuario.findMany({
    where: { perfil: { in: ['vendas','atendimento'] }, ativo: true },
    select: { id:true, nome:true, cargo:true, perfil:true }
  });

  // Planos do mês
  const planos = await prisma.planoContratado.findMany({
    where: { criadoEm: { gte: inicio, lt: fim }, statusContrato: { not: 'cancelado' } },
    include: { cliente: { select: { nome:true, pacienteNome:true } }, vendedor: { select: { nome:true } } },
    orderBy: { criadoEm: 'desc' }
  });

  // Agrupar por vendedor
  const porVendedor = vendedores.map(v => {
    const mine = planos.filter(p => p.vendedorId === v.id);
    const total = mine.reduce((s,p) => s+(p.valorFinal||0), 0);
    const com   = mine.reduce((s,p) => s+comPlano(p.valorFinal), 0);
    return {
      ...v, qtd: mine.length, totalVendido: total,
      comissao: com, bonus: calcBonusPrevisao(total),
      pctMeta: Math.min(100,(total/META)*100),
      ticketMedio: mine.length ? total/mine.length : 0,
    };
  }).sort((a,b) => b.totalVendido - a.totalVendido);

  const totalGeral = planos.reduce((s,p) => s+(p.valorFinal||0), 0);
  const totalCom   = planos.reduce((s,p) => s+comPlano(p.valorFinal), 0);

  // Ranking de produtos
  const prodRank = {};
  planos.forEach(p => { const k=p.nomePlano||'Sem plano'; prodRank[k]=(prodRank[k]||0)+(p.valorFinal||0); });
  const ranking = Object.entries(prodRank).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([nome,total])=>({nome,total}));

  res.json({ mes, totalGeral, totalCom, qtdVendas: planos.length, porVendedor, ranking,
    planos: planos.map(p=>({ id:p.id, criadoEm:p.criadoEm, vendedor:p.vendedor?.nome, cliente:p.cliente?.nome, produto:p.nomePlano, valorFinal:p.valorFinal, comissao:comPlano(p.valorFinal), status:p.statusContrato, formaPagamento:p.formaPagamento })) });
} catch(e) { next(e) }});

module.exports = r;
