const{Router}=require('express');const r=Router();const prisma=require('../config/database');

// Normalize accents for fuzzy matching
function norm(s){return(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/vacina\s*/gi,'').replace(/\s+/g,' ').trim()}


r.get('/busca',async(req,res,next)=>{try{
  const{q}=req.query;if(!q||q.length<2)return res.json([]);
  const now=new Date();const qt=q.trim();
  // LAYER 1: Exact barcode
  let results=await prisma.unidade.findMany({where:{codigoBarras:qt,status:'disponivel'},include:{lote:{include:{vacina:true}}},take:10});
  // LAYER 2: Barcode contains
  if(!results.length)results=await prisma.unidade.findMany({where:{status:'disponivel',codigoBarras:{contains:qt,mode:'insensitive'}},include:{lote:{include:{vacina:true}}},take:10});
  // LAYER 3: Lot/vaccine search
  if(!results.length)results=await prisma.unidade.findMany({where:{status:'disponivel',OR:[{lote:{numeroLote:{contains:qt,mode:'insensitive'}}},{lote:{vacina:{nome:{contains:qt,mode:'insensitive'}}}},{lote:{vacina:{codigo:{contains:qt,mode:'insensitive'}}}}]},include:{lote:{include:{vacina:true}}},take:30,orderBy:{lote:{validade:'asc'}}});
  res.json(results.map(u=>{const l=u.lote;const v=l.vacina;return{id:u.id,lote_id:l.id,vacina_id:v.id,codigo_barras:u.codigoBarras,status:u.status,numero_lote:l.numeroLote,validade:l.validade,quantidade_disponivel:l.quantidadeDisponivel,local_armazenamento:l.localArmazenamento,fabricante:l.fabricante,vacina_nome:v.nome,vacina_codigo:v.codigo,via_administracao:v.viaAdministracao,dias_para_vencer:Math.ceil((l.validade-now)/864e5)}}));
}catch(e){next(e)}});

r.put('/barcode/:id',async(req,res,next)=>{try{
  const{codigo_barras}=req.body;if(!codigo_barras)return res.status(400).json({error:'Código obrigatório'});
  await prisma.unidade.update({where:{id:+req.params.id},data:{codigoBarras:codigo_barras.trim()}});
  res.json({success:true});
}catch(e){next(e)}});

