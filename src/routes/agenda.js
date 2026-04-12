const{Router}=require('express');const r=Router();const prisma=require('../config/database');
r.get('/regioes',async(req,res,next)=>{try{res.json(await prisma.regiao.findMany({where:{ativo:true},orderBy:{diaSemana:'asc'}}))}catch(e){next(e)}});
r.post('/regioes',async(req,res,next)=>{try{const{nome,cor,dia_semana,bairros}=req.body;if(!nome)return res.status(400).json({error:'Nome obrigatório'});res.json({success:true,regiao:await prisma.regiao.create({data:{nome,cor:cor||'#2BBCB3',diaSemana:dia_semana!=null?+dia_semana:null,bairros:bairros||[]}})})}catch(e){next(e)}});
r.put('/regioes/:id',async(req,res,next)=>{try{const b=req.body;const d={};if(b.nome)d.nome=b.nome;if(b.cor)d.cor=b.cor;if(b.dia_semana!=null)d.diaSemana=+b.dia_semana;if(b.bairros)d.bairros=b.bairros;if(b.ativo!=null)d.ativo=b.ativo;await prisma.regiao.update({where:{id:+req.params.id},data:d});res.json({success:true})}catch(e){next(e)}});

r.get('/',async(req,res,next)=>{try{
  const{data,regiao_id,status,semana,mes}=req.query;const w={};
  if(data){const d=new Date(data);const s=new Date(d.getFullYear(),d.getMonth(),d.getDate());const e=new Date(s);e.setDate(e.getDate()+1);w.data={gte:s,lt:e}}
  else if(semana){const ref=new Date(semana);const day=ref.getDay();const diff=ref.getDate()-day+(day===0?-6:1);const s=new Date(ref);s.setDate(diff);s.setHours(0,0,0,0);const e=new Date(s);e.setDate(e.getDate()+7);w.data={gte:s,lt:e}}
  else if(mes){const[y,m]=mes.split('-').map(Number);w.data={gte:new Date(y,m-1,1),lt:new Date(y,m,1)}}
  if(regiao_id)w.regiaoId=+regiao_id;if(status)w.status=status;
  const ags=await prisma.agendamento.findMany({where:w,orderBy:[{data:'asc'},{horario:'asc'}],
    include:{cliente:{select:{id:true,nome:true,codigoCliente:true,telefone:true,responsavelNome:true,responsavelTelefone:true,tipoPaciente:true,bairro:true,endereco:true}},regiao:{select:{id:true,nome:true,cor:true}}}});
  const dIds=ags.filter(a=>a.planoDoseId).map(a=>a.planoDoseId);
  const ds=dIds.length?await prisma.planoContratadoDose.findMany({where:{id:{in:dIds}},include:{vacina:{select:{nome:true}}}}):[];
  const dm={};ds.forEach(d=>{dm[d.id]={v:d.vacina.nome,d:d.doseNumero,c:d.competencia}});
  const vIds=[...new Set(ags.filter(a=>a.vacinaId&&!a.planoDoseId).map(a=>a.vacinaId))];
  const vs=vIds.length?await prisma.vacina.findMany({where:{id:{in:vIds}},select:{id:true,nome:true}}):[];
  const vm={};vs.forEach(v=>{vm[v.id]=v.nome});
  res.json(ags.map(a=>{const di=dm[a.planoDoseId];const cel=a.cliente.telefone||a.cliente.responsavelTelefone||'';
    const isC=a.cliente.tipoPaciente==='crianca'||a.cliente.tipoPaciente==='bebe';
    return{id:a.id,data:a.data,horario:a.horario,status:a.status,cliente_id:a.clienteId,paciente:a.cliente.nome,
      responsavel:isC?a.cliente.responsavelNome:null,codigo_cliente:a.cliente.codigoCliente,celular:cel,
      bairro:a.cliente.bairro,endereco:a.endereco||a.cliente.endereco,
      vacina:di?.v||vm[a.vacinaId]||'A definir',dose_numero:di?.d||null,
      regiao_id:a.regiaoId,regiao_nome:a.regiao?.nome,regiao_cor:a.regiao?.cor,
      observacoes:a.observacoes}}));
}catch(e){next(e)}});

