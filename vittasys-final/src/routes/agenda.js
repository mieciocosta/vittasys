const{Router}=require('express');const r=Router();const prisma=require('../config/database');

// REGIOES
r.get('/regioes',async(req,res,next)=>{try{res.json(await prisma.regiao.findMany({where:{ativo:true},orderBy:{diaSemana:'asc'}}))}catch(e){next(e)}});
r.post('/regioes',async(req,res,next)=>{try{const{nome,cor,dia_semana,bairros}=req.body;if(!nome)return res.status(400).json({error:'Nome obrigatório'});res.json({success:true,regiao:await prisma.regiao.create({data:{nome,cor:cor||'#2BBCB3',diaSemana:dia_semana!=null?+dia_semana:null,bairros:bairros||[]}})})}catch(e){next(e)}});
r.put('/regioes/:id',async(req,res,next)=>{try{const b=req.body;const d={};if(b.nome)d.nome=b.nome;if(b.cor)d.cor=b.cor;if(b.dia_semana!=null)d.diaSemana=+b.dia_semana;if(b.bairros)d.bairros=b.bairros;if(b.ativo!=null)d.ativo=b.ativo;await prisma.regiao.update({where:{id:+req.params.id},data:d});res.json({success:true})}catch(e){next(e)}});

// LISTAR
r.get('/',async(req,res,next)=>{try{
  const{data,regiao_id,status,semana,mes}=req.query;const w={};
  if(data){const d=new Date(data);const s=new Date(d.getFullYear(),d.getMonth(),d.getDate());const e=new Date(s);e.setDate(e.getDate()+1);w.data={gte:s,lt:e}}
  else if(semana){const ref=new Date(semana);const day=ref.getDay();const diff=ref.getDate()-day+(day===0?-6:1);const s=new Date(ref);s.setDate(diff);s.setHours(0,0,0,0);const e=new Date(s);e.setDate(e.getDate()+7);w.data={gte:s,lt:e}}
  else if(mes){const[y,m]=mes.split('-').map(Number);w.data={gte:new Date(y,m-1,1),lt:new Date(y,m,1)}}
  if(regiao_id)w.regiaoId=+regiao_id;if(status)w.status=status;
  const ags=await prisma.agendamento.findMany({where:w,orderBy:[{data:'asc'},{horario:'asc'}],
    include:{cliente:{select:{id:true,nome:true,codigoCliente:true,telefone:true,responsavelNome:true,responsavelTelefone:true,tipoPaciente:true,bairro:true,endereco:true,
      planosContratados:{where:{statusContrato:'ativo'},select:{id:true,nomePlano:true}}}},
    regiao:{select:{id:true,nome:true,cor:true}}}});
  // Enrich doses
  const dIds=ags.filter(a=>a.planoDoseId).map(a=>a.planoDoseId);
  const ds=dIds.length?await prisma.planoContratadoDose.findMany({where:{id:{in:dIds}},include:{vacina:{select:{nome:true}}}}):[];
  const dm={};ds.forEach(d=>{dm[d.id]={v:d.vacina.nome,d:d.doseNumero}});
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
      plano_contratado_id:a.planoContratadoId,plano_dose_id:a.planoDoseId,
      planos_ativos:a.cliente.planosContratados?.map(p=>({id:p.id,nome:p.nomePlano}))||[],
      observacoes:a.observacoes,vacina_id:a.vacinaId}}));
}catch(e){next(e)}});

