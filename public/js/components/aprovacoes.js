async function renderAprovacoes(){
  const wrap=h('div',{className:'fade-in'});

  async function draw(){
    wrap.innerHTML='';
    wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'Aprovações'),
      h('p',{className:'page-subtitle'},'Movimentações sensíveis pendentes de aprovação master'))));

    const data=await Api.movimentacoesPendentes()||[];

    if(!data.length){
      wrap.appendChild(h('div',{className:'empty-state',style:{padding:'60px 20px',textAlign:'center'}},
        h('div',{style:{fontSize:'48px',marginBottom:'16px'}},'✅'),
        h('div',{style:{fontSize:'18px',fontWeight:'700',color:'var(--text-2)'}},'Nenhuma aprovação pendente'),
        h('div',{style:{fontSize:'13px',color:'var(--text-3)',marginTop:'8px'}},'Todas as movimentações sensíveis estão resolvidas')));
      return;
    }

    // Stats
    const stats=h('div',{style:{display:'flex',gap:'12px',marginBottom:'20px'}});
    const byType={};data.forEach(m=>{byType[m.tipo]=(byType[m.tipo]||0)+1});
    Object.entries(byType).forEach(([t,c])=>{
      const colors={descarte:'#dc2626',ajuste:'#d97706',estorno:'#7c3aed',retirada:'#f97316'};
      stats.appendChild(h('div',{style:{padding:'12px 20px',background:colors[t]+'15',borderRadius:'10px',borderLeft:`4px solid ${colors[t]||'var(--primary)'}`,flex:'1'}},
        h('div',{style:{fontSize:'24px',fontWeight:'800',color:colors[t]||'var(--primary)'}},String(c)),
        h('div',{style:{fontSize:'12px',fontWeight:'600',textTransform:'uppercase',color:colors[t]||'var(--text-3)'}},t)));
    });
    wrap.appendChild(stats);

    // List
    data.forEach(m=>{
      const tm={descarte:['Descarte','#dc2626'],ajuste:['Ajuste','#d97706'],estorno:['Estorno','#7c3aed'],retirada:['Retirada (Fora do Plano)','#f97316']};
      const[tl,tc]=tm[m.tipo]||[m.tipo,'#64748b'];

      const card=h('div',{style:{background:'var(--card-bg)',borderRadius:'12px',padding:'20px',marginBottom:'12px',border:'1px solid var(--border)',borderLeft:`4px solid ${tc}`}});

      // Header
      const hdr=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}});
      hdr.appendChild(h('div',null,
        h('div',{style:{display:'flex',alignItems:'center',gap:'8px'}},
          h('span',{className:'mono text-muted',style:'font-size:16px;font-weight:700'},`#${m.id}`),
          h('span',{style:{padding:'4px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:'700',color:'white',background:tc}},tl.toUpperCase()),
          h('span',{className:'badge badge-orange'},'Pendente')),
        h('div',{style:{fontSize:'12px',color:'var(--text-3)',marginTop:'4px'}},`Solicitado por: ${esc(m.solicitante_nome||'-')} (${esc(m.solicitante_cargo||'-')}) — ${fmtDataHora(m.data_hora)}`)
      ));
      card.appendChild(hdr);

      // Details grid
      const grid=h('div',{style:'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px'});
      const field=(l,v)=>{const d=h('div');d.appendChild(h('div',{style:'font-size:10px;color:var(--text-4);text-transform:uppercase;font-weight:600'},l));d.appendChild(h('div',{style:'font-size:13px;font-weight:500;margin-top:2px'},v||'-'));return d};
      grid.appendChild(field('Vacina',m.nome_vacina));
      grid.appendChild(field('Lote',m.numero_lote));
      grid.appendChild(field('Cód. Barras',m.codigo_barras));
      grid.appendChild(field('Quantidade',String(m.quantidade)));
      grid.appendChild(field('Paciente',m.cliente_nome+(m.responsavel_nome?` (Resp: ${m.responsavel_nome})`:'')));
      grid.appendChild(field('Local',m.local_aplicacao));
      card.appendChild(grid);

      // Justification
      if(m.motivo_padrao||m.justificativa){
        const jBox=h('div',{style:{padding:'10px',background:'#fffbeb',borderRadius:'8px',marginBottom:'16px',fontSize:'13px'}});
        if(m.motivo_padrao)jBox.appendChild(h('div',null,h('span',{style:'font-weight:600'},'Motivo: '),esc(m.motivo_padrao.replace(/_/g,' '))));
        if(m.justificativa)jBox.appendChild(h('div',{style:{marginTop:'4px'}},h('span',{style:'font-weight:600'},'Justificativa: '),esc(m.justificativa)));
        card.appendChild(jBox);
      }

      // Actions
      const acts=h('div',{style:{display:'flex',gap:'10px'}});
      acts.appendChild(iconBtn('btn btn-primary btn-lg',I.check,'✓ Aprovar',()=>modalAprovar(m),{style:{flex:'1'}}));
      acts.appendChild(iconBtn('btn btn-red btn-lg',I.x,'✗ Reprovar',()=>modalReprovar(m),{style:{flex:'1'}}));
      card.appendChild(acts);

      wrap.appendChild(card);
    });
  }

  function modalAprovar(m){showModal(`Aprovar ${m.tipo} #${m.id}`,async(body,close)=>{
    body.appendChild(h('div',{style:{padding:'12px',background:'var(--primary-bg)',borderRadius:'8px',marginBottom:'16px'}},
      h('div',{style:'font-weight:600;color:var(--primary)'},`${m.nome_vacina} — Lote: ${m.numero_lote}`),
      h('div',{style:'font-size:12px;color:var(--text-3);margin-top:4px'},`Quantidade: ${m.quantidade} · Tipo: ${m.tipo}`)));
    const obs=h('textarea',{className:'input',placeholder:'Observações da aprovação (opcional)',rows:'3',style:'resize:vertical'});
    body.appendChild(h('label',{className:'label'},'Observações'));body.appendChild(obs);
    body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',I.check,'Confirmar Aprovação',async()=>{
      let fotoBlob=null,geoData={geo_status:'nao_capturado'};
      try{
        if(typeof captureAuditPhoto==='function')fotoBlob=await captureAuditPhoto(`APROVAR ${m.tipo.toUpperCase()} — ${m.nome_vacina||''}`);
        if(typeof captureGeoForAudit==='function')geoData=await captureGeoForAudit();
      }catch(ev){}
      if(!fotoBlob){Toast.show('⚠ Foto obrigatória para aprovação','error');return}
      const r=await Api.aprovarMovimentacao(m.id,{aprovador_id:AppState.usuario.id,observacoes:obs.value});
      if(r?.success){
        try{sendAuditWithPhoto({acao:'aprovar',entidade:'movimentacao',entidadeId:m.id,
          usuarioId:AppState.usuario?.id,usuarioNome:AppState.usuario?.nome,perfil:'master',
          detalhes:JSON.stringify({tipo:m.tipo,vacina:m.nome_vacina,decisao:'aprovado',...geoData})},fotoBlob)}catch(ae){}
        Toast.show(r.message);close();draw()
      }else Toast.show(r?.error||'Erro','error')
    },{style:{marginTop:'16px'}}));
  },'480px')}

  function modalReprovar(m){showModal(`Reprovar ${m.tipo} #${m.id}`,async(body,close)=>{
    body.appendChild(h('div',{style:{padding:'12px',background:'#fef2f2',borderRadius:'8px',marginBottom:'16px',border:'1px solid #fca5a5'}},
      h('div',{style:'font-weight:600;color:#dc2626'},`${m.nome_vacina} — Lote: ${m.numero_lote}`),
      h('div',{style:'font-size:12px;color:#dc2626;margin-top:4px'},`⚠ Estoque NÃO será alterado`)));
    const motivo=h('textarea',{className:'input',placeholder:'Motivo da reprovação (obrigatório)',rows:'3',style:'resize:vertical'});
    body.appendChild(h('label',{className:'label',style:'color:#dc2626'},'Motivo *'));body.appendChild(motivo);
    body.appendChild(iconBtn('btn btn-red btn-block btn-lg',I.x,'Confirmar Reprovação',async()=>{
      if(!motivo.value.trim())return Toast.show('Motivo obrigatório','error');
      // ═══ EVIDENCE: geo for rejection ═══
      let geoData={geo_status:'nao_capturado'};
      try{if(typeof captureGeoForAudit==='function')geoData=await captureGeoForAudit()}catch(ev){}
      const r=await Api.reprovarMovimentacao(m.id,{aprovador_id:AppState.usuario.id,motivo:motivo.value.trim()});
      if(r?.success){
        try{Api.auditoriaLog({acao:'reprovar',entidade:'movimentacao',entidadeId:m.id,
          usuarioId:AppState.usuario?.id,usuarioNome:AppState.usuario?.nome,perfil:'master',
          detalhes:JSON.stringify({tipo:m.tipo,motivo:motivo.value.trim(),...geoData})})}catch(ae){}
        Toast.show(r.message);close();draw()
      }else Toast.show(r?.error||'Erro','error')
    },{style:{marginTop:'16px'}}));
  },'480px')}

  await draw();return wrap;
}
