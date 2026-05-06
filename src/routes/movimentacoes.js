const{Router}=require('express');const r=Router();const prisma=require('../config/database');
const{logAudit,getRealIP}=require('./auditoria');

function norm(s){return(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/vacina\s*/gi,'').replace(/\s+/g,' ').trim()}

const TIPOS_SENSIVEIS=['descarte','ajuste','estorno'];
const MOTIVOS_PADRAO=['vacina_vencida','quebra_avaria','cancelamento_plano','erro_lancamento','divergencia_inventario','devolucao','estorno_indevido','outro'];

// ═══ LIST (with approval filters) ═══
r.get('/',async(req,res,next)=>{try{
  const{page=1,limit=50,search='',tipo='',tipo_cliente='',status='',sort,order}=req.query;
  const where={};
  if(tipo)where.tipo=tipo;
  if(tipo_cliente)where.tipoCliente=tipo_cliente;
  if(status)where.status=status;
  if(search){
    const sn=search.replace(/[\.\-]/g,'');const qL=`%${search}%`;const sL=`%${sn}%`;
    try{
      const rows=await prisma.$queryRaw`SELECT m.id FROM movimentacoes m LEFT JOIN clientes c ON m.cliente_id=c.id WHERE
        unaccent(coalesce(m.nome_vacina,'')) ILIKE unaccent(${qL})
        OR coalesce(m.numero_lote,'') ILIKE ${qL}
        OR coalesce(m.codigo_barras,'') ILIKE ${qL}
        OR unaccent(coalesce(c.nome,'')) ILIKE unaccent(${qL})
        OR coalesce(c.cpf,'') ILIKE ${sL}`;
      where.id={in:rows.map(r=>r.id)};
    }catch(_){
      where.OR=[{nomeVacina:{contains:search,mode:'insensitive'}},{numeroLote:{contains:search,mode:'insensitive'}},{codigoBarras:{contains:search,mode:'insensitive'}},{cliente:{nome:{contains:search,mode:'insensitive'}}},{cliente:{cpf:{contains:sn,mode:'insensitive'}}}];
    }
  }
  const sm={id:'id',data_hora:'dataHora',tipo:'tipo',nome_vacina:'nomeVacina',numero_lote:'numeroLote',status:'status',local_aplicacao:'localAplicacao'};
  const ob=sort&&sm[sort]?typeof sm[sort]==='string'?{[sm[sort]]:order==='ASC'?'asc':'desc'}:sm[sort]:{id:'desc'};
  const[data,total]=await Promise.all([
    prisma.movimentacao.findMany({where,orderBy:ob,skip:(+page-1)*+limit,take:+limit,include:{
      cliente:{select:{id:true,nome:true,tipoPaciente:true,codigoCliente:true,tipoCliente:true,responsavelNome:true,
        planosContratados:{select:{id:true,nomePlano:true,statusContrato:true,doses:{select:{status:true}}}}}},
    }}),
    prisma.movimentacao.count({where})]);
  res.json({data:data.map(m=>{
    let plano_progresso=null;
    if(m.cliente?.tipoCliente==='ativo'&&m.cliente?.planosContratados?.length>0){
      // If movimentação has explicit planoContratadoId, use THAT plan
      let targetPlans=m.cliente.planosContratados;
      if(m.planoContratadoId){
        const linked=targetPlans.find(p=>p.id===m.planoContratadoId);
        if(linked)targetPlans=[linked];
      }
      let totalDoses=0,totalAplicadas=0;let planoNome='';
      targetPlans.forEach(pc=>{
        totalDoses+=pc.doses.length;
        totalAplicadas+=pc.doses.filter(d=>d.status==='aplicada').length;
        if(!planoNome)planoNome=pc.nomePlano+(pc.statusContrato==='finalizado'?' ✓':'');
      });
      if(targetPlans.length>1)planoNome+=` (+${targetPlans.length-1})`;
      plano_progresso={nome:planoNome,aplicadas:totalAplicadas,total:totalDoses,pct:totalDoses>0?Math.round(totalAplicadas/totalDoses*100):0};
    }
    const isForaPlano=m.motivoPadrao==='vacina_fora_plano';
    return{id:m.id,tipo:m.tipo,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,codigo_barras:m.codigoBarras,quantidade:m.quantidade,local_aplicacao:m.localAplicacao,tipo_cliente:m.tipoCliente||m.cliente?.tipoCliente,tipo_atendimento:m.tipoAtendimento,status:m.status,observacoes:m.observacoes,cliente_id:m.clienteId,cliente_nome:m.cliente?.nome,codigo_cliente:m.cliente?.codigoCliente,responsavel_nome:m.cliente?.responsavelNome||null,usuario_id:m.usuarioId,unidade_id:m.unidadeId,plano_progresso,fora_do_plano:isForaPlano,plano_contratado_id:m.planoContratadoId,
      requer_aprovacao:m.requerAprovacao,justificativa:m.justificativa,motivo_padrao:m.motivoPadrao,aprovado_por:m.aprovadoPor,aprovado_em:m.aprovadoEm,motivo_reprovacao:m.motivoReprovacao};
  }),pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

// ═══ PENDING APPROVALS ═══
r.get('/pendentes',async(req,res,next)=>{try{
  const data=await prisma.movimentacao.findMany({
    where:{status:'pendente_aprovacao'},
    orderBy:{dataHora:'desc'},
    include:{cliente:{select:{nome:true,codigoCliente:true,responsavelNome:true,tipoPaciente:true}}}
  });
  const usuario_ids=[...new Set(data.map(m=>m.usuarioId))];
  const usuarios=await prisma.usuario.findMany({where:{id:{in:usuario_ids}},select:{id:true,nome:true,cargo:true}});
  const umap=Object.fromEntries(usuarios.map(u=>[u.id,u]));
  res.json(data.map(m=>({
    id:m.id,tipo:m.tipo,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,
    codigo_barras:m.codigoBarras,quantidade:m.quantidade,status:m.status,
    justificativa:m.justificativa,motivo_padrao:m.motivoPadrao,observacoes:m.observacoes,
    cliente_nome:m.cliente?.nome,codigo_cliente:m.cliente?.codigoCliente,
    responsavel_nome:m.cliente?.responsavelNome||null,tipo_paciente:m.cliente?.tipoPaciente||null,
    solicitante_nome:umap[m.usuarioId]?.nome,solicitante_cargo:umap[m.usuarioId]?.cargo,
    local_aplicacao:m.localAplicacao,
  })));
}catch(e){next(e)}});

// ═══ CREATE (with approval workflow) ═══
r.post('/',async(req,res,next)=>{try{
  const b=req.body;
  if(!b.tipo)return res.status(400).json({error:'Tipo obrigatório'});
  if(!b.usuario_id)return res.status(400).json({error:'Operador obrigatório'});
  const qty=+(b.quantidade||1);if(qty<1||qty>999)return res.status(400).json({error:'Quantidade inválida'});

  // Check if sensitive type
  const isSensitive=TIPOS_SENSIVEIS.includes(b.tipo);

  // Get user profile
  const user=await prisma.usuario.findUnique({where:{id:+b.usuario_id},select:{perfil:true}});
  const isMaster=user?.perfil==='master';

  // Sensitive types require justification
  if(isSensitive&&!isMaster){
    if(!b.justificativa&&!b.motivo_padrao)return res.status(400).json({error:'Justificativa obrigatória para movimentações sensíveis (descarte/ajuste/estorno)'});
  }

  // Resolve vaccine name
  let nomeVacina=b.nome_vacina||'';
  if(b.vacina_id&&!nomeVacina){const v=await prisma.vacina.findUnique({where:{id:+b.vacina_id}});nomeVacina=v?.nome||''}
  let numeroLote=b.numero_lote||'';
  if(b.lote_id&&!numeroLote){const l=await prisma.lote.findUnique({where:{id:+b.lote_id}});numeroLote=l?.numeroLote||''}

  // Determine status and stock impact
  const needsApproval=isSensitive&&!isMaster;
  const status=needsApproval?'pendente_aprovacao':'concluido';
  const impactaEstoque=!needsApproval; // Only impact stock if auto-approved or normal

  // Create movement
  const mov=await prisma.movimentacao.create({data:{
    tipo:b.tipo,status,
    vacinaId:b.vacina_id?+b.vacina_id:null,loteId:b.lote_id?+b.lote_id:null,
    unidadeId:b.unidade_id?+b.unidade_id:null,clienteId:b.cliente_id?+b.cliente_id:null,
    usuarioId:+b.usuario_id,aplicadoPor:b.aplicador_id?+b.aplicador_id:null,
    tipoCliente:b.tipo_cliente||null,tipoAtendimento:b.tipo_atendimento||'normal',
    localAplicacao:b.local_aplicacao||null,quantidade:qty,
    codigoBarras:b.codigo_barras||null,numeroLote,nomeVacina,
    observacoes:b.observacoes||null,
    requerAprovacao:needsApproval,justificativa:b.justificativa||null,
    motivoPadrao:b.motivo_padrao||null,
    impactaEstoque,estoqueAplicadoEm:impactaEstoque?new Date():null,
  }});

  // Apply stock impact immediately for non-sensitive or master
  if(impactaEstoque&&b.lote_id){
    if(['entrada'].includes(b.tipo)){
      await prisma.lote.update({where:{id:+b.lote_id},data:{quantidadeTotal:{increment:qty},quantidadeDisponivel:{increment:qty}}});
    }else if(['retirada','aplicacao','descarte'].includes(b.tipo)){
      const lote=await prisma.lote.findUnique({where:{id:+b.lote_id}});
      if(!lote)return res.status(400).json({error:'Lote não encontrado'});
      const dpu=lote.dosesPorUnidade||1;
      if(dpu>1){
        // Multi-dose box: track doses, only consume box when all doses used
        const totalDoses=lote.quantidadeDisponivel*dpu-(lote.dosesAbertas||0);
        if(totalDoses<qty)return res.status(400).json({error:`Estoque insuficiente: ${totalDoses} doses disponíveis`});
        const novasDosesAbertas=(lote.dosesAbertas||0)+qty;
        const caixasConsumidas=Math.floor(novasDosesAbertas/dpu);
        const dosesRestantes=novasDosesAbertas%dpu;
        const updateData={dosesAbertas:dosesRestantes,quantidadeAplicada:{increment:qty}};
        if(caixasConsumidas>0)updateData.quantidadeDisponivel={decrement:caixasConsumidas};
        await prisma.lote.update({where:{id:+b.lote_id},data:updateData});
      }else{
        // Single-dose: original behavior
        if(lote.quantidadeDisponivel<qty)return res.status(400).json({error:`Estoque insuficiente: ${lote.quantidadeDisponivel} disponíveis`});
        await prisma.lote.update({where:{id:+b.lote_id},data:{quantidadeDisponivel:{decrement:qty},quantidadeAplicada:{increment:qty}}});
      }
    }
  }

  // ═══ VINCULAR AO PLANO DO CLIENTE (retirada/aplicação) ═══
  if(impactaEstoque&&b.cliente_id&&['retirada','aplicacao'].includes(b.tipo)){
    try{
      const cli=await prisma.cliente.findUnique({where:{id:+b.cliente_id},select:{tipoCliente:true}});
      if(cli?.tipoCliente==='ativo'){
        const planosAtivos=await prisma.planoContratado.findMany({
          where:{clienteId:+b.cliente_id,statusContrato:'ativo'},
          include:{doses:{where:{status:'pendente'},include:{vacina:{select:{nome:true}}}}}
        });
        // Try to match vaccine to a pending dose — STRICT by vacinaId only
        for(const plano of planosAtivos){
          const match=plano.doses.find(d=>d.vacinaId===+(b.vacina_id||0));
          if(match){
            await prisma.planoContratadoDose.update({where:{id:match.id},data:{
              status:'aplicada',dataAplicacao:new Date(),localAplicacao:b.local_aplicacao||null,movimentacaoId:mov.id
            }});
            break;
          }
        }
      }
    }catch(e){console.error('Dose link warning:',e.message)} // Non-critical - don't block movement
  }

  res.json({
    success:true,id:mov.id,status:mov.status,
    message:needsApproval?`Movimentação #${mov.id} criada — aguardando aprovação do master`:`Movimentação #${mov.id} registrada`,
    requer_aprovacao:needsApproval,
  });
  logAudit({acao:needsApproval?'criar_pendente':'criar',entidade:'movimentacao',entidadeId:mov.id,usuarioId:+b.usuario_id,detalhes:{tipo:b.tipo,vacina:nomeVacina,quantidade:qty,status:mov.status},ip:getRealIP(req),userAgent:req.get('user-agent')});
}catch(e){next(e)}});

// ═══ APPROVE ═══
r.post('/:id/aprovar',async(req,res,next)=>{try{
  const{aprovador_id,observacoes}=req.body;
  if(!aprovador_id)return res.status(400).json({error:'Aprovador obrigatório'});

  // Check approver is master
  const user=await prisma.usuario.findUnique({where:{id:+aprovador_id},select:{perfil:true,nome:true}});
  if(user?.perfil!=='master')return res.status(403).json({error:'Apenas usuários master podem aprovar movimentações'});

  const mov=await prisma.movimentacao.findUnique({where:{id:+req.params.id}});
  if(!mov)return res.status(404).json({error:'Movimentação não encontrada'});
  if(mov.status!=='pendente_aprovacao')return res.status(400).json({error:`Movimentação já está "${mov.status}" — não pode ser aprovada`});

  // Apply stock impact
  if(mov.loteId){
    if(['retirada','aplicacao','descarte','ajuste'].includes(mov.tipo)){
      const lote=await prisma.lote.findUnique({where:{id:mov.loteId}});
      const dpu=lote?.dosesPorUnidade||1;
      if(dpu>1){
        const totalDoses=lote.quantidadeDisponivel*dpu-(lote.dosesAbertas||0);
        if(totalDoses<mov.quantidade)return res.status(400).json({error:`Estoque insuficiente: ${totalDoses} doses disponíveis`});
        const novasDoses=(lote.dosesAbertas||0)+mov.quantidade;
        const caixas=Math.floor(novasDoses/dpu);const rest=novasDoses%dpu;
        const ud={dosesAbertas:rest,quantidadeAplicada:{increment:mov.quantidade}};
        if(caixas>0)ud.quantidadeDisponivel={decrement:caixas};
        await prisma.lote.update({where:{id:mov.loteId},data:ud});
      }else{
        if(lote&&lote.quantidadeDisponivel<mov.quantidade)return res.status(400).json({error:`Estoque insuficiente: ${lote.quantidadeDisponivel} disponíveis`});
        const updateData={quantidadeDisponivel:{decrement:mov.quantidade}};
        if(['retirada','aplicacao'].includes(mov.tipo))updateData.quantidadeAplicada={increment:mov.quantidade};
        await prisma.lote.update({where:{id:mov.loteId},data:updateData});
      }
      // Check if esgotado
      const updLote=await prisma.lote.findUnique({where:{id:mov.loteId}});
      if(updLote&&updLote.quantidadeDisponivel<=0)await prisma.lote.update({where:{id:mov.loteId},data:{status:'esgotado'}});
      // Mark unit as applied if retirada
      if(['retirada','aplicacao'].includes(mov.tipo)&&mov.unidadeId){
        await prisma.unidade.update({where:{id:mov.unidadeId},data:{status:'aplicada'}}).catch(()=>{});
      }
    }else if(mov.tipo==='estorno'){
      await prisma.lote.update({where:{id:mov.loteId},data:{quantidadeDisponivel:{increment:mov.quantidade},quantidadeAplicada:{decrement:mov.quantidade}}});
    }
  }

  // Update movement
  await prisma.movimentacao.update({where:{id:+req.params.id},data:{
    status:'concluido',aprovadoPor:+aprovador_id,aprovadoEm:new Date(),
    impactaEstoque:true,estoqueAplicadoEm:new Date(),
    observacoes:mov.observacoes?(mov.observacoes+' | Aprovado: '+(observacoes||'')):('Aprovado: '+(observacoes||'')),
  }});

  res.json({success:true,message:`Movimentação #${req.params.id} aprovada por ${user.nome}`});
  logAudit({acao:'aprovar',entidade:'movimentacao',entidadeId:+req.params.id,usuarioId:+aprovador_id,usuarioNome:user.nome,perfil:'master',detalhes:{tipo:mov.tipo,vacina:mov.nomeVacina},ip:getRealIP(req),userAgent:req.get('user-agent')});
}catch(e){next(e)}});

// ═══ REJECT ═══
r.post('/:id/reprovar',async(req,res,next)=>{try{
  const{aprovador_id,motivo}=req.body;
  if(!aprovador_id)return res.status(400).json({error:'Aprovador obrigatório'});
  if(!motivo)return res.status(400).json({error:'Motivo da reprovação obrigatório'});

  const user=await prisma.usuario.findUnique({where:{id:+aprovador_id},select:{perfil:true,nome:true}});
  if(user?.perfil!=='master')return res.status(403).json({error:'Apenas master pode reprovar'});

  const mov=await prisma.movimentacao.findUnique({where:{id:+req.params.id}});
  if(!mov)return res.status(404).json({error:'Não encontrada'});
  if(mov.status!=='pendente_aprovacao')return res.status(400).json({error:`Status "${mov.status}" não pode ser reprovado`});

  await prisma.movimentacao.update({where:{id:+req.params.id},data:{
    status:'reprovado',aprovadoPor:+aprovador_id,aprovadoEm:new Date(),
    motivoReprovacao:motivo,impactaEstoque:false,
  }});

  res.json({success:true,message:`Movimentação #${req.params.id} reprovada por ${user.nome}`});
  logAudit({acao:'reprovar',entidade:'movimentacao',entidadeId:+req.params.id,usuarioId:+aprovador_id,usuarioNome:user.nome,perfil:'master',detalhes:{tipo:mov.tipo,motivo},ip:getRealIP(req),userAgent:req.get('user-agent')});
}catch(e){next(e)}});

// ═══ EDIT ═══
r.put('/:id',async(req,res,next)=>{try{
  const b=req.body;const m=await prisma.movimentacao.findUnique({where:{id:+req.params.id}});
  if(!m)return res.status(404).json({error:'Não encontrada'});
  if(m.unidadeId)return res.status(400).json({error:'Movimentação de bipagem não pode ser editada — use estorno'});
  if(m.status==='concluido'&&m.impactaEstoque)return res.status(400).json({error:'Movimentação já consolidada no estoque'});
  const data={};
  if(b.observacoes!==undefined)data.observacoes=b.observacoes;
  if(b.local_aplicacao)data.localAplicacao=b.local_aplicacao;
  if(b.justificativa)data.justificativa=b.justificativa;
  if(b.motivo_padrao)data.motivoPadrao=b.motivo_padrao;
  await prisma.movimentacao.update({where:{id:+req.params.id},data});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ DELETE ═══
r.delete('/:id',async(req,res,next)=>{try{
  const m=await prisma.movimentacao.findUnique({where:{id:+req.params.id}});
  if(!m)return res.status(404).json({error:'Não encontrada'});
  if(m.unidadeId)return res.status(400).json({error:'Movimentação de bipagem não pode ser excluída — use estorno'});
  if(m.status==='concluido'&&m.impactaEstoque)return res.status(400).json({error:'Movimentação consolidada não pode ser excluída'});
  await prisma.movimentacao.delete({where:{id:+req.params.id}});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ MOTIVOS PADRAO ═══
r.get('/motivos',(_,res)=>res.json(MOTIVOS_PADRAO));

module.exports=r;
