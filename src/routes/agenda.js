const{Router}=require('express');const r=Router();const prisma=require('../config/database');

// ═══ REGIÕES ═══
r.get('/regioes',async(req,res,next)=>{try{
  const regioes=await prisma.regiao.findMany({where:{ativo:true},orderBy:{id:'asc'}});
  res.json(regioes);
}catch(e){next(e)}});

r.post('/regioes',async(req,res,next)=>{try{
  const{nome,cor,dia_semana,bairros}=req.body;
  if(!nome)return res.status(400).json({error:'Nome obrigatório'});
  const reg=await prisma.regiao.create({data:{nome,cor:cor||'#2BBCB3',diaSemana:dia_semana!=null?+dia_semana:null,bairros:bairros||[]}});
  res.json({success:true,regiao:reg});
}catch(e){next(e)}});

r.put('/regioes/:id',async(req,res,next)=>{try{
  const{nome,cor,dia_semana,bairros,ativo}=req.body;
  const data={};
  if(nome)data.nome=nome;
  if(cor)data.cor=cor;
  if(dia_semana!=null)data.diaSemana=+dia_semana;
  if(bairros)data.bairros=bairros;
  if(ativo!=null)data.ativo=ativo;
  await prisma.regiao.update({where:{id:+req.params.id},data});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ AGENDA: LISTAR ═══
r.get('/',async(req,res,next)=>{try{
  const{data,regiao_id,status,semana}=req.query;
  const where={};
  
  if(data){
    const d=new Date(data);
    const start=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    const end=new Date(start);end.setDate(end.getDate()+1);
    where.data={gte:start,lt:end};
  }else if(semana){
    // Get week start (Monday)
    const ref=new Date(semana);
    const day=ref.getDay();const diff=ref.getDate()-day+(day===0?-6:1);
    const start=new Date(ref.setDate(diff));start.setHours(0,0,0,0);
    const end=new Date(start);end.setDate(end.getDate()+7);
    where.data={gte:start,lt:end};
  }
  if(regiao_id)where.regiaoId=+regiao_id;
  if(status)where.status=status;

  const agendamentos=await prisma.agendamento.findMany({
    where,orderBy:[{data:'asc'},{horario:'asc'}],
    include:{
      cliente:{select:{id:true,nome:true,codigoCliente:true,telefone:true,responsavelNome:true,
        responsavelTelefone:true,tipoPaciente:true,bairro:true,endereco:true,pacienteNome:true}},
      regiao:{select:{id:true,nome:true,cor:true}},
    }
  });

  // Enrich with vaccine info
  const doseIds=agendamentos.filter(a=>a.planoDoseId).map(a=>a.planoDoseId);
  const doses=doseIds.length?await prisma.planoContratadoDose.findMany({
    where:{id:{in:doseIds}},include:{vacina:{select:{nome:true,codigo:true}}}
  }):[];
  const doseMap={};doses.forEach(d=>{doseMap[d.id]={vacina:d.vacina.nome,dose:d.doseNumero,competencia:d.competencia}});

  // Enrich with vacina name for direct vacinaId
  const vacIds=[...new Set(agendamentos.filter(a=>a.vacinaId&&!a.planoDoseId).map(a=>a.vacinaId))];
  const vacs=vacIds.length?await prisma.vacina.findMany({where:{id:{in:vacIds}},select:{id:true,nome:true}}):[];
  const vacMap={};vacs.forEach(v=>{vacMap[v.id]=v.nome});

  res.json(agendamentos.map(a=>{
    const di=doseMap[a.planoDoseId];
    const celular=a.cliente.telefone||a.cliente.responsavelTelefone||'';
    const isChild=a.cliente.tipoPaciente==='crianca'||a.cliente.tipoPaciente==='bebe';
    return{
      id:a.id,data:a.data,horario:a.horario,status:a.status,
      cliente_id:a.clienteId,paciente:a.cliente.nome,
      responsavel:isChild?a.cliente.responsavelNome:null,
      codigo_cliente:a.cliente.codigoCliente,celular,
      bairro:a.cliente.bairro,endereco:a.endereco||a.cliente.endereco,
      vacina:di?.vacina||vacMap[a.vacinaId]||'A definir',
      dose_numero:di?.dose||null,competencia:di?.competencia||null,
      regiao_id:a.regiaoId,regiao_nome:a.regiao?.nome,regiao_cor:a.regiao?.cor,
      plano_contratado_id:a.planoContratadoId,plano_dose_id:a.planoDoseId,
      observacoes:a.observacoes,confirmado_em:a.confirmadoEm,realizado_em:a.realizadoEm,
    };
  }));
}catch(e){next(e)}});

// ═══ AGENDA: GERAR AUTOMÁTICA ═══
r.post('/gerar',async(req,res,next)=>{try{
  const{mes,ano,max_por_dia=12}=req.body;
  const targetMonth=mes!=null?+mes:new Date().getMonth()+1; // 1-based
  const targetYear=ano||new Date().getFullYear();

  // 1. Get all active clients with pending doses in this month range
  const clientes=await prisma.cliente.findMany({
    where:{tipoCliente:'ativo',status:'ativo'},
    select:{id:true,nome:true,bairro:true,regiaoId:true,endereco:true,
      planosContratados:{where:{statusContrato:'ativo'},include:{
        doses:{where:{status:'pendente'},include:{vacina:{select:{id:true,nome:true}}}}
      }}
    }
  });

  // 2. Get regions
  const regioes=await prisma.regiao.findMany({where:{ativo:true}});
  const regMap={};regioes.forEach(r2=>{regMap[r2.id]=r2;
    // Build bairro→regiao lookup
    (r2.bairros||[]).forEach(b=>{regMap['B:'+b.toLowerCase()]=r2});
  });

  // 3. Build list of agendamentos needed
  const items=[];
  for(const cli of clientes){
    // Find client region
    let regId=cli.regiaoId;
    if(!regId&&cli.bairro){
      const match=regMap['B:'+cli.bairro.toLowerCase()];
      if(match)regId=match.id;
    }

    for(const plano of cli.planosContratados){
      for(const dose of plano.doses){
        // Check if dose competencia matches target month
        const comp=dose.competencia; // format: "2026-04" or null
        let shouldSchedule=true;
        if(comp){
          const[cy,cm]=comp.split('-').map(Number);
          if(cy!==targetYear||cm!==targetMonth)shouldSchedule=false;
        }else{
          // No competencia — check mesPrevisto relative to plan start
          shouldSchedule=true; // Include all pending if no competencia
        }

        if(shouldSchedule){
          // Check if already scheduled
          const existing=await prisma.agendamento.findFirst({
            where:{clienteId:cli.id,planoDoseId:dose.id,status:{notIn:['cancelado','faltou']}}
          });
          if(!existing){
            items.push({clienteId:cli.id,planoContratadoId:plano.id,planoDoseId:dose.id,
              vacinaId:dose.vacinaId,regiaoId:regId||null,bairro:cli.bairro});
          }
        }
      }
    }
  }

  // 4. Group by region and distribute across days
  const byRegion={};
  items.forEach(it=>{
    const key=it.regiaoId||'sem_regiao';
    if(!byRegion[key])byRegion[key]=[];
    byRegion[key].push(it);
  });

  let created=0;
  for(const[regIdStr,regItems] of Object.entries(byRegion)){
    const regId=regIdStr==='sem_regiao'?null:+regIdStr;
    const reg=regId?regMap[regId]:null;
    const baseDow=reg?.diaSemana||5; // default Friday

    // Find next occurrence of that day of week in target month
    let baseDate=new Date(targetYear,targetMonth-1,1);
    while(baseDate.getDay()!==baseDow%7){baseDate.setDate(baseDate.getDate()+1)}

    let dayOffset=0;let countThisDay=0;
    for(const item of regItems){
      if(countThisDay>=max_por_dia){dayOffset+=7;countThisDay=0;} // next week same day
      const schedDate=new Date(baseDate);schedDate.setDate(baseDate.getDate()+dayOffset);
      const hour=9+Math.floor(countThisDay/2);
      const min=countThisDay%2===0?'00':'30';
      const horario=`${String(hour).padStart(2,'0')}:${min}`;

      await prisma.agendamento.create({data:{
        clienteId:item.clienteId,planoContratadoId:item.planoContratadoId,
        planoDoseId:item.planoDoseId,vacinaId:item.vacinaId,
        regiaoId:item.regiaoId,data:schedDate,horario,
        status:'agendado',criadoPor:req.body.usuario_id?+req.body.usuario_id:null,
      }});
      created++;countThisDay++;
    }
  }

  res.json({success:true,message:`Agenda gerada: ${created} agendamentos criados`,total:created,
    por_regiao:Object.fromEntries(Object.entries(byRegion).map(([k,v])=>[k,v.length]))});
}catch(e){next(e)}});

// ═══ AGENDA: ATUALIZAR STATUS ═══
r.put('/:id/status',async(req,res,next)=>{try{
  const{status}=req.body;
  if(!['agendado','confirmado','realizado','faltou','cancelado'].includes(status))
    return res.status(400).json({error:'Status inválido'});
  const data={status};
  if(status==='confirmado')data.confirmadoEm=new Date();
  if(status==='realizado')data.realizadoEm=new Date();
  await prisma.agendamento.update({where:{id:+req.params.id},data});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ AGENDA: EDITAR ═══
r.put('/:id',async(req,res,next)=>{try{
  const b=req.body;const data={};
  if(b.data)data.data=new Date(b.data);
  if(b.horario)data.horario=b.horario;
  if(b.regiao_id!=null)data.regiaoId=+b.regiao_id;
  if(b.observacoes!=null)data.observacoes=b.observacoes;
  if(b.endereco!=null)data.endereco=b.endereco;
  await prisma.agendamento.update({where:{id:+req.params.id},data});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ AGENDA: EXCLUIR ═══
r.delete('/:id',async(req,res,next)=>{try{
  await prisma.agendamento.delete({where:{id:+req.params.id}});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ AGENDA: RESUMO DO DIA/SEMANA ═══
r.get('/resumo',async(req,res,next)=>{try{
  const now=new Date();
  const hoje=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const amanha=new Date(hoje);amanha.setDate(amanha.getDate()+1);
  // Week boundaries
  const day=hoje.getDay();const diff=hoje.getDate()-day+(day===0?-6:1);
  const weekStart=new Date(hoje);weekStart.setDate(diff);weekStart.setHours(0,0,0,0);
  const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+7);

  const[hojeTotal,hojeConf,hojeReal,hojeFalta,semanaTotal,semanaReal]=await Promise.all([
    prisma.agendamento.count({where:{data:{gte:hoje,lt:amanha}}}),
    prisma.agendamento.count({where:{data:{gte:hoje,lt:amanha},status:'confirmado'}}),
    prisma.agendamento.count({where:{data:{gte:hoje,lt:amanha},status:'realizado'}}),
    prisma.agendamento.count({where:{data:{gte:hoje,lt:amanha},status:'faltou'}}),
    prisma.agendamento.count({where:{data:{gte:weekStart,lt:weekEnd}}}),
    prisma.agendamento.count({where:{data:{gte:weekStart,lt:weekEnd},status:'realizado'}}),
  ]);

  // By region for the week
  const byRegiao=await prisma.agendamento.groupBy({
    by:['regiaoId'],where:{data:{gte:weekStart,lt:weekEnd}},_count:true
  });

  const regioes=await prisma.regiao.findMany({where:{ativo:true}});
  const regMap={};regioes.forEach(r2=>{regMap[r2.id]=r2});

  res.json({
    hoje:{total:hojeTotal,confirmados:hojeConf,realizados:hojeReal,faltas:hojeFalta,pendentes:hojeTotal-hojeConf-hojeReal-hojeFalta},
    semana:{total:semanaTotal,realizados:semanaReal},
    por_regiao:byRegiao.map(b=>({regiao_id:b.regiaoId,nome:regMap[b.regiaoId]?.nome||'Sem região',cor:regMap[b.regiaoId]?.cor||'#94a3b8',total:b._count})),
  });
}catch(e){next(e)}});

module.exports=r;
