const{Router}=require('express');const r=Router();const prisma=require('../config/database');
const PERMS={master:['dashboard','retirada','estoque','historico','planos','clientes','financeiro','metas','alertas'],ativos:['dashboard','retirada','estoque','historico','planos','clientes','alertas'],espontaneos:['dashboard','retirada','estoque','historico','clientes','alertas'],operador:['dashboard','retirada','estoque','historico','clientes','alertas']};

r.post('/login',async(req,res,next)=>{try{
  const{usuario_id,pin}=req.body;
  const u=await prisma.usuario.findFirst({where:{id:parseInt(usuario_id),pin,ativo:true},select:{id:true,nome:true,cargo:true,email:true,perfil:true}});
  if(!u)return res.status(401).json({error:'PIN incorreto'});
  u.modulos_permitidos=PERMS[u.perfil]||PERMS.operador;
  res.json({success:true,usuario:u});
}catch(e){next(e)}});

r.get('/usuarios',async(req,res,next)=>{try{
  res.json(await prisma.usuario.findMany({where:{ativo:true},select:{id:true,nome:true,cargo:true,perfil:true},orderBy:{nome:'asc'}}));
}catch(e){next(e)}});
module.exports=r;
