function buildSearchBox(ph,onInput,val){const w=h('div',{className:'search-box'});w.appendChild(h('span',{className:'s-icon',innerHTML:I.search}));const inp=h('input',{placeholder:ph,value:val||''});inp.addEventListener('input',debounce(e=>onInput(e.target.value),250));w.appendChild(inp);return w}
function buildFilterChips(opts,active,onChange){const w=h('div',{className:'filter-chips'});opts.forEach(([v,l])=>w.appendChild(h('button',{className:`filter-chip ${active===v?'active':''}`,onClick:()=>onChange(v)},l)));return w}
function buildSelect(opts,val,onChange){const s=h('select',{className:'input select'});opts.forEach(([v,l])=>{const o=h('option',{value:v},l);if(v==val)o.selected=true;s.appendChild(o)});s.addEventListener('change',e=>onChange(e.target.value));return s}

// ═══ SORTABLE TABLE HEADERS ═══
// cols: [[label, sortKey], ...] — sortKey='' means not sortable
// f: filter object with f.sort and f.order
// onSort: callback(newSort, newOrder)
function buildSortableTable(cols, f, onSort) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  cols.forEach(([label, sortKey]) => {
    const th = document.createElement('th');
    if (sortKey) {
      th.style.cursor = 'pointer';
      th.style.userSelect = 'none';
      th.title = 'Ordenar por ' + label;
      const isActive = f.sort === sortKey;
      th.innerHTML = label + (isActive ? (f.order === 'DESC' ? ' <span style="opacity:.6">▼</span>' : ' <span style="opacity:.6">▲</span>') : ' <span style="opacity:.2">⇅</span>');
      th.addEventListener('click', () => {
        if (f.sort === sortKey) f.order = f.order === 'DESC' ? 'ASC' : 'DESC';
        else { f.sort = sortKey; f.order = 'ASC'; }
        onSort();
      });
    } else {
      th.textContent = label;
    }
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);
  return table;
}

// ═══════════════════════════════════════════════════════════
// confirmarExclusao — helper global para botões de exclusão
// Se master: modal com justificativa → executa diretamente
// Se não-master: modal com justificativa → envia para aprovação
// ═══════════════════════════════════════════════════════════
function confirmarExclusao({entidade, entidadeId, label, snapshot, deleteFn, onSuccess}){
  if(!AppState.usuario)return;
  const isMaster=AppState.isMaster();
  const titulo=isMaster?`Excluir: ${label}`:`Solicitar exclusão: ${label}`;

  showModal(titulo,async(body,close)=>{
    // Warning banner
    const bannerColor=isMaster?'#fef2f2':'#fffbeb';
    const bannerBorder=isMaster?'#fca5a5':'#fcd34d';
    const bannerText=isMaster?'#dc2626':'#92400e';
    body.appendChild(h('div',{style:`padding:12px 16px;background:${bannerColor};border:1px solid ${bannerBorder};border-radius:8px;margin-bottom:16px`},
      h('div',{style:`font-weight:700;color:${bannerText};font-size:13px`},
        isMaster?'⚠️ Esta ação será executada imediatamente':'📋 Solicitação será enviada para aprovação do master'),
      h('div',{style:`font-size:12px;color:${bannerText};opacity:0.85;margin-top:4px`},
        isMaster?'O registro será excluído ou inativado permanentemente':'Enquanto pendente, o registro ficará bloqueado para edição/exclusão')
    ));

    // Justification field
    body.appendChild(h('label',{className:'label',style:'margin-bottom:4px;display:block'},'Justificativa *'));
    const ta=h('textarea',{className:'input',placeholder:'Descreva o motivo da exclusão (mínimo 6 caracteres)...',rows:'3',style:'resize:vertical;width:100%;box-sizing:border-box'});
    body.appendChild(ta);
    const errMsg=h('div',{style:'font-size:11px;color:#dc2626;margin-top:4px;display:none'});
    body.appendChild(errMsg);

    body.appendChild(h('div',{style:'margin-top:16px'}));

    const btnClass=isMaster?'btn btn-red btn-block btn-lg':'btn btn-primary btn-block btn-lg';
    const btnLabel=isMaster?'🗑 Confirmar Exclusão':'📤 Enviar para Aprovação';

    body.appendChild(h('button',{className:btnClass,onClick:async()=>{
      const motivo=ta.value.trim();
      if(motivo.length<6){
        errMsg.textContent='Justificativa deve ter no mínimo 6 caracteres';
        errMsg.style.display='block';ta.focus();return;
      }
      if(!motivo.replace(/\s/g,'')){
        errMsg.textContent='Justificativa não pode conter apenas espaços';
        errMsg.style.display='block';ta.focus();return;
      }
      errMsg.style.display='none';

      if(isMaster){
        const r=await deleteFn();
        if(r?.success!==false&&!r?.error){
          Toast.show(typeof r?.message==='string'?r.message:`${label} excluído com sucesso`);
          close();if(onSuccess)onSuccess(r);
        }else{
          Toast.show(r?.error||'Erro ao excluir','error');
        }
      }else{
        const r=await Api.solicitarExclusao(
          entidade,entidadeId,label,snapshot,motivo,
          AppState.usuario.id,AppState.usuario.nome
        );
        if(r?.success){
          Toast.show('⏳ Exclusão enviada para aprovação do master');
          close();if(onSuccess)onSuccess(r);
        }else{
          Toast.show(r?.error||'Erro ao solicitar exclusão','error');
        }
      }
    }},btnLabel));
  },'480px');
}

// ═══════════════════════════════════════════════════════════
// confirmarSimples — substitui confirm() do browser
// Uso: confirmarSimples('Título','Mensagem', ()=>callback(), 'Confirmar')
// ═══════════════════════════════════════════════════════════
function confirmarSimples(titulo, mensagem, onConfirm, btnLabel='Confirmar', btnClass='btn btn-primary'){
  showModal(titulo,(body,close)=>{
    body.appendChild(h('p',{style:'margin:0 0 20px;font-size:14px;color:var(--text-1);line-height:1.5'},mensagem));
    const row=h('div',{style:'display:flex;gap:10px'});
    row.appendChild(h('button',{className:'btn btn-outline',style:'flex:1',onClick:()=>close()},'Cancelar'));
    row.appendChild(h('button',{className:btnClass,style:'flex:1',onClick:()=>{close();onConfirm();}},(btnLabel)));
    body.appendChild(row);
  },'400px');
}
