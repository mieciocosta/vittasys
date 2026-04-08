const{Router}=require('express');const r=Router();const prisma=require('../config/database');

async function logAudit(data){
  try{await prisma.auditLog.create({data:{acao:data.acao,entidade:data.entidade||null,entidadeId:data.entidadeId||null,usuarioId:data.usuarioId||null,usuarioNome:data.usuarioNome||null,perfil:data.perfil||null,detalhes:data.detalhes?JSON.stringify(data.detalhes):null,ip:data.ip||null,userAgent:data.userAgent||null,rota:data.rota||null,sessaoId:data.sessaoId||null}})}catch(e){console.error('Audit:',e.message)}
}

// ═══ LEVEL 1: USERS WITH STATS ═══
r.get('/usuarios',async(req,res,next)=>{try{
  const{search}=req.query;
  const usuarios=await prisma.usuario.findMany({
    where:search?{OR:[{nome:{contains:search,mode:'insensitive'}},{email:{contains:search,mode:'insensitive'}},{perfil:{contains:search,mode:'insensitive'}}]}:undefined,
    select:{id:true,nome:true,cargo:true,email:true,perfil:true},orderBy:{nome:'asc'}});
  const[stats,critical]=await Promise.all([
    prisma.auditLog.groupBy({by:['usuarioId'],_count:true,_max:{criadoEm:true}}),
    prisma.auditLog.groupBy({by:['usuarioId'],where:{acao:{in:['retirada','descarte','estorno','aprovar','reprovar','excluir']}},_count:true})]);
  const sm=Object.fromEntries(stats.map(s=>[s.usuarioId,{total:s._count,ultimo:s._max.criadoEm}]));
  const cm=Object.fromEntries(critical.map(c=>[c.usuarioId,c._count]));
  res.json(usuarios.map(u=>({id:u.id,nome:u.nome,cargo:u.cargo,email:u.email,perfil:u.perfil,
    total_eventos:sm[u.id]?.total||0,ultimo_acesso:sm[u.id]?.ultimo||null,acoes_criticas:cm[u.id]||0})));
}catch(e){next(e)}});

// ═══ LEVEL 2: DAYS FOR USER ═══
r.get('/usuario/:id/dias',async(req,res,next)=>{try{
  const uid=+req.params.id;
  const events=await prisma.auditLog.findMany({where:{usuarioId:uid},select:{criadoEm:true,acao:true},orderBy:{criadoEm:'desc'}});
  const days={};
  events.forEach(e=>{const day=e.criadoEm.toISOString().slice(0,10);
    if(!days[day])days[day]={data:day,total:0,criticos:0,primeiro:e.criadoEm,ultimo:e.criadoEm};
    days[day].total++;
    if(['retirada','descarte','estorno','aprovar','reprovar','excluir'].includes(e.acao))days[day].criticos++;
    if(e.criadoEm<days[day].primeiro)days[day].primeiro=e.criadoEm;
    if(e.criadoEm>days[day].ultimo)days[day].ultimo=e.criadoEm;
  });
  res.json(Object.values(days).map(d=>({...d,duracao_min:Math.round((d.ultimo.getTime()-d.primeiro.getTime())/60000)})).sort((a,b)=>b.data.localeCompare(a.data)));
}catch(e){next(e)}});

// ═══ LEVEL 3: TIMELINE FOR USER+DAY ═══
r.get('/usuario/:id/dia/:data',async(req,res,next)=>{try{
  const uid=+req.params.id;const ds=req.params.data;
  const events=await prisma.auditLog.findMany({where:{usuarioId:uid,criadoEm:{gte:new Date(ds+'T00:00:00Z'),lte:new Date(ds+'T23:59:59.999Z')}},orderBy:{criadoEm:'asc'}});
  let prev=null;
  const timeline=events.map(e=>{
    let gap=prev?Math.round((e.criadoEm.getTime()-prev.getTime())/1000):null;prev=e.criadoEm;
    const ua=e.userAgent||'';
    const browser=ua.includes('Chrome')?'Chrome':ua.includes('Firefox')?'Firefox':ua.includes('Safari')?'Safari':ua.includes('Edge')?'Edge':'—';
    const os=ua.includes('Windows')?'Windows':ua.includes('Mac')?'macOS':ua.includes('Linux')?'Linux':ua.includes('Android')?'Android':ua.includes('iPhone')?'iOS':'—';
    const device=ua.includes('Mobile')||ua.includes('Android')||ua.includes('iPhone')?'📱 Mobile':'🖥️ Desktop';
    let det=null;try{if(e.detalhes)det=JSON.parse(e.detalhes)}catch(x){}
    return{id:e.id,hora:e.criadoEm,acao:e.acao,entidade:e.entidade,entidade_id:e.entidadeId,detalhes:det,ip:e.ip,browser,os,device,rota:e.rota,sessao_id:e.sessaoId,gap_seconds:gap,latitude:det?.latitude||null,longitude:det?.longitude||null};
  });
  const p=events[0]?.criadoEm;const u=events[events.length-1]?.criadoEm;
  const dur=p&&u?Math.round((u.getTime()-p.getTime())/60000):0;
  const idle=timeline.reduce((s,e)=>(e.gap_seconds&&e.gap_seconds>300)?s+Math.round(e.gap_seconds/60):s,0);
  res.json({usuario_id:uid,dia:ds,sessao:{primeiro:p,ultimo:u,duracao_min:dur,ativo_min:dur-idle,ocioso_min:idle,total_eventos:events.length},timeline});
}catch(e){next(e)}});

// ═══ GLOBAL STATS ═══
r.get('/stats',async(req,res,next)=>{try{
  const today=new Date();today.setHours(0,0,0,0);
  const[total,hoje,logins,criticas]=await Promise.all([prisma.auditLog.count(),prisma.auditLog.count({where:{criadoEm:{gte:today}}}),prisma.auditLog.count({where:{acao:'login',criadoEm:{gte:today}}}),prisma.auditLog.count({where:{acao:{in:['retirada','descarte','estorno','aprovar','reprovar','excluir']}}})]);
  res.json({total,hoje,logins_hoje:logins,acoes_criticas:criticas});
}catch(e){next(e)}});

r.post('/log',async(req,res,next)=>{try{
  await logAudit({...req.body,ip:req.ip,userAgent:req.get('user-agent')});
  res.json({success:true});
}catch(e){next(e)}});

module.exports=r;module.exports.logAudit=logAudit;
