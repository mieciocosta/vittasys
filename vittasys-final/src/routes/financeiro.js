const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/resumo',async(req,res,next)=>{try{
  const[tr,vc,ct,dt,tp,pq]=await Promise.all([
    prisma.pagamento.aggregate({_sum:{valorPago:true}}),
    prisma.planoContratado.aggregate({_sum:{valorFinal:true},where:{statusContrato:'ativo'}}),
    prisma.planoContratado.aggregate({_sum:{valorCusto:true},where:{statusContrato:'ativo'}}),
    prisma.planoContratado.aggregate({_sum:{valorDesconto:true},where:{statusContrato:'ativo'}}),
    prisma.planoContratado.count({where:{statusContrato:'ativo'}}),
    prisma.planoContratado.count({where:{statusContrato:'ativo'}})]);// TODO: quitados
  const trV=tr._sum.valorPago||0;const vcV=vc._sum.valorFinal||0;const ctV=ct._sum.valorCusto||0;
  res.json({total_recebido:trV,valor_contratos:vcV,saldo_pendente:vcV-trV,custo_total:ctV,lucro_previsto:vcV-ctV,desconto_total:dt._sum.valorDesconto||0,margem_media:vcV>0?((vcV-ctV)/vcV*100):0,total_planos:tp,planos_quitados:0});
}catch(e){next(e)}});

r.get('/pagamentos',async(req,res,next)=>{try{
  const{page=1,limit=50,search,forma_pagamento,sort,order}=req.query;
  const where={};if(forma_pagamento)where.formaPagamento=forma_pagamento;
  if(search)where.OR=[{planoContratado:{cliente:{nome:{contains:search,mode:'insensitive'}}}},{planoContratado:{nomePlano:{contains:search,mode:'insensitive'}}}];
  const ob=sort==='id'?{id:order==='ASC'?'asc':'desc'}:sort==='data_pagamento'?{dataPagamento:order==='ASC'?'asc':'desc'}:sort==='valor_pago'?{valorPago:order==='ASC'?'asc':'desc'}:sort==='forma_pagamento'?{formaPagamento:order==='ASC'?'asc':'desc'}:{id:'desc'};
  const[data,total]=await Promise.all([
    prisma.pagamento.findMany({where,orderBy:ob,skip:(+page-1)*+limit,take:+limit,include:{planoContratado:{include:{cliente:{select:{nome:true,codigoCliente:true}}}}}}),
    prisma.pagamento.count({where})]);
  res.json({data:data.map(p=>({id:p.id,data_pagamento:p.dataPagamento,valor_pago:p.valorPago,forma_pagamento:p.formaPagamento,numero_parcela:p.numeroParcela,nome_plano:p.planoContratado.nomePlano,valor_final:p.planoContratado.valorFinal,cliente_nome:p.planoContratado.cliente.nome,codigo_cliente:p.planoContratado.cliente.codigoCliente,plano_contratado_id:p.planoContratadoId,vendedor_nome:'',lancado_por_nome:''})),pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

r.post('/pagamentos',async(req,res,next)=>{try{const b=req.body;
  if(!b.plano_contratado_id||!b.valor_pago||!b.data_pagamento)return res.status(400).json({error:'Campos obrigatórios'});
  const pg=await prisma.pagamento.create({data:{planoContratadoId:+b.plano_contratado_id,valorPago:+b.valor_pago,dataPagamento:new Date(b.data_pagamento),formaPagamento:b.forma_pagamento||'pix',numeroParcela:+(b.numero_parcela||1),observacao:b.observacao,criadoPor:b.criado_por?+b.criado_por:null}});
  res.json({success:true,id:pg.id});
}catch(e){next(e)}});
module.exports=r;
