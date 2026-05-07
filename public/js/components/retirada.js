async function renderRetirada(){
  // ═══ STATE ═══
  let etapa='scan'; // scan | cliente | local | aplicador | confirmar
  let query='';
  let resultados=[];
  let unidadeSel=null;
  let clienteSel=null;
  let clientePlanos=null;
  let planoSel=null; // Selected plan for ativo clients
  let aplicadorSel=null;
  let buscaCliente='';
  let clientesResult=[];
  const perfilFilter=AppState.filtroClientePerfil();
  let tipoCliente=perfilFilter||'ativo';
  let localAplicacao='';
  let buscando=false;     // Prevent concurrent searches
  let confirmando=false;  // Prevent double submit
  let recentPage=0;       // Pagination for recent block
  const RECENT_PER_PAGE=5;
  let recentData=null;
  let recentTotal=0;
  const wrap=h('div',{className:'fade-in'});
  // ═══ FOCUS MANAGEMENT ═══
  function focusScanner(){
    requestAnimationFrame(()=>{
      const el=document.getElementById('scanner-main-input');
      if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}
    });
    // Double-ensure after render
    setTimeout(()=>{const el=document.getElementById('scanner-main-input');if(el&&document.activeElement!==el)el.focus()},200);
  }
  // ═══ INPUT SANITIZATION ═══
  function sanitize(val){
    return val.replace(/[\r\n\t]/g,'').trim();
  }
  // ═══ MAIN DRAW ═══
  async function draw(){
    wrap.innerHTML='';
    wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'Retirada da Câmara'),h('p',{className:'page-subtitle'},'Bipe o código de barras ou busque por lote/vacina'))));
    // ═══ SCANNER CARD ═══
    const sc=h('div',{className:'scanner-card'});
    const ib=h('div',{className:`scanner-icon ${etapa==='scan'?'on':'off'}`,innerHTML:I.barcode});
    if(etapa==='scan')ib.appendChild(h('div',{className:'scanner-laser'}));
    sc.appendChild(h('div',{className:'scanner-top'},ib,h('div',null,
      h('div',{className:'scanner-title'},etapa==='scan'?'Aguardando Leitura':'Vacina Selecionada ✓'),
      h('div',{className:'scanner-desc'},etapa==='scan'?'Bipe ou busque por lote/vacina':
        unidadeSel?`${unidadeSel.vacina_nome} — Lote ${unidadeSel.numero_lote} — ${unidadeSel._doses_total} doses`:'-'))));
    // Input
    const iw=h('div',{className:'scanner-input-wrap'});
    iw.appendChild(h('div',{className:'scanner-input-icon',innerHTML:I.search}));
    const inputAttrs={className:'scanner-input',id:'scanner-main-input',
      placeholder:etapa==='scan'?'Código de barras, lote ou nome da vacina...':'Vacina selecionada',
      value:query,autocomplete:'off',inputMode:'text',spellcheck:'false'};
    if(etapa!=='scan')inputAttrs.disabled=true;
    const inp=h('input',inputAttrs);
    // Status indicator
    const statusEl=h('div',{id:'scan-status'});
    if(etapa==='scan'){
      // Debounced search handler
      let searchTimer=null;
      inp.addEventListener('input',e=>{
        query=sanitize(e.target.value);
        e.target.value=query;
        if(searchTimer)clearTimeout(searchTimer);
        // Clear status
        statusEl.innerHTML='';
        if(query.length<2){resultados=[];drawAC(iw);return}
        // Show searching indicator
        statusEl.innerHTML='<div style="font-size:12px;color:var(--text-3);padding:4px 0">🔍 Buscando...</div>';
        searchTimer=setTimeout(()=>executarBusca(query,iw,statusEl),250);
      });
      // Enter handler
      inp.addEventListener('keydown',e=>{
        if(e.key==='Enter'){
          e.preventDefault();
          if(searchTimer)clearTimeout(searchTimer);
          if(query.length>=2)executarBusca(query,iw,statusEl);
        }
        if(e.key==='Escape'){query='';inp.value='';resultados=[];drawAC(iw);statusEl.innerHTML=''}
      });
      // Paste handler
      inp.addEventListener('paste',e=>{
        setTimeout(()=>{query=sanitize(inp.value);inp.value=query;
          if(query.length>=4)executarBusca(query,iw,statusEl)},50);
      });
    }
    iw.appendChild(inp);sc.appendChild(iw);sc.appendChild(statusEl);
    // Cancel button (all steps except scan)
    if(etapa!=='scan'){
      sc.appendChild(iconBtn('btn btn-red btn-sm',I.x,'Cancelar e Recomeçar',()=>{resetar();focusScanner()},{style:{marginTop:'12px'}}));
    }
    wrap.appendChild(sc);
    // ═══ VACCINE DETAIL CARD ═══
    if(unidadeSel){
      const st=statusVenc(unidadeSel.dias_para_vencer);
      const ic=h('div',{className:'card slide-up',style:{marginBottom:'20px',borderLeft:'4px solid var(--primary)'}});
      ic.appendChild(h('div',{className:'label',style:{marginBottom:'10px'}},'VACINA IDENTIFICADA'));
      const ig=h('div',{className:'vac-detail-grid'});
      [['Vacina',unidadeSel.vacina_nome,'fw-600'],['Lote',unidadeSel.numero_lote,'mono'],
       ['Cód. Barras',unidadeSel.codigo_barras,'mono'],
       ['Validade',`${fmtData(unidadeSel.validade)} (${st.label})`],
       ['Estoque',`${unidadeSel._doses_total} doses disponíveis`,'fw-600']
      ].forEach(([l,v,cls])=>{
        const d=h('div',{className:'vac-detail-item'});d.appendChild(h('label',null,l));
        d.appendChild(h('span',{className:cls||''},v));ig.appendChild(d)});
      ic.appendChild(ig);wrap.appendChild(ic);
    }
    // ═══ STEP 2: PATIENT ═══
    if(etapa==='cliente'){
      const cc=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
      cc.appendChild(iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar',()=>{etapa='scan';draw();focusScanner()}));
      cc.appendChild(h('div',{className:'label',style:{margin:'12px 0'}},'PACIENTE'));
      if(!perfilFilter){cc.appendChild(h('div',{style:{marginBottom:'12px'}},
        buildFilterChips([['ativo','⭐ Ativo'],['espontaneo','Espontâneo']],tipoCliente,async v=>{
          tipoCliente=v;buscaCliente='';
          clientesResult=(await Api.clientes({tipo_cliente:tipoCliente,limit:15}))?.data||[];
          drawCL(cc)})))}
      const si=h('input',{className:'input',placeholder:'Nome, CPF ou código...',value:buscaCliente});
      si.addEventListener('input',debounce(async e=>{
        buscaCliente=e.target.value;
        clientesResult=buscaCliente.length>=2?
          (await Api.buscarClientes(buscaCliente)||[]):
          (await Api.clientes({tipo_cliente:tipoCliente,limit:15}))?.data||[];
        drawCL(cc)},250));
      si.addEventListener('keydown',e=>{if(e.key==='Escape'){etapa='scan';draw();focusScanner()}});
      cc.appendChild(si);
      if(!clientesResult.length)clientesResult=(await Api.clientes({tipo_cliente:tipoCliente,limit:15}))?.data||[];
      cc.appendChild(h('div',{id:'cl-list',style:{maxHeight:'280px',overflow:'auto',marginTop:'12px'}}));
      wrap.appendChild(cc);drawCL(cc);setTimeout(()=>si.focus(),60);
    }
    // ═══ STEP 3: LOCAL ═══
    if(etapa==='local'){
      const lc=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
      lc.appendChild(iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar',()=>{etapa='cliente';draw()}));
      lc.appendChild(h('div',{className:'label',style:{margin:'12px 0',color:'var(--red)'}},'LOCAL DE APLICAÇÃO * (obrigatório)'));
      // Plan info + SELECTION
      if(clienteSel&&clientePlanos){
        const ap=(clientePlanos||[]).filter(p=>p.status_contrato==='ativo');
        if(ap.length>0){
          const pc=h('div',{style:{marginBottom:'16px',padding:'12px',background:'var(--primary-bg)',borderRadius:'10px',borderLeft:'4px solid var(--primary)'}});
          pc.appendChild(h('div',{className:'label',style:{marginBottom:'6px'}},`PLANO: ${clienteSel.nome.toUpperCase()}`));
          if(ap.length>1&&!planoSel){
            // Multiple plans — REQUIRE selection
            pc.appendChild(h('div',{style:{fontSize:'13px',color:'#d97706',fontWeight:'600',marginBottom:'8px'}},'⚠ Selecione o plano para este lançamento:'));
            ap.forEach(p=>{const prog=p.doses_total>0?Math.round((p.doses_aplicadas||0)/p.doses_total*100):0;
              const btn=h('button',{className:'applicator-card',style:{textAlign:'left',padding:'12px',marginBottom:'6px',width:'100%'},onClick:()=>{planoSel=p;draw()}});
              btn.innerHTML=`<div class="fw-600">${esc(p.nome_plano)} <span class="badge badge-green">${p.status_contrato}</span></div><div style="display:flex;align-items:center;gap:8px;margin-top:4px"><div class="prog-bar" style="flex:1"><div class="prog-fill" style="width:${prog}%"></div></div><span class="mono text-sm">${p.doses_aplicadas||0}/${p.doses_total||0}</span></div>`;
              pc.appendChild(btn)});
            lc.appendChild(pc);
            // Block local selection until plan is selected
            lc.appendChild(h('div',{style:{textAlign:'center',padding:'20px',color:'#94a3b8',fontSize:'13px'}},'Selecione o plano acima para continuar'));
            wrap.appendChild(lc);
            return wrap; // STOP — don't show local buttons until plan selected
          }else{
            // Single plan or already selected
            const sel=planoSel||ap[0];
            if(!planoSel)planoSel=sel;
            const prog=sel.doses_total>0?Math.round((sel.doses_aplicadas||0)/sel.doses_total*100):0;
            pc.innerHTML+=`<div style="margin-bottom:6px"><span class="fw-600">${esc(sel.nome_plano)}</span> <span class="badge badge-green">${sel.status_contrato}</span>${ap.length>1?` <span style="cursor:pointer;color:var(--primary);font-size:11px;text-decoration:underline" onclick="this.closest('.card')&&(window._vittaResetPlano=true)">(trocar plano)</span>`:''}<div style="display:flex;align-items:center;gap:8px;margin-top:4px"><div class="prog-bar" style="flex:1"><div class="prog-fill" style="width:${prog}%"></div></div><span class="mono text-sm">${sel.doses_aplicadas||0}/${sel.doses_total||0}</span></div></div>`;
          }
          lc.appendChild(pc);
        }
      }
      const locais=[['Deltóide D','💪 Deltóide Direito'],['Deltóide E','💪 Deltóide Esquerdo'],['VL Coxa D','🦵 VL Coxa Direita'],['VL Coxa E','🦵 VL Coxa Esquerda'],['Glúteo D','Glúteo Direito'],['Glúteo E','Glúteo Esquerdo'],['Subcutânea','💉 Via Subcutânea'],['Oral','👄 Via Oral']];
      const lg=h('div',{className:'applicator-grid'});
      locais.forEach(([val,label])=>{lg.appendChild(h('button',{className:`applicator-card${localAplicacao===val?' active':''}`,onClick:()=>{localAplicacao=val;etapa='aplicador';draw()}},h('div',{style:{fontWeight:'600',fontSize:'13px'}},label)))});
      lc.appendChild(lg);wrap.appendChild(lc);
    }
    // ═══ STEP 4: APPLICATOR ═══
    if(etapa==='aplicador'){
      const ac=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
      ac.appendChild(iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar',()=>{etapa='local';draw()}));
      ac.appendChild(h('div',{className:'label',style:{margin:'12px 0'}},'APLICADOR'));
      ac.appendChild(h('div',{style:{fontSize:'12px',color:'var(--text-3)',marginBottom:'10px'}},`Local: ${localAplicacao}`));
      const usrs=await Api.usuarios()||[];
      const ag=h('div',{className:'applicator-grid'});
      usrs.forEach(u=>{ag.appendChild(h('button',{className:'applicator-card',onClick:()=>{aplicadorSel=u;etapa='confirmar';draw()}},
        h('div',{style:{fontWeight:'600',fontSize:'13px'}},u.nome),
        h('div',{style:{fontSize:'12px',color:'#94a3b8'}},u.cargo)))});
      ac.appendChild(ag);
      ac.appendChild(iconBtn('btn btn-outline btn-block',null,'Sem aplicação imediata',()=>{aplicadorSel=null;etapa='confirmar';draw()},{style:{marginTop:'10px'}}));
      wrap.appendChild(ac);
    }
    // ═══ STEP 5: CONFIRM ═══
    if(etapa==='confirmar'){
      const cf=h('div',{className:'confirm-banner slide-up'});
      cf.appendChild(iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar',()=>{etapa='aplicador';draw()}));
      // Last unit alert
      if(unidadeSel._doses_total<=1){
        cf.appendChild(h('div',{style:{padding:'12px',background:'#fef2f2',borderRadius:'10px',marginBottom:'14px',border:'1px solid #fca5a5'}},
          h('div',{style:{fontWeight:'700',color:'#dc2626',fontSize:'14px'}},'⚠ ÚLTIMA UNIDADE DESTE LOTE'),
          h('div',{style:{fontSize:'12px',color:'#dc2626',marginTop:'4px'}},`Lote ${esc(unidadeSel.numero_lote)} ficará com estoque ZERO!`)));
      }else if(unidadeSel._doses_total<=3){
        cf.appendChild(h('div',{style:{padding:'10px',background:'#fffbeb',borderRadius:'10px',marginBottom:'14px',border:'1px solid #fcd34d'}},
          h('div',{style:{fontWeight:'600',color:'#d97706',fontSize:'13px'}},`⚠ Estoque baixo: ${unidadeSel._doses_total} doses restantes`)));
      }
      cf.appendChild(h('h2',{style:{textAlign:'center',fontSize:'17px',fontWeight:'700',margin:'12px 0'}},'Confirmar Retirada'));
      // Patient name LARGE — show responsável if child
      const isChild=(clienteSel.tipo_paciente==='crianca'||clienteSel.tipo_paciente==='bebe')&&clienteSel.responsavel_nome;
      if(isChild){
        cf.appendChild(h('div',{style:{textAlign:'center',marginBottom:'16px'}},
          h('div',{style:{fontSize:'22px',fontWeight:'800',color:'var(--primary)'}},'👶 '+esc(clienteSel.nome)),
          h('div',{style:{fontSize:'13px',color:'#64748b',marginTop:'4px'}},'👤 Resp: '+esc(clienteSel.responsavel_nome))
        ));
      }else{
        cf.appendChild(h('div',{style:{textAlign:'center',fontSize:'22px',fontWeight:'800',color:'var(--primary)',marginBottom:'16px'}},esc(clienteSel.nome)));
      }
      const grid=h('div',{className:'confirm-grid'});
      grid.innerHTML=`<div><div class="cg-label">VACINA</div><div class="cg-value">${esc(unidadeSel.vacina_nome)}</div><div class="cg-sub">Lote: ${esc(unidadeSel.numero_lote)} · CB: ${esc(unidadeSel.codigo_barras.slice(-10))}</div></div>
        <div><div class="cg-label">ESTOQUE APÓS</div><div class="cg-value" style="color:${unidadeSel._doses_total<=1?'#dc2626':'inherit'}">${Math.max(0,unidadeSel._doses_total-1)} doses</div></div>
        <div><div class="cg-label">LOCAL</div><div class="cg-value">${esc(localAplicacao)}</div></div>
        <div><div class="cg-label">APLICADOR</div><div class="cg-value">${aplicadorSel?esc(aplicadorSel.nome):'Sem aplicação'}</div></div>
        ${planoSel?`<div style="grid-column:1/-1"><div class="cg-label">PLANO VINCULADO</div><div class="cg-value" style="color:var(--primary)">${esc(planoSel.nome_plano)} (${planoSel.doses_aplicadas||0}/${planoSel.doses_total||0})</div></div>`:''}`;
      cf.appendChild(grid);
      const acts=h('div',{style:{display:'flex',gap:'12px',marginTop:'16px'}});
      acts.appendChild(iconBtn('btn btn-outline btn-lg',I.x,'Cancelar',()=>{resetar();focusScanner()},{style:{flex:'1'}}));
      const confirmBtn=iconBtn('btn btn-primary btn-lg',I.check,'✓ Confirmar Retirada',confirmar,{style:{flex:'2',fontSize:'16px'}});
      if(confirmando)confirmBtn.disabled=true;
      acts.appendChild(confirmBtn);
      cf.appendChild(acts);wrap.appendChild(cf);
    }
    // ═══ STEPPER ═══
    const steps=['scan','cliente','local','aplicador','confirmar'];
    const lbls=['Bipe','Paciente','Local','Aplicador','Confirmar'];
    const at=steps.indexOf(etapa);
    const stp=h('div',{className:'stepper'});
    lbls.forEach((l,i)=>{const on=i<=at;
      stp.appendChild(h('div',{className:`step-dot ${on?'on':'off'}`},i<at?h('span',{innerHTML:I.check}):String(i+1)));
      stp.appendChild(h('span',{className:`step-name ${on?'on':'off'}`},l));
      if(i<4)stp.appendChild(h('div',{className:`step-line ${on?'on':'off'}`}))});
    wrap.appendChild(stp);
    // ═══ RECENT MOVEMENTS (inline, paginated, clickable) ═══
    if(etapa==='scan'){await drawRecentBlock()}
    // Focus management
    if(etapa==='scan')focusScanner();
  }
  // ═══ SEARCH LOGIC ═══
  async function executarBusca(q,iw,statusEl){
    if(buscando)return;
    buscando=true;
    try{
      const qt=sanitize(q);
      if(qt.length<2){buscando=false;return}
      resultados=await Api.buscarUnidades(qt)||[];
      statusEl.innerHTML='';
      // Exact barcode match → direct select
      const exactMatch=resultados.find(r=>r.codigo_barras===qt&&r.status==='disponivel');
      if(exactMatch){selUnit(exactMatch);buscando=false;return}
      // All same barcode → select first available
      if(resultados.length>0&&resultados.every(r=>r.codigo_barras===qt)){
        const avail=resultados.find(r=>r.status==='disponivel');
        if(avail){selUnit(avail);buscando=false;return}
        // All applied
        statusEl.innerHTML='<div style="padding:10px;background:#fef2f2;border-radius:8px;color:#dc2626;font-size:13px;font-weight:600">❌ Todas as unidades deste código já foram aplicadas</div>';
        buscando=false;return;
      }
      // No results
      if(resultados.length===0){
        const old=iw.querySelector('.autocomplete-list');if(old)old.remove();
        statusEl.innerHTML=`<div style="padding:12px;background:#fef2f2;border-radius:10px;margin-top:8px">
          <div style="font-weight:700;color:#dc2626;font-size:14px">❌ Código não encontrado</div>
          <div style="font-size:12px;color:#dc2626;margin-top:4px">"${esc(qt)}" não existe no estoque.</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:6px">• Verifique a leitura do scanner<br>• Tente digitar novamente<br>• Cadastre via Estoque → Código de Barras</div></div>`;
        buscando=false;return;
      }
      // Multiple results → show autocomplete
      drawAC(iw);
    }catch(e){
      statusEl.innerHTML=`<div style="padding:8px;color:#dc2626;font-size:12px">Erro na busca: ${esc(e.message)}</div>`;
    }
    buscando=false;
  }
  // ═══ AUTOCOMPLETE ═══
  function drawAC(par){
    const old=par.querySelector('.autocomplete-list');if(old)old.remove();
    if(!resultados.length)return;
    const list=h('div',{className:'autocomplete-list'});
    // Group by lot
    const gr={};
    resultados.forEach(r2=>{const k=r2.numero_lote;if(!gr[k])gr[k]={...r2,count:0};gr[k].count++});
    Object.values(gr).forEach(g=>{
      const it=h('div',{className:'autocomplete-item',onClick:()=>{
        const unit=resultados.find(r2=>r2.numero_lote===g.numero_lote&&r2.status==='disponivel')||resultados.find(r2=>r2.numero_lote===g.numero_lote);
        if(unit)selUnit(unit);
      }});
      const st=statusVenc(g.dias_para_vencer);
      it.innerHTML=`<div style="flex:1"><div style="font-weight:600">${esc(g.vacina_nome)}</div><div style="font-size:12px;color:#64748b">Lote: ${esc(g.numero_lote)} · <strong>${(g.doses_por_unidade||1)>1?g.quantidade_disponivel*(g.doses_por_unidade||1)-(g.doses_abertas||0):g.quantidade_disponivel} doses</strong></div></div><div style="text-align:right"><span class="badge ${st.cls}">${st.label}</span><div style="font-size:11px;color:#94a3b8;margin-top:2px">${fmtData(g.validade)}</div></div>`;
      list.appendChild(it);
    });
    par.appendChild(list);
  }
  // ═══ CLIENT LIST ═══
  function drawCL(card){
    const ld=card.querySelector('#cl-list');if(!ld)return;ld.innerHTML='';
    const fl=clientesResult.filter(c=>!perfilFilter||(c.tipo_cliente===perfilFilter));
    if(!fl.length){ld.innerHTML='<div class="empty-state" style="padding:20px">Busque por nome, CPF ou código</div>';return}
    fl.forEach(c=>{
      const it=h('div',{className:'client-pick-item',onClick:async()=>{
        clienteSel=c;
        if(c.tipo_cliente==='ativo'){const cd=await Api.cliente(c.id);clientePlanos=cd?.planos||[]}
        else clientePlanos=[];
        etapa='local';draw();
      }});
      it.innerHTML=`<div style="width:36px;height:36px;border-radius:50%;background:${c.tipo_cliente==='ativo'?'var(--primary-bg)':'#f1f5f9'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${c.nome.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><div style="flex:1"><div style="font-weight:600;font-size:13px">${(c.tipo_paciente==='crianca'||c.tipo_paciente==='bebe')?'👶 ':''}${esc(c.nome)} ${c.codigo_cliente?'<span class="mono text-muted">['+esc(c.codigo_cliente)+']</span>':''}</div>${c.responsavel_nome?`<div style="font-size:11px;color:#64748b">👤 ${esc(c.responsavel_nome)}</div>`:''}<div style="font-size:12px;color:#94a3b8">${tipoClienteBadge(c.tipo_cliente)}</div></div>`;
      ld.appendChild(it);
    });
  }
  // ═══ RECENT MOVEMENTS BLOCK (inline, paginated, clickable) ═══
  async function drawRecentBlock(){
    const rb=h('div',{style:{marginTop:'24px'}});
    rb.appendChild(h('div',{className:'label',style:{marginBottom:'10px'}},'ÚLTIMAS MOVIMENTAÇÕES'));
    // Fetch paginated
    const offset=recentPage*RECENT_PER_PAGE;
    const data=await Api.movimentacoes({page:recentPage+1,limit:RECENT_PER_PAGE,sort:'data_hora',order:'DESC',tipo_cliente:perfilFilter||undefined});
    if(!data||!data.data){rb.appendChild(h('div',{className:'empty-state'},'Nenhuma movimentação'));wrap.appendChild(rb);return}
    recentTotal=data.pagination?.total||0;
    if(!data.data.length){rb.appendChild(h('div',{className:'empty-state',style:{padding:'20px'}},'Nenhuma movimentação registrada'));wrap.appendChild(rb);return}
    // List items (clickable → navigate to movimentações detail)
    data.data.forEach(m=>{
      const tm={retirada:['Retirada','badge-orange'],entrada:['Entrada','badge-primary'],aplicacao:['Aplicação','badge-green'],descarte:['Descarte','badge-red']};
      const[tl,tc]=tm[m.tipo]||[m.tipo,'badge-gray'];
      const it=h('div',{className:'recent-bip-item',style:{cursor:'pointer',transition:'background .15s'},
        onClick:()=>{AppState.verMovimentacao(m.id)},
        onMouseEnter:function(){this.style.background='var(--primary-bg)'},
        onMouseLeave:function(){this.style.background=''}});
      it.innerHTML=`<div style="flex:1">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
          <span class="badge ${tc}" style="font-size:10px">${tl}</span>
          <span class="fw-600">${esc(m.nome_vacina||'-')}</span>
          <span class="mono text-muted text-sm">#${m.id}</span>
        </div>
        <div class="text-sm text-muted">
          ${m.cliente_nome?esc(m.cliente_nome):'—'} · Lote: ${esc(m.numero_lote||'-')} · CB: ${esc((m.codigo_barras||'').slice(-8))}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="bip-time">${fmtDataHora(m.data_hora)}</div>
        <div style="font-size:10px;color:var(--text-4)">${esc(m.local_aplicacao||'')}</div>
      </div>`;
      rb.appendChild(it);
    });
    // Pagination controls
    const totalPages=Math.ceil(recentTotal/RECENT_PER_PAGE);
    if(totalPages>1){
      const pag=h('div',{style:{display:'flex',justifyContent:'center',alignItems:'center',gap:'8px',marginTop:'12px'}});
      if(recentPage>0){
        pag.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>{recentPage--;drawRecentRefresh()}},'← Anterior'));
      }
      pag.appendChild(h('span',{className:'mono text-sm text-muted'},`${recentPage+1} / ${totalPages} (${recentTotal} total)`));
      if(recentPage<totalPages-1){
        pag.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>{recentPage++;drawRecentRefresh()}},'Próximo →'));
      }
      rb.appendChild(pag);
    }
    wrap.appendChild(rb);
  }
  // Refresh only the recent block without redrawing everything
  async function drawRecentRefresh(){
    const existing=wrap.querySelector('[style*="marginTop: 24px"]')||wrap.lastChild;
    if(existing&&existing.querySelector('.label')?.textContent==='ÚLTIMAS MOVIMENTAÇÕES'){
      existing.remove();
    }
    await drawRecentBlock();
    focusScanner();
  }
  // ═══ ACTIONS ═══
  function selUnit(u){
    // Calculate total available doses for multi-dose boxes
    const dpu=u.doses_por_unidade||1;
    u._doses_total=dpu>1?(u.quantidade_disponivel*dpu-(u.doses_abertas||0)):u.quantidade_disponivel;
    unidadeSel=u;
    query='';
    resultados=[];
    etapa='cliente';
    clientesResult=[];
    buscaCliente='';
    draw();
  }
  function resetar(){
    etapa='scan';query='';resultados=[];unidadeSel=null;clienteSel=null;
    clientePlanos=null;planoSel=null;aplicadorSel=null;buscaCliente='';
    clientesResult=[];localAplicacao='';confirmando=false;
    recentPage=0;
    draw();
  }
  async function confirmar(){
    if(confirmando)return;
    if(!unidadeSel||!clienteSel||!localAplicacao)return;
    confirmando=true;
    const btn=wrap.querySelector('.confirm-banner .btn-primary');
    if(btn){btn.disabled=true;btn.textContent='Processando...'}

    // ═══ FOTO OBRIGATÓRIA PARA RETIRADA ═══
    let fotoBlob=null,geoData={geo_status:'nao_capturado'};
    try{
      if(typeof captureAuditPhoto==='function'){
        fotoBlob=await captureAuditPhoto(`RETIRADA — ${unidadeSel.vacina_nome||'Vacina'}`);
      }
      if(typeof captureGeoForAudit==='function'){
        geoData=await captureGeoForAudit();
      }
    }catch(ev){}

    if(!fotoBlob){
      Toast.show('⚠ Foto obrigatória para retirada. Ação cancelada.','error');
      confirmando=false;
      if(btn){btn.disabled=false;btn.textContent='✓ Confirmar Retirada'}
      return; // BLOCK
    }

    try{
      const r2=await Api.retirada({
        unidade_id:unidadeSel.id,
        cliente_id:clienteSel.id,
        usuario_id:AppState.usuario.id,
        aplicador_id:aplicadorSel?.id,
        tipo_cliente:tipoCliente,
        local_aplicacao:localAplicacao,
        plano_contratado_id:planoSel?.id||null
      });
      if(r2?.code==='SELECIONAR_PLANO'){
        // Backend requires plan selection — go back to local step
        confirmando=false;
        if(btn){btn.disabled=false;btn.textContent='✓ Confirmar Retirada'}
        planoSel=null;etapa='local';draw();
        Toast.show('Selecione o plano antes de continuar','warning');
        return;
      }
      if(r2?.success){
        let msg=r2.message;
        if(r2.estoque)msg+=` | Estoque: ${r2.estoque.antes}→${r2.estoque.depois}`;
        if(r2.pendente_aprovacao)Toast.show(msg,'warning');
        else Toast.show(msg);

        // ═══ SEND AUDIT EVIDENCE (photo + geo) ═══
        try{
          const auditData={acao:'retirada',entidade:'movimentacao',
            entidadeId:r2.movimentacao_id,
            usuarioId:AppState.usuario.id,usuarioNome:AppState.usuario?.nome,
            perfil:AppState.usuario?.perfil,
            detalhes:JSON.stringify({
              vacina:unidadeSel.vacina_nome,cliente:clienteSel.nome,
              local:localAplicacao,estoque_antes:r2.estoque?.antes,estoque_depois:r2.estoque?.depois,
              ...geoData
            })};
          if(typeof sendAuditWithPhoto==='function'){
            sendAuditWithPhoto(auditData,fotoBlob);
          }else{Api.auditoriaLog(auditData)}
        }catch(ae){}

        confirmando=false;resetar();focusScanner();
      }else if(r2?.code==='FORA_DO_PLANO'){
        // ═══ VACINA FORA DO PLANO — PEDIR JUSTIFICATIVA ═══
        confirmando=false;
        if(btn){btn.disabled=false;btn.textContent='✓ Confirmar Retirada'}
        showModal('⚠ Vacina fora do plano',async(body,close)=>{
          body.appendChild(h('div',{style:'padding:12px;background:#fef2f2;border-radius:8px;border:1px solid #fca5a5;margin-bottom:16px'},
            h('div',{style:'font-weight:700;color:#dc2626;font-size:14px'},`"${unidadeSel.vacina_nome}" não pertence ao plano do cliente`),
            h('div',{style:'font-size:12px;color:#dc2626;margin-top:6px'},r2.error)));
          body.appendChild(h('label',{className:'label',style:'color:#dc2626;margin-top:12px'},'Justificativa * (obrigatória)'));
          const justInput=h('textarea',{className:'input',rows:'3',placeholder:'Ex: Troca autorizada, dose extra, emergência...',style:'resize:vertical'});
          body.appendChild(justInput);
          body.appendChild(h('div',{style:'font-size:11px;color:#64748b;margin-top:8px'},'⏳ Esta retirada será enviada para aprovação do master antes de ser concluída.'));
          body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Enviar para Aprovação',async()=>{
            if(!justInput.value.trim()){Toast.show('Justificativa obrigatória','error');return}
            // Retry with justification
            const r3=await Api.retirada({
              unidade_id:unidadeSel.id,cliente_id:clienteSel.id,
              usuario_id:AppState.usuario.id,aplicador_id:aplicadorSel?.id,
              tipo_cliente:tipoCliente,local_aplicacao:localAplicacao,
              justificativa_fora_plano:justInput.value.trim(),
              plano_contratado_id:planoSel?.id||null
            });
            if(r3?.success){Toast.show(r3.message,'warning');close();resetar();focusScanner()}
            else Toast.show(r3?.error||'Erro','error');
          },{style:{marginTop:'16px'}}));
        },'480px');
      }else{
        Toast.show(r2?.error||'Erro na retirada','error');
        confirmando=false;
        if(btn){btn.disabled=false;btn.textContent='✓ Confirmar Retirada'}
      }
    }catch(e){
      Toast.show('Erro de conexão: '+e.message,'error');
      confirmando=false;
      if(btn){btn.disabled=false;btn.textContent='✓ Confirmar Retirada'}
    }
  }
  // ═══ GLOBAL FOCUS RECOVERY ═══
  // When user clicks anywhere on the page and scan step is active, restore focus
  wrap.addEventListener('click',e=>{
    if(etapa==='scan'&&!e.target.closest('input')&&!e.target.closest('button')&&!e.target.closest('.autocomplete-item')){
      setTimeout(focusScanner,100);
    }
  });
  await draw();
  return wrap;
}