r.post('/gerar',async(req,res,next)=>{try{
  const{mes,ano,max_por_dia=12}=req.body;const tM=mes!=null?+mes:new Date().getMonth()+1;const tY=ano||new Date().getFullYear();
  const clientes=await prisma.cliente.findMany({where:{tipoCliente:'ativo',status:'ativo'},
    select:{id:true,bairro:true,regiaoId:true,planosContratados:{where:{statusContrato:'ativo'},
      include:{doses:{where:{status:'pendente'},include:{vacina:{select:{id:true,nome:true}}}}}}}});
  const regioes=await prisma.regiao.findMany({where:{ativo:true}});
  const regMap={};const bMap={};
  regioes.forEach(r2=>{regMap[r2.id]=r2;(r2.bairros||[]).forEach(b=>{bMap[b.toLowerCase()]=r2})});
  const items=[];
  for(const cli of clientes){
    let rId=cli.regiaoId;if(!rId&&cli.bairro)rId=bMap[cli.bairro.toLowerCase()]?.id||null;
    for(const p of cli.planosContratados){for(const d of p.doses){
      let ok=true;if(d.competencia){const[cy,cm]=d.competencia.split('-').map(Number);if(cy!==tY||cm!==tM)ok=false}
      if(ok){const ex=await prisma.agendamento.findFirst({where:{clienteId:cli.id,planoDoseId:d.id,status:{notIn:['cancelado','faltou']}}});
        if(!ex)items.push({cId:cli.id,pId:p.id,dId:d.id,vId:d.vacinaId,rId})}}}}
  // Group by region
  const byR={};items.forEach(it=>{const k=it.rId||0;if(!byR[k])byR[k]=[];byR[k].push(it)});
  const dim=new Date(tY,tM,0).getDate();let created=0;
  for(const[rStr,rItems] of Object.entries(byR)){
    const rId=+rStr||null;const reg=rId?regMap[rId]:null;const tDow=reg?.diaSemana||null;
    const avail=[];
    for(let d=1;d<=dim;d++){const dt=new Date(tY,tM-1,d);const dow=dt.getDay();
      if(tDow){if(dow===tDow)avail.push(dt)}else{if(dow>=1&&dow<=5)avail.push(dt)}}
    if(!avail.length)avail.push(new Date(tY,tM-1,1));
    let di=0,si=0;
    for(const it of rItems){
      if(si>=max_por_dia){di++;si=0}if(di>=avail.length)di=0;
      const sd=avail[di];const hr=9+Math.floor(si/2);const mn=si%2===0?'00':'30';
      await prisma.agendamento.create({data:{clienteId:it.cId,planoContratadoId:it.pId,planoDoseId:it.dId,vacinaId:it.vId,
        regiaoId:it.rId,data:sd,horario:`${String(hr).padStart(2,'0')}:${mn}`,status:'agendado',
        criadoPor:req.body.usuario_id?+req.body.usuario_id:null}});
      created++;si++}}
  res.json({success:true,message:`✓ ${created} agendamentos criados para ${String(tM).padStart(2,'0')}/${tY}`,total:created});
}catch(e){next(e)}});

r.post('/',async(req,res,next)=>{try{const b=req.body;if(!b.cliente_id||!b.data)return res.status(400).json({error:'Cliente e data obrigatórios'});
  const ag=await prisma.agendamento.create({data:{clienteId:+b.cliente_id,vacinaId:b.vacina_id?+b.vacina_id:null,regiaoId:b.regiao_id?+b.regiao_id:null,
    data:new Date(b.data),horario:b.horario||null,status:'agendado',endereco:b.endereco||null,observacoes:b.observacoes||null,criadoPor:b.usuario_id?+b.usuario_id:null}});
  res.json({success:true,id:ag.id})}catch(e){next(e)}});
r.put('/:id/status',async(req,res,next)=>{try{const{status}=req.body;const d={status};
  if(status==='confirmado')d.confirmadoEm=new Date();if(status==='realizado')d.realizadoEm=new Date();
  await prisma.agendamento.update({where:{id:+req.params.id},data:d});res.json({success:true})}catch(e){next(e)}});
r.put('/:id',async(req,res,next)=>{try{const b=req.body;const d={};if(b.data)d.data=new Date(b.data);if(b.horario!=null)d.horario=b.horario;
  if(b.regiao_id!=null)d.regiaoId=+b.regiao_id||null;if(b.observacoes!=null)d.observacoes=b.observacoes;if(b.endereco!=null)d.endereco=b.endereco;
  await prisma.agendamento.update({where:{id:+req.params.id},data:d});res.json({success:true})}catch(e){next(e)}});
r.delete('/:id',async(req,res,next)=>{try{await prisma.agendamento.delete({where:{id:+req.params.id}});res.json({success:true})}catch(e){next(e)}});
module.exports=r;
