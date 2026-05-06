// ═══════════════════════════════════════════════════════════
// EXCLUSÕES PENDENTES — aprovação master para não-masters
// ═══════════════════════════════════════════════════════════
const {Router}=require('express');
const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();
const r=Router();

// ─── GET — listar pendentes ───────────────────────────────
r.get('/',async(req,res,next)=>{try{
  const status=req.query.status||'pendente';
  const items=await prisma.exclusaoPendente.findMany({
    where:{status},
    orderBy:{criadoEm:'desc'}
  });
  res.json(items);
}catch(e){next(e)}});

// ─── GET /por-entidade/:entidade — retorna map {id: exclusao} ──
r.get('/por-entidade/:entidade',async(req,res,next)=>{try{
  const items=await prisma.exclusaoPendente.findMany({
    where:{entidade:req.params.entidade,status:'pendente'},
    select:{id:true,entidadeId:true,label:true,solicitanteNome:true,motivo:true,criadoEm:true}
  });
  // Return as map: {[entidadeId]: item}
  const map={};
  items.forEach(i=>{ map[i.entidadeId]=i; });
  res.json(map);
}catch(e){next(e)}});

// ─── POST — solicitar exclusão ────────────────────────────
r.post('/',async(req,res,next)=>{try{
  const{entidade,entidade_id,label,snapshot,motivo,solicitante_id,solicitante_nome}=req.body;
  if(!entidade||!entidade_id||!solicitante_id)
    return res.status(400).json({error:'Campos obrigatórios: entidade, entidade_id, solicitante_id'});

  // Check if already has pending request for same record
  const existing=await prisma.exclusaoPendente.findFirst({
    where:{entidade,entidadeId:+entidade_id,status:'pendente'}
  });
  if(existing)return res.status(409).json({error:'Já existe solicitação de exclusão pendente para este registro'});

  const item=await prisma.exclusaoPendente.create({data:{
    entidade,entidadeId:+entidade_id,
    label:label||`${entidade} #${entidade_id}`,
    snapshot:snapshot?JSON.stringify(snapshot):null,
    motivo:motivo||null,
    solicitanteId:+solicitante_id,
    solicitanteNome:solicitante_nome||'Desconhecido',
    status:'pendente'
  }});
  res.json({success:true,message:'Solicitação de exclusão enviada para aprovação do master',id:item.id});
}catch(e){next(e)}});

// ─── PUT /:id/aprovar — master aprova e executa exclusão ──
r.put('/:id/aprovar',async(req,res,next)=>{try{
  const id=+req.params.id;
  const{aprovador_id,aprovador_nome}=req.body;
  const exc=await prisma.exclusaoPendente.findUnique({where:{id}});
  if(!exc)return res.status(404).json({error:'Solicitação não encontrada'});
  if(exc.status!=='pendente')return res.status(400).json({error:'Solicitação já resolvida'});

  // Execute the actual deletion based on entidade type
  let result={};
  try{
    result=await executarExclusao(exc.entidade,exc.entidadeId);
  }catch(err){
    return res.status(400).json({error:`Erro ao executar exclusão: ${err.message}`});
  }

  // Mark as approved
  await prisma.exclusaoPendente.update({where:{id},data:{
    status:'aprovado',
    aprovadorId:aprovador_id?+aprovador_id:null,
    aprovadorNome:aprovador_nome||null,
    resolvidoEm:new Date()
  }});

  res.json({success:true,message:`Exclusão aprovada e executada: ${exc.label}`,detalhes:result});
}catch(e){next(e)}});

// ─── PUT /:id/rejeitar — master rejeita ───────────────────
r.put('/:id/rejeitar',async(req,res,next)=>{try{
  const id=+req.params.id;
  const{motivo,aprovador_id,aprovador_nome}=req.body;
  const exc=await prisma.exclusaoPendente.findUnique({where:{id}});
  if(!exc)return res.status(404).json({error:'Solicitação não encontrada'});
  if(exc.status!=='pendente')return res.status(400).json({error:'Solicitação já resolvida'});
  if(!motivo?.trim())return res.status(400).json({error:'Motivo da rejeição é obrigatório'});

  await prisma.exclusaoPendente.update({where:{id},data:{
    status:'rejeitado',
    motivoRejeicao:motivo.trim(),
    aprovadorId:aprovador_id?+aprovador_id:null,
    aprovadorNome:aprovador_nome||null,
    resolvidoEm:new Date()
  }});
  res.json({success:true,message:`Exclusão de "${exc.label}" rejeitada`});
}catch(e){next(e)}});

// ─── Executar exclusão real por tipo de entidade ──────────
async function executarExclusao(entidade,id){
  switch(entidade){

    case 'lote':{
      const lote=await prisma.lote.findUnique({where:{id},include:{_count:{select:{movimentacoes:true,unidades:true}}}});
      if(!lote)throw new Error('Lote não encontrado');
      const movsCount=lote._count.movimentacoes||0;
      const unitsUsed=await prisma.unidade.count({where:{loteId:id,status:{not:'disponivel'}}});
      if(movsCount>0||unitsUsed>0){
        await prisma.lote.update({where:{id},data:{status:'inativo'}});
        return{tipo:'inativado',message:`Lote inativado (${movsCount} movimentações vinculadas)`};
      }else{
        await prisma.unidade.deleteMany({where:{loteId:id}});
        await prisma.lote.delete({where:{id}});
        return{tipo:'excluido',message:'Lote excluído permanentemente'};
      }
    }

    case 'cliente':{
      const[movs,plans]=await Promise.all([
        prisma.movimentacao.count({where:{clienteId:id}}),
        prisma.planoContratado.count({where:{clienteId:id,statusContrato:'ativo'}})
      ]);
      if(movs>0||plans>0)throw new Error(`Não é possível: ${movs} movimentações, ${plans} planos ativos`);
      await prisma.cliente.update({where:{id},data:{status:'inativo'}});
      return{tipo:'inativado'};
    }

    case 'plano_contratado':{
      const dosesAplicadas=await prisma.planoContratadoDose.count({where:{planoContratadoId:id,status:'aplicada'}});
      if(dosesAplicadas>0)throw new Error(`Não é possível: ${dosesAplicadas} dose(s) já aplicada(s)`);
      const pagamentos=await prisma.pagamento.aggregate({where:{planoContratadoId:id},_sum:{valorPago:true}});
      const totalPago=pagamentos._sum.valorPago||0;
      if(totalPago>0)throw new Error(`Não é possível: R$ ${totalPago.toFixed(2)} em pagamentos vinculados`);
      await prisma.planoContratadoDose.deleteMany({where:{planoContratadoId:id}});
      await prisma.pagamento.deleteMany({where:{planoContratadoId:id}});
      await prisma.planoContratado.delete({where:{id}});
      return{tipo:'excluido'};
    }

    case 'template_plano':{
      const plano=await prisma.plano.findUnique({where:{id}});
      if(!plano)throw new Error('Plano não encontrado');
      await prisma.plano.update({where:{id},data:{status:'inativo'}});
      return{tipo:'inativado'};
    }

    case 'usuario':{
      const u=await prisma.usuario.findUnique({where:{id}});
      if(!u)throw new Error('Usuário não encontrado');
      if(u.perfil==='master'){
        const masters=await prisma.usuario.count({where:{perfil:'master',ativo:true}});
        if(masters<=1)throw new Error('Não é possível desativar o único master do sistema');
      }
      await prisma.usuario.update({where:{id},data:{ativo:false}});
      return{tipo:'inativado'};
    }

    default:
      throw new Error(`Entidade desconhecida: ${entidade}`);
  }
}

module.exports=r;
