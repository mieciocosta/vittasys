const{Router}=require('express');const r=Router();const prisma=require('../config/database');
const multer=require('multer');const fs=require('fs');

// Memory storage — convert to base64, don't write to disk (Railway ephemeral FS)
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024},
  fileFilter:(_,file,cb)=>cb(null,file.mimetype.startsWith('image/'))});

function getRealIP(req){
  const xff=req.headers['x-forwarded-for'];
  if(xff)return xff.split(',')[0].trim();
  return req.ip||req.connection?.remoteAddress||'unknown';
}

async function logAudit(data){
  try{
    const detalhes=data.detalhes?(typeof data.detalhes==='string'?data.detalhes:JSON.stringify(data.detalhes)):null;
    await prisma.auditLog.create({data:{
      acao:data.acao,entidade:data.entidade||null,entidadeId:data.entidadeId?+data.entidadeId:null,
      usuarioId:data.usuarioId?+data.usuarioId:null,usuarioNome:data.usuarioNome||null,
      perfil:data.perfil||null,detalhes,ip:data.ip||null,userAgent:data.userAgent||null,
      rota:data.rota||null,sessaoId:data.sessaoId||null,
      fotoBase64:data.fotoBase64||null,
    }});
  }catch(e){console.error('Audit:',e.message)}
}

// ═══ LEVEL 1: USERS ═══
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

// ═══ LEVEL 2: DAYS ═══
r.get('/usuario/:id/dias',async(req,res,next)=>{try{
  const uid=+req.params.id;
  const events=await prisma.auditLog.findMany({where:{usuarioId:uid},select:{criadoEm:true,acao:true},orderBy:{criadoEm:'desc'}});
  const days={};const CRIT=['retirada','descarte','estorno','aprovar','reprovar','excluir'];
  events.forEach(e=>{const day=e.criadoEm.toISOString().slice(0,10);
    if(!days[day])days[day]={data:day,total:0,criticos:0,primeiro:e.criadoEm,ultimo:e.criadoEm};
    days[day].total++;if(CRIT.includes(e.acao))days[day].criticos++;
    if(e.criadoEm<days[day].primeiro)days[day].primeiro=e.criadoEm;
    if(e.criadoEm>days[day].ultimo)days[day].ultimo=e.criadoEm;
  });
  res.json(Object.values(days).map(d=>({...d,duracao_min:Math.round((d.ultimo.getTime()-d.primeiro.getTime())/60000)})).sort((a,b)=>b.data.localeCompare(a.data)));
}catch(e){next(e)}});

// ═══ LEVEL 3: TIMELINE (DESC) — exclude fotoBase64 from list, return has_foto flag ═══
r.get('/usuario/:id/dia/:data',async(req,res,next)=>{try{
  const uid=+req.params.id;const ds=req.params.data;
  const events=await prisma.auditLog.findMany({
    where:{usuarioId:uid,criadoEm:{gte:new Date(ds+'T00:00:00Z'),lte:new Date(ds+'T23:59:59.999Z')}},
    select:{id:true,criadoEm:true,acao:true,entidade:true,entidadeId:true,detalhes:true,ip:true,userAgent:true,rota:true,sessaoId:true,fotoPath:true,fotoBase64:false},
    orderBy:{criadoEm:'desc'}
  });
  // Check which have photos (without loading base64)
  const photoIds=await prisma.auditLog.findMany({
    where:{usuarioId:uid,criadoEm:{gte:new Date(ds+'T00:00:00Z'),lte:new Date(ds+'T23:59:59.999Z')},OR:[{fotoBase64:{not:null}},{fotoPath:{not:null}}]},
    select:{id:true}});
  const hasPhoto=new Set(photoIds.map(p=>p.id));

  let nextEv=null;
  const timeline=events.map(e=>{
    let gap=nextEv?Math.round((nextEv.getTime()-e.criadoEm.getTime())/1000):null;nextEv=e.criadoEm;
    const ua=e.userAgent||'';
    const edgeM=ua.match(/Edg\/([\d.]+)/);const chromeM=ua.match(/Chrome\/([\d.]+)/);const ffM=ua.match(/Firefox\/([\d.]+)/);const safM=ua.match(/Version\/([\d.]+).*Safari/);
    let browser='—';
    if(edgeM)browser=`Edge ${edgeM[1]}`;else if(chromeM)browser=`Chrome ${chromeM[1]}`;else if(ffM)browser=`Firefox ${ffM[1]}`;else if(safM)browser=`Safari ${safM[1]}`;
    const os=ua.includes('Windows')?'Windows':ua.includes('Mac')?'macOS':ua.includes('Linux')?'Linux':ua.includes('Android')?'Android':ua.includes('iPhone')?'iOS':'—';
    const device=(ua.includes('Mobile')||ua.includes('Android')||ua.includes('iPhone'))?'📱 Mobile':'🖥️ Desktop';
    let det=null;try{if(e.detalhes)det=JSON.parse(e.detalhes)}catch(x){}
    return{id:e.id,hora:e.criadoEm,acao:e.acao,entidade:e.entidade,entidade_id:e.entidadeId,
      detalhes:det,ip:e.ip,user_agent_raw:ua,browser,os,device,rota:e.rota,sessao_id:e.sessaoId,
      gap_seconds:gap,latitude:det?.latitude||null,longitude:det?.longitude||null,
      geo_status:det?.geo_status||null,has_foto:hasPhoto.has(e.id)};
  });
  const last=events[0]?.criadoEm;const first=events[events.length-1]?.criadoEm;
  const dur=first&&last?Math.round((last.getTime()-first.getTime())/60000):0;
  const idle=timeline.reduce((s,e)=>(e.gap_seconds&&e.gap_seconds>300)?s+Math.round(e.gap_seconds/60):s,0);
  res.json({usuario_id:uid,dia:ds,sessao:{primeiro:first,ultimo:last,duracao_min:dur,ativo_min:dur-idle,ocioso_min:idle,total_eventos:events.length},timeline});
}catch(e){next(e)}});

