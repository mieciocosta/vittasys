const{Router}=require('express');const r=Router();const prisma=require('../config/database');

// ═══ AUDIT HELPER — call from any route ═══
async function logAudit(data){
  try{
    await prisma.auditLog.create({data:{
      acao:data.acao,entidade:data.entidade||null,entidadeId:data.entidadeId||null,
      usuarioId:data.usuarioId||null,usuarioNome:data.usuarioNome||null,
      perfil:data.perfil||null,detalhes:data.detalhes?JSON.stringify(data.detalhes):null,
      ip:data.ip||null,userAgent:data.userAgent||null,rota:data.rota||null,
      sessaoId:data.sessaoId||null,
    }});
  }catch(e){console.error('Audit log error:',e.message)}
}

// ═══ LIST AUDIT LOGS (master only) ═══
r.get('/',async(req,res,next)=>{try{
  const{page=1,limit=50,acao,entidade,usuario_id,search,from,to}=req.query;
  const where={};
  if(acao)where.acao=acao;
  if(entidade)where.entidade=entidade;
  if(usuario_id)where.usuarioId=+usuario_id;
  if(search)where.OR=[
    {usuarioNome:{contains:search,mode:'insensitive'}},
    {detalhes:{contains:search,mode:'insensitive'}},
    {rota:{contains:search,mode:'insensitive'}},
    {entidade:{contains:search,mode:'insensitive'}},
  ];
  if(from||to){where.criadoEm={};if(from)where.criadoEm.gte=new Date(from);if(to)where.criadoEm.lte=new Date(to)}

  const[data,total]=await Promise.all([
    prisma.auditLog.findMany({where,orderBy:{criadoEm:'desc'},skip:(+page-1)*+limit,take:+limit}),
    prisma.auditLog.count({where})
  ]);

  res.json({data:data.map(l=>({
    id:l.id,acao:l.acao,entidade:l.entidade,entidade_id:l.entidadeId,
    usuario_id:l.usuarioId,usuario_nome:l.usuarioNome,perfil:l.perfil,
    detalhes:l.detalhes?JSON.parse(l.detalhes):null,
    ip:l.ip,user_agent:l.userAgent,rota:l.rota,sessao_id:l.sessaoId,
    criado_em:l.criadoEm,
  })),pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

// ═══ STATS ═══
r.get('/stats',async(req,res,next)=>{try{
  const today=new Date();today.setHours(0,0,0,0);
  const[total,hoje,logins,acoesCriticas]=await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({where:{criadoEm:{gte:today}}}),
    prisma.auditLog.count({where:{acao:'login',criadoEm:{gte:today}}}),
    prisma.auditLog.count({where:{acao:{in:['retirada','descarte','estorno','aprovar','reprovar']}}})
  ]);
  res.json({total,hoje,logins_hoje:logins,acoes_criticas:acoesCriticas});
}catch(e){next(e)}});

// ═══ LOG EVENT (from frontend) ═══
r.post('/log',async(req,res,next)=>{try{
  const b=req.body;
  await logAudit({...b,ip:req.ip,userAgent:req.get('user-agent')});
  res.json({success:true});
}catch(e){next(e)}});

module.exports=r;
module.exports.logAudit=logAudit;
