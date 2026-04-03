const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/',async(req,res,next)=>{try{
  const{page=1,limit=50,search,status,vencimento,sort='validade',order='ASC'}=req.query;
  const where={};const now=new Date();
  if(search){
    where.OR=[
      {vacina:{nome:{contains:search,mode:'insensitive'}}},
      {numeroLote:{contains:search,mode:'insensitive'}},
      {fabricante:{contains:search,mode:'insensitive'}},
      {unidades:{some:{codigoBarras:{contains:search,mode:'insensitive'}}}},
    ];
  }
  if(status)where.status=status;
  if(vencimento==='proximo'){const d30=new Date();d30.setDate(d30.getDate()+30);where.validade={gte:now,lte:d30}}
  else if(vencimento==='vencido')where.validade={lt:now};

  const sm={validade:'validade',quantidade_disponivel:'quantidadeDisponivel',numero_lote:'numeroLote',fabricante:'fabricante',valor_unitario_custo:'valorUnitarioCusto',status:'status'};
  const orderBy=sort&&sm[sort]?{[sm[sort]]:order==='DESC'?'desc':'asc'}:{validade:'asc'};

  const[data,total]=await Promise.all([
    prisma.lote.findMany({where,orderBy,skip:(+page-1)*+limit,take:+limit,
      include:{vacina:{select:{id:true,nome:true,codigo:true,viaAdministracao:true}},_count:{select:{unidades:true}}}}),
    prisma.lote.count({where})
  ]);

  // Count available units per lot
  const loteIds=data.map(l=>l.id);
  const unitCounts=await prisma.unidade.groupBy({by:['loteId'],where:{loteId:{in:loteIds},status:'disponivel'},_count:true});
  const ucMap={};unitCounts.forEach(u=>{ucMap[u.loteId]=u._count});

  const mapped=data.map(l=>{
    const d=Math.ceil((l.validade-now)/864e5);
    return{
      id:l.id,
      vacina_id:l.vacinaId,
      vacina_nome:l.vacina.nome,
      vacina_codigo:l.vacina.codigo,
      via_administracao:l.vacina.viaAdministracao,
      numero_lote:l.numeroLote,
      fabricante:l.fabricante,
      quantidade_total:l.quantidadeTotal,
      quantidade_disponivel:l.quantidadeDisponivel,
      quantidade_reservada:l.quantidadeReservada,
      quantidade_aplicada:l.quantidadeAplicada,
      validade:l.validade,
      local_armazenamento:l.localArmazenamento,
      temperatura_armazenamento:l.temperaturaArmazenamento,
      valor_unitario_custo:l.valorUnitarioCusto,
      status:l.status,
      dias_para_vencer:d,
      unidades_total:l._count.unidades,
      unidades_disponiveis:ucMap[l.id]||0,
      criado_em:l.criadoEm,
    };
  });

  res.json({data:mapped,pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

// Create lot with custom or auto barcodes
r.post('/',async(req,res,next)=>{try{
  const b=req.body;
  if(!b.vacina_id)return res.status(400).json({error:'Vacina é obrigatória'});
  if(!b.numero_lote)return res.status(400).json({error:'Número do lote é obrigatório'});
  if(!b.quantidade_total||+b.quantidade_total<1)return res.status(400).json({error:'Quantidade deve ser >= 1'});
  if(!b.validade)return res.status(400).json({error:'Validade é obrigatória'});

  const qty=+b.quantidade_total;
  const lote=await prisma.lote.create({data:{
    vacinaId:+b.vacina_id,
    numeroLote:b.numero_lote,
    fabricante:b.fabricante||'',
    quantidadeTotal:qty,
    quantidadeDisponivel:qty,
    validade:new Date(b.validade),
    temperaturaArmazenamento:b.temperatura||'2-8°C',
    localArmazenamento:b.local||'Câmara Fria Principal',
    valorUnitarioCusto:+(b.valor_unitario||0),
    observacoes:b.observacoes||null,
  }});

  // Create units - use custom barcodes if provided, otherwise auto-generate
  const barcodes=b.codigos_barras||[]; // Array of custom barcodes
  let uc=0;
  for(let i=0;i<qty;i++){
    const codigo=barcodes[i]||('7891'+String(Math.floor(Math.random()*9999999999)).padStart(10,'0'));
    try{await prisma.unidade.create({data:{loteId:lote.id,codigoBarras:codigo}});uc++}
    catch(e){
      // Duplicate barcode - generate unique fallback
      const fallback=codigo+'-'+String(Date.now()).slice(-4);
      await prisma.unidade.create({data:{loteId:lote.id,codigoBarras:fallback}});uc++
    }
  }

  // Register entry movement
  await prisma.movimentacao.create({data:{
    tipo:'entrada',loteId:lote.id,vacinaId:+b.vacina_id,usuarioId:+(b.usuario_id||1),
    quantidade:qty,numeroLote:b.numero_lote,nomeVacina:b.nome_vacina||'',status:'concluido',
    observacoes:`Cadastro de lote: ${qty} unidades`
  }});

  res.json({success:true,id:lote.id,unidades_criadas:uc,numero_lote:b.numero_lote});
}catch(e){if(e.code==='P2002')return res.status(409).json({error:'Número de lote já existe'});next(e)}});

// ═══ CADASTRO POR CÓDIGO DE BARRAS ═══
r.post('/cadastro-barras',async(req,res,next)=>{try{
  const b=req.body;
  if(!b.codigo_barras)return res.status(400).json({error:'Código de barras é obrigatório'});
  if(!b.nome_vacina)return res.status(400).json({error:'Nome da vacina é obrigatório'});
  if(!b.fabricante)return res.status(400).json({error:'Fabricante é obrigatório'});
  if(!b.numero_lote)return res.status(400).json({error:'Número do lote é obrigatório'});
  if(!b.validade)return res.status(400).json({error:'Validade é obrigatória'});
  const qty=+(b.quantidade||1);if(qty<1)return res.status(400).json({error:'Quantidade inválida'});

  const result=await prisma.$transaction(async tx=>{
    // 1. Find or create vaccine
    let vacina=await tx.vacina.findFirst({where:{OR:[{nome:{equals:b.nome_vacina,mode:'insensitive'}},{codigo:{equals:b.codigo_vacina||'',mode:'insensitive'}}]}});
    if(!vacina){
      const codigo=b.codigo_vacina||('CB-'+Date.now().toString(36).toUpperCase());
      vacina=await tx.vacina.create({data:{codigo,nome:b.nome_vacina,fabricante:b.fabricante,laboratorio:b.laboratorio||null,categoria:b.categoria||null,viaAdministracao:b.via_administracao||null,valorCustoMedio:+(b.custo_unitario||0)}});
    }

    // 2. Find or create lot
    let lote=await tx.lote.findUnique({where:{numeroLote:b.numero_lote}});
    if(!lote){
      lote=await tx.lote.create({data:{vacinaId:vacina.id,numeroLote:b.numero_lote,fabricante:b.fabricante,quantidadeTotal:qty,quantidadeDisponivel:qty,validade:new Date(b.validade),localArmazenamento:b.local_armazenamento||'Câmara Fria Principal',valorUnitarioCusto:+(b.custo_unitario||0),observacoes:b.observacoes||null}});
    }else{
      // Lot exists — increment stock
      await tx.lote.update({where:{id:lote.id},data:{quantidadeTotal:{increment:qty},quantidadeDisponivel:{increment:qty}}});
    }

    // 3. Create unit(s) with the barcode
    const unidadesCriadas=[];
    for(let i=0;i<qty;i++){
      const cb=i===0?b.codigo_barras:(b.codigo_barras+'-'+String(i+1).padStart(3,'0'));
      try{
        const un=await tx.unidade.create({data:{loteId:lote.id,codigoBarras:cb}});
        unidadesCriadas.push({id:un.id,codigo_barras:cb});
      }catch(e){
        const fb=b.codigo_barras+'-'+Date.now().toString(36)+'-'+i;
        const un=await tx.unidade.create({data:{loteId:lote.id,codigoBarras:fb}});
        unidadesCriadas.push({id:un.id,codigo_barras:fb});
      }
    }

    // 4. Register entry movement
    const mov=await tx.movimentacao.create({data:{
      tipo:'entrada',loteId:lote.id,vacinaId:vacina.id,usuarioId:+(b.usuario_id||1),
      quantidade:qty,codigoBarras:b.codigo_barras,numeroLote:b.numero_lote,
      nomeVacina:vacina.nome,status:'concluido',
      observacoes:`Cadastro por código de barras: ${b.codigo_barras}`
    }});

    return{vacina,lote,unidades:unidadesCriadas,movimentacao_id:mov.id};
  });

  res.json({
    success:true,
    message:`✓ ${result.vacina.nome} — Lote ${result.lote.numeroLote} — ${result.unidades.length} unidade(s) cadastrada(s)`,
    vacina_id:result.vacina.id,
    lote_id:result.lote.id,
    movimentacao_id:result.movimentacao_id,
    unidades:result.unidades,
  });
}catch(e){next(e)}});

module.exports=r;
