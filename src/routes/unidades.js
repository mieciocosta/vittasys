const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/busca',async(req,res,next)=>{try{
  const{q}=req.query;if(!q||q.length<2)return res.json([]);
  const now=new Date();const qt=q.trim();
  // LAYER 1: Exact barcode
  let results=await prisma.unidade.findMany({where:{codigoBarras:qt,status:'disponivel'},include:{lote:{include:{vacina:true}}},take:10});
  // LAYER 2: Barcode contains
  if(!results.length)results=await prisma.unidade.findMany({where:{status:'disponivel',codigoBarras:{contains:qt,mode:'insensitive'}},include:{lote:{include:{vacina:true}}},take:10});
  // LAYER 3: Lot/vaccine search
  if(!results.length)results=await prisma.unidade.findMany({where:{status:'disponivel',OR:[{lote:{numeroLote:{contains:qt,mode:'insensitive'}}},{lote:{vacina:{nome:{contains:qt,mode:'insensitive'}}}},{lote:{vacina:{codigo:{contains:qt,mode:'insensitive'}}}}]},include:{lote:{include:{vacina:true}}},take:30,orderBy:{lote:{validade:'asc'}}});
  res.json(results.map(u=>{const l=u.lote;const v=l.vacina;return{id:u.id,lote_id:l.id,vacina_id:v.id,codigo_barras:u.codigoBarras,status:u.status,numero_lote:l.numeroLote,validade:l.validade,quantidade_disponivel:l.quantidadeDisponivel,local_armazenamento:l.localArmazenamento,fabricante:l.fabricante,vacina_nome:v.nome,vacina_codigo:v.codigo,via_administracao:v.viaAdministracao,dias_para_vencer:Math.ceil((l.validade-now)/864e5)}}));
}catch(e){next(e)}});

r.put('/barcode/:id',async(req,res,next)=>{try{
  const{codigo_barras}=req.body;if(!codigo_barras)return res.status(400).json({error:'Código obrigatório'});
  await prisma.unidade.update({where:{id:+req.params.id},data:{codigoBarras:codigo_barras.trim()}});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ RETIRADA COM VALIDAÇÃO DE LIMITE DE DOSES ═══
r.post('/retirada',async(req,res,next)=>{try{
  const{unidade_id,cliente_id,usuario_id,aplicador_id,tipo_cliente,tipo_atendimento,local_aplicacao,observacoes}=req.body;
  if(!unidade_id||!cliente_id||!usuario_id)return res.status(400).json({error:'Campos obrigatórios faltando'});
  if(!local_aplicacao)return res.status(400).json({error:'Local de aplicação obrigatório'});

  const result=await prisma.$transaction(async tx=>{
    const un=await tx.unidade.findUnique({where:{id:+unidade_id},include:{lote:{include:{vacina:true}}}});
    if(!un)throw Object.assign(new Error('Unidade não encontrada'),{status:404});
    if(un.status!=='disponivel')throw Object.assign(new Error(`Unidade já ${un.status}`),{status:400});
    const l=un.lote;const v=l.vacina;

    // ═══ VALIDAÇÃO DE LIMITE DE DOSES DO PLANO ═══
    if(tipo_cliente==='ativo'){
      // Find active plans for this client
      const planosAtivos=await tx.planoContratado.findMany({
        where:{clienteId:+cliente_id,statusContrato:'ativo'},
        include:{doses:{where:{vacinaId:v.id}}}
      });
      for(const plano of planosAtivos){
        const dosesVacina=plano.doses.filter(d=>d.vacinaId===v.id);
        if(dosesVacina.length>0){
          const aplicadas=dosesVacina.filter(d=>d.status==='aplicada').length;
          const total=dosesVacina.length;
          if(aplicadas>=total){
            throw Object.assign(new Error(
              `Limite de doses atingido: ${v.nome} — ${aplicadas}/${total} doses já aplicadas no plano "${plano.nomePlano}". Não é permitido retirar mais.`
            ),{status:400});
          }
          // Mark next pending dose as applied
          const proxDose=dosesVacina.find(d=>d.status==='pendente');
          if(proxDose){
            await tx.planoContratadoDose.update({
              where:{id:proxDose.id},
              data:{status:'aplicada',dataAplicacao:new Date(),localAplicacao:local_aplicacao}
            });
          }
        }
      }
    }

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
}catch(e){if(e.status)return res.status(e.status).json({error:e.message});next(e)}});

r.get('/recentes',async(req,res,next)=>{try{
  const r2=await prisma.retiradaRecente.findMany({orderBy:{dataHora:'desc'},take:15});
  res.json(r2.map(x=>({...x,vacina_nome:x.vacinaNome,codigo_barras:x.codigoBarras,cliente_nome:x.clienteNome,usuario_nome:x.usuarioNome,data_hora:x.dataHora})));
}catch(e){next(e)}});

r.get('/lote/:loteId',async(req,res,next)=>{try{
  res.json(await prisma.unidade.findMany({where:{loteId:+req.params.loteId},orderBy:{id:'asc'},select:{id:true,codigoBarras:true,status:true}}));
}catch(e){next(e)}});

// ═══ DETAIL: single movement ═══
r.get('/movimentacao/:id',async(req,res,next)=>{try{
  const m=await prisma.movimentacao.findUnique({where:{id:+req.params.id},include:{cliente:{select:{id:true,nome:true,codigoCliente:true,tipoCliente:true}},lote:{select:{id:true,numeroLote:true,fabricante:true}},vacina:{select:{id:true,nome:true,codigo:true}},unidade:{select:{id:true,codigoBarras:true,status:true}}}});
  if(!m)return res.status(404).json({error:'Não encontrada'});
  // Get applicator and operator names
  const[operador,aplicador]=await Promise.all([
    m.usuarioId?prisma.usuario.findUnique({where:{id:m.usuarioId},select:{nome:true,cargo:true}}):null,
    m.aplicadoPor?prisma.usuario.findUnique({where:{id:m.aplicadoPor},select:{nome:true,cargo:true}}):null,
  ]);
  // Get plan info if ativo client
  let planoInfo=null;
  if(m.clienteId&&m.vacinaId){
    const pc=await prisma.planoContratado.findFirst({where:{clienteId:m.clienteId,statusContrato:'ativo',doses:{some:{vacinaId:m.vacinaId}}},select:{id:true,nomePlano:true,doses:{where:{vacinaId:m.vacinaId},select:{doseNumero:true,status:true}}}});
    if(pc)planoInfo={id:pc.id,nome:pc.nomePlano,doses_vacina:pc.doses.length,doses_aplicadas:pc.doses.filter(d=>d.status==='aplicada').length};
  }
  res.json({...m,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,codigo_barras:m.codigoBarras||m.unidade?.codigoBarras,local_aplicacao:m.localAplicacao,tipo_cliente:m.tipoCliente,tipo_atendimento:m.tipoAtendimento,operador_nome:operador?.nome,operador_cargo:operador?.cargo,aplicador_nome:aplicador?.nome,aplicador_cargo:aplicador?.cargo,cliente_nome:m.cliente?.nome,cliente_codigo:m.cliente?.codigoCliente,vacina_codigo:m.vacina?.codigo,lote_fabricante:m.lote?.fabricante,plano:planoInfo});
}catch(e){next(e)}});

module.exports=r;
