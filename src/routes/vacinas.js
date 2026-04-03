const{Router}=require('express');const r=Router();const prisma=require('../config/database');
r.get('/',async(req,res,next)=>{try{res.json(await prisma.vacina.findMany({where:{ativo:true},orderBy:{nome:'asc'}}))}catch(e){next(e)}});
r.get('/:id',async(req,res,next)=>{try{const v=await prisma.vacina.findUnique({where:{id:+req.params.id}});v?res.json(v):res.status(404).json({error:'Não encontrada'})}catch(e){next(e)}});
r.post('/',async(req,res,next)=>{try{const b=req.body;res.json({success:true,...await prisma.vacina.create({data:{codigo:b.codigo,nome:b.nome,nomeTecnico:b.nome_tecnico,fabricante:b.fabricante,laboratorio:b.laboratorio,categoria:b.categoria,apresentacao:b.apresentacao,viaAdministracao:b.via_administracao,dosesEsquema:+(b.doses_esquema||1),valorCustoMedio:+(b.valor_custo_medio||0),valorVendaSugerido:+(b.valor_venda_sugerido||0),observacoes:b.observacoes}})})}catch(e){next(e)}});
module.exports=r;
