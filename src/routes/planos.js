const{Router}=require('express');const r=Router();const prisma=require('../config/database');

r.get('/templates',async(req,res,next)=>{try{
  const planos=await prisma.plano.findMany({where:{status:'ativo'},orderBy:[{idadeInicio:'asc'},{idadeFim:'asc'}],include:{vacinas:{include:{vacina:true}}}});
  res.json(planos.map(p=>({...p,idade_inicio:p.idadeInicio,idade_fim:p.idadeFim,valor_tabela:p.valorTabela,vacinas:p.vacinas.map(v=>({...v,vacina_nome:v.vacina.nome,vacina_codigo:v.vacina.codigo}))})));
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
  const sm={cliente_nome:{cliente:{nome:order==='ASC'?'asc':'desc'}},nome_plano:'nomePlano',valor_final:'valorFinal',status_contrato:'statusContrato'};
  const ob=sort&&sm[sort]?typeof sm[sort]==='string'?{[sm[sort]]:order==='ASC'?'asc':'desc'}:sm[sort]:{criadoEm:'desc'};
  const[data,total]=await Promise.all([
    prisma.planoContratado.findMany({where,orderBy:ob,skip:(+page-1)*+limit,take:+limit,include:{cliente:{select:{nome:true,codigoCliente:true,tipoPaciente:true,dataNascimento:true,responsavelNome:true}},doses:true,pagamentos:true}}),
    prisma.planoContratado.count({where})]);
  const mapped=data.map(p=>{const tp=p.pagamentos.reduce((s,pg)=>s+pg.valorPago,0);const da2=p.doses.filter(d=>d.status==='aplicada').length;
    return{id:p.id,cliente_id:p.clienteId,nome_plano:p.nomePlano,idade_inicio:p.idadeInicio,idade_fim:p.idadeFim,valor_final:p.valorFinal,percentual_desconto:p.percentualDesconto,status_contrato:p.statusContrato,contrato_assinado:p.contratoAssinado,vendedor_id:p.vendedorId,
      cliente_nome:p.cliente.nome,codigo_cliente:p.cliente.codigoCliente,tipo_paciente:p.cliente.tipoPaciente,
      total_pago:tp,saldo_pendente:p.valorFinal-tp,doses_aplicadas:da2,doses_total:p.doses.length,
      vendedor_nome:'',criado_em:p.criadoEm}});
  res.json({data:mapped,pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

r.get('/:id',async(req,res,next)=>{try{
  const p=await prisma.planoContratado.findUnique({where:{id:+req.params.id},include:{cliente:{select:{nome:true,codigoCliente:true,dataNascimento:true,tipoPaciente:true,responsavelNome:true}},doses:{include:{vacina:true},orderBy:[{mesPrevisto:'asc'},{doseNumero:'asc'}]},pagamentos:{orderBy:{dataPagamento:'desc'}}}});
  if(!p)return res.status(404).json({error:'Não encontrado'});
  const tp=p.pagamentos.reduce((s,pg)=>s+pg.valorPago,0);
  res.json({...p,nome_plano:p.nomePlano,valor_final:p.valorFinal,percentual_desconto:p.percentualDesconto,margem_lucro_percentual:p.margemLucro,status_contrato:p.statusContrato,idade_inicio:p.idadeInicio,idade_fim:p.idadeFim,
    cliente_nome:p.cliente.nome,codigo_cliente:p.cliente.codigoCliente,vendedor_nome:'',
    total_pago:tp,saldo_pendente:p.valorFinal-tp,
    doses:p.doses.map(d=>({...d,vacina_nome:d.vacina.nome,dose_numero:d.doseNumero,data_aplicacao:d.dataAplicacao,local_aplicacao:d.localAplicacao})),
    pagamentos:p.pagamentos.map(pg=>({...pg,valor_pago:pg.valorPago,data_pagamento:pg.dataPagamento,forma_pagamento:pg.formaPagamento,numero_parcela:pg.numeroParcela})),
    projecao_mensal:[]});
}catch(e){next(e)}});

r.post('/',async(req,res,next)=>{try{const b=req.body;
  const vd=(b.valor_bruto||0)*(b.percentual_desconto||0)/100;const vf=(b.valor_bruto||0)-vd;
  const p=await prisma.planoContratado.create({data:{clienteId:+b.cliente_id,planoId:b.plano_id?+b.plano_id:null,nomePlano:b.nome_plano,idadeInicio:+(b.idade_inicio||0),idadeFim:+(b.idade_fim||18),valorCusto:+(b.valor_custo||0),valorBruto:+(b.valor_bruto||0),valorDesconto:vd,percentualDesconto:+(b.percentual_desconto||0),valorFinal:vf,lucroPrevisto:vf-(+(b.valor_custo||0)),margemLucro:vf>0?((vf-(+(b.valor_custo||0)))/vf*100):0,statusContrato:b.status_contrato||'ativo',vendedorId:b.vendedor_id?+b.vendedor_id:null,vacinadorId:b.vacinador_id?+b.vacinador_id:null,dataVenda:b.data_venda?new Date(b.data_venda):new Date(),dataInicioPlano:b.data_inicio_plano?new Date(b.data_inicio_plano):null,dataFimPlano:b.data_fim_plano?new Date(b.data_fim_plano):null}});
  // Auto-create doses from template
  if(b.plano_id){const pvs=await prisma.planoVacina.findMany({where:{planoId:+b.plano_id}});const dtI=new Date(b.data_inicio_plano||new Date());
    for(const pv of pvs){for(let dn=1;dn<=pv.doses;dn++){const mp=pv.mesPrevInicio+(pv.mesPrevFim-pv.mesPrevInicio)*((dn-1)/Math.max(1,pv.doses-1))|0;const dc=new Date(dtI);dc.setMonth(dc.getMonth()+mp);
      await prisma.planoContratadoDose.create({data:{planoContratadoId:p.id,vacinaId:pv.vacinaId,doseNumero:dn,status:'pendente',mesPrevisto:mp,competencia:`${dc.getFullYear()}-${String(dc.getMonth()+1).padStart(2,'0')}`}})}}}
  res.json({success:true,id:p.id});
}catch(e){next(e)}});
module.exports=r;
