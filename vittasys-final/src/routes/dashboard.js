const{Router}=require('express');const r=Router();const prisma=require('../config/database');
r.get('/',async(req,res,next)=>{try{
  const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const in30=new Date(today);in30.setDate(in30.getDate()+30);

  const [totalDoses,totalLotes,vencidos,proxVencer,movsHoje,totalCli,cliAtivos,cliEsp,contratosAtivos,contratosFinalizados,dosePend,doseAplic,totalRecebido,valorContratos,pendAprov]=await Promise.all([
    prisma.lote.aggregate({_sum:{quantidadeDisponivel:true},where:{status:{notIn:['vencido','descartado']}}}),
    prisma.lote.count({where:{status:{notIn:['vencido','descartado']}}}),
    prisma.lote.count({where:{validade:{lt:now}}}),
    prisma.lote.count({where:{validade:{gte:now,lte:in30},status:{not:'vencido'}}}),
    prisma.movimentacao.count({where:{dataHora:{gte:today}}}),
    prisma.cliente.count({where:{status:'ativo'}}),
    prisma.cliente.count({where:{tipoCliente:'ativo',status:'ativo'}}),
    prisma.cliente.count({where:{tipoCliente:'espontaneo',status:'ativo'}}),
    prisma.planoContratado.count({where:{statusContrato:'ativo'}}),
    prisma.planoContratado.count({where:{statusContrato:'finalizado'}}),
    prisma.planoContratadoDose.count({where:{status:'pendente'}}),
    prisma.planoContratadoDose.count({where:{status:'aplicada'}}),
    prisma.pagamento.aggregate({_sum:{valorPago:true}}),
    prisma.planoContratado.aggregate({_sum:{valorFinal:true}}),
    prisma.movimentacao.count({where:{status:'pendente_aprovacao'}}),
  ]);
  const trVal=totalRecebido._sum.valorPago||0;const vcVal=valorContratos._sum.valorFinal||0;

  const ultMovs=await prisma.movimentacao.findMany({orderBy:{dataHora:'desc'},take:8,include:{cliente:{select:{nome:true,tipoCliente:true}}}});
  const alertas=await prisma.lote.findMany({where:{validade:{lte:in30},quantidadeDisponivel:{gt:0}},orderBy:{validade:'asc'},take:10,include:{vacina:{select:{nome:true}}}});

  res.json({
    estoque:{total_doses:totalDoses._sum.quantidadeDisponivel||0,total_lotes:totalLotes,vencidos,proximos_vencer:proxVencer},
    movimentacoes:{hoje:movsHoje},
    clientes:{total:totalCli,ativos:cliAtivos,espontaneos:cliEsp},
    planos:{contratos_ativos:contratosAtivos,contratos_finalizados:contratosFinalizados,total_contratos:contratosAtivos+contratosFinalizados,doses_pendentes:dosePend,doses_aplicadas:doseAplic},
    financeiro:{total_recebido:trVal,valor_contratos:vcVal,saldo_pendente:vcVal-trVal},
    aprovacoes_pendentes:pendAprov,
    ultimas_movimentacoes:ultMovs.map(m=>({...m,cliente_nome:m.cliente?.nome,tipo_cliente:m.cliente?.tipoCliente,data_hora:m.dataHora,nome_vacina:m.nomeVacina})),
    alertas_vencimento:alertas.map(a=>({...a,vacina_nome:a.vacina.nome,numero_lote:a.numeroLote,quantidade_disponivel:a.quantidadeDisponivel,dias_para_vencer:Math.ceil((a.validade-now)/864e5)})),
  });
}catch(e){next(e)}});
module.exports=r;
