async function renderHistorico(){
  const perfilFilter=AppState.filtroClientePerfil();
  let f={page:1,limit:50,search:'',tipo:'',tipo_cliente:perfilFilter,status:'',sort:'id',order:'DESC'};
  const wrap=h('div',{className:'fade-in'});

async function draw(){wrap.innerHTML='';
const titleSuffix=perfilFilter==='ativo'?' — Ativos':perfilFilter==='espontaneo'?' — Espontâneos':'';
const hdr=h('div',{className:'page-header'});
hdr.appendChild(h('div',{className:'page-header-left'},h('h1',{className:'page-title'},`Movimentações${titleSuffix}`),h('p',{className:'page-subtitle'},'Rastreabilidade completa')));
hdr.appendChild(h('div',{className:'page-header-actions'},iconBtn('btn btn-primary btn-sm',I.plus,'Nova Movimentação',()=>modalNovaMovimentacao())));
wrap.appendChild(hdr);

const fb=h('div',{className:'filters-bar'});
fb.appendChild(buildSearchBox('Buscar por nome, vacina, lote, código...',v=>{f.search=v;f.page=1;draw()},f.search));
fb.appendChild(buildSelect([['','Tipo'],['retirada','Retirada'],['aplicacao','Aplicação'],['entrada','Entrada'],['descarte','Descarte'],['ajuste','Ajuste'],['estorno','Estorno']],f.tipo,v=>{f.tipo=v;f.page=1;draw()}));
fb.appendChild(buildSelect([['','Status'],['concluido','Concluído'],['pendente_aprovacao','⏳ Pendente'],['reprovado','✗ Reprovado'],['cancelado','Cancelado']],f.status,v=>{f.status=v;f.page=1;draw()}));
if(!perfilFilter){fb.appendChild(buildSelect([['','Cliente'],['ativo','⭐ Ativo'],['espontaneo','Espontâneo']],f.tipo_cliente,v=>{f.tipo_cliente=v;f.page=1;draw()}))}
wrap.appendChild(fb);

const data=await Api.movimentacoes(f);if(!data)return;
const tw=h('div',{className:'table-wrap'});
const t=buildSortableTable([['ID','id'],['Data','data_hora'],['Tipo','tipo'],['Vacina','nome_vacina'],['Lote','numero_lote'],['CB',''],['Paciente','cliente_nome'],['Cliente',''],['Local','local_aplicacao'],['Status','status'],['Ações','']],f,draw);
const tb=document.createElement('tbody');
if(!data.data.length)tb.innerHTML='<tr><td colspan="11" class="empty-state">Nenhuma movimentação</td></tr>';
else data.data.forEach(m=>{
  const tm={retirada:['Retirada','badge-orange'],aplicacao:['Aplicação','badge-green'],entrada:['Entrada','badge-primary'],descarte:['Descarte','badge-red'],ajuste:['Ajuste','badge-navy'],estorno:['Estorno','badge-purple']};
  const[tl,tc]=tm[m.tipo]||[m.tipo,'badge-gray'];
  const tr=h('tr',{className:'clickable',onClick:()=>modalDetalheMovimentacao(m.id)});
  if(m.tipo_cliente==='ativo')tr.style.borderLeft='3px solid var(--primary)';
  const statusBadge=m.status==='pendente_aprovacao'?'<span class="badge badge-orange" style="font-size:10px">⏳ Pendente</span>':m.status==='reprovado'?'<span class="badge badge-red" style="font-size:10px">✗ Reprovado</span>':m.status==='cancelado'?'<span class="badge badge-gray">Cancelado</span>':m.plano_progresso?`<div class="fw-600" style="color:var(--primary)">${m.plano_progresso.pct}%</div><div class="text-sm text-muted">${m.plano_progresso.aplicadas} de ${m.plano_progresso.total}</div>`:`<span class="badge ${m.status==='concluido'?'badge-green':'badge-orange'}">${m.status}</span>`;
  tr.innerHTML=`<td class="mono text-muted text-sm">#${m.id}</td><td class="mono">${fmtDataHora(m.data_hora)}</td><td><span class="badge ${tc}">${tl}</span></td><td class="fw-600">${esc(m.nome_vacina||'-')}</td><td class="mono">${esc(m.numero_lote||'-')}</td><td class="mono text-sm">${esc((m.codigo_barras||'').slice(-10))}</td><td>${esc(m.cliente_nome||'-')} ${m.codigo_cliente?'<span class="mono text-muted">['+esc(m.codigo_cliente)+']</span>':''}</td><td>${m.tipo_cliente?tipoClienteBadge(m.tipo_cliente):'-'}</td><td class="text-sm">${esc(m.local_aplicacao||'-')}</td><td>${statusBadge}</td>`;
  // Actions
  const actTd=document.createElement('td');actTd.style.whiteSpace='nowrap';
  actTd.appendChild(iconBtn('btn btn-outline btn-sm',null,'Editar',e=>{e.stopPropagation();modalEditarMovimentacao(m)},{style:{marginRight:'4px'}}));
  if(!m.unidade_id){
    actTd.appendChild(iconBtn('btn btn-red btn-sm',null,'Excluir',async e=>{e.stopPropagation();
      if(!confirm(`Excluir movimentação #${m.id}?`))return;
      const r=await Api.del(`/movimentacoes/${m.id}`);
      if(r?.success){Toast.show('Excluída');draw()}else Toast.show(r?.error||'Erro','error')}));
  }
  tr.appendChild(actTd);tb.appendChild(tr);
});
t.appendChild(tb);tw.appendChild(t);
tw.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
wrap.appendChild(tw);
}

// ═══ NOVA MOVIMENTAÇÃO (with autocomplete + approval) ═══
function modalNovaMovimentacao(){showModal('Nova Movimentação',async(body,close)=>{
  const fd={usuario_id:AppState.usuario.id,quantidade:1};
  const vacs=await Api.vacinas()||[];
  const lotes=await Api.lotes({limit:200})||{data:[]};
  let acResults=[];

  // ═══ AUTOCOMPLETE INTELIGENTE ═══
  const scanWrap=h('div',{style:{marginBottom:'16px',padding:'14px',background:'var(--primary-bg)',borderRadius:'12px',border:'2px dashed var(--primary)',position:'relative',overflow:'visible'}});
  scanWrap.appendChild(h('div',{className:'label',style:{color:'var(--primary)',marginBottom:'6px',fontSize:'11px'}},'🔍 BUSCA INTELIGENTE — Bipe, nome, lote ou código'));
  const scanInput=h('input',{className:'scanner-input',placeholder:'Ex: "Meningo", "7896015", "NF84765"...',style:'font-size:14px;padding:10px',id:'mov-barcode-input',autocomplete:'off'});
  const scanStatus=h('div',{style:{marginTop:'6px',maxHeight:'48px',overflow:'hidden'}});
  const acList=h('div',{style:{display:'none',position:'absolute',left:'0',right:'0',top:'100%',zIndex:'9999',maxHeight:'200px',overflow:'auto',background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:'0 0 10px 10px',boxShadow:'0 8px 24px #0003'}});

  let searchTimer=null;
  scanInput.addEventListener('input',e=>{
    const q=e.target.value.trim();
    if(searchTimer)clearTimeout(searchTimer);
    if(q.length<2){acList.style.display='none';acResults=[];scanStatus.innerHTML='';return}
    scanStatus.innerHTML='<div style="font-size:11px;color:var(--text-3)">🔍 Buscando...</div>';
    searchTimer=setTimeout(async()=>{
      acResults=await Api.buscarUnidades(q)||[];
      scanStatus.innerHTML='';
      if(acResults.length===0){
        acList.style.display='none';
        scanStatus.innerHTML=`<div style="padding:8px;background:#fef2f2;border-radius:8px;color:#dc2626;font-size:12px">Nenhum resultado para "${esc(q)}"</div>`;
        return;
      }
      // Group by lot
      acList.innerHTML='';acList.style.display='block';
      const gr={};acResults.forEach(r=>{const k=r.numero_lote;if(!gr[k])gr[k]={...r,count:0};gr[k].count++});
      Object.values(gr).forEach(g=>{
        const it=h('div',{style:'padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background .1s',
          onMouseEnter:function(){this.style.background='var(--primary-bg)'},
          onMouseLeave:function(){this.style.background=''},
          onClick:()=>selectAcItem(g)});
        const st=statusVenc(g.dias_para_vencer);
        it.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600;font-size:13px">${esc(g.vacina_nome)}</div>
          <div style="font-size:11px;color:#64748b">Lote: ${esc(g.numero_lote)} · CB: ${esc((g.codigo_barras||'').slice(-10))} · <strong>${g.quantidade_disponivel} disp.</strong></div></div>
          <span class="badge ${st.cls}" style="font-size:10px">${st.label}</span></div>`;
        acList.appendChild(it);
      });
    },200);
  });

  // Enter selects first result
  scanInput.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();
      if(acResults.length>0)selectAcItem(acResults[0]);
      else if(scanInput.value.trim().length>=3){scanInput.dispatchEvent(new Event('input'))}
    }
    if(e.key==='Escape'){acList.style.display='none';scanInput.value=''}
  });

  function selectAcItem(u){
    fd.vacina_id=u.vacina_id;fd.nome_vacina=u.vacina_nome;
    fd.lote_id=u.lote_id;fd.numero_lote=u.numero_lote;
    fd.codigo_barras=u.codigo_barras;fd.unidade_id=u.id;
    acList.style.display='none';scanInput.value='';
    scanStatus.innerHTML=`<div style="font-size:12px;color:#059669;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">✓ ${esc(u.vacina_nome)} — Lote: ${esc(u.numero_lote)} — ${u.quantidade_disponivel} disp.</div>`;
    scanInput.focus();
  }

  // Close autocomplete on outside click
  body.addEventListener('click',e=>{if(!scanWrap.contains(e.target))acList.style.display='none'});

  scanWrap.appendChild(scanInput);scanWrap.appendChild(acList);scanWrap.appendChild(scanStatus);
  body.appendChild(scanWrap);
  setTimeout(()=>scanInput.focus(),100);

  const gr=h('div',{className:'form-grid'});

  // Tipo (obrigatório)
  const dTipo=h('div');dTipo.appendChild(h('label',{className:'label',style:{color:'var(--red)'}},'Tipo * (obrigatório)'));
  dTipo.appendChild(buildSelect([['','— Selecione o tipo —'],['entrada','Entrada'],['retirada','Retirada (manual)'],['aplicacao','Aplicação'],['ajuste','Ajuste'],['descarte','Descarte'],['estorno','Estorno']],fd.tipo||'',v=>{fd.tipo=v;checkSensitive()}));
  gr.appendChild(dTipo);

  // ═══ CLIENTE (obrigatório para retirada/aplicação) ═══
  const dCli=h('div',{style:{gridColumn:'1/-1'}});
  dCli.appendChild(h('label',{className:'label'},'Cliente / Paciente'));
  const cliInput=h('input',{className:'input',placeholder:'Buscar por nome, CPF ou código...'});
  const cliResult=h('div',{style:{fontSize:'12px',marginTop:'4px'}});
  let cliTimer=null;
  cliInput.addEventListener('input',e=>{
    const q=e.target.value.trim();if(cliTimer)clearTimeout(cliTimer);
    if(q.length<2){cliResult.innerHTML='';return}
    cliTimer=setTimeout(async()=>{
      const cls=await Api.buscarClientes(q)||[];
      cliResult.innerHTML='';
      if(!cls.length){cliResult.innerHTML='<span style="color:var(--text-3)">Nenhum cliente encontrado</span>';return}
      cls.slice(0,5).forEach(c=>{
        const btn=h('div',{style:'padding:6px 10px;cursor:pointer;border-radius:6px;font-size:12px;border:1px solid var(--border);margin:2px 0;display:inline-block;margin-right:4px',
          onMouseEnter:function(){this.style.background='var(--primary-bg)'},onMouseLeave:function(){this.style.background=''},
          onClick:()=>{fd.cliente_id=c.id;fd.tipo_cliente=c.tipo_cliente;cliInput.value=c.nome;
            cliResult.innerHTML=`<span style="color:#059669;font-weight:600">✓ ${esc(c.nome)} [${esc(c.codigo_cliente||'')}] — ${c.tipo_cliente}</span>`}});
        btn.textContent=`${c.nome} [${c.codigo_cliente||''}]`;
        cliResult.appendChild(btn);
      });
    },250);
  });
  dCli.appendChild(cliInput);dCli.appendChild(cliResult);gr.appendChild(dCli);

  // Vacina (obrigatório)
  const dVac=h('div');dVac.appendChild(h('label',{className:'label',style:{color:'var(--red)'}},'Vacina * (obrigatório)'));
  dVac.appendChild(buildSelect([['','— Selecione a vacina —'],...vacs.map(v=>[v.id+'|'+v.nome,v.nome+' ('+v.fabricante+')'])],fd.vacina_id||'',v=>{
    const parts=v.split('|');fd.vacina_id=parseInt(parts[0]);fd.nome_vacina=parts[1]||''}));
  gr.appendChild(dVac);

  // Lote
  const dLote=h('div');dLote.appendChild(h('label',{className:'label'},'Lote'));
  dLote.appendChild(buildSelect([['','— Opcional —'],...lotes.data.filter(l=>l.status==='disponivel').map(l=>[l.id+'|'+l.numero_lote,`${l.vacina_nome} — ${l.numero_lote} (${l.quantidade_disponivel} disp.)`])],fd.lote_id||'',v=>{
    const parts=v.split('|');fd.lote_id=parseInt(parts[0]);fd.numero_lote=parts[1]||''}));
  gr.appendChild(dLote);

  // Quantidade
  const dQtd=h('div');dQtd.appendChild(h('label',{className:'label'},'Quantidade *'));
  const iQtd=h('input',{className:'input',type:'number',value:'1',min:'1',max:'999'});
  iQtd.addEventListener('input',e=>{fd.quantidade=parseInt(e.target.value)||1});
  dQtd.appendChild(iQtd);gr.appendChild(dQtd);

  // Local aplicação
  const dLoc=h('div');dLoc.appendChild(h('label',{className:'label'},'Local de Aplicação'));
  dLoc.appendChild(buildSelect([['','— Não se aplica —'],['Deltóide D','Deltóide D'],['Deltóide E','Deltóide E'],['VL Coxa D','VL Coxa D'],['VL Coxa E','VL Coxa E'],['Glúteo D','Glúteo D'],['Oral','Oral']],fd.local_aplicacao||'',v=>{fd.local_aplicacao=v}));
  gr.appendChild(dLoc);

  // Data/hora
  const dDt=h('div');dDt.appendChild(h('label',{className:'label'},'Data/Hora'));
  const iDt=h('input',{className:'input',type:'datetime-local'});
  iDt.addEventListener('input',e=>{fd.data_hora=e.target.value.replace('T',' ')});
  dDt.appendChild(iDt);gr.appendChild(dDt);

  // Tipo atendimento
  const dAtend=h('div');dAtend.appendChild(h('label',{className:'label'},'Tipo Atendimento'));
  dAtend.appendChild(buildSelect([['normal','Normal'],['urgencia','Urgência'],['campanha','Campanha'],['domiciliar','Domiciliar']],fd.tipo_atendimento||'normal',v=>{fd.tipo_atendimento=v}));
  gr.appendChild(dAtend);

  // Observações
  const dObs=h('div');dObs.appendChild(h('label',{className:'label'},'Observações'));
  const iObs=h('input',{className:'input',placeholder:'Opcional'});
  iObs.addEventListener('input',e=>{fd.observacoes=e.target.value});
  dObs.appendChild(iObs);gr.appendChild(dObs);

  // Motivo padrão (for sensitive types)
  const dMotivo=h('div',{id:'motivo-wrap',style:{display:'none'}});
  dMotivo.appendChild(h('label',{className:'label',style:{color:'var(--red)'}},'Motivo * (obrigatório para descarte/ajuste/estorno)'));
  dMotivo.appendChild(buildSelect([['','— Selecione o motivo —'],['vacina_vencida','Vacina vencida'],['quebra_avaria','Quebra / Avaria'],['cancelamento_plano','Cancelamento de plano'],['erro_lancamento','Erro de lançamento'],['divergencia_inventario','Divergência de inventário'],['devolucao','Devolução'],['estorno_indevido','Estorno por lançamento indevido'],['outro','Outro']],'',v=>{fd.motivo_padrao=v}));
  gr.appendChild(dMotivo);

  // Justificativa
  const dJust=h('div',{id:'just-wrap',style:{display:'none'}});
  dJust.appendChild(h('label',{className:'label'},'Justificativa'));
  const iJust=h('textarea',{className:'input',placeholder:'Descreva o motivo...',rows:'2',style:'resize:vertical'});
  iJust.addEventListener('input',e=>{fd.justificativa=e.target.value});
  dJust.appendChild(iJust);gr.appendChild(dJust);

  // Show/hide justification fields based on type
  function checkSensitive(){
    const s=['descarte','ajuste','estorno'].includes(fd.tipo);
    dMotivo.style.display=s?'':'none';dJust.style.display=s?'':'none';
  }
  // Override tipo select to trigger check
  const tipoSel=dTipo.querySelector('select');
  if(tipoSel)tipoSel.addEventListener('change',()=>{fd.tipo=tipoSel.value;checkSensitive()});

  body.appendChild(gr);
  const isMaster=AppState.isMaster();
  const infoText=isMaster?'ℹ️ Master: movimentações sensíveis serão aprovadas automaticamente':'⚠️ Descarte, ajuste e estorno requerem aprovação do master';
  body.appendChild(h('div',{style:{marginTop:'12px',padding:'10px',background:isMaster?'var(--primary-bg)':'#fffbeb',borderRadius:'8px',fontSize:'12px',color:isMaster?'var(--primary-dark)':'#d97706'}},infoText));
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Registrar Movimentação',async()=>{
    if(!fd.tipo)return Toast.show('Selecione o tipo de movimentação','error');
    if(!fd.nome_vacina&&!fd.vacina_id)return Toast.show('Selecione a vacina','error');
    if(['retirada','aplicacao'].includes(fd.tipo)&&!fd.local_aplicacao)return Toast.show('Local de aplicação obrigatório para retirada','error');

    // ═══ CAMERA FOR CRITICAL ACTIONS ═══
    const tiposCriticos=['descarte','ajuste','estorno'];
    let fotoBlob=null;
    if(tiposCriticos.includes(fd.tipo)&&typeof captureAuditPhoto==='function'){
      fotoBlob=await captureAuditPhoto(`${fd.tipo.toUpperCase()} — ${fd.nome_vacina||'Vacina'}`);
      // Photo is optional — operation continues even without it
    }

    const r=await Api.criarMovimentacao(fd);
    if(r?.success){
      // Send audit with photo if captured
      if(fotoBlob&&r.id){
        sendAuditWithPhoto({acao:fd.tipo,entidade:'movimentacao',entidadeId:r.id,
          usuarioId:AppState.usuario?.id,usuarioNome:AppState.usuario?.nome,
          perfil:AppState.usuario?.perfil,
          detalhes:JSON.stringify({vacina:fd.nome_vacina,tipo:fd.tipo,quantidade:fd.quantidade})},fotoBlob);
      }
      Toast.show(r.message||'Movimentação registrada!');close();draw()
    }
    else Toast.show(r?.error||'Erro ao registrar','error');
  },{style:{marginTop:'16px'}}));
},'600px')}

// ═══ EDITAR MOVIMENTAÇÃO ═══
function modalEditarMovimentacao(mov){showModal('Editar Movimentação',async(body,close)=>{
  const isBipe=!!mov.unidade_id;
  if(isBipe){body.appendChild(h('div',{style:{padding:'12px',background:'var(--orange-bg)',borderRadius:'8px',marginBottom:'16px',fontSize:'13px',color:'var(--orange-text)'}},'⚠ Esta movimentação foi gerada pelo bipe. Só é possível editar: local de aplicação, observações e aplicador.'))}

  const fd={...mov};const gr=h('div',{className:'form-grid'});

  // Tipo (read-only for bipe)
  const dTipo=h('div');dTipo.appendChild(h('label',{className:'label'},'Tipo'));
  if(isBipe){dTipo.appendChild(h('input',{className:'input',value:mov.tipo,disabled:true}))}
  else dTipo.appendChild(buildSelect([['entrada','Entrada'],['retirada','Retirada'],['ajuste','Ajuste'],['descarte','Descarte'],['estorno','Estorno']],fd.tipo,v=>{fd.tipo=v}));
  gr.appendChild(dTipo);

  // Vacina (read-only for bipe)
  const dVac=h('div');dVac.appendChild(h('label',{className:'label'},'Vacina'));
  dVac.appendChild(h('input',{className:'input',value:mov.nome_vacina||'',disabled:isBipe}));
  if(!isBipe){dVac.querySelector('input').addEventListener('input',e=>{fd.nome_vacina=e.target.value})}
  gr.appendChild(dVac);

  // Local
  const dLoc=h('div');dLoc.appendChild(h('label',{className:'label'},'Local de Aplicação'));
  dLoc.appendChild(buildSelect([['','—'],['Deltóide D','Deltóide D'],['Deltóide E','Deltóide E'],['VL Coxa D','VL Coxa D'],['VL Coxa E','VL Coxa E'],['Glúteo D','Glúteo D'],['Oral','Oral']],fd.local_aplicacao||'',v=>{fd.local_aplicacao=v}));
  gr.appendChild(dLoc);

  // Observações
  const dObs=h('div');dObs.appendChild(h('label',{className:'label'},'Observações'));
  const iObs=h('input',{className:'input',value:fd.observacoes||''});iObs.addEventListener('input',e=>{fd.observacoes=e.target.value});
  dObs.appendChild(iObs);gr.appendChild(dObs);

  if(!isBipe){
    // Quantidade
    const dQtd=h('div');dQtd.appendChild(h('label',{className:'label'},'Quantidade'));
    const iQtd=h('input',{className:'input',type:'number',value:fd.quantidade||1});
    iQtd.addEventListener('input',e=>{fd.quantidade=parseInt(e.target.value)});dQtd.appendChild(iQtd);gr.appendChild(dQtd);
    // Data
    const dDt=h('div');dDt.appendChild(h('label',{className:'label'},'Data/Hora'));
    const iDt=h('input',{className:'input',type:'datetime-local',value:(fd.data_hora||'').replace(' ','T').slice(0,16)});
    iDt.addEventListener('input',e=>{fd.data_hora=e.target.value.replace('T',' ')});dDt.appendChild(iDt);gr.appendChild(dDt);
  }

  body.appendChild(gr);
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Salvar Alterações',async()=>{
    const r=await Api.put(`/movimentacoes/${mov.id}`,fd);
    if(r?.success){Toast.show('Movimentação atualizada!');close();draw()}
    else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
},'560px')}

// ═══ DETALHE DA MOVIMENTAÇÃO ═══
function modalDetalheMovimentacao(id){showModal('Detalhe da Movimentação',async(body,close)=>{
  body.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-3)">Carregando...</div>';
  const m=await Api.movimentacaoDetalhe(id);
  if(!m||m.error){body.innerHTML=`<div style="color:var(--red)">${esc(m?.error||'Erro')}</div>`;return}
  body.innerHTML='';
  const tm={retirada:['Retirada','badge-orange'],aplicacao:['Aplicação','badge-green'],entrada:['Entrada','badge-primary'],descarte:['Descarte','badge-red']};
  const[tl,tc]=tm[m.tipo]||[m.tipo,'badge-gray'];
  body.appendChild(h('div',{style:{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}},
    h('span',{className:'mono text-muted',style:'font-size:20px;font-weight:700'},`#${m.id}`),
    h('span',{innerHTML:`<span class="badge ${tc}" style="font-size:13px">${tl}</span>`}),
    h('span',{className:'badge '+(m.status==='concluido'?'badge-green':'badge-orange')},m.status)));

  const grid=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:12px'});
  const field=(l,v,full)=>{const d=h('div',{style:full?'grid-column:1/-1':''});d.appendChild(h('div',{style:'font-size:11px;color:var(--text-4);text-transform:uppercase;font-weight:600;margin-bottom:2px'},l));d.appendChild(h('div',{style:'font-size:14px;font-weight:500'},v||'-'));return d};

  grid.appendChild(field('Vacina',m.nome_vacina));
  grid.appendChild(field('Código Vacina',m.vacina_codigo));
  grid.appendChild(field('Lote',m.numero_lote));
  grid.appendChild(field('Fabricante',m.lote_fabricante));
  grid.appendChild(field('Código de Barras',m.codigo_barras,true));
  grid.appendChild(field('Data / Hora',fmtDataHora(m.data_hora)));
  grid.appendChild(field('Quantidade',String(m.quantidade)));
  grid.appendChild(field('Paciente',m.cliente_nome?`${m.cliente_nome} [${m.cliente_codigo||''}]`:'-',true));
  grid.appendChild(field('Tipo Cliente',m.tipo_cliente));
  grid.appendChild(field('Tipo Atendimento',m.tipo_atendimento));
  grid.appendChild(field('Operador (retirou)',m.operador_nome?`${m.operador_nome} (${m.operador_cargo})`:'-'));
  grid.appendChild(field('Aplicador',m.aplicador_nome?`${m.aplicador_nome} (${m.aplicador_cargo})`:'-'));
  grid.appendChild(field('Local de Aplicação',m.local_aplicacao));
  grid.appendChild(field('Observações',m.observacoes,true));

  if(m.plano){grid.appendChild(field('Plano Vacinal',`${m.plano.nome} — ${m.plano.doses_aplicadas}/${m.plano.doses_vacina} doses`,true))}

  // Approval audit trail
  if(m.requer_aprovacao||m.justificativa||m.motivo_padrao||m.aprovador_nome){
    grid.appendChild(h('div',{style:'grid-column:1/-1;border-top:1px solid var(--border);padding-top:12px;margin-top:8px'}));
    grid.appendChild(h('div',{style:'grid-column:1/-1;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-4)'},'AUDITORIA DE APROVAÇÃO'));
    if(m.motivo_padrao)grid.appendChild(field('Motivo Padrão',m.motivo_padrao.replace(/_/g,' ')));
    if(m.justificativa)grid.appendChild(field('Justificativa',m.justificativa,true));
    if(m.aprovador_nome)grid.appendChild(field('Aprovador/Decisor',`${m.aprovador_nome} (${m.aprovador_cargo||''})`));
    if(m.aprovado_em)grid.appendChild(field('Data da Decisão',fmtDataHora(m.aprovado_em)));
    if(m.motivo_reprovacao)grid.appendChild(field('Motivo Reprovação',m.motivo_reprovacao,true));
    grid.appendChild(field('Impactou Estoque',m.impacta_estoque?'✅ Sim':'❌ Não'));
    if(m.estoque_aplicado_em)grid.appendChild(field('Estoque Aplicado Em',fmtDataHora(m.estoque_aplicado_em)));
  }

  body.appendChild(grid);
},'580px')}

await draw();

// ═══ AUTO-OPEN DETAIL if navigated via verMovimentacao ═══
if(AppState.movDetalheId){
  const detId=AppState.movDetalheId;
  AppState.movDetalheId=null;
  setTimeout(()=>modalDetalheMovimentacao(detId),200);
}

return wrap;}
