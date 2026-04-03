const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/',async(req,res,next)=>{try{
  res.json(await prisma.vacina.findMany({where:{ativo:true},orderBy:{nome:'asc'}}));
}catch(e){next(e)}});

r.get('/:id',async(req,res,next)=>{try{
  const v=await prisma.vacina.findUnique({where:{id:+req.params.id},include:{lotes:{orderBy:{validade:'asc'},include:{unidades:{select:{id:true,codigoBarras:true,status:true}}}}}});
  v?res.json(v):res.status(404).json({error:'Não encontrada'});
}catch(e){next(e)}});

r.post('/',async(req,res,next)=>{try{const b=req.body;
  if(!b.nome||!b.fabricante)return res.status(400).json({error:'Nome e fabricante são obrigatórios'});
  if(!b.codigo){b.codigo='VAC-'+Date.now().toString(36).toUpperCase()}
  const v=await prisma.vacina.create({data:{codigo:b.codigo,nome:b.nome,nomeTecnico:b.nome_tecnico||null,fabricante:b.fabricante,laboratorio:b.laboratorio||null,categoria:b.categoria||null,apresentacao:b.apresentacao||null,viaAdministracao:b.via_administracao||null,dosesEsquema:+(b.doses_esquema||1),valorCustoMedio:+(b.valor_custo_medio||0),valorVendaSugerido:+(b.valor_venda_sugerido||0),observacoes:b.observacoes||null}});
  res.json({success:true,id:v.id,codigo:v.codigo});
}catch(e){if(e.code==='P2002')return res.status(409).json({error:'Código de vacina já existe'});next(e)}});

// Barcode lookup: find vaccine/lot/unit by barcode
r.get('/barcode/:code',async(req,res,next)=>{try{
  const code=req.params.code.trim();
  // Search available units first, then any unit
  let unit=await prisma.unidade.findFirst({where:{codigoBarras:code,status:'disponivel'},include:{lote:{include:{vacina:true}}}});
  if(!unit)unit=await prisma.unidade.findFirst({where:{codigoBarras:code},include:{lote:{include:{vacina:true}}}});
  if(unit){return res.json({found:true,source:'unidade',unidade:unit,lote:unit.lote,vacina:unit.lote.vacina})}
  // Search in lots
  const lote=await prisma.lote.findFirst({where:{OR:[{numeroLote:code},{unidades:{some:{codigoBarras:{contains:code}}}}]},include:{vacina:true}});
  if(lote){return res.json({found:true,source:'lote',lote,vacina:lote.vacina})}
  res.json({found:false});
}catch(e){next(e)}});

module.exports=r;