// ═══ RETIRADA COM VALIDAÇÃO DE LIMITE DE DOSES ═══
r.post('/retirada',async(req,res,next)=>{try{
  const{unidade_id,cliente_id,usuario_id,aplicador_id,tipo_cliente,tipo_atendimento,local_aplicacao,observacoes,justificativa_fora_plano,plano_contratado_id}=req.body;
  if(!unidade_id||!cliente_id||!usuario_id)return res.status(400).json({error:'Campos obrigatórios faltando'});
  if(!local_aplicacao)return res.status(400).json({error:'Local de aplicação obrigatório'});

  const result=await prisma.$transaction(async tx=>{
    const un=await tx.unidade.findUnique({where:{id:+unidade_id},include:{lote:{include:{vacina:true}}}});
    if(!un)throw Object.assign(new Error('Unidade não encontrada'),{status:404});
    if(un.status!=='disponivel')throw Object.assign(new Error(`Unidade já ${un.status}`),{status:400});
    const l=un.lote;const v=l.vacina;

    // ═══ VINCULAR MOVIMENTAÇÃO AO PLANO CONTRATADO ═══
    const clienteDB=await tx.cliente.findUnique({where:{id:+cliente_id},select:{tipoCliente:true}});
    const isAtivo=clienteDB?.tipoCliente==='ativo'||tipo_cliente==='ativo';
    let doseVinculada=null;
    let planoSelecionadoId=plano_contratado_id?+plano_contratado_id:null;
    if(isAtivo){
      const planosAtivos=await tx.planoContratado.findMany({
        where:{clienteId:+cliente_id,statusContrato:'ativo',
          ...(planoSelecionadoId?{id:planoSelecionadoId}:{})},
        include:{doses:{include:{vacina:{select:{id:true,nome:true,codigo:true}}},orderBy:[{mesPrevisto:'asc'},{doseNumero:'asc'}]}}
      });

      // If multiple plans and none selected, require selection
      if(!planoSelecionadoId&&planosAtivos.length>1){
        throw Object.assign(new Error('Cliente possui múltiplos planos ativos. Selecione o plano antes de continuar.'),
          {status:400,code:'SELECIONAR_PLANO',planos:planosAtivos.map(p=>({id:p.id,nome:p.nomePlano,doses_total:p.doses.length,doses_aplicadas:p.doses.filter(d=>d.status==='aplicada').length}))});
      }
      if(planosAtivos.length===1)planoSelecionadoId=planosAtivos[0].id;

      // Get plan start date for month calculation
      for(const plano of planosAtivos){
        // Find compatible doses — STRICT matching by vacinaId ONLY
        // Fuzzy name matching removed: caused false positives (Hepatite A ≠ Hepatite B)
        const dosesCompativeis=plano.doses.filter(d=>{
          if(d.status!=='pendente')return false;
          return d.vacinaId===v.id;
        });

        if(dosesCompativeis.length===0)continue;

        // Check dose limit — STRICT by vacinaId
        const allCompat=plano.doses.filter(d=>d.vacinaId===v.id);
        const aplicadas=allCompat.filter(d=>d.status==='aplicada').length;
        if(aplicadas>=allCompat.length){
          // All doses applied — skip plan matching, allow retirada as "extra/fora do plano"
          continue;
        }

        // ═══ SELECT CORRECT DOSE BY COMPETÊNCIA ═══
        // Sort pending by mesPrevisto ASC (first due = first served)
        const pendentes=dosesCompativeis.sort((a,b)=>(a.mesPrevisto||0)-(b.mesPrevisto||0));
        const proxDose=pendentes[0]; // First pending in sequence

        if(proxDose){
          // Check if within acceptable window (±1 month tolerance)
          const now=new Date();
          const inicioPlano=plano.dataInicioPlano||plano.criadoEm||plano.dataVenda;
          let isException=false;let tipoExcecao=null;

          if(inicioPlano&&proxDose.mesPrevisto!=null){
            const dataEsperada=new Date(inicioPlano);
            dataEsperada.setMonth(dataEsperada.getMonth()+proxDose.mesPrevisto);
            const diffMs=now.getTime()-dataEsperada.getTime();
            const diffDays=Math.round(diffMs/(1000*60*60*24));

            if(diffDays<-45){isException=true;tipoExcecao='antecipacao'} // >45 days early
            else if(diffDays>60){isException=true;tipoExcecao='atraso'} // >60 days late
          }

          // Check if user is master
          const userCheck=await tx.usuario.findUnique({where:{id:+usuario_id},select:{perfil:true}});
          const isMaster=userCheck?.perfil==='master';

          if(isException&&!isMaster){
            // Don't mark as applied yet — just flag for review but still allow withdrawal
            // The stock withdrawal happens, but the dose gets a special status
            doseVinculada=proxDose;
            await tx.planoContratadoDose.update({
              where:{id:proxDose.id},
              data:{status:'aplicada',dataAplicacao:new Date(),localAplicacao:local_aplicacao,tipoExcecao}
            });
          }else{
            doseVinculada=proxDose;
            await tx.planoContratadoDose.update({
              where:{id:proxDose.id},
              data:{status:'aplicada',dataAplicacao:new Date(),localAplicacao:local_aplicacao,tipoExcecao:isException?tipoExcecao:null}
            });
          }
        }
        break; // Only match first active plan
      }

      // ═══ VACINA FORA DO PLANO — SEMPRE REQUER APROVAÇÃO ═══
      if(!doseVinculada&&planosAtivos.length>0){
        // Collect plan vaccine names for error message
        const vacinasPlano=[];
        planosAtivos.forEach(p=>p.doses.forEach(d=>{if(d.vacina?.nome&&!vacinasPlano.includes(d.vacina.nome))vacinasPlano.push(d.vacina.nome)}));

        if(justificativa_fora_plano){
          // Create pending movement — NO stock impact, NO plan impact
          // Even master must go through approval trail for fora-do-plano
          const mov=await tx.movimentacao.create({data:{
            tipo:'retirada',unidadeId:+unidade_id,loteId:l.id,vacinaId:v.id,
            clienteId:+cliente_id,usuarioId:+usuario_id,
            aplicadoPor:aplicador_id?+aplicador_id:null,
            tipoCliente:tipo_cliente||'ativo',tipoAtendimento:tipo_atendimento||'normal',
            localAplicacao:local_aplicacao,quantidade:1,
            codigoBarras:un.codigoBarras,numeroLote:l.numeroLote,nomeVacina:v.nome,
            status:'pendente_aprovacao',
            observacoes:`[FORA DO PLANO] ${justificativa_fora_plano}`,
            requerAprovacao:true,justificativa:justificativa_fora_plano,
            motivoPadrao:'vacina_fora_plano',impactaEstoque:false,
            planoContratadoId:planoSelecionadoId||null,
          }});
          return{movId:mov.id,vacNome:v.nome,cliNome:(await tx.cliente.findUnique({where:{id:+cliente_id},select:{nome:true}}))?.nome,pendente:true};
        }else{
          throw Object.assign(new Error(
            `Vacina "${v.nome}" não pertence ao plano do cliente. Vacinas do plano: ${vacinasPlano.join(', ')}. Para prosseguir, informe justificativa.`
          ),{status:400,code:'FORA_DO_PLANO',vacinas_plano:vacinasPlano});
        }
      }
    }

    await tx.unidade.update({where:{id:+unidade_id},data:{status:'aplicada'}});
    await tx.lote.update({where:{id:l.id},data:{quantidadeDisponivel:{decrement:1},quantidadeAplicada:{increment:1}}});
    const updLote=await tx.lote.findUnique({where:{id:l.id}});
    if(updLote.quantidadeDisponivel<=0)await tx.lote.update({where:{id:l.id},data:{status:'esgotado'}});

    const mov=await tx.movimentacao.create({data:{tipo:'retirada',unidadeId:+unidade_id,loteId:l.id,vacinaId:v.id,clienteId:+cliente_id,usuarioId:+usuario_id,aplicadoPor:aplicador_id?+aplicador_id:null,tipoCliente:tipo_cliente||'espontaneo',tipoAtendimento:tipo_atendimento||'normal',localAplicacao:local_aplicacao,quantidade:1,codigoBarras:un.codigoBarras,numeroLote:l.numeroLote,nomeVacina:v.nome,status:'concluido',observacoes:observacoes||null,planoContratadoId:planoSelecionadoId||null}});
    // Link dose to movimentacao for traceability
    if(doseVinculada){await tx.planoContratadoDose.update({where:{id:doseVinculada.id},data:{movimentacaoId:mov.id}})}
    const cli=await tx.cliente.findUnique({where:{id:+cliente_id},select:{nome:true}});
    await tx.retiradaRecente.create({data:{unidadeId:+unidade_id,vacinaNome:v.nome,lote:l.numeroLote,codigoBarras:un.codigoBarras,clienteNome:cli?.nome,usuarioNome:''}});
    return{movId:mov.id,vacNome:v.nome,cliNome:cli?.nome,antes:l.quantidadeDisponivel,depois:updLote.quantidadeDisponivel};
  });
  if(result.pendente){
    res.json({success:true,movimentacao_id:result.movId,message:`⏳ ${result.vacNome} fora do plano → enviada para aprovação do master`,pendente_aprovacao:true});
  }else{
    res.json({success:true,movimentacao_id:result.movId,message:`✓ ${result.vacNome} → ${result.cliNome}`,estoque:{antes:result.antes,depois:result.depois}});
  }
  // Audit log
  try{const{logAudit,getRealIP}=require('./auditoria');logAudit({acao:'retirada',entidade:'movimentacao',entidadeId:result.movId,usuarioId:+usuario_id,detalhes:{vacina:result.vacNome,cliente:result.cliNome,estoque_antes:result.antes,estoque_depois:result.depois},ip:getRealIP(req),userAgent:req.get('user-agent')})}catch(e){}
}catch(e){if(e.status)return res.status(e.status).json({error:e.message,code:e.code||null,planos:e.planos||null});next(e)}});

