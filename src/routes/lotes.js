const{Router}=require('express');const r=Router();const prisma=require('../config/database');
function cb(){return'7891'+String(Math.floor(Math.random()*9999999999)).padStart(10,'0')}

r.get('/',async(req,res,next)=>{try{
  const{page=1,limit=50,search,status,vencimento,sort='validade',order='ASC'}=req.query;
  const where={};const now=new Date();
  if(search)where.OR=[{vacina:{nome:{contains:search,mode:'insensitive'}}},{numeroLote:{contains:search,mode:'insensitive'}},{fabricante:{contains:search,mode:'insensitive'}}];
  if(status)where.status=status;
  if(vencimento==='proximo'){const d30=new Date();d30.setDate(d30.getDate()+30);where.validade={gte:now,lte:d30}}
  else if(vencimento==='vencido')where.validade={lt:now};
  const sm={validade:'validade',vacina_nome:{vacina:{nome:order==='ASC'?'asc':'desc'}},quantidade_disponivel:'quantidadeDisponivel',numero_lote:'numeroLote',fabricante:'fabricante',valor_unitario_custo:'valorUnitarioCusto',status:'status'};
  const orderBy=sm[sort]?{[typeof sm[sort]==='string'?sm[sort]:sort]:order==='DESC'?'desc':'asc'}:{validade:'asc'};
  const[data,total]=await Promise.all([
    prisma.lote.findMany({where,orderBy,skip:(+page-1)*+limit,take:+limit,include:{vacina:{select:{nome:true,codigo:true,viaAdministracao:true}}}}),
    prisma.lote.count({where})]);
  const mapped=data.map(l=>{const d=Math.ceil((l.validade-now)/864e5);return{...l,vacina_nome:l.vacina.nome,vacina_codigo:l.vacina.codigo,via_administracao:l.vacina.viaAdministracao,numero_lote:l.numeroLote,quantidade_total:l.quantidadeTotal,quantidade_disponivel:l.quantidadeDisponivel,quantidade_reservada:l.quantidadeReservada,quantidade_aplicada:l.quantidadeAplicada,local_armazenamento:l.localArmazenamento,valor_unitario_custo:l.valorUnitarioCusto,dias_para_vencer:d,unidades_disponiveis:0}});
  res.json({data:mapped,pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

r.post('/',async(req,res,next)=>{try{const b=req.body;
  const lote=await prisma.lote.create({data:{vacinaId:+b.vacina_id,numeroLote:b.numero_lote,fabricante:b.fabricante||'',quantidadeTotal:+b.quantidade_total,quantidadeDisponivel:+b.quantidade_total,validade:new Date(b.validade),temperaturaArmazenamento:b.temperatura||'2-8°C',localArmazenamento:b.local||'Câmara Fria Principal',valorUnitarioCusto:+(b.valor_unitario||0)}});
  let uc=0;for(let i=0;i<+b.quantidade_total;i++){await prisma.unidade.create({data:{loteId:lote.id,codigoBarras:cb()}});uc++}
  res.json({success:true,id:lote.id,unidades_criadas:uc});
}catch(e){next(e)}});
module.exports=r;