// GERAR AUTOMATICA — distribui por TODAS as datas do mês, round-robin por região
r.post('/gerar',async(req,res,next)=>{try{
  const{mes,ano,max_por_dia=12}=req.body;
  const tM=mes!=null?+mes:new Date().getMonth()+1;const tY=ano||new Date().getFullYear();
  
  // Clients + pending doses
  const clientes=await prisma.cliente.findMany({where:{tipoCliente:'ativo',status:'ativo'},
    select:{id:true,bairro:true,regiaoId:true,
      planosContratados:{where:{statusContrato:'ativo'},include:{doses:{where:{status:'pendente'},include:{vacina:{select:{id:true,nome:true}}}}}}}});
  
  // Regions + bairro lookup
  const regioes=await prisma.regiao.findMany({where:{ativo:true}});
  const regMap={};const bMap={};
  regioes.forEach(rg=>{regMap[rg.id]=rg;(rg.bairros||[]).forEach(b=>{bMap[b.toLowerCase().trim()]=rg})});
  
  // Build items
  const items=[];
  for(const cli of clientes){
    let rId=cli.regiaoId;
    if(!rId&&cli.bairro){const m=bMap[cli.bairro.toLowerCase().trim()];if(m)rId=m.id}
    for(const p of cli.planosContratados){
      for(const d of p.doses){
        let ok=true;
        if(d.competencia){const[cy,cm]=d.competencia.split('-').map(Number);if(cy!==tY||cm!==tM)ok=false}
        if(!ok)continue;
        const ex=await prisma.agendamento.findFirst({where:{clienteId:cli.id,planoDoseId:d.id,status:{notIn:['cancelado','faltou']}}});
        if(!ex)items.push({cId:cli.id,pId:p.id,dId:d.id,vId:d.vacinaId,rId});
      }
    }
  }
  
  if(!items.length)return res.json({success:true,message:'Nenhuma dose pendente encontrada para este mês',total:0});
  
  // Build ALL available dates (Mon-Sat) in the month
  const dim=new Date(tY,tM,0).getDate();
  const allDates=[];
  for(let d=1;d<=dim;d++){const dt=new Date(tY,tM-1,d);const dow=dt.getDay();if(dow>=1&&dow<=6)allDates.push({date:dt,dow})}
  
  // Group items by region
  const byReg={};
  items.forEach(it=>{const k=it.rId||'none';if(!byReg[k])byReg[k]=[];byReg[k].push(it)});
  
  // Track how many slots used per date
  const slotsUsed={};allDates.forEach(d=>{slotsUsed[d.date.toISOString()]=0});
  
  let created=0;
  for(const[regKey,regItems] of Object.entries(byReg)){
    const rId=regKey==='none'?null:+regKey;
    const reg=rId?regMap[rId]:null;
    const prefDow=reg?.diaSemana||null;
    
    // Sort dates: preferred DOW first, then others
    const sortedDates=[...allDates].sort((a,b)=>{
      if(prefDow){
        const aMatch=a.dow===prefDow?0:1;const bMatch=b.dow===prefDow?0:1;
        if(aMatch!==bMatch)return aMatch-bMatch;
      }
      return a.date-b.date;
    });
    
    // Distribute items across dates, round-robin, respecting max
    let dateIdx=0;
    for(const item of regItems){
      // Find next date with available slot
      let attempts=0;
      while(attempts<sortedDates.length){
        const d=sortedDates[dateIdx%sortedDates.length];
        const key=d.date.toISOString();
        if(slotsUsed[key]<max_por_dia){
          const slot=slotsUsed[key];
          const hour=9+Math.floor(slot/2);const min=slot%2===0?'00':'30';
          await prisma.agendamento.create({data:{
            clienteId:item.cId,planoContratadoId:item.pId,planoDoseId:item.dId,vacinaId:item.vId,
            regiaoId:item.rId,data:d.date,horario:`${String(hour).padStart(2,'0')}:${min}`,
            status:'agendado',criadoPor:req.body.usuario_id?+req.body.usuario_id:null}});
          slotsUsed[key]++;created++;break;
        }
        dateIdx++;attempts++;
      }
      dateIdx++;
    }
  }
  
  res.json({success:true,message:`✓ ${created} agendamentos criados para ${String(tM).padStart(2,'0')}/${tY}`,total:created});
}catch(e){next(e)}});