// ═══ GET PHOTO BY LOG ID (lazy load) ═══
r.get('/foto/:id',async(req,res,next)=>{try{
  const log=await prisma.auditLog.findUnique({where:{id:+req.params.id},select:{fotoBase64:true,fotoPath:true}});
  if(!log)return res.status(404).json({error:'Não encontrado'});
  if(log.fotoBase64){
    return res.json({foto:`data:image/jpeg;base64,${log.fotoBase64}`});
  }
  if(log.fotoPath){
    return res.json({foto:log.fotoPath});
  }
  res.json({foto:null});
}catch(e){next(e)}});

// ═══ STATS ═══
r.get('/stats',async(req,res,next)=>{try{
  const today=new Date();today.setHours(0,0,0,0);
  const[total,hoje,logins,criticas]=await Promise.all([prisma.auditLog.count(),prisma.auditLog.count({where:{criadoEm:{gte:today}}}),prisma.auditLog.count({where:{acao:'login',criadoEm:{gte:today}}}),prisma.auditLog.count({where:{acao:{in:['retirada','descarte','estorno','aprovar','reprovar','excluir']}}})]);
  res.json({total,hoje,logins_hoje:logins,acoes_criticas:criticas});
}catch(e){next(e)}});

// ═══ LOG (frontend) ═══
r.post('/log',async(req,res,next)=>{try{
  await logAudit({...req.body,ip:getRealIP(req),userAgent:req.get('user-agent')});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ LOG WITH PHOTO (base64 in DB — persists across deploys) ═══
r.post('/log-com-foto',upload.single('foto'),async(req,res,next)=>{try{
  const b=req.body;
  let fotoBase64=null;
  if(req.file){fotoBase64=req.file.buffer.toString('base64')}
  let detalhes=b.detalhes;
  if(typeof detalhes==='string'){try{detalhes=JSON.parse(detalhes)}catch(e){}}
  const log=await prisma.auditLog.create({data:{
    acao:b.acao||'evidencia',entidade:b.entidade||null,entidadeId:b.entidadeId?+b.entidadeId:null,
    usuarioId:b.usuarioId?+b.usuarioId:null,usuarioNome:b.usuarioNome||null,
    perfil:b.perfil||null,detalhes:detalhes?JSON.stringify(detalhes):null,
    ip:getRealIP(req),userAgent:req.get('user-agent'),
    rota:b.rota||null,sessaoId:b.sessaoId||null,fotoBase64,
  }});
  res.json({success:true,id:log.id});
}catch(e){next(e)}});

module.exports=r;module.exports.logAudit=logAudit;module.exports.getRealIP=getRealIP;
