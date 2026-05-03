const{Router}=require('express');const r=Router();const prisma=require('../config/database');

// ═══ RELATÓRIO DE ESTOQUE ═══
r.get('/estoque',async(req,res,next)=>{try{
  const lotes=await prisma.lote.findMany({
    where:{status:{not:'descartado'}},
    include:{vacina:{select:{id:true,nome:true,codigo:true,fabricante:true,categoria:true}},
      _count:{select:{unidades:true}}},
    orderBy:[{vacina:{nome:'asc'}},{numeroLote:'asc'}]
  });

  // Aggregate by vaccine
  const byVac={};
  let totalCaixas=0,totalDoses=0,totalCusto=0,lotesAtivos=0,lotesVencidos=0,lotesProxVencer=0;
  const hoje=new Date();
  const em90dias=new Date();em90dias.setDate(em90dias.getDate()+90);

  lotes.forEach(l=>{
    const vNome=l.vacina.nome;const vCod=l.vacina.codigo;
    if(!byVac[vCod])byVac[vCod]={nome:vNome,codigo:vCod,fabricante:l.vacina.fabricante,categoria:l.vacina.categoria||'',
      lotes:[],totalCaixas:0,totalDoses:0,totalCusto:0};
    const dpu=l.dosesPorUnidade||1;
    const doses=l.quantidadeDisponivel*dpu-(l.dosesAbertas||0);
    const vencido=l.validade<hoje;
    const proxVencer=!vencido&&l.validade<em90dias;
    
    byVac[vCod].lotes.push({
      id:l.id,numero_lote:l.numeroLote,fabricante:l.fabricante,
      quantidade_total:l.quantidadeTotal,quantidade_disponivel:l.quantidadeDisponivel,
      quantidade_aplicada:l.quantidadeAplicada,doses_por_unidade:dpu,
      doses_abertas:l.dosesAbertas||0,doses_disponiveis:doses,
      validade:l.validade,status:l.status,local:l.localArmazenamento,
      custo_unitario:l.valorUnitarioCusto||0,
      custo_total:(l.valorUnitarioCusto||0)*l.quantidadeDisponivel,
      vencido,prox_vencer:proxVencer
    });
    byVac[vCod].totalCaixas+=l.quantidadeDisponivel;
    byVac[vCod].totalDoses+=doses;
    byVac[vCod].totalCusto+=(l.valorUnitarioCusto||0)*l.quantidadeDisponivel;
    totalCaixas+=l.quantidadeDisponivel;totalDoses+=doses;
    totalCusto+=(l.valorUnitarioCusto||0)*l.quantidadeDisponivel;
    lotesAtivos++;
    if(vencido)lotesVencidos++;
    if(proxVencer)lotesProxVencer++;
  });

  // Sort alphabetically
  const vacinas=Object.values(byVac).sort((a,b)=>a.nome.localeCompare(b.nome));

  res.json({
    gerado_em:new Date(),
    resumo:{total_vacinas:vacinas.length,total_lotes:lotesAtivos,total_caixas:totalCaixas,
      total_doses:totalDoses,valor_estoque:totalCusto,lotes_vencidos:lotesVencidos,lotes_prox_vencer:lotesProxVencer},
    vacinas
  });
}catch(e){next(e)}});

module.exports=r;
