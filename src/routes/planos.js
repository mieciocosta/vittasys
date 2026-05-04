const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/templates',async(req,res,next)=>{try{
  const planos=await prisma.plano.findMany({where:{status:'ativo'},orderBy:[{idadeInicio:'asc'},{idadeFim:'asc'}],include:{vacinas:{include:{vacina:true}}}});
  res.json(planos.map(p=>({...p,idade_inicio:p.idadeInicio,idade_fim:p.idadeFim,valor_tabela:p.valorTabela,valor_avista:p.valorAvista,valor_cartao:p.valorCartao,parcelas:p.parcelas,desc_pagamento:p.descPagamento,vacinas:p.vacinas.map(v=>({...v,vacina_nome:v.vacina.nome,vacina_codigo:v.vacina.codigo}))})));
}catch(e){next(e)}});

// ═══ CRIAR TEMPLATE DE PLANO ═══
r.post('/templates',async(req,res,next)=>{try{
  const b=req.body;
  if(!b.nome)return res.status(400).json({error:'Nome do plano obrigatório'});
  const p=await prisma.plano.create({data:{
    nome:b.nome,descricao:b.descricao||null,
    idadeInicio:+(b.idade_inicio||0),idadeFim:+(b.idade_fim||18),
    tipoPlano:b.tipo_plano||'padrao',validadeMeses:+(b.validade_meses||18),
    valorTabela:+(b.valor_tabela||0),valorAvista:b.valor_avista?+b.valor_avista:null,
    valorCartao:b.valor_cartao?+b.valor_cartao:null,parcelas:b.parcelas?+b.parcelas:1,
    descPagamento:b.desc_pagamento||null,status:'ativo'
  }});
  // Add vaccines
  if(b.vacinas?.length){
    for(const v of b.vacinas){
      await prisma.planoVacina.create({data:{planoId:p.id,vacinaId:+v.vacina_id,doses:+(v.doses||1),
        mesPrevInicio:+(v.mes_inicio||0),mesPrevFim:+(v.mes_fim||18)}});
    }
  }
  res.json({success:true,id:p.id});
}catch(e){next(e)}});

// ═══ EDITAR TEMPLATE ═══
r.put('/templates/:id',async(req,res,next)=>{try{
  const b=req.body;const id=+req.params.id;
  const data={};
  if(b.nome)data.nome=b.nome;
  if(b.descricao!==undefined)data.descricao=b.descricao;
  if(b.idade_inicio!=null)data.idadeInicio=+b.idade_inicio;
  if(b.idade_fim!=null)data.idadeFim=+b.idade_fim;
  if(b.valor_tabela!=null)data.valorTabela=+b.valor_tabela;
  if(b.valor_avista!=null)data.valorAvista=+b.valor_avista;
  if(b.valor_cartao!=null)data.valorCartao=+b.valor_cartao;
  if(b.parcelas!=null)data.parcelas=+b.parcelas;
  if(b.desc_pagamento!==undefined)data.descPagamento=b.desc_pagamento;
  await prisma.plano.update({where:{id},data});
  // Update vaccines if provided
  if(b.vacinas){
    await prisma.planoVacina.deleteMany({where:{planoId:id}});
    for(const v of b.vacinas){
      await prisma.planoVacina.create({data:{planoId:id,vacinaId:+v.vacina_id,doses:+(v.doses||1),
        mesPrevInicio:+(v.mes_inicio||0),mesPrevFim:+(v.mes_fim||18)}});
    }
  }
  res.json({success:true});
}catch(e){next(e)}});

// ═══ EXCLUIR TEMPLATE ═══
r.delete('/templates/:id',async(req,res,next)=>{try{
  await prisma.plano.update({where:{id:+req.params.id},data:{status:'inativo'}});
  res.json({success:true});
}catch(e){next(e)}});

r.get('/stats/resumo',async(req,res,next)=>{try{
  const[tc,dp,da,vt]=await Promise.all([
    prisma.planoContratado.count({where:{statusContrato:'ativo'}}),
    prisma.planoContratadoDose.count({where:{status:'pendente'}}),
    prisma.planoContratadoDose.count({where:{status:'aplicada'}}),
    prisma.planoContratado.aggregate({_sum:{valorFinal:true},where:{statusContrato:'ativo'}})]);
  res.json({total_contratos:tc,doses_pendentes:dp,doses_aplicadas:da,valor_total:vt._sum.valorFinal||0});
}catch(e){next(e)}});

