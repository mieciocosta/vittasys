const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/busca',async(req,res,next)=>{try{
  const{q}=req.query;if(!q||q.length<2)return res.json([]);
  const now=new Date();
  const byCode=await prisma.unidade.findMany({where:{codigoBarras:q,status:'disponivel'},include:{lote:{include:{vacina:true}}},take:5});
  if(byCode.length>0)return res.json(byCode.map(mapUnit));
  const bySearch=await prisma.unidade.findMany({where:{status:'disponivel',OR:[{lote:{numeroLote:{contains:q,mode:'insensitive'}}},{lote:{vacina:{nome:{contains:q,mode:'insensitive'}}}}]},include:{lote:{include:{vacina:true}}},take:20,orderBy:{lote:{validade:'asc'}}});
  res.json(bySearch.map(mapUnit));
  function mapUnit(u){const l=u.lote;const v=l.vacina;return{id:u.id,lote_id:l.id,codigo_barras:u.codigoBarras,status:u.status,numero_lote:l.numeroLote,validade:l.validade,quantidade_disponivel:l.quantidadeDisponivel,local_armazenamento:l.localArmazenamento,fabricante:l.fabricante,temperatura_armazenamento:l.temperaturaArmazenamento,vacina_nome:v.nome,vacina_codigo:v.codigo,via_administracao:v.viaAdministracao,dias_para_vencer:Math.ceil((l.validade-now)/864e5)}}
}catch(e){next(e)}});

r.post('/retirada',async(req,res,next)=>{try{
  const{unidade_id,cliente_id,usuario_id,aplicador_id,tipo_cliente,tipo_atendimento,local_aplicacao,responsavel_nome,responsavel_parentesco,observacoes}=req.body;
  if(!unidade_id||!cliente_id||!usuario_id)return res.status(400).json({error:'Campos obrigatórios faltando'});
  if(!local_aplicacao)return res.status(400).json({error:'Local de aplicação obrigatório'});

  const result=await prisma.$transaction(async tx=>{
    const un=await tx.unidade.findUnique({where:{id:+unidade_id},include:{lote:{include:{vacina:true}}}});
    if(!un)throw Object.assign(new Error('Unidade não encontrada'),{status:404});
    if(un.status!=='disponivel')throw Object.assign(new Error('Unidade indisponível'),{status:400});
    const l=un.lote;const v=l.vacina;

    await tx.unidade.update({where:{id:+unidade_id},data:{status:'aplicada'}});
    await tx.lote.update({where:{id:l.id},data:{quantidadeDisponivel:{decrement:1},quantidadeAplicada:{increment:1}}});
    const updLote=await tx.lote.findUnique({where:{id:l.id}});
    if(updLote.quantidadeDisponivel<=0)await tx.lote.update({where:{id:l.id},data:{status:'esgotado'}});

    const mov=await tx.movimentacao.create({data:{tipo:'retirada',unidadeId:+unidade_id,loteId:l.id,vacinaId:v.id,clienteId:+cliente_id,usuarioId:+usuario_id,aplicadoPor:aplicador_id?+aplicador_id:null,tipoCliente:tipo_cliente||'espontaneo',tipoAtendimento:tipo_atendimento||'normal',localAplicacao:local_aplicacao,quantidade:1,codigoBarras:un.codigoBarras,numeroLote:l.numeroLote,nomeVacina:v.nome,status:'concluido',observacoes:observacoes||null}});

    const cli=await tx.cliente.findUnique({where:{id:+cliente_id},select:{nome:true}});
    await tx.retiradaRecente.create({data:{unidadeId:+unidade_id,vacinaNome:v.nome,lote:l.numeroLote,codigoBarras:un.codigoBarras,clienteNome:cli?.nome,usuarioNome:''}});

    return{movId:mov.id,vacNome:v.nome,cliNome:cli?.nome,antes:l.quantidadeDisponivel,depois:updLote.quantidadeDisponivel};
  });

  res.json({success:true,movimentacao_id:result.movId,message:`✓ ${result.vacNome} → ${result.cliNome}`,estoque:{antes:result.antes,depois:result.depois}});
}catch(e){next(e)}});

r.get('/recentes',async(req,res,next)=>{try{
  const r2=await prisma.retiradaRecente.findMany({orderBy:{dataHora:'desc'},take:15});
  res.json(r2.map(x=>({...x,vacina_nome:x.vacinaNome,codigo_barras:x.codigoBarras,cliente_nome:x.clienteNome,usuario_nome:x.usuarioNome,data_hora:x.dataHora})));
}catch(e){next(e)}});
module.exports=r;
