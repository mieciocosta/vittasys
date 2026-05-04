const{Router}=require('express');const r=Router();const prisma=require('../config/database');
const{logAudit,getRealIP}=require('./auditoria');
const PERMS={
  master:['dashboard','retirada','estoque','historico','planos','clientes','financeiro','metas','alertas','aprovacoes','auditoria','agenda','usuarios','relatorios'],
  ativos:['dashboard','retirada','estoque','historico','planos','clientes','alertas','agenda'],
  espontaneos:['dashboard','retirada','estoque','historico','clientes','alertas'],
  atendimento:['dashboard','retirada','estoque','historico','planos','clientes','alertas','agenda'],
  operador:['dashboard','retirada','estoque','historico','planos','clientes','alertas']
};

r.post('/login',async(req,res,next)=>{try{
  const{usuario_id,pin}=req.body;
  const u=await prisma.usuario.findFirst({where:{id:parseInt(usuario_id),pin,ativo:true},select:{id:true,nome:true,cargo:true,email:true,perfil:true}});
  if(!u){
    logAudit({acao:'login_falha',usuarioId:parseInt(usuario_id),detalhes:{motivo:'PIN incorreto'},ip:getRealIP(req),userAgent:req.get('user-agent')});
    return res.status(401).json({error:'PIN incorreto'});
  }
  u.modulos_permitidos=PERMS[u.perfil]||PERMS.operador;
  logAudit({acao:'login',usuarioId:u.id,usuarioNome:u.nome,perfil:u.perfil,ip:getRealIP(req),userAgent:req.get('user-agent')});
  res.json({success:true,usuario:u});
}catch(e){next(e)}});

r.get('/usuarios',async(req,res,next)=>{try{
  res.json(await prisma.usuario.findMany({where:{ativo:true},select:{id:true,nome:true,cargo:true,perfil:true},orderBy:{nome:'asc'}}));
}catch(e){next(e)}});
module.exports=r;

// ═══ ADMIN RESET — limpa toda a base operacional ═══
r.post('/admin/reset',async(req,res,next)=>{try{
  const{pin,confirmar}=req.body;
  if(pin!=='2305')return res.status(403).json({error:'PIN master obrigatório'});
  if(confirmar!=='LIMPAR TUDO')return res.status(400).json({error:'Digite "LIMPAR TUDO" para confirmar'});
  // Delete in order (foreign keys)
  const counts={};
  counts.retiradas=await prisma.retiradaRecente.deleteMany({}).then(r=>r.count);
  counts.movimentacoes=await prisma.movimentacao.deleteMany({}).then(r=>r.count);
  counts.pagamentos=await prisma.pagamento.deleteMany({}).then(r=>r.count);
  counts.plano_doses=await prisma.planoContratadoDose.deleteMany({}).then(r=>r.count);
  counts.planos_contratados=await prisma.planoContratado.deleteMany({}).then(r=>r.count);
  counts.unidades=await prisma.unidade.deleteMany({}).then(r=>r.count);
  counts.lotes=await prisma.lote.deleteMany({}).then(r=>r.count);
  counts.vacinas=await prisma.vacina.deleteMany({}).then(r=>r.count);
  counts.clientes=await prisma.cliente.deleteMany({}).then(r=>r.count);
  counts.metas=await prisma.metaFinanceira.deleteMany({}).then(r=>r.count);
  res.json({success:true,message:'Base limpa com sucesso',registros_removidos:counts});
}catch(e){next(e)}});