r.get('/',async(req,res,next)=>{try{
  const{page=1,limit=50,search,status_contrato,sort,order}=req.query;
  const where={};if(status_contrato)where.statusContrato=status_contrato;
  if(search)where.OR=[{nomePlano:{contains:search,mode:'insensitive'}},{cliente:{nome:{contains:search,mode:'insensitive'}}}];
  const sm={id:'id',cliente_nome:{cliente:{nome:order==='ASC'?'asc':'desc'}},nome_plano:'nomePlano',valor_final:'valorFinal',status_contrato:'statusContrato',codigo_cliente:{cliente:{codigoCliente:order==='ASC'?'asc':'desc'}}};
  const ob=sort&&sm[sort]?typeof sm[sort]==='string'?{[sm[sort]]:order==='ASC'?'asc':'desc'}:sm[sort]:{id:'desc'};
  const[data,total]=await Promise.all([
    prisma.planoContratado.findMany({where,orderBy:ob,skip:(+page-1)*+limit,take:+limit,include:{
      cliente:{select:{nome:true,codigoCliente:true,tipoPaciente:true,dataNascimento:true,responsavelNome:true}},
      doses:true,pagamentos:true,
    }}),
    prisma.planoContratado.count({where})]);
  // Also get movimentação counts per client for progress fallback
  const clientIds=[...new Set(data.map(p=>p.clienteId))];
  const movCounts=clientIds.length>0?await prisma.movimentacao.groupBy({by:['clienteId'],where:{clienteId:{in:clientIds},tipo:{in:['retirada','aplicacao']},status:'concluido'},_count:true}):[];
  const movMap=Object.fromEntries(movCounts.map(m=>[m.clienteId,m._count]));

  const mapped=data.map(p=>{const tp=p.pagamentos.reduce((s,pg)=>s+pg.valorPago,0);
    const da2=p.doses.filter(d=>d.status==='aplicada').length;
    const dt=p.doses.length;
    // If plan has no formal doses, use movimentações as progress indicator
    const dosesAplicadas=dt>0?da2:(movMap[p.clienteId]||0);
    const dosesTotal=dt>0?dt:Math.max(dosesAplicadas,1);
    return{id:p.id,cliente_id:p.clienteId,nome_plano:p.nomePlano,idade_inicio:p.idadeInicio,idade_fim:p.idadeFim,valor_bruto:p.valorBruto,valor_final:p.valorFinal,valor_custo:p.valorCusto,percentual_desconto:p.percentualDesconto,forma_pagamento:p.formaPagamento,status_contrato:p.statusContrato,contrato_assinado:p.contratoAssinado,vendedor_id:p.vendedorId,
      cliente_nome:p.cliente.nome,codigo_cliente:p.cliente.codigoCliente,tipo_paciente:p.cliente.tipoPaciente,
      total_pago:tp,saldo_pendente:p.valorFinal-tp,doses_aplicadas:dosesAplicadas,doses_total:dosesTotal,
      vendedor_nome:'',criado_em:p.criadoEm}});
  res.json({data:mapped,pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

r.get('/:id',async(req,res,next)=>{try{
  const p=await prisma.planoContratado.findUnique({where:{id:+req.params.id},include:{cliente:{select:{id:true,nome:true,codigoCliente:true,dataNascimento:true,tipoPaciente:true,responsavelNome:true}},doses:{include:{vacina:true},orderBy:[{mesPrevisto:'asc'},{doseNumero:'asc'}]},pagamentos:{orderBy:{dataPagamento:'desc'}}}});
  if(!p)return res.status(404).json({error:'Não encontrado'});
  const tp=p.pagamentos.reduce((s,pg)=>s+pg.valorPago,0);

  // Fetch fora-do-plano movimentações ONLY for THIS specific plan
  const planStart=p.dataInicioPlano||p.criadoEm||p.dataVenda||new Date('2020-01-01');
  const excecoes=await prisma.movimentacao.findMany({
    where:{clienteId:p.cliente.id,
      OR:[
        {planoContratadoId:p.id}, // Explicitly tied to this plan
        {motivoPadrao:'vacina_fora_plano',planoContratadoId:null,dataHora:{gte:planStart}} // Legacy (no plan link, use date)
      ]},
    orderBy:{dataHora:'desc'},
    select:{id:true,nomeVacina:true,status:true,dataHora:true,observacoes:true,justificativa:true,motivoReprovacao:true,aprovadoPor:true,aprovadoEm:true,quantidade:true,motivoPadrao:true,planoContratadoId:true}
  });
  // Only show fora-do-plano exceptions (not regular movimentações)
  const excecoesForaPlano=excecoes.filter(e=>e.motivoPadrao==='vacina_fora_plano');

  res.json({...p,nome_plano:p.nomePlano,valor_final:p.valorFinal,percentual_desconto:p.percentualDesconto,margem_lucro_percentual:p.margemLucro,status_contrato:p.statusContrato,idade_inicio:p.idadeInicio,idade_fim:p.idadeFim,
    cliente_nome:p.cliente.nome,codigo_cliente:p.cliente.codigoCliente,vendedor_nome:'',
    total_pago:tp,saldo_pendente:p.valorFinal-tp,
    doses:p.doses.map(d=>({...d,vacina_nome:d.vacina.nome,dose_numero:d.doseNumero,data_aplicacao:d.dataAplicacao,local_aplicacao:d.localAplicacao,tipo_excecao:d.tipoExcecao})),
    pagamentos:p.pagamentos.map(pg=>({...pg,valor_pago:pg.valorPago,data_pagamento:pg.dataPagamento,forma_pagamento:pg.formaPagamento,numero_parcela:pg.numeroParcela})),
    excecoes_fora_plano:excecoesForaPlano.map(e=>({id:e.id,vacina:e.nomeVacina,status:e.status,data:e.dataHora,justificativa:e.justificativa,motivo_reprovacao:e.motivoReprovacao})),
    projecao_mensal:[]});
}catch(e){next(e)}});

r.post('/',async(req,res,next)=>{try{const b=req.body;
  const vd=(b.valor_bruto||0)*(b.percentual_desconto||0)/100;const vf=(b.valor_bruto||0)-vd;
  
  // Create the plan
  let p;
  try{
    p=await prisma.planoContratado.create({data:{clienteId:+b.cliente_id,planoId:b.plano_id?+b.plano_id:null,nomePlano:b.nome_plano||'Plano Personalizado',idadeInicio:+(b.idade_inicio||0),idadeFim:+(b.idade_fim||18),valorCusto:+(b.valor_custo||0),valorBruto:+(b.valor_bruto||0),valorDesconto:vd,percentualDesconto:+(b.percentual_desconto||0),valorFinal:vf,lucroPrevisto:vf-(+(b.valor_custo||0)),margemLucro:vf>0?((vf-(+(b.valor_custo||0)))/vf*100):0,statusContrato:b.status_contrato||'ativo',formaPagamento:b.forma_pagamento||'avista',vendedorId:b.vendedor_id?+b.vendedor_id:null,vacinadorId:b.vacinador_id?+b.vacinador_id:null,dataVenda:b.data_venda?new Date(b.data_venda):new Date(),dataInicioPlano:b.data_inicio_plano?new Date(b.data_inicio_plano):null,dataFimPlano:b.data_fim_plano?new Date(b.data_fim_plano):null}});
  }catch(createErr){
    if(createErr.code==='P2002')return res.status(409).json({error:'Erro ao criar plano. Tente novamente.'});
    throw createErr;
  }

  // ═══ REGRA: Espontâneo + Plano = Ativo ═══
  try{
    const cliente=await prisma.cliente.findUnique({where:{id:+b.cliente_id},select:{id:true,tipoCliente:true,codigoCliente:true}});
    if(cliente&&cliente.tipoCliente==='espontaneo'){
      const updateData={tipoCliente:'ativo'};
      if(!cliente.codigoCliente||cliente.codigoCliente.startsWith('ESP-')){
        // Find max VIT number safely
        const all=await prisma.cliente.findMany({where:{codigoCliente:{startsWith:'VIT-'}},select:{codigoCliente:true}});
        const nums=all.map(c=>parseInt((c.codigoCliente||'').replace('VIT-',''))||0);
        const nextNum=nums.length>0?Math.max(...nums)+1:1;
        for(let attempt=0;attempt<10;attempt++){
          const code='VIT-'+String(nextNum+attempt).padStart(3,'0');
          const exists=await prisma.cliente.findFirst({where:{codigoCliente:code}});
          if(!exists){updateData.codigoCliente=code;break}
        }
      }
      await prisma.cliente.update({where:{id:+b.cliente_id},data:updateData});
    }
  }catch(promErr){console.log('Aviso: erro ao promover cliente:',promErr.message)}

  // Auto-create doses from template
  let dosesCreated=0;const alertas=[];
  if(b.plano_id){
    try{
      const pvs=await prisma.planoVacina.findMany({where:{planoId:+b.plano_id},include:{vacina:{select:{nome:true}}}});
      const dtI=new Date(b.data_inicio_plano||new Date());
      for(const pv of pvs){
        const estoqueDisp=await prisma.lote.aggregate({where:{vacinaId:pv.vacinaId,status:{not:'esgotado'}},_sum:{quantidadeDisponivel:true}});
        const disp=estoqueDisp._sum.quantidadeDisponivel||0;
        if(disp<pv.doses)alertas.push({vacina:pv.vacina?.nome||'?',necessario:pv.doses,disponivel:disp});
        for(let dn=1;dn<=pv.doses;dn++){
          const mp=pv.mesPrevInicio+(pv.mesPrevFim-pv.mesPrevInicio)*((dn-1)/Math.max(1,pv.doses-1))|0;
          const dc=new Date(dtI);dc.setMonth(dc.getMonth()+mp);
          await prisma.planoContratadoDose.create({data:{planoContratadoId:p.id,vacinaId:pv.vacinaId,doseNumero:dn,status:'pendente',mesPrevisto:mp,competencia:dc.getFullYear()+'-'+String(dc.getMonth()+1).padStart(2,'0')}});
          dosesCreated++;
        }
      }
    }catch(doseErr){console.log('Aviso: erro ao criar doses:',doseErr.message)}
  }
  // Custom plan: create doses from vacinas array if provided
  if(b.vacinas_custom?.length){
    try{
      const dtI=new Date(b.data_inicio_plano||new Date());
      for(const vc of b.vacinas_custom){
        for(let dn=1;dn<=(vc.doses||1);dn++){
          const mp=Math.round((+(vc.mes_inicio||0))+(+(vc.mes_fim||18)-(+(vc.mes_inicio||0)))*((dn-1)/Math.max(1,(vc.doses||1)-1)))||0;
          const dc=new Date(dtI);dc.setMonth(dc.getMonth()+mp);
          await prisma.planoContratadoDose.create({data:{planoContratadoId:p.id,vacinaId:+vc.vacina_id,doseNumero:dn,status:'pendente',mesPrevisto:mp,competencia:dc.getFullYear()+'-'+String(dc.getMonth()+1).padStart(2,'0')}});
          dosesCreated++;
        }
      }
    }catch(custErr){console.log('Aviso: erro ao criar doses personalizadas:',custErr.message)}
  }
  const resp={success:true,id:p.id,doses_criadas:dosesCreated};
  if(alertas.length>0)resp.alertas_estoque=alertas;
  res.json(resp);
}catch(e){
  console.error('Erro criar plano:',e.message,e.code,e.meta);
  if(e.code==='P2002')return res.status(409).json({error:'Erro de duplicidade. Tente novamente em alguns segundos.'});
  next(e)}});

// ═══ EDITAR PLANO CONTRATADO ═══
r.put('/:id',async(req,res,next)=>{try{
  const id=+req.params.id;const b=req.body;
  const isMaster=b._caller_perfil==='master';
  
  const data={};
  if(b.nome_plano)data.nomePlano=b.nome_plano;
  if(b.valor_bruto!=null){
    data.valorBruto=+b.valor_bruto;
    const desc=+(b.percentual_desconto||0);
    data.percentualDesconto=desc;
    data.valorDesconto=data.valorBruto*desc/100;
    data.valorFinal=data.valorBruto-data.valorDesconto;
    if(b.valor_custo!=null){data.valorCusto=+b.valor_custo;data.lucroPrevisto=data.valorFinal-data.valorCusto;data.margemLucro=data.valorFinal>0?((data.valorFinal-data.valorCusto)/data.valorFinal*100):0}
  }
  if(b.percentual_desconto!=null&&!b.valor_bruto){
    const pc=await prisma.planoContratado.findUnique({where:{id}});
    data.percentualDesconto=+b.percentual_desconto;data.valorDesconto=pc.valorBruto*data.percentualDesconto/100;
    data.valorFinal=pc.valorBruto-data.valorDesconto;
  }
  if(b.status_contrato)data.statusContrato=b.status_contrato;
  if(b.forma_pagamento)data.formaPagamento=b.forma_pagamento;
  if(b.data_inicio_plano)data.dataInicioPlano=new Date(b.data_inicio_plano);
  if(b.data_fim_plano)data.dataFimPlano=new Date(b.data_fim_plano);
  if(b.vendedor_id!=null)data.vendedorId=+b.vendedor_id||null;
  
  if(!Object.keys(data).length)return res.status(400).json({error:'Nenhum campo alterado'});
  
  if(isMaster){
    // Master: apply directly
    await prisma.planoContratado.update({where:{id},data});
    // Log
    await prisma.auditLog.create({data:{acao:'plano_editado',entidade:'plano_contratado',entidadeId:id,
      usuarioId:b._caller_id?+b._caller_id:null,detalhes:JSON.stringify(data)}}).catch(()=>{});
    res.json({success:true,message:'Plano atualizado'});
  }else{
    // Operador: save as pending approval
    await prisma.auditLog.create({data:{
      acao:'plano_alteracao_pendente',entidade:'plano_contratado',entidadeId:id,
      usuarioId:b._caller_id?+b._caller_id:null,
      detalhes:JSON.stringify({alteracoes:data,solicitante:b._caller_nome||'Operador'})
    }});
    res.json({success:true,message:'Alteração enviada para aprovação do master',pendente:true});
  }
}catch(e){next(e)}});

// ═══ APROVAR/REJEITAR ALTERAÇÃO DE PLANO ═══
r.post('/:id/aprovar-alteracao',async(req,res,next)=>{try{
  const{audit_id,aprovado,motivo}=req.body;
  const log=await prisma.auditLog.findUnique({where:{id:+audit_id}});
  if(!log||log.acao!=='plano_alteracao_pendente')return res.status(404).json({error:'Solicitação não encontrada'});
  
  const det=JSON.parse(log.detalhes||'{}');
  if(aprovado){
    await prisma.planoContratado.update({where:{id:+req.params.id},data:det.alteracoes});
    await prisma.auditLog.update({where:{id:+audit_id},data:{acao:'plano_alteracao_aprovada',
      detalhes:JSON.stringify({...det,aprovado_por:req.body._caller_nome,aprovado_em:new Date()})}});
    res.json({success:true,message:'Alteração aprovada e aplicada'});
  }else{
    await prisma.auditLog.update({where:{id:+audit_id},data:{acao:'plano_alteracao_rejeitada',
      detalhes:JSON.stringify({...det,rejeitado_por:req.body._caller_nome,motivo:motivo||'',rejeitado_em:new Date()})}});
    res.json({success:true,message:'Alteração rejeitada'});
  }
}catch(e){next(e)}});

// ═══ LISTAR ALTERAÇÕES PENDENTES ═══
r.get('/alteracoes/pendentes',async(req,res,next)=>{try{
  const logs=await prisma.auditLog.findMany({where:{acao:'plano_alteracao_pendente'},orderBy:{criadoEm:'desc'}});
  const result=[];
  for(const log of logs){
    const det=JSON.parse(log.detalhes||'{}');
    const pc=await prisma.planoContratado.findUnique({where:{id:log.entidadeId},include:{cliente:{select:{nome:true,codigoCliente:true}}}}).catch(()=>null);
    if(!pc)continue;
    result.push({audit_id:log.id,plano_id:log.entidadeId,cliente:pc.cliente.nome,codigo:pc.cliente.codigoCliente,
      plano:pc.nomePlano,alteracoes:det.alteracoes,solicitante:det.solicitante,data:log.criadoEm});
  }
  res.json(result);
}catch(e){next(e)}});

// ═══ DELETE PLANO CONTRATADO ═══
r.delete('/:id',async(req,res,next)=>{try{
  const id=+req.params.id;
  const pc=await prisma.planoContratado.findUnique({where:{id},include:{doses:true,pagamentos:true}});
  if(!pc)return res.status(404).json({error:'Plano não encontrado'});
  // Check for applied doses
  const dosesAplicadas=pc.doses.filter(d=>d.status==='aplicada').length;
  if(dosesAplicadas>0)return res.status(400).json({error:`Não é possível excluir: ${dosesAplicadas} dose(s) já aplicada(s) neste plano`});
  // Check for payments
  const totalPago=pc.pagamentos.reduce((s,p)=>s+p.valorPago,0);
  if(totalPago>0)return res.status(400).json({error:`Não é possível excluir: R$ ${totalPago.toFixed(2)} em pagamentos vinculados`});
  // Safe to delete
  await prisma.planoContratadoDose.deleteMany({where:{planoContratadoId:id}});
  await prisma.pagamento.deleteMany({where:{planoContratadoId:id}});
  await prisma.planoContratado.delete({where:{id}});
  res.json({success:true,message:'Plano excluído com sucesso'});
}catch(e){next(e)}});

module.exports=r;
