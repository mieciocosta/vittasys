const{Router}=require('express');const r=Router();const prisma=require('../config/database');
const{logAudit}=require('./auditoria');

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
  if(search){const s=search.replace(/[\.\-]/g,'');
    where.OR=[{nomeVacina:{contains:search,mode:'insensitive'}},{numeroLote:{contains:search,mode:'insensitive'}},{codigoBarras:{contains:search,mode:'insensitive'}},{cliente:{nome:{contains:search,mode:'insensitive'}}},{cliente:{cpf:{contains:s,mode:'insensitive'}}}]}
  const sm={id:'id',data_hora:'dataHora',tipo:'tipo',nome_vacina:'nomeVacina',numero_lote:'numeroLote',status:'status',local_aplicacao:'localAplicacao'};
  const ob=sort&&sm[sort]?typeof sm[sort]==='string'?{[sm[sort]]:order==='ASC'?'asc':'desc'}:sm[sort]:{id:'desc'};
  const[data,total]=await Promise.all([
    prisma.movimentacao.findMany({where,orderBy:ob,skip:(+page-1)*+limit,take:+limit,include:{
      cliente:{select:{id:true,nome:true,tipoPaciente:true,codigoCliente:true,tipoCliente:true,
        planosContratados:{where:{statusContrato:'ativo'},select:{id:true,nomePlano:true,doses:{select:{status:true}}}}}},
    }}),
    prisma.movimentacao.count({where})]);
  res.json({data:data.map(m=>{
    let plano_progresso=null;
    if(m.cliente?.tipoCliente==='ativo'&&m.cliente?.planosContratados?.length>0){
      const pc=m.cliente.planosContratados[0];const td=pc.doses.length;const ap=pc.doses.filter(d=>d.status==='aplicada').length;
      plano_progresso={nome:pc.nomePlano,aplicadas:ap,total:td,pct:td>0?Math.round(ap/td*100):0};
    }
    return{id:m.id,tipo:m.tipo,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,codigo_barras:m.codigoBarras,quantidade:m.quantidade,local_aplicacao:m.localAplicacao,tipo_cliente:m.tipoCliente||m.cliente?.tipoCliente,tipo_atendimento:m.tipoAtendimento,status:m.status,observacoes:m.observacoes,cliente_id:m.clienteId,cliente_nome:m.cliente?.nome,codigo_cliente:m.cliente?.codigoCliente,usuario_id:m.usuarioId,unidade_id:m.unidadeId,plano_progresso,
      requer_aprovacao:m.requerAprovacao,justificativa:m.justificativa,motivo_padrao:m.motivoPadrao,aprovado_por:m.aprovadoPor,aprovado_em:m.aprovadoEm,motivo_reprovacao:m.motivoReprovacao};
  }),pagination:{page:+page,limit:+limit,total,pages:Math.ceil(total/+limit)}});
}catch(e){next(e)}});

// ═══ PENDING APPROVALS ═══
r.get('/pendentes',async(req,res,next)=>{try{
  const data=await prisma.movimentacao.findMany({
    where:{status:'pendente_aprovacao'},
    orderBy:{dataHora:'desc'},
    include:{cliente:{select:{nome:true,codigoCliente:true}}}
  });
  const usuario_ids=[...new Set(data.map(m=>m.usuarioId))];
  const usuarios=await prisma.usuario.findMany({where:{id:{in:usuario_ids}},select:{id:true,nome:true,cargo:true}});
  const umap=Object.fromEntries(usuarios.map(u=>[u.id,u]));
  res.json(data.map(m=>({
    id:m.id,tipo:m.tipo,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,
    codigo_barras:m.codigoBarras,quantidade:m.quantidade,status:m.status,
    justificativa:m.justificativa,motivo_padrao:m.motivoPadrao,observacoes:m.observacoes,
    cliente_nome:m.cliente?.nome,codigo_cliente:m.cliente?.codigoCliente,
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
      if(lote&&lote.quantidadeDisponivel<qty)return res.status(400).json({error:`Estoque insuficiente: ${lote.quantidadeDisponivel} disponíveis`});
      await prisma.lote.update({where:{id:+b.lote_id},data:{quantidadeDisponivel:{decrement:qty}}});
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
        // Try to match vaccine to a pending dose
        for(const plano of planosAtivos){
          const match=plano.doses.find(d=>{
            if(d.vacinaId===+(b.vacina_id||0))return true;
            // Fuzzy match with accent normalization
            const nv=norm(nomeVacina);const nd=norm(d.vacina?.nome);
            if(nv.length>3&&nd.length>3){
              if(nv.includes(nd)||nd.includes(nv))return true;
              const w1=nv.split(/[\s\-\(\)]+/).filter(w=>w.length>3);
              const w2=nd.split(/[\s\-\(\)]+/).filter(w=>w.length>3);
              for(const a of w1){for(const b2 of w2){if(a.includes(b2)||b2.includes(a))return true}}
            }
            return false;
          });
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
  logAudit({acao:needsApproval?'criar_pendente':'criar',entidade:'movimentacao',entidadeId:mov.id,usuarioId:+b.usuario_id,detalhes:{tipo:b.tipo,vacina:nomeVacina,quantidade:qty,status:mov.status},ip:req.ip,userAgent:req.get('user-agent')});
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
    if(['descarte','ajuste'].includes(mov.tipo)){
      const lote=await prisma.lote.findUnique({where:{id:mov.loteId}});
      if(lote&&lote.quantidadeDisponivel<mov.quantidade)return res.status(400).json({error:`Estoque insuficiente para aprovar: ${lote.quantidadeDisponivel} disponíveis`});
      await prisma.lote.update({where:{id:mov.loteId},data:{quantidadeDisponivel:{decrement:mov.quantidade}}});
    }else if(mov.tipo==='estorno'){
      await prisma.lote.update({where:{id:mov.loteId},data:{quantidadeDisponivel:{increment:mov.quantidade}}});
    }
  }

  // Update movement
  await prisma.movimentacao.update({where:{id:+req.params.id},data:{
    status:'concluido',aprovadoPor:+aprovador_id,aprovadoEm:new Date(),
    impactaEstoque:true,estoqueAplicadoEm:new Date(),
    observacoes:mov.observacoes?(mov.observacoes+' | Aprovado: '+(observacoes||'')):('Aprovado: '+(observacoes||'')),
  }});

  res.json({success:true,message:`Movimentação #${req.params.id} aprovada por ${user.nome}`});
  logAudit({acao:'aprovar',entidade:'movimentacao',entidadeId:+req.params.id,usuarioId:+aprovador_id,usuarioNome:user.nome,perfil:'master',detalhes:{tipo:mov.tipo,vacina:mov.nomeVacina},ip:req.ip,userAgent:req.get('user-agent')});
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
  logAudit({acao:'reprovar',entidade:'movimentacao',entidadeId:+req.params.id,usuarioId:+aprovador_id,usuarioNome:user.nome,perfil:'master',detalhes:{tipo:mov.tipo,motivo},ip:req.ip,userAgent:req.get('user-agent')});
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