// CRIAR MANUAL
r.post('/',async(req,res,next)=>{try{const b=req.body;
  if(!b.cliente_id||!b.data)return res.status(400).json({error:'Cliente e data obrigatórios'});
  const vacinas=b.vacina_ids||[];
  if(b.vacina_id)vacinas.push(+b.vacina_id);
  if(!vacinas.length)return res.status(400).json({error:'Selecione ao menos uma vacina'});
  const created=[];
  for(let i=0;i<vacinas.length;i++){
    const hr=b.horario||'09:00';
    const ag=await prisma.agendamento.create({data:{clienteId:+b.cliente_id,vacinaId:+vacinas[i],
      planoContratadoId:b.plano_contratado_id?+b.plano_contratado_id:null,
      regiaoId:b.regiao_id?+b.regiao_id:null,data:new Date(b.data),horario:hr,
      status:'agendado',endereco:b.endereco||null,observacoes:b.observacoes||null,
      criadoPor:b.usuario_id?+b.usuario_id:null}});
    created.push(ag.id);}
  res.json({success:true,ids:created,message:`${created.length} agendamento(s) criado(s)`})}catch(e){next(e)}});

// STATUS — with plan dose integration
r.put('/:id/status',async(req,res,next)=>{try{
  const{status}=req.body;
  const ag=await prisma.agendamento.findUnique({where:{id:+req.params.id}});
  if(!ag)return res.status(404).json({error:'Não encontrado'});
  
  const d={status};
  if(status==='confirmado')d.confirmadoEm=new Date();
  if(status==='realizado'){
    d.realizadoEm=new Date();
    // ═══ INTEGRAÇÃO: Marcar dose como aplicada no plano ═══
    if(ag.planoDoseId){
      await prisma.planoContratadoDose.update({
        where:{id:ag.planoDoseId},
        data:{status:'aplicada',dataAplicacao:new Date()}
      }).catch(()=>{});
    }
  }
  if(status==='faltou'||status==='cancelado'){
    // Se estava realizado e voltou, reverter dose
    if(ag.status==='realizado'&&ag.planoDoseId){
      await prisma.planoContratadoDose.update({
        where:{id:ag.planoDoseId},
        data:{status:'pendente',dataAplicacao:null}
      }).catch(()=>{});
    }
  }
  await prisma.agendamento.update({where:{id:+req.params.id},data:d});
  res.json({success:true});
}catch(e){next(e)}});

// EDITAR
r.put('/:id',async(req,res,next)=>{try{const b=req.body;const d={};
  if(b.data)d.data=new Date(b.data);if(b.horario!=null)d.horario=b.horario;
  if(b.regiao_id!=null)d.regiaoId=+b.regiao_id||null;if(b.observacoes!=null)d.observacoes=b.observacoes;
  if(b.endereco!=null)d.endereco=b.endereco;if(b.vacina_id!=null)d.vacinaId=+b.vacina_id||null;
  await prisma.agendamento.update({where:{id:+req.params.id},data:d});res.json({success:true})}catch(e){next(e)}});

// EXCLUIR
r.delete('/:id',async(req,res,next)=>{try{await prisma.agendamento.delete({where:{id:+req.params.id}});res.json({success:true})}catch(e){next(e)}});

// VACINAS DISPONIVEIS (para selecionar no agendamento manual)
r.get('/vacinas',async(req,res,next)=>{try{
  const vacinas=await prisma.vacina.findMany({select:{id:true,nome:true,codigo:true},orderBy:{nome:'asc'}});
  res.json(vacinas);
}catch(e){next(e)}});

// LIMPAR MÊS (para regenerar)
r.post('/limpar',async(req,res,next)=>{try{
  const{mes,ano}=req.body;const tM=+mes;const tY=+ano;
  const r2=await prisma.agendamento.deleteMany({where:{data:{gte:new Date(tY,tM-1,1),lt:new Date(tY,tM,1)},status:{in:['agendado']}}});
  res.json({success:true,message:`${r2.count} agendamentos removidos`,total:r2.count});
}catch(e){next(e)}});

module.exports=r;
