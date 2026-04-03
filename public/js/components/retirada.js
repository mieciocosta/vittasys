async function renderRetirada(){
  let etapa='scan',query='',resultados=[],unidadeSel=null,clienteSel=null,clientePlanos=null,aplicadorSel=null;
  let buscaCliente='',clientesResult=[];
  const perfilFilter=AppState.filtroClientePerfil();
  let tipoCliente=perfilFilter||'ativo';
  let tipoAtendimento='normal',localAplicacao='',flash=false;
  let cachedVacs=null,cachedRecentes=null;
  const wrap=h('div',{className:'fade-in'});

  async function draw(){
    wrap.innerHTML='';
    wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'Retirada da Câmara'),h('p',{className:'page-subtitle'},'Bipe o código de barras ou busque por lote/vacina'))));

    // ═══ SCANNER ═══
    const sc=h('div',{className:`scanner-card ${flash?'flash':''}`});
    const ib=h('div',{className:`scanner-icon ${etapa==='scan'?'on':'off'}`,innerHTML:I.barcode});
    if(etapa==='scan')ib.appendChild(h('div',{className:'scanner-laser'}));
    sc.appendChild(h('div',{className:'scanner-top'},ib,h('div',null,
      h('div',{className:'scanner-title'},etapa==='scan'?'Aguardando Leitura':'Vacina Selecionada ✓'),
      h('div',{className:'scanner-desc'},etapa==='scan'?'Bipe ou busque por lote/vacina':unidadeSel?`${unidadeSel.vacina_nome} — Lote ${unidadeSel.numero_lote}`:'-'))));

    const iw=h('div',{className:'scanner-input-wrap'});
    iw.appendChild(h('div',{className:'scanner-input-icon',innerHTML:I.search}));
    const inp=h('input',{className:'scanner-input',placeholder:'Código de barras, lote ou nome...',value:query,id:'scanner-main-input'});
    if(etapa!=='scan')inp.disabled=true;
    inp.addEventListener('input',debounce(async e=>{query=e.target.value;if(query.length<2){resultados=[];drawAC(iw);return}
      resultados=await Api.buscarUnidades(query)||[];if(resultados.length===1&&resultados[0].codigo_barras===query){selUnit(resultados[0]);return}drawAC(iw)},200));
    inp.addEventListener('keydown',async e=>{if(e.key==='Enter'&&query.length>=3){resultados=await Api.buscarUnidades(query)||[];if(resultados.length===1)selUnit(resultados[0]);else drawAC(iw)}});
    iw.appendChild(inp);sc.appendChild(iw);

    if(etapa==='scan'){if(!cachedVacs)cachedVacs=await Api.vacinas()||[];
      if(cachedVacs.length>0){const qc=h('div');qc.appendChild(h('div',{style:{fontSize:'11px',color:'#94a3b8',marginTop:'14px',marginBottom:'6px',fontWeight:'500'}},'BUSCA RÁPIDA:'));
        const chips=h('div',{className:'quick-chips'});cachedVacs.slice(0,10).forEach(v=>{chips.appendChild(h('button',{className:'quick-chip',onClick:async()=>{query=v.nome;resultados=await Api.buscarUnidades(v.nome)||[];if(resultados.length===1)selUnit(resultados[0]);else{drawAC(iw)}}},v.nome.slice(0,16)))});qc.appendChild(chips);sc.appendChild(qc)}}

    if(etapa!=='scan'){sc.appendChild(iconBtn('btn btn-red btn-sm',I.x,'Cancelar e Recomeçar',resetar,{style:{marginTop:'12px'}}))}
    wrap.appendChild(sc);

    // CRITICAL: Always focus scanner input when on scan step
    if(etapa==='scan'){requestAnimationFrame(()=>{const el=document.getElementById('scanner-main-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}})}
    if(resultados.length>0&&etapa==='scan')drawAC(iw);

    // ═══ VACCINE DETAIL ═══
    if(unidadeSel){const st=statusVenc(unidadeSel.dias_para_vencer);
      const ic=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
      ic.appendChild(h('div',{className:'label',style:{marginBottom:'14px'}},'VACINA IDENTIFICADA'));
      const ig=h('div',{className:'vac-detail-grid'});
      [['Vacina',unidadeSel.vacina_nome],['Lote',unidadeSel.numero_lote,'mono'],['Cód. Barras',unidadeSel.codigo_barras,'mono'],['Validade',`${fmtData(unidadeSel.validade)} (${st.label})`],['Estoque Lote',`${unidadeSel.quantidade_disponivel} doses`]].forEach(([l,v,cls])=>{
        const d=h('div',{className:'vac-detail-item'});d.appendChild(h('label',null,l));d.appendChild(h('span',{className:cls||''},v));ig.appendChild(d)});
      ic.appendChild(ig);wrap.appendChild(ic)}

    // ═══ CLIENT SELECTION ═══
    if(etapa==='cliente'){
      const cc=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
      cc.appendChild(iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar ao scanner',()=>{etapa='scan';draw()}));
      cc.appendChild(h('div',{className:'label',style:{margin:'12px 0'}},'PARA QUEM?'));
      if(!perfilFilter){cc.appendChild(h('div',{style:{marginBottom:'12px'}},buildFilterChips([['ativo','⭐ Ativo'],['espontaneo','Espontâneo']],tipoCliente,async v=>{tipoCliente=v;buscaCliente='';clientesResult=(await Api.clientes({tipo_cliente:tipoCliente,limit:15}))?.data||[];drawCL(cc)})))}
      const si=h('input',{className:'input',placeholder:'Nome, CPF ou código...',value:buscaCliente});
      si.addEventListener('input',debounce(async e=>{buscaCliente=e.target.value;clientesResult=buscaCliente.length>=2?(await Api.buscarClientes(buscaCliente)||[]):(await Api.clientes({tipo_cliente:tipoCliente,limit:15}))?.data||[];drawCL(cc)},250));
      cc.appendChild(si);if(!clientesResult.length)clientesResult=(await Api.clientes({tipo_cliente:tipoCliente,limit:15}))?.data||[];
      cc.appendChild(h('div',{id:'cl-list',style:{maxHeight:'250px',overflow:'auto',marginTop:'12px'}}));wrap.appendChild(cc);drawCL(cc);setTimeout(()=>si.focus(),60)}

    // ═══ CLIENT PLAN INFO ═══
    if(clienteSel&&clientePlanos&&etapa==='aplicador'){
      const ap=(clientePlanos||[]).filter(p=>p.status_contrato==='ativo');
      if(ap.length>0){const pc=h('div',{className:'card',style:{marginBottom:'20px',borderLeft:'4px solid var(--primary)'}});
        pc.appendChild(h('div',{className:'label',style:{marginBottom:'8px'}},`PLANO VACINAL DE ${clienteSel.nome.toUpperCase()}`));
        ap.forEach(p=>{const prog=p.doses_total>0?Math.round((p.doses_aplicadas||0)/p.doses_total*100):0;
          const row=h('div',{style:{marginBottom:'8px'}});
          row.innerHTML=`<div style="font-weight:600;margin-bottom:4px">${esc(p.nome_plano)} <span class="badge badge-green">${p.status_contrato}</span></div><div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="flex:1"><div class="prog-fill" style="width:${prog}%;background:var(--primary)"></div></div><span class="mono text-sm">${p.doses_aplicadas||0}/${p.doses_total||0} (${prog}%)</span></div><div class="text-sm text-muted" style="margin-top:4px">Valor: ${fmtMoeda(p.valor_final)} · Pago: ${fmtMoeda(p.total_pago)} · Saldo: ${fmtMoeda(p.saldo_pendente)}</div>`;
          pc.appendChild(row)});wrap.appendChild(pc)}}

    // ═══ APPLICATOR + LOCAL ═══
    if(etapa==='aplicador'){
      const ac=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
      ac.appendChild(iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar',()=>{etapa='cliente';draw()}));
      ac.appendChild(h('div',{className:'label',style:{margin:'12px 0'}},'APLICADOR'));
      const usrs=await Api.usuarios()||[];const ag=h('div',{className:'applicator-grid'});
      usrs.forEach(u=>{ag.appendChild(h('button',{className:'applicator-card',onClick:()=>{aplicadorSel=u;checkGoConfirm()}},h('div',{style:{fontWeight:'600',fontSize:'13px'}},u.nome),h('div',{style:{fontSize:'12px',color:'#94a3b8'}},u.cargo)))});ac.appendChild(ag);
      ac.appendChild(iconBtn('btn btn-outline btn-block',null,'Sem aplicação imediata',()=>{aplicadorSel=null;checkGoConfirm()},{style:{marginTop:'10px'}}));
      ac.appendChild(h('div',{style:{marginTop:'14px'}},h('div',{className:'label',style:{color:'var(--red)'}},'LOCAL DE APLICAÇÃO * (obrigatório)'),buildSelect([['','— Selecione —'],['Deltóide D','Deltóide D'],['Deltóide E','Deltóide E'],['VL Coxa D','VL Coxa D'],['VL Coxa E','VL Coxa E'],['Glúteo D','Glúteo D'],['Glúteo E','Glúteo E'],['Oral','Oral']],localAplicacao,v=>{localAplicacao=v})));
      wrap.appendChild(ac)}

    // ═══ CONFIRM ═══
    if(etapa==='confirmar'){
      const cf=h('div',{className:'confirm-banner slide-up'});
      cf.appendChild(iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar',()=>{etapa='aplicador';draw()}));
      cf.appendChild(h('h2',{style:{textAlign:'center',fontSize:'17px',fontWeight:'700',margin:'12px 0'}},'Confirmar Retirada'));
      const grid=h('div',{className:'confirm-grid'});
      grid.innerHTML=`<div><div class="cg-label">VACINA</div><div class="cg-value">${esc(unidadeSel.vacina_nome)}</div><div class="cg-sub">Lote: ${esc(unidadeSel.numero_lote)} · CB: ${esc(unidadeSel.codigo_barras.slice(-10))}</div></div><div><div class="cg-label">PACIENTE</div><div class="cg-value">${esc(clienteSel.nome)}</div><div class="cg-sub">${tipoClienteBadge(tipoCliente)}</div></div><div><div class="cg-label">OPERADOR</div><div class="cg-value">${esc(AppState.usuario.nome)}</div></div><div><div class="cg-label">APLICADOR / LOCAL</div><div class="cg-value">${aplicadorSel?esc(aplicadorSel.nome):'Sem aplicação'}</div><div class="cg-sub">${esc(localAplicacao)}</div></div>`;
      cf.appendChild(grid);
      const acts=h('div',{style:{display:'flex',gap:'12px',marginTop:'12px'}});
      acts.appendChild(iconBtn('btn btn-outline btn-lg',I.x,'Cancelar',resetar,{style:{flex:'1'}}));
      acts.appendChild(iconBtn('btn btn-primary btn-lg',I.check,'Confirmar Retirada',confirmar,{style:{flex:'2'}}));
      cf.appendChild(acts);wrap.appendChild(cf)}

    // ═══ STEPPER ═══
    const steps=['scan','cliente','aplicador','confirmar'],lbls=['Bipe','Paciente','Aplicador','Confirmar'],at=steps.indexOf(etapa);
    const stp=h('div',{className:'stepper'});lbls.forEach((l,i)=>{const on=i<=at;stp.appendChild(h('div',{className:`step-dot ${on?'on':'off'}`},i<at?h('span',{innerHTML:I.check}):String(i+1)));stp.appendChild(h('span',{className:`step-name ${on?'on':'off'}`},l));if(i<3)stp.appendChild(h('div',{className:`step-line ${on?'on':'off'}`}))});wrap.appendChild(stp);

    // ═══ RECENT BIPS ═══
    if(etapa==='scan'){if(!cachedRecentes)cachedRecentes=await Api.retirasRecentes()||[];
      if(cachedRecentes.length>0){const rb=h('div',{style:{marginTop:'20px'}});rb.appendChild(h('div',{className:'label',style:{marginBottom:'8px'}},`ÚLTIMAS RETIRADAS (${cachedRecentes.length})`));
        cachedRecentes.slice(0,8).forEach(r2=>{const it=h('div',{className:'recent-bip-item success'});it.innerHTML=`<div style="flex:1"><span class="fw-600">${esc(r2.vacina_nome||'-')}</span> → ${esc(r2.cliente_nome||'-')}<div class="text-sm text-muted">Lote: ${esc(r2.lote||'-')} · CB: ${esc((r2.codigo_barras||'').slice(-8))}</div></div><div class="bip-time">${fmtDataHora(r2.data_hora)}</div>`;rb.appendChild(it)});wrap.appendChild(rb)}}

    // RE-FOCUS after full render (critical for continuous scanning)
    if(etapa==='scan'){setTimeout(()=>{const el=document.getElementById('scanner-main-input');if(el)el.focus()},150)}
  }

  function drawAC(par){const old=par.querySelector('.autocomplete-list');if(old)old.remove();if(!resultados.length)return;
    const list=h('div',{className:'autocomplete-list'});const gr={};
    resultados.forEach(r2=>{const k=r2.numero_lote;if(!gr[k])gr[k]={...r2,count:0};gr[k].count++});
    Object.values(gr).forEach(g=>{const it=h('div',{className:'autocomplete-item',onClick:()=>{selUnit(resultados.find(r2=>r2.numero_lote===g.numero_lote))}});
      const st=statusVenc(g.dias_para_vencer);const qtd=g.quantidade_disponivel||g.count;
      it.innerHTML=`<div style="flex:1"><div style="font-weight:600">${esc(g.vacina_nome)}</div><div style="font-size:12px;color:#64748b">Lote: ${esc(g.numero_lote)} · <strong>${qtd} doses</strong></div></div><div style="text-align:right"><span class="badge ${st.cls}">${st.label}</span><div style="font-size:11px;color:#94a3b8;margin-top:2px">${fmtData(g.validade)}</div></div>`;
      list.appendChild(it)});par.appendChild(list)}

  function drawCL(card){const ld=card.querySelector('#cl-list');if(!ld)return;ld.innerHTML='';
    const fl=clientesResult.filter(c=>!perfilFilter||(c.tipo_cliente===perfilFilter));
    if(!fl.length){ld.innerHTML='<div class="empty-state" style="padding:20px">Busque por nome, CPF ou código</div>';return}
    fl.forEach(c=>{const it=h('div',{className:'client-pick-item',onClick:async()=>{clienteSel=c;if(c.tipo_cliente==='ativo'){const cd=await Api.cliente(c.id);clientePlanos=cd?.planos||[]}else clientePlanos=[];etapa='aplicador';draw()}});
      it.innerHTML=`<div style="width:36px;height:36px;border-radius:50%;background:${c.tipo_cliente==='ativo'?'var(--primary-bg)':'#f1f5f9'};display:flex;align-items:center;justify-content:center;color:${c.tipo_cliente==='ativo'?'var(--primary)':'#64748b'};flex-shrink:0;font-size:12px;font-weight:700">${c.nome.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><div style="flex:1"><div style="font-weight:600;font-size:13px">${esc(c.nome)}${c.codigo_cliente?' <span class="mono text-muted">['+esc(c.codigo_cliente)+']</span>':''}</div><div style="font-size:12px;color:#94a3b8">${tipoPacienteBadge(c.tipo_paciente)} ${tipoClienteBadge(c.tipo_cliente)}</div></div>`;
      ld.appendChild(it)})}

  function selUnit(u){unidadeSel=u;flash=true;etapa='cliente';clientesResult=[];buscaCliente='';draw();setTimeout(()=>{flash=false},600)}

  // CRITICAL: resetar must clear ALL state and re-focus scanner
  function resetar(){
    etapa='scan';query='';resultados=[];unidadeSel=null;clienteSel=null;clientePlanos=null;
    aplicadorSel=null;buscaCliente='';clientesResult=[];localAplicacao='';
    cachedRecentes=null;cachedVacs=null; // Force reload
    draw(); // draw() will refocus scanner input via requestAnimationFrame
  }

  function checkGoConfirm(){if(!localAplicacao){Toast.show('Selecione o local de aplicação','error');return}etapa='confirmar';draw()}

  async function confirmar(){
    if(!unidadeSel||!clienteSel)return;
    if(!localAplicacao){Toast.show('Local obrigatório','error');return}
    const r2=await Api.retirada({unidade_id:unidadeSel.id,cliente_id:clienteSel.id,usuario_id:AppState.usuario.id,aplicador_id:aplicadorSel?.id,tipo_cliente:tipoCliente,tipo_atendimento:tipoAtendimento,local_aplicacao:localAplicacao});
    if(r2?.success){
      let msg=r2.message;
      if(r2.estoque)msg+=` | Estoque: ${r2.estoque.antes}→${r2.estoque.depois}`;
      Toast.show(msg);
      if(r2.alerta_duplicata)setTimeout(()=>Toast.show(r2.alerta_duplicata,'info'),1500);
      // CRITICAL: reset and immediately ready for next scan
      resetar();
    }else{Toast.show(r2?.error||'Erro na retirada','error')}
  }

  await draw();return wrap;
}