r.get('/recentes',async(req,res,next)=>{try{
  const r2=await prisma.retiradaRecente.findMany({orderBy:{dataHora:'desc'},take:15});
  res.json(r2.map(x=>({...x,vacina_nome:x.vacinaNome,codigo_barras:x.codigoBarras,cliente_nome:x.clienteNome,usuario_nome:x.usuarioNome,data_hora:x.dataHora})));
}catch(e){next(e)}});

r.get('/lote/:loteId',async(req,res,next)=>{try{
  res.json(await prisma.unidade.findMany({where:{loteId:+req.params.loteId},orderBy:{id:'asc'},select:{id:true,codigoBarras:true,status:true}}));
}catch(e){next(e)}});

// ═══ DETAIL: single movement ═══
r.get('/movimentacao/:id',async(req,res,next)=>{try{
  const m=await prisma.movimentacao.findUnique({where:{id:+req.params.id},include:{cliente:{select:{id:true,nome:true,codigoCliente:true,tipoCliente:true}},lote:{select:{id:true,numeroLote:true,fabricante:true}},vacina:{select:{id:true,nome:true,codigo:true}},unidade:{select:{id:true,codigoBarras:true,status:true}}}});
  if(!m)return res.status(404).json({error:'Não encontrada'});
  // Get applicator and operator names
  const[operador,aplicador]=await Promise.all([
    m.usuarioId?prisma.usuario.findUnique({where:{id:m.usuarioId},select:{nome:true,cargo:true}}):null,
    m.aplicadoPor?prisma.usuario.findUnique({where:{id:m.aplicadoPor},select:{nome:true,cargo:true}}):null,
  ]);
  // Get plan info if ativo client
  let planoInfo=null;
  if(m.clienteId&&m.vacinaId){
    const pc=await prisma.planoContratado.findFirst({where:{clienteId:m.clienteId,statusContrato:'ativo',doses:{some:{vacinaId:m.vacinaId}}},select:{id:true,nomePlano:true,doses:{where:{vacinaId:m.vacinaId},select:{doseNumero:true,status:true}}}});
    if(pc)planoInfo={id:pc.id,nome:pc.nomePlano,doses_vacina:pc.doses.length,doses_aplicadas:pc.doses.filter(d=>d.status==='aplicada').length};
  }
  // Get approver name
  let aprovadorInfo=null;
  if(m.aprovadoPor){const apr=await prisma.usuario.findUnique({where:{id:m.aprovadoPor},select:{nome:true,cargo:true}});if(apr)aprovadorInfo=apr}
  res.json({...m,data_hora:m.dataHora,nome_vacina:m.nomeVacina,numero_lote:m.numeroLote,codigo_barras:m.codigoBarras||m.unidade?.codigoBarras,local_aplicacao:m.localAplicacao,tipo_cliente:m.tipoCliente,tipo_atendimento:m.tipoAtendimento,operador_nome:operador?.nome,operador_cargo:operador?.cargo,aplicador_nome:aplicador?.nome,aplicador_cargo:aplicador?.cargo,cliente_nome:m.cliente?.nome,cliente_codigo:m.cliente?.codigoCliente,vacina_codigo:m.vacina?.codigo,lote_fabricante:m.lote?.fabricante,plano:planoInfo,
    requer_aprovacao:m.requerAprovacao,justificativa:m.justificativa,motivo_padrao:m.motivoPadrao,aprovado_em:m.aprovadoEm,motivo_reprovacao:m.motivoReprovacao,aprovador_nome:aprovadorInfo?.nome,aprovador_cargo:aprovadorInfo?.cargo,impacta_estoque:m.impactaEstoque,estoque_aplicado_em:m.estoqueAplicadoEm});
}catch(e){next(e)}});

module.exports=r;
