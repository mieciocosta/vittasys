const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/',async(req,res,next)=>{try{
  const{page=1,limit=50,tipo,tipo_cliente,search,sort,order}=req.query;
  const where={};if(tipo)where.tipo=tipo;if(tipo_cliente)where.tipoCliente=tipo_cliente;
  if(search)where.OR=[{nomeVacina:{contains:search,mode:'insensitive'}},{numeroLote:{contains:search,mode:'insensitive'}},{cliente:{nome:{contains:search,mode:'insensitive'}}}];
  const sm={id:'id',data_hora:'dataHora',tipo:'tipo',nome_vacina:'nomeVacina',cliente_nome:{cliente:{nome:order==='ASC'?'asc':'desc'}},numero_lote:'numeroLote',status:'status'};
  const ob=sort&&sm[sort]?typeof sm[sort]==='string'?{[sm[sort]]:order==='ASC'?'asc':'desc'}:sm[sort]:{id:'desc'};
  const[data,total]=await Promise.all([
    prisma.movimentacao.findMany({where,orderBy:ob,skip:(+page-1)*+limit,take:+limit,include:{
      cliente:{select:{id:true,nome:true,tipoPaciente:true,codigoCliente:true,tipoCliente:true,
        planosContratados:{where:{statusContrato:'ativo'},select:{id:true,nomePlano:true,doses:{select:{status:true}}}}}},
    }}),
    prisma.movimentacao.count({where})]);
  res.json({data:data.map(m=>{
    // Plan progress for active clients
    let plano_progresso=null;
    if(m.cliente?.tipoCliente==='ativo'&&m.cliente?.planosContratados?.length>0){
      const pc=m.cliente.planosContratados[0];
      const total_doses=pc.doses.length;
      const aplicadas=pc.doses.filter(d=>d.status==='aplicada').length;
      plano_progresso={nome:pc.nomePlano,aplicadas,total:total_doses,pct:total_doses>0?Math.round(aplicadas/total_doses*100):0};
    }
    return{id:m.id,tipo:m.tipo,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,codigo_barras:m.codigoBarras,quantidade:m.quantidade,local_aplicacao:m.localAplicacao,tipo_cliente:m.tipoCliente||m.cliente?.tipoCliente,tipo_atendimento:m.tipoAtendimento,status:m.status,observacoes:m.observacoes,cliente_id:m.clienteId,cliente_nome:m.cliente?.nome,codigo_cliente:m.cliente?.codigoCliente,usuario_id:m.usuarioId,usuario_nome:'',aplicador_nome:'',unidade_id:m.unidadeId,plano_progresso};
  }),pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

r.post('/',async(req,res,next)=>{try{const b=req.body;
  if(!b.tipo)return res.status(400).json({error:'Tipo obrigatório'});if(!b.usuario_id)return res.status(400).json({error:'Operador obrigatório'});
  if(!b.nome_vacina&&!b.vacina_id)return res.status(400).json({error:'Vacina obrigatória'});
  const m=await prisma.movimentacao.create({data:{tipo:b.tipo,loteId:b.lote_id?+b.lote_id:null,vacinaId:b.vacina_id?+b.vacina_id:null,clienteId:b.cliente_id?+b.cliente_id:null,usuarioId:+b.usuario_id,tipoCliente:b.tipo_cliente,tipoAtendimento:b.tipo_atendimento||'normal',localAplicacao:b.local_aplicacao,quantidade:+(b.quantidade||1),numeroLote:b.numero_lote,nomeVacina:b.nome_vacina,status:b.status||'concluido',observacoes:b.observacoes,dataHora:b.data_hora?new Date(b.data_hora):new Date()}});
  res.json({success:true,id:m.id});
}catch(e){next(e)}});

r.put('/:id',async(req,res,next)=>{try{const b=req.body;const m=await prisma.movimentacao.findUnique({where:{id:+req.params.id}});if(!m)return res.status(404).json({error:'Não encontrada'});
  const data={};if(b.observacoes!==undefined)data.observacoes=b.observacoes;if(b.local_aplicacao!==undefined)data.localAplicacao=b.local_aplicacao;
  if(!m.unidadeId){if(b.tipo)data.tipo=b.tipo;if(b.nome_vacina)data.nomeVacina=b.nome_vacina;if(b.quantidade)data.quantidade=+b.quantidade;if(b.data_hora)data.dataHora=new Date(b.data_hora)}
  await prisma.movimentacao.update({where:{id:+req.params.id},data});res.json({success:true});
}catch(e){next(e)}});

r.delete('/:id',async(req,res,next)=>{try{const m=await prisma.movimentacao.findUnique({where:{id:+req.params.id}});if(!m)return res.status(404).json({error:'Não encontrada'});
  if(m.unidadeId)return res.status(400).json({error:'Retirada do bipe não pode ser excluída. Use estorno.'});
  await prisma.movimentacao.delete({where:{id:+req.params.id}});res.json({success:true});
}catch(e){next(e)}});
module.exports=r;
