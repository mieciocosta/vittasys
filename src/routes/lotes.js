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

  const sm={id:'id',validade:'validade',quantidade_disponivel:'quantidadeDisponivel',numero_lote:'numeroLote',fabricante:'fabricante',valor_unitario_custo:'valorUnitarioCusto',status:'status'};
  let orderBy;
  if(sort==='vacina_nome')orderBy={vacina:{nome:order==='DESC'?'desc':'asc'}};
  else if(sort&&sm[sort])orderBy={[sm[sort]]:order==='DESC'?'desc':'asc'};
  else orderBy={validade:'asc'};

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
  const qty=+(b.quantidade||1);if(qty<1||qty>999)return res.status(400).json({error:'Quantidade inválida'});
  const cb=b.codigo_barras.trim();

  // Use separate queries (NOT transaction) to avoid P2002 cascade abort
  // 1. Find or create vaccine
  let vacina=null;
  // Only search by name (avoid empty-string codigo match)
  vacina=await prisma.vacina.findFirst({where:{nome:{equals:b.nome_vacina,mode:'insensitive'}}});
  if(!vacina){
    const codigo=b.codigo_vacina||('CB-'+Date.now().toString(36).toUpperCase());
    try{vacina=await prisma.vacina.create({data:{codigo,nome:b.nome_vacina,fabricante:b.fabricante,valorCustoMedio:+(b.custo_unitario||0)}})}
    catch(e){
      // Codigo conflict - try with timestamp suffix
      vacina=await prisma.vacina.create({data:{codigo:codigo+'-'+Date.now().toString(36).slice(-3),nome:b.nome_vacina,fabricante:b.fabricante,valorCustoMedio:+(b.custo_unitario||0)}});
    }
  }

  // 2. Find or create lot
  let lote=await prisma.lote.findUnique({where:{numeroLote:b.numero_lote}});
  if(!lote){
    lote=await prisma.lote.create({data:{vacinaId:vacina.id,numeroLote:b.numero_lote,fabricante:b.fabricante,quantidadeTotal:qty,quantidadeDisponivel:qty,validade:new Date(b.validade),localArmazenamento:b.local_armazenamento||'Câmara Fria Principal',valorUnitarioCusto:+(b.custo_unitario||0)}});
  }else{
    await prisma.lote.update({where:{id:lote.id},data:{quantidadeTotal:{increment:qty},quantidadeDisponivel:{increment:qty}}});
  }

  // 3. Create units - ALL with same barcode (not unique anymore)
  for(let i=0;i<qty;i++){
    await prisma.unidade.create({data:{loteId:lote.id,codigoBarras:cb}});
  }

  // 4. Entry movement
  const mov=await prisma.movimentacao.create({data:{tipo:'entrada',loteId:lote.id,vacinaId:vacina.id,usuarioId:+(b.usuario_id||1),quantidade:qty,codigoBarras:cb,numeroLote:b.numero_lote,nomeVacina:vacina.nome,status:'concluido',observacoes:`Cadastro por código de barras`}});

  res.json({success:true,message:`✓ ${vacina.nome} — Lote ${lote.numeroLote} — ${qty} unidade(s)`,vacina_id:vacina.id,lote_id:lote.id,movimentacao_id:mov.id});
}catch(e){console.error('cadastro-barras:',e);res.status(500).json({error:'Erro ao cadastrar: '+(e.meta?.cause||e.message)})}});

module.exports=r;
