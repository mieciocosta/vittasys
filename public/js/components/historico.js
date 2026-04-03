async function renderHistorico(){
  const perfilFilter=AppState.filtroClientePerfil();
  let f={page:1,limit:50,search:'',tipo:'',tipo_cliente:perfilFilter,sort:'data_hora',order:'DESC'};
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
if(!perfilFilter){fb.appendChild(buildSelect([['','Cliente'],['ativo','⭐ Ativo'],['espontaneo','Espontâneo']],f.tipo_cliente,v=>{f.tipo_cliente=v;f.page=1;draw()}))}
wrap.appendChild(fb);

const data=await Api.movimentacoes(f);if(!data)return;
const tw=h('div',{className:'table-wrap'});
const t=buildSortableTable([['Data','data_hora'],['Tipo','tipo'],['Vacina','nome_vacina'],['Lote','numero_lote'],['Paciente','cliente_nome'],['Cliente',''],['Local','local_aplicacao'],['Operador',''],['Status','status'],['Ações','']],f,draw);
const tb=document.createElement('tbody');
if(!data.data.length)tb.innerHTML='<tr><td colspan="10" class="empty-state">Nenhuma movimentação</td></tr>';
else data.data.forEach(m=>{
  const tm={retirada:['Retirada','badge-orange'],aplicacao:['Aplicação','badge-green'],entrada:['Entrada','badge-primary'],descarte:['Descarte','badge-red'],ajuste:['Ajuste','badge-navy'],estorno:['Estorno','badge-purple']};
  const[tl,tc]=tm[m.tipo]||[m.tipo,'badge-gray'];
  const tr=h('tr',{className:'clickable'});
  if(m.tipo_cliente==='ativo')tr.style.borderLeft='3px solid var(--primary)';
  tr.innerHTML=`<td class="mono">${fmtDataHora(m.data_hora)}</td><td><span class="badge ${tc}">${tl}</span></td><td class="fw-600" style="cursor:pointer" onclick="event.stopPropagation()">${esc(m.nome_vacina||'-')}</td><td class="mono">${esc(m.numero_lote||'-')}</td><td style="cursor:pointer" onclick="if(${m.cliente_id})AppState.verCliente(${m.cliente_id})">${esc(m.cliente_nome||'-')} ${m.codigo_cliente?'<span class="mono text-muted">['+esc(m.codigo_cliente)+']</span>':''}</td><td>${m.tipo_cliente?tipoClienteBadge(m.tipo_cliente):'-'}</td><td class="text-sm">${esc(m.local_aplicacao||'-')}</td><td class="text-muted">${esc(m.usuario_nome||'-')}</td><td><span class="badge ${m.status==='concluido'?'badge-green':'badge-orange'}">${m.status}</span></td>`;
  // Actions
  const actTd=document.createElement('td');actTd.style.whiteSpace='nowrap';
  actTd.appendChild(iconBtn('btn btn-outline btn-sm',null,'Editar',e=>{e.stopPropagation();modalEditarMovimentacao(m)},{style:{marginRight:'4px'}}));
  // Delete only if no unidade_id (not from bipe)
  if(!m.unidade_id){
    actTd.appendChild(iconBtn('btn btn-red btn-sm',null,'Excluir',async e=>{e.stopPropagation();
      if(!confirm(`Excluir movimentação de ${m.nome_vacina||'?'} em ${fmtDataHora(m.data_hora)}?`))return;
      const r=await Api.del(`/movimentacoes/${m.id}`);
      if(r?.success){Toast.show('Movimentação excluída');draw()}else Toast.show(r?.error||'Erro','error')}));
  }
  tr.appendChild(actTd);tb.appendChild(tr);
});
t.appendChild(tb);tw.appendChild(t);
tw.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
wrap.appendChild(tw);
}

// ═══ NOVA MOVIMENTAÇÃO (with validation) ═══
function modalNovaMovimentacao(){showModal('Nova Movimentação',async(body,close)=>{
  const fd={usuario_id:AppState.usuario.id,quantidade:1};
  const vacs=await Api.vacinas()||[];
  const lotes=await Api.lotes({limit:200})||{data:[]};

  const gr=h('div',{className:'form-grid'});

  // Tipo (obrigatório)
  const dTipo=h('div');dTipo.appendChild(h('label',{className:'label',style:{color:'var(--red)'}},'Tipo * (obrigatório)'));
  dTipo.appendChild(buildSelect([['','— Selecione o tipo —'],['entrada','Entrada'],['retirada','Retirada (manual)'],['ajuste','Ajuste'],['descarte','Descarte'],['estorno','Estorno']],fd.tipo||'',v=>{fd.tipo=v}));
  gr.appendChild(dTipo);

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

  body.appendChild(gr);
  body.appendChild(h('div',{style:{marginTop:'12px',padding:'10px',background:'var(--primary-bg)',borderRadius:'8px',fontSize:'12px',color:'var(--primary-dark)'}},'ℹ️ Tipo e Vacina são obrigatórios. Para retirada/aplicação, cliente e local são obrigatórios.'));
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Registrar Movimentação',async()=>{
    if(!fd.tipo)return Toast.show('Selecione o tipo de movimentação','error');
    if(!fd.nome_vacina&&!fd.vacina_id)return Toast.show('Selecione a vacina','error');
    if(['retirada','aplicacao'].includes(fd.tipo)&&!fd.local_aplicacao)return Toast.show('Local de aplicação obrigatório para retirada','error');
    const r=await Api.criarMovimentacao(fd);
    if(r?.success){Toast.show('Movimentação registrada!');close();draw()}
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

await draw();return wrap;}
