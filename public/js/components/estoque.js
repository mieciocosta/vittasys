async function renderEstoque(){
  let f={page:1,limit:50,search:'',status:'',vencimento:'',sort:'id',order:'DESC'};
  const wrap=h('div',{className:'fade-in'});

async function draw(){wrap.innerHTML='';
  const hdr=h('div',{className:'page-header'});
  hdr.appendChild(h('div',{className:'page-header-left'},h('h1',{className:'page-title'},'Estoque / Câmara Fria'),h('p',{className:'page-subtitle'},'Lotes, validades, códigos de barras e rastreabilidade')));
  const acts=h('div',{className:'page-header-actions'});
  acts.appendChild(iconBtn('btn btn-primary btn-sm',I.barcode,'Cadastro por Código de Barras',()=>modalCadastroBarras()));
  acts.appendChild(iconBtn('btn btn-outline btn-sm',I.plus,'Nova Vacina Avulsa',()=>modalNovaVacina()));
  acts.appendChild(iconBtn('btn btn-outline btn-sm',I.plus,'Novo Lote',()=>modalNovoLote()));
  acts.appendChild(iconBtn('btn btn-navy btn-sm',I.upload,'Importar NF-e',()=>modalImportarNFe()));
  hdr.appendChild(acts);wrap.appendChild(hdr);

  const fb=h('div',{className:'filters-bar'});
  fb.appendChild(buildSearchBox('Buscar por vacina, lote, fabricante ou código de barras...',v=>{f.search=v;f.page=1;draw()},f.search));
  fb.appendChild(buildSelect([['','Status'],['disponivel','Disponível'],['reservado','Reservado'],['esgotado','Esgotado'],['vencido','Vencido']],f.status,v=>{f.status=v;f.page=1;draw()}));
  fb.appendChild(buildSelect([['','Validade'],['proximo','Próx. 30d'],['vencido','Vencidos']],f.vencimento,v=>{f.vencimento=v;f.page=1;draw()}));
  wrap.appendChild(fb);

  const data=await Api.lotes(f);
  if(!data||!data.data){wrap.appendChild(h('div',{className:'empty-state'},'Erro ao carregar estoque'));return}

  const tw=h('div',{className:'table-wrap'});
  const isMaster=AppState.usuario?.perfil==='master';
  const cols=[['Vacina','vacina_nome'],['Fabricante','fabricante'],['Lote','numero_lote'],
    ['Estoque','quantidade_disponivel'],['Unid.',''],['Validade','validade'],['Local',''],
    ['Custo','valor_unitario_custo'],['Status','status']];
  if(isMaster)cols.push(['Ações','']);
  const t=buildSortableTable(cols,f,draw);

  const tb=document.createElement('tbody');
  if(!data.data.length){tb.innerHTML='<tr><td colspan="10" class="empty-state">Nenhum lote encontrado</td></tr>'}
  else data.data.forEach(l=>{
    const dias=l.dias_para_vencer;const st=statusVenc(dias);
    const pct=l.quantidade_total>0?Math.round(l.quantidade_disponivel/l.quantidade_total*100):0;
    const bc=l.quantidade_disponivel<5?'#dc2626':l.quantidade_disponivel<15?'#d97706':'#2BBCB3';
    const sm2={disponivel:'badge-green',reservado:'badge-primary',esgotado:'badge-gray',vencido:'badge-red',inativo:'badge-gray'};
    const tr=h('tr',{style:{cursor:'pointer'},onClick:()=>modalDetalheLote(l.id)});
    if(dias<=30&&dias>=0)tr.style.background='#fffbeb';
    if(dias<0)tr.style.background='#fef2f2';
    tr.innerHTML=`
      <td class="fw-600">${esc(l.vacina_nome)}<div class="text-sm text-muted">${esc(l.vacina_codigo||'')}</div></td>
      <td class="text-muted">${esc(l.fabricante)}</td>
      <td class="mono">${esc(l.numero_lote)}</td>
      <td><div class="stock-bar"><div class="stock-bar-track"><div class="stock-bar-fill" style="width:${pct}%;background:${bc}"></div></div><span class="mono fw-600">${l.quantidade_disponivel}/${l.quantidade_total}</span></div></td>
      <td class="mono">${l.unidades_disponiveis||0}</td>
      <td><span class="badge ${st.cls}">${fmtData(l.validade)}</span><div class="text-sm text-muted">${st.label}</div></td>
      <td class="text-sm">${esc(l.local_armazenamento||'-')}</td>
      <td class="mono text-sm">${l.valor_unitario_custo?fmtMoeda(l.valor_unitario_custo):'-'}</td>
      <td><span class="badge ${sm2[l.status]||'badge-gray'}">${l.status}</span></td>`;
    // Master actions
    if(isMaster){
      const actTd=document.createElement('td');actTd.style.whiteSpace='nowrap';
      actTd.appendChild(iconBtn('btn btn-outline btn-sm',null,'✏️',async e=>{
        e.stopPropagation();
        showModal(`Editar Lote #${l.id} — ${esc(l.vacina_nome)}`,async(body,close)=>{
          const fd={numero_lote:l.numero_lote,fabricante:l.fabricante,local_armazenamento:l.local_armazenamento,valor_unitario_custo:l.valor_unitario_custo||0,status:l.status};
          // Read-only info
          body.appendChild(h('div',{style:{padding:'10px 12px',background:'var(--bg-subtle)',borderRadius:'8px',marginBottom:'16px',fontSize:'12px',color:'var(--text-3)'}},
            `Vacina: ${esc(l.vacina_nome)} · Validade: ${fmtData(l.validade)} · Estoque: ${l.quantidade_disponivel}/${l.quantidade_total}`));
          const gr=h('div',{className:'form-grid'});
          [['numero_lote','Nº do Lote'],['fabricante','Fabricante'],['local_armazenamento','Local de Armazenamento']].forEach(([k,lab])=>{
            const d=h('div');d.appendChild(h('label',{className:'label'},lab));
            const inp=h('input',{className:'input',value:fd[k]||''});inp.addEventListener('input',ev=>{fd[k]=ev.target.value});
            d.appendChild(inp);gr.appendChild(d);
          });
          // Custo unitário
          const dCusto=h('div');dCusto.appendChild(h('label',{className:'label'},'Custo Unitário (R$)'));
          const cInp=h('input',{className:'input',type:'number',step:'0.01',value:fd.valor_unitario_custo||''});
          cInp.addEventListener('input',ev=>{fd.valor_unitario_custo=parseFloat(ev.target.value)||0});
          dCusto.appendChild(cInp);gr.appendChild(dCusto);
          // Status
          const dSt=h('div');dSt.appendChild(h('label',{className:'label'},'Status'));
          dSt.appendChild(buildSelect([['disponivel','Disponível'],['esgotado','Esgotado'],['inativo','Inativo']],fd.status||'',v=>{fd.status=v}));
          gr.appendChild(dSt);
          body.appendChild(gr);
          if(l.status==='reservado'){
            body.appendChild(h('div',{style:{padding:'10px',background:'#fef3c7',borderRadius:'8px',marginTop:'8px',fontSize:'12px',color:'#92400e'}},
              '⚠ Este lote está reservado. Para liberar, clique no lote para ver as reservas pendentes e aprove/reprove na tela de Aprovações.'));
          }
          body.appendChild(h('div',{style:{fontSize:'11px',color:'#94a3b8',marginTop:'8px'}},'⚠ Vacina e validade não podem ser alterados para preservar rastreabilidade'));
          body.appendChild(iconBtn('btn btn-primary btn-block',null,'Salvar',async()=>{
            const r=await Api.atualizarLote(l.id,fd);
            if(r?.success){Toast.show('Lote atualizado');close();draw()}else Toast.show(r?.error||'Erro','error');
          },{style:{marginTop:'16px'}}));
        },'520px');
      },{style:{marginRight:'4px'}}));
      actTd.appendChild(iconBtn('btn btn-red btn-sm',null,'🗑',async e=>{
        e.stopPropagation();
        const msg=l.quantidade_disponivel>0?
          `Lote #${l.id} tem ${l.quantidade_disponivel} unidades. Será INATIVADO (histórico preservado). Confirmar?`:
          `Excluir lote #${l.id} permanentemente?`;
        if(!confirm(msg))return;
        const r=await Api.excluirLote(l.id);
        if(r?.success){Toast.show(r.message);draw()}else Toast.show(r?.error||'Erro','error');
      }));
      tr.appendChild(actTd);
    }
    tb.appendChild(tr);
  });
  t.appendChild(tb);tw.appendChild(t);
  tw.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
  wrap.appendChild(tw);
}

// ═══ DETALHE DO LOTE ═══
function modalDetalheLote(id){showModal('Detalhamento do Lote',async(body,close)=>{
  body.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-3)">Carregando...</div>';
  const l=await Api.loteDetalhe(id);
  if(!l||l.error){body.innerHTML=`<div style="color:var(--red)">${esc(l?.error||'Erro')}</div>`;return}
  body.innerHTML='';

  const sm2={disponivel:'badge-green',reservado:'badge-primary',esgotado:'badge-gray',vencido:'badge-red',inativo:'badge-gray'};

  // ═══ HEADER ═══
  body.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}},
    h('div',null,
      h('div',{style:{fontSize:'18px',fontWeight:'700',color:'var(--navy)'}},esc(l.vacina_nome)),
      h('div',{style:{fontSize:'12px',color:'var(--text-3)'}},`Código: ${esc(l.vacina_codigo||'-')} · Lote: ${esc(l.numero_lote)}`)
    ),
    h('span',{className:`badge ${sm2[l.status]||'badge-gray'}`,style:'font-size:13px'},l.status)
  ));

  // ═══ CARDS DE ESTOQUE ═══
  const grid=h('div',{style:'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px'});
  const fld=(label,value,color)=>{const d=h('div',{style:'padding:10px;background:var(--bg-subtle);border-radius:8px'});d.innerHTML=`<div style="font-size:10px;color:var(--text-4);text-transform:uppercase;font-weight:600">${label}</div><div style="font-size:16px;font-weight:700;color:${color||'var(--text-1)'};margin-top:2px">${value}</div>`;return d};
  grid.appendChild(fld('Disponível',`${l.quantidade_disponivel} / ${l.quantidade_total}`,l.quantidade_disponivel<5?'#dc2626':'#2BBCB3'));
  grid.appendChild(fld('Aplicadas',String(l.quantidade_aplicada||0),'var(--primary)'));
  grid.appendChild(fld('Validade',fmtData(l.validade),l.dias_para_vencer<0?'#dc2626':l.dias_para_vencer<30?'#d97706':'#059669'));
  grid.appendChild(fld('Fabricante',esc(l.fabricante)));
  grid.appendChild(fld('Local',esc(l.local_armazenamento||'-')));
  grid.appendChild(fld('Custo Unit.',l.valor_unitario_custo?fmtMoeda(l.valor_unitario_custo):'-'));
  body.appendChild(grid);

  // ═══ DEMANDA: Pacientes que precisam desta vacina ═══
  if(l.demanda_planos?.length){
    const sec=h('div',{style:'margin-bottom:16px;border:1px solid #bfdbfe;border-radius:10px;overflow:hidden'});
    sec.appendChild(h('div',{style:'padding:10px 14px;background:#eff6ff;font-size:12px;font-weight:700;color:#1e40af'},'📋 Demanda — Pacientes aguardando esta vacina ('+l.demanda_planos.length+' doses pendentes)'));
    const tb=h('div',{style:'max-height:200px;overflow-y:auto'});
    l.demanda_planos.forEach(d=>{
      const isChild=d.tipo_paciente==='crianca'||d.tipo_paciente==='bebe';
      const row=h('div',{style:'display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #f1f5f9;font-size:12px'});
      row.innerHTML=`
        <span class="fw-600" style="min-width:160px">${isChild?'👶 ':''}${esc(d.paciente)}</span>
        ${d.responsavel?`<span class="text-muted" style="font-size:11px">👤 ${esc(d.responsavel)}</span>`:''}
        <span class="mono text-muted" style="font-size:10px">${esc(d.codigo_cliente||'')}</span>
        <span class="badge badge-primary" style="font-size:9px">Dose ${d.dose_numero}</span>
        <span class="text-muted" style="font-size:10px">${esc(d.plano||'')}</span>
        ${d.competencia?`<span class="mono text-muted" style="font-size:10px">Prev: ${d.competencia}</span>`:''}`;
      tb.appendChild(row);
    });
    sec.appendChild(tb);body.appendChild(sec);
  }

  // ═══ PENDENTES DE APROVAÇÃO (fora do plano aguardando master) ═══
  if(l.pendentes_aprovacao?.length){
    const sec=h('div',{style:'margin-bottom:16px;border:1px solid #fcd34d;border-radius:10px;overflow:hidden'});
    sec.appendChild(h('div',{style:'padding:10px 14px;background:#fef3c7;font-size:12px;font-weight:700;color:#92400e'},'⏳ Pendentes de Aprovação — '+l.pendentes_aprovacao.length+' solicitações'));
    l.pendentes_aprovacao.forEach(p=>{
      const row=h('div',{style:'padding:8px 14px;border-bottom:1px solid #f1f5f9;font-size:12px'});
      row.innerHTML=`
        <div><span class="fw-600">${esc(p.paciente||'-')}</span>${p.responsavel?` <span class="text-muted">(Resp: ${esc(p.responsavel)})</span>`:''} ${p.codigo_cliente?'['+esc(p.codigo_cliente)+']':''}</div>
        <div class="text-muted" style="font-size:11px;margin-top:2px">Solicitado por: ${esc(p.solicitante||'-')} (${esc(p.solicitante_cargo||'-')}) · ${fmtDataHora(p.data)}</div>
        ${p.justificativa?`<div style="font-size:11px;color:#d97706;margin-top:2px">Justificativa: ${esc(p.justificativa)}</div>`:''}`;
      sec.appendChild(row);
    });
    body.appendChild(sec);
  }

  // ═══ HISTÓRICO DE MOVIMENTAÇÕES ═══
  if(l.movimentacoes?.length){
    const sec=h('div',{style:'border-top:1px solid var(--border);padding-top:12px'});
    sec.appendChild(h('div',{style:'font-size:12px;font-weight:700;color:var(--text-2);margin-bottom:8px'},`📦 Movimentações (${l.total_movimentacoes})`));
    l.movimentacoes.forEach(m=>{
      const tc2={retirada:'badge-orange',entrada:'badge-green',descarte:'badge-red',ajuste:'badge-gray',estorno:'badge-primary'};
      const stc={concluido:'badge-green',pendente_aprovacao:'badge-orange',reprovado:'badge-red'};
      const row=h('div',{style:'display:grid;grid-template-columns:auto auto 1fr auto;gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:11px'});
      row.innerHTML=`
        <span class="mono text-muted">${fmtDataHora(m.data)}</span>
        <span class="badge ${tc2[m.tipo]||'badge-gray'}" style="font-size:10px">${m.tipo}${m.motivo_padrao==='vacina_fora_plano'?' ⚠':''}</span>
        <span>${m.paciente?`<strong>${esc(m.paciente)}</strong>${m.responsavel?' <span class="text-muted">('+esc(m.responsavel)+')</span>':''}`:''} ${m.operador?`<span class="text-muted">por ${esc(m.operador)}</span>`:''} ${m.local?`· ${esc(m.local)}`:''}</span>
        <span class="badge ${stc[m.status]||'badge-gray'}" style="font-size:9px">${m.status==='concluido'?'✓':m.status==='pendente_aprovacao'?'⏳':'✗'}</span>`;
      sec.appendChild(row);
    });
    body.appendChild(sec);
  }
},'680px')}

// ═══ CADASTRO POR CÓDIGO DE BARRAS (NOVO) ═══
function modalCadastroBarras(){showModal('Cadastro por Código de Barras',async(body,close)=>{
  const fd={quantidade:1,usuario_id:AppState.usuario?.id};
  let lookupDone=false;
  // Preload vaccines for select
  window._vittaVacinas=await Api.vacinas()||[];

  // Barcode input (FIRST — autofocus for scanner)
  const barcodeSection=h('div',{style:{marginBottom:'20px',padding:'20px',background:'var(--primary-bg)',borderRadius:'12px',border:'2px solid var(--primary)'}});
  barcodeSection.appendChild(h('div',{className:'label',style:{color:'var(--primary-dark)',fontSize:'12px'}},'CÓDIGO DE BARRAS (bipe ou digite)'));
  const barcodeInput=h('input',{className:'scanner-input',placeholder:'Bipe o código ou digite aqui...',style:{fontSize:'18px',padding:'16px',fontFamily:'var(--mono)',letterSpacing:'2px',textAlign:'center'}});
  barcodeSection.appendChild(barcodeInput);
  barcodeSection.appendChild(h('div',{style:{fontSize:'11px',color:'var(--text-3)',marginTop:'6px',textAlign:'center'}},'Após bipar, o sistema busca automaticamente. Se não encontrar, preencha os campos abaixo.'));
  body.appendChild(barcodeSection);

  // Auto-lookup on barcode input
  const statusDiv=h('div',{id:'barcode-status',style:{marginBottom:'16px'}});
  body.appendChild(statusDiv);

  barcodeInput.addEventListener('input',debounce(async(e)=>{
    const code=e.target.value.trim();fd.codigo_barras=code;
    if(code.length<4){statusDiv.innerHTML='';lookupDone=false;return}
    statusDiv.innerHTML='<div style="padding:8px;color:var(--text-3);font-size:13px">🔍 Buscando...</div>';
    const r=await Api.buscarPorBarcode(code);
    if(r&&r.found){
      lookupDone=true;
      const v=r.vacina;const l=r.lote;
      statusDiv.innerHTML=`<div style="padding:12px;background:var(--green-bg);border-radius:8px;border:1px solid var(--green-badge)"><div style="font-weight:700;color:var(--green-text);margin-bottom:4px">✓ Código encontrado!</div><div style="font-size:13px;color:var(--green-text)">Vacina: <strong>${esc(v.nome)}</strong> (${esc(v.fabricante)})<br>Lote: <strong>${esc(l?.numeroLote||'-')}</strong> · Estoque: ${l?.quantidadeDisponivel||0}</div></div>`;
      // Pre-fill form
      fd.nome_vacina=v.nome;fd.fabricante=v.fabricante;fd.codigo_vacina=v.codigo;
      if(l){fd.numero_lote=l.numeroLote||l.numero_lote;const vd=l.validade||l.expirationDate;if(vd)fd.validade=String(vd).slice(0,10)}
      fillForm();
    }else{
      lookupDone=false;
      statusDiv.innerHTML='<div style="padding:8px;background:var(--orange-bg);border-radius:8px;font-size:13px;color:var(--orange-text)">Código não encontrado. Preencha os dados para cadastrar.</div>';
    }
  },400));

  // Form fields
  const formDiv=h('div',{id:'barcode-form'});
  body.appendChild(formDiv);
  fillForm();

  function fillForm(){
    formDiv.innerHTML='';
    const vacs=window._vittaVacinas||[];
    const gr=h('div',{className:'form-grid'});
    // Vaccine SELECT — standard names + existing
    const d1=h('div');d1.appendChild(h('label',{className:'label',style:fd.nome_vacina?'color:var(--primary)':''},'NOME DA VACINA *'+(fd.nome_vacina?' ✓':'')));
    const selOpts=[['','— Selecione a vacina —'],...vacs.map(v=>[v.nome,v.nome])];
    d1.appendChild(buildVacSelect(vacs,fd.nome_vacina||'',(_id,v)=>{fd.nome_vacina=v.nome;const match=vacs.find(x=>x.nome===v.nome);if(match){fd.fabricante=match.fabricante;fd.codigo_vacina=match.codigo;fillForm()}},'Buscar vacina pelo nome...'));
    gr.appendChild(d1);
    // Fabricante dropdown
    const d2=h('div');d2.appendChild(h('label',{className:'label',style:fd.fabricante?'color:var(--primary)':''},'Fabricante *'+(fd.fabricante?' ✓':'')));
    d2.appendChild(buildSelect([['','— Selecione —'],...FABRICANTES.map(f=>[f,f])],fd.fabricante||'',v=>{fd.fabricante=v}));
    gr.appendChild(d2);
    // Lote
    const d3=h('div');d3.appendChild(h('label',{className:'label',style:fd.numero_lote?'color:var(--primary)':''},'Nº do Lote *'+(fd.numero_lote?' ✓':'')));
    const i3=h('input',{className:'input',value:fd.numero_lote||'',placeholder:'Ex: BCG-202601',style:fd.numero_lote?'border-color:var(--primary);font-weight:600':''});
    i3.addEventListener('input',e=>{fd.numero_lote=e.target.value});d3.appendChild(i3);gr.appendChild(d3);
    // Validade
    const d4=h('div');d4.appendChild(h('label',{className:'label'},'Validade *'));
    const valStr=fd.validade?String(fd.validade).slice(0,10):'';
    const i4=h('input',{className:'input',type:'month',value:valStr});
    i4.addEventListener('input',e=>{fd.validade=e.target.value});d4.appendChild(i4);gr.appendChild(d4);
    // Quantidade
    const d5=h('div');d5.appendChild(h('label',{className:'label'},'Quantidade'));
    const i5=h('input',{className:'input',type:'number',value:fd.quantidade||1,min:'1'});
    i5.addEventListener('input',e=>{fd.quantidade=parseInt(e.target.value)||1});d5.appendChild(i5);gr.appendChild(d5);
    // Custo
    const d6=h('div');d6.appendChild(h('label',{className:'label'},'Custo Unit. R$'));
    const i6=h('input',{className:'input',type:'number',value:fd.custo_unitario||0,step:'0.01'});
    i6.addEventListener('input',e=>{fd.custo_unitario=parseFloat(e.target.value)||0});d6.appendChild(i6);gr.appendChild(d6);
    // Local
    const d7=h('div');d7.appendChild(h('label',{className:'label'},'Local Armazenamento'));
    const i7=h('input',{className:'input',value:fd.local_armazenamento||'Câmara Fria Principal'});
    i7.addEventListener('input',e=>{fd.local_armazenamento=e.target.value});d7.appendChild(i7);gr.appendChild(d7);
    // Observações
    const d8=h('div');d8.appendChild(h('label',{className:'label'},'Observações'));
    const i8=h('input',{className:'input',value:fd.observacoes||''});
    i8.addEventListener('input',e=>{fd.observacoes=e.target.value});d8.appendChild(i8);gr.appendChild(d8);
    formDiv.appendChild(gr);
  }

  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',I.check,'Cadastrar Vacina',async()=>{
    if(!fd.codigo_barras)return Toast.show('Bipe ou digite o código de barras','error');
    if(!fd.nome_vacina)return Toast.show('Nome da vacina é obrigatório','error');
    if(!fd.fabricante)return Toast.show('Fabricante é obrigatório','error');
    if(!fd.numero_lote)return Toast.show('Número do lote é obrigatório','error');
    if(!fd.validade)return Toast.show('Validade é obrigatória','error');
    const r=await Api.cadastroBarras(fd);
    if(r?.success){Toast.show(r.message);close();draw()}
    else Toast.show(r?.error||'Erro ao cadastrar','error');
  },{style:{marginTop:'20px'}}));

  // Focus barcode input for scanner
  setTimeout(()=>barcodeInput.focus(),100);
},'640px')}

// ═══ NOVA VACINA AVULSA ═══
function modalNovaVacina(){showModal('Cadastrar Nova Vacina',async(body,close)=>{
  const fd={};
  const vacs=await Api.vacinas()||[];

  // Barcode
  const bSec=h('div',{style:'margin-bottom:18px;padding:16px;background:var(--primary-bg);border-radius:12px;border:2px solid var(--primary)'});
  bSec.appendChild(h('div',{className:'label',style:'color:var(--primary-dark);font-size:12px'},'CÓDIGO DE BARRAS (bipe ou digite)'));
  const bInp=h('input',{className:'scanner-input',placeholder:'Bipe o código ou digite aqui...',style:'font-size:18px;padding:14px;font-family:var(--mono);letter-spacing:2px;text-align:center'});
  bInp.addEventListener('input',e=>{fd.codigo_barras=e.target.value.trim()});
  bSec.appendChild(bInp);
  bSec.appendChild(h('div',{style:'font-size:11px;color:var(--text-3);margin-top:6px;text-align:center'},'Opcional. Vincula o código de barras à vacina.'));
  body.appendChild(bSec);

  const gr=h('div',{className:'form-grid'});
  // Código
  const dc=h('div');dc.appendChild(h('label',{className:'label'},'CÓDIGO *'));
  const ic=h('input',{className:'input',placeholder:'Ex: BCG, HEXA, PCV20...'});
  ic.addEventListener('input',e=>{fd.codigo=e.target.value});dc.appendChild(ic);gr.appendChild(dc);
  // Nome — dropdown
  const dn=h('div');dn.appendChild(h('label',{className:'label'},'NOME *'));
  dn.appendChild(buildVacSelect(vacs,'',(_id,v)=>{fd.nome=v.nome;const m=vacs.find(x=>x.nome===v.nome);if(m){fd.fabricante=m.fabricante;ic.value=m.codigo;fd.codigo=m.codigo;rebuildFab()}},'Buscar vacina pelo nome...'));
  gr.appendChild(dn);
  // Fabricante
  const df=h('div');df.appendChild(h('label',{className:'label'},'FABRICANTE *'));
  let fabSel=buildSelect([['','— Selecione —'],...FABRICANTES.map(f=>[f,f])],fd.fabricante||'',v=>{fd.fabricante=v});
  df.appendChild(fabSel);gr.appendChild(df);
  function rebuildFab(){df.innerHTML='';df.appendChild(h('label',{className:'label'},'FABRICANTE *'));fabSel=buildSelect([['','— Selecione —'],...FABRICANTES.map(f=>[f,f])],fd.fabricante||'',v=>{fd.fabricante=v});df.appendChild(fabSel)}
  // Laboratório
  const dl=h('div');dl.appendChild(h('label',{className:'label'},'LABORATÓRIO'));
  const il=h('input',{className:'input'});il.addEventListener('input',e=>{fd.laboratorio=e.target.value});dl.appendChild(il);gr.appendChild(dl);
  // Categoria dropdown
  const dcat=h('div');dcat.appendChild(h('label',{className:'label'},'CATEGORIA'));
  dcat.appendChild(buildSelect([['','— Selecione —'],['Calendário','Calendário'],['Premium','Premium'],['Sazonal','Sazonal'],['Viagem','Viagem'],['Ocupacional','Ocupacional']],'',v=>{fd.categoria=v}));
  gr.appendChild(dcat);
  // Custo + Venda
  [['valor_custo_medio','CUSTO MÉDIO R$','0'],['valor_venda_sugerido','VENDA SUGERIDA R$','0']].forEach(([k,l,ph])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));
    const inp=h('input',{className:'input',type:'number',placeholder:ph,step:'0.01'});
    inp.addEventListener('input',e=>{fd[k]=parseFloat(e.target.value)||0});d.appendChild(inp);gr.appendChild(d)});
  body.appendChild(gr);
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'✓ Cadastrar Vacina',async()=>{
    if(!fd.codigo||!fd.nome||!fd.fabricante)return Toast.show('Código, nome e fabricante obrigatórios','error');
    const r=await Api.criarVacina(fd);if(r?.success){Toast.show('Vacina cadastrada!');close();draw()}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
  setTimeout(()=>bInp.focus(),100);
},'560px')}

// ═══ NOVO LOTE ═══
function modalNovoLote(){showModal('Cadastrar Novo Lote',async(body,close)=>{
  const fd={};const vacs=await Api.vacinas()||[];

  // Barcode
  const bSec=h('div',{style:'margin-bottom:18px;padding:16px;background:var(--primary-bg);border-radius:12px;border:2px solid var(--primary)'});
  bSec.appendChild(h('div',{className:'label',style:'color:var(--primary-dark);font-size:12px'},'CÓDIGO DE BARRAS (bipe ou digite)'));
  const bInp=h('input',{className:'scanner-input',placeholder:'Bipe o código ou digite aqui...',style:'font-size:18px;padding:14px;font-family:var(--mono);letter-spacing:2px;text-align:center'});
  bInp.addEventListener('input',debounce(async(e)=>{
    const code=e.target.value.trim();fd.codigo_barras=code;
    if(code.length<4)return;
    const r=await Api.buscarPorBarcode(code);
    if(r&&r.found){
      const v=r.vacina;const l=r.lote;
      fd.vacina_id=v.id;fd.fabricante=v.fabricante;
      if(l){fd.numero_lote=l.numeroLote||l.numero_lote;if(l.validade)fd.validade=String(l.validade).slice(0,7)}
      Toast.show('Código encontrado: '+v.nome);rebuildForm();
    }
  },400));
  bSec.appendChild(bInp);
  bSec.appendChild(h('div',{style:'font-size:11px;color:var(--text-3);margin-top:6px;text-align:center'},'Opcional. Se o código já estiver cadastrado, preenche automaticamente.'));
  body.appendChild(bSec);

  const formDiv=h('div');body.appendChild(formDiv);
  rebuildForm();

  function rebuildForm(){
    formDiv.innerHTML='';
    const gr=h('div',{className:'form-grid'});
    // Vacina dropdown — existing + standard names
    const d1=h('div');d1.appendChild(h('label',{className:'label'},'VACINA *'));
    d1.appendChild(buildVacSelect(vacs,'',(vid,v)=>{
      if(String(vid).startsWith('new:')){
        // Vaccine not in DB yet — store name to create on save
        fd.vacina_id=null;fd._nova_vacina=v.nome;
      }else{
        fd.vacina_id=+vid;fd._nova_vacina=null;
      }
      const m=vacs.find(x=>x.id==vid);if(m){fd.fabricante=m.fabricante;rebuildForm()}
    },'Buscar vacina pelo nome...'));
    gr.appendChild(d1);
    // Nº Lote
    const d2=h('div');d2.appendChild(h('label',{className:'label'},'Nº LOTE *'));
    const i2=h('input',{className:'input',value:fd.numero_lote||'',placeholder:'Ex: HEXA-202601'});
    i2.addEventListener('input',e=>{fd.numero_lote=e.target.value});d2.appendChild(i2);gr.appendChild(d2);
    // Fabricante
    const d3=h('div');d3.appendChild(h('label',{className:'label'},'FABRICANTE *'));
    d3.appendChild(buildSelect([['','— Selecione —'],...FABRICANTES.map(f=>[f,f])],fd.fabricante||'',v=>{fd.fabricante=v}));gr.appendChild(d3);
    // Quantidade
    const d4=h('div');d4.appendChild(h('label',{className:'label'},'QUANTIDADE *'));
    const i4=h('input',{className:'input',type:'number',value:fd.quantidade_total||'',min:'1'});
    i4.addEventListener('input',e=>{fd.quantidade_total=parseInt(e.target.value)||0});d4.appendChild(i4);gr.appendChild(d4);
    // Validade
    const d5=h('div');d5.appendChild(h('label',{className:'label'},'VALIDADE * (MM/AAAA)'));
    const i5=h('input',{className:'input',type:'month',value:fd.validade||''});
    i5.addEventListener('input',e=>{fd.validade=e.target.value});d5.appendChild(i5);gr.appendChild(d5);
    // Temperatura
    const d6=h('div');d6.appendChild(h('label',{className:'label'},'TEMPERATURA'));
    const i6=h('input',{className:'input',value:fd.temperatura||'2-8°C'});
    i6.addEventListener('input',e=>{fd.temperatura=e.target.value});d6.appendChild(i6);gr.appendChild(d6);
    // Local
    const d7=h('div');d7.appendChild(h('label',{className:'label'},'LOCAL'));
    const i7=h('input',{className:'input',value:fd.local||'Câmara Fria Principal'});
    i7.addEventListener('input',e=>{fd.local=e.target.value});d7.appendChild(i7);gr.appendChild(d7);
    // Custo
    const d8=h('div');d8.appendChild(h('label',{className:'label'},'CUSTO UNIT. R$'));
    const i8=h('input',{className:'input',type:'number',value:fd.valor_unitario||0,step:'0.01'});
    i8.addEventListener('input',e=>{fd.valor_unitario=parseFloat(e.target.value)||0});d8.appendChild(i8);gr.appendChild(d8);
    formDiv.appendChild(gr);
  }

  body.appendChild(h('div',{style:'margin-top:12px;padding:10px;background:var(--primary-bg);border-radius:8px;font-size:12px;color:var(--primary-dark)'},'ℹ️ Unidades com código de barras serão geradas automaticamente'));
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'✓ Cadastrar Lote',async()=>{
    // Auto-create vaccine if it's new
    if(!fd.vacina_id&&fd._nova_vacina){
      const code=fd._nova_vacina.replace(/[^A-Za-z0-9]/g,'').slice(0,10).toUpperCase();
      const rv=await Api.criarVacina({codigo:code,nome:fd._nova_vacina,fabricante:fd.fabricante||'',categoria:'Premium'});
      if(rv?.success||rv?.id){fd.vacina_id=rv.id||rv.vacina?.id}
      else{Toast.show('Erro ao criar vacina: '+(rv?.error||''),'error');return}
    }
    if(!fd.vacina_id||!fd.numero_lote||!fd.quantidade_total||!fd.validade)return Toast.show('Preencha campos obrigatórios','error');
    fd.usuario_id=AppState.usuario?.id;
    const r=await Api.criarLote(fd);if(r?.success){Toast.show('Lote criado com '+r.unidades_criadas+' unidades!');close();draw()}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
  setTimeout(()=>bInp.focus(),100);
},'600px')}

// ═══ IMPORTAR NF-e ═══
function modalImportarNFe(){showModal('Importar NF-e (XML)',async(body,close)=>{
  const ua=h('div',{className:'upload-area'});
  ua.innerHTML=`<div style="color:var(--primary);margin-bottom:8px">${I.upload}</div><p style="font-weight:600;margin-bottom:4px">Arraste o XML da NF-e ou clique</p><p style="font-size:12px;color:var(--text-3)">Extrai vacinas, quantidades, valores e GTIN/EAN automaticamente</p>`;
  const fi=h('input',{type:'file',accept:'.xml',style:{display:'none'}});
  const resultDiv=h('div',{style:{marginTop:'16px'}});

  fi.addEventListener('change',async()=>{if(!fi.files[0])return;
    ua.innerHTML=`<div style="color:var(--primary)">📄 ${esc(fi.files[0].name)} — processando...</div>`;
    const fd=new FormData();fd.append('xml',fi.files[0]);fd.append('usuario_id',AppState.usuario?.id);
    const r=await Api.importarNFe(fd);
    if(r?.success){
      Toast.show(r.message);resultDiv.innerHTML='';
      resultDiv.appendChild(h('div',{style:{padding:'14px',background:'var(--green-bg)',borderRadius:'10px',marginBottom:'14px'}},
        h('div',{style:{fontWeight:'700',color:'var(--green-text)',marginBottom:'4px'}},`✓ NF ${esc(r.numero_nota)} importada`),
        h('div',{style:{fontSize:'13px',color:'var(--green-text)'}},`Fornecedor: ${esc(r.fornecedor)} · ${fmtMoeda(r.valor_total)} · ${r.total_itens} vacinas · ${r.total_unidades} unidades`)));
      // Items table
      const tbl=document.createElement('table');tbl.style.cssText='width:100%;font-size:12px;border-collapse:collapse';
      let html='<thead><tr style="border-bottom:2px solid var(--border)"><th style="padding:6px;text-align:left">Vacina</th><th>Qtd</th><th>Valor</th><th>Lote</th><th>GTIN</th></tr></thead><tbody>';
      (r.itens_importados||[]).forEach(it=>{html+=`<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:6px;font-weight:600">${esc(it.nome)}</td><td style="padding:6px" class="mono">${it.quantidade}</td><td style="padding:6px" class="mono">${fmtMoeda(it.valor_unitario)}</td><td style="padding:6px" class="mono">${esc(it.lote)}</td><td style="padding:6px" class="mono">${it.ean?esc(it.ean):'<span style="color:#d97706">⚠ sem</span>'}</td></tr>`});
      html+='</tbody>';tbl.innerHTML=html;resultDiv.appendChild(tbl);

      // Items without barcodes - offer inline registration
      if(r.itens_sem_barcode?.length>0){
        const alertDiv=h('div',{style:{padding:'14px',background:'var(--orange-bg)',borderRadius:'10px',marginTop:'14px',border:'1px solid var(--orange-badge)'}});
        alertDiv.appendChild(h('div',{style:{fontWeight:'700',color:'var(--orange-text)',marginBottom:'8px'}},`⚠ ${r.itens_sem_barcode.length} item(ns) sem código de barras`));
        alertDiv.appendChild(h('div',{style:{fontSize:'12px',color:'var(--orange-text)',marginBottom:'12px'}},'Bipe os códigos agora para vincular cada unidade. Ou faça depois em "Cadastro por Código de Barras".'));
        alertDiv.appendChild(iconBtn('btn btn-primary btn-sm',I.barcode,'Cadastrar Códigos Agora',()=>{
          close();modalCadastroBarcodesLote(r.itens_sem_barcode)
        }));
        resultDiv.appendChild(alertDiv);
      }
      resultDiv.appendChild(iconBtn('btn btn-outline btn-block',null,'Fechar e Atualizar',()=>{close();draw()},{style:{marginTop:'14px'}}));
    }else{Toast.show(r?.error||'Erro','error');ua.innerHTML=`<div style="color:var(--red)">${esc(r?.error||'Erro')}</div>`}});

  ua.addEventListener('click',()=>fi.click());
  ua.addEventListener('dragover',e=>{e.preventDefault();ua.classList.add('dragover')});
  ua.addEventListener('dragleave',()=>ua.classList.remove('dragover'));
  ua.addEventListener('drop',e=>{e.preventDefault();ua.classList.remove('dragover');fi.files=e.dataTransfer.files;fi.dispatchEvent(new Event('change'))});
  body.appendChild(ua);body.appendChild(fi);body.appendChild(resultDiv);
},'640px')}

// ═══ CADASTRO DE BARCODES EM LOTE (após NF-e) ═══
function modalCadastroBarcodesLote(itens){
  let itemIdx=0;let unitIdx=0;let allUnits=[];let currentItem=null;

  async function loadUnits(){
    allUnits=[];
    for(const it of itens){
      const units=await Api.unidadesLote(it.lote_id)||[];
      // Only units that have auto-generated barcodes (start with "NF")
      const autoUnits=units.filter(u=>u.codigoBarras.startsWith('NF'));
      allUnits.push({item:it,units:autoUnits});
    }
  }

  showModal('Cadastrar Códigos de Barras',async(body,close)=>{
    body.appendChild(h('div',{style:{textAlign:'center',padding:'20px',color:'var(--text-3)'}},'Carregando unidades...'));
    await loadUnits();
    body.innerHTML='';

    const totalUnits=allUnits.reduce((s,g)=>s+g.units.length,0);
    let done=0;

    const statusDiv=h('div',{style:{marginBottom:'16px'}});
    const scanArea=h('div');
    body.appendChild(statusDiv);body.appendChild(scanArea);

    function renderCurrent(){
      scanArea.innerHTML='';
      // Find next unregistered unit
      let found=false;
      for(let i=0;i<allUnits.length;i++){
        for(let j=0;j<allUnits[i].units.length;j++){
          if(allUnits[i].units[j].codigoBarras.startsWith('NF')){
            currentItem=allUnits[i];unitIdx=j;found=true;break;
          }
        }
        if(found)break;
      }

      statusDiv.innerHTML='';
      statusDiv.appendChild(h('div',{className:'label'},`PROGRESSO: ${done}/${totalUnits} unidades`));
      const progPct=totalUnits>0?Math.round(done/totalUnits*100):0;
      statusDiv.innerHTML+=`<div class="prog-bar" style="margin-top:6px"><div class="prog-fill" style="width:${progPct}%;background:var(--primary)"></div></div>`;

      if(!found){
        scanArea.appendChild(h('div',{style:{padding:'30px',textAlign:'center',background:'var(--green-bg)',borderRadius:'12px'}},
          h('div',{style:{fontSize:'32px',marginBottom:'8px'}},'✓'),
          h('div',{style:{fontWeight:'700',color:'var(--green-text)',fontSize:'16px'}},'Todos os códigos cadastrados!'),
          h('div',{style:{color:'var(--green-text)',marginTop:'8px'}},`${done} unidades vinculadas com sucesso`)));
        scanArea.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Concluir e Atualizar',()=>{close();draw()},{style:{marginTop:'16px'}}));
        return;
      }

      const unit=currentItem.units[unitIdx];
      scanArea.appendChild(h('div',{style:{padding:'16px',background:'var(--primary-bg)',borderRadius:'10px',marginBottom:'16px'}},
        h('div',{style:{fontWeight:'700',fontSize:'14px'}},currentItem.item.nome),
        h('div',{style:{fontSize:'12px',color:'var(--text-3)',marginTop:'4px'}},`Lote: ${currentItem.item.lote} · Unidade #${unit.id} · Código atual: ${unit.codigoBarras}`)
      ));

      const inp=h('input',{className:'scanner-input',placeholder:'Bipe o código de barras...',style:{fontSize:'18px',padding:'16px',fontFamily:'var(--mono)',letterSpacing:'2px',textAlign:'center'},id:'nfe-barcode-input'});
      inp.addEventListener('keydown',async e=>{
        if(e.key==='Enter'&&inp.value.trim().length>=4){
          const code=inp.value.trim();
          const r=await Api.atualizarBarcode(unit.id,code);
          if(r?.success){
            Toast.show(`✓ ${code} → ${currentItem.item.nome}`);
            unit.codigoBarras=code; // Mark as done
            done++;
            renderCurrent();
          }else{Toast.show(r?.error||'Erro','error');inp.value='';inp.focus()}
        }
      });
      scanArea.appendChild(inp);
      scanArea.appendChild(h('div',{style:{fontSize:'11px',color:'var(--text-3)',marginTop:'8px',textAlign:'center'}},'Bipe e pressione Enter — avança automaticamente'));

      // Skip button
      scanArea.appendChild(iconBtn('btn btn-outline btn-sm',null,'Pular esta unidade',()=>{
        unit.codigoBarras='SKIP'; // Mark as skipped
        done++;renderCurrent();
      },{style:{marginTop:'12px'}}));

      setTimeout(()=>{const el=document.getElementById('nfe-barcode-input');if(el)el.focus()},100);
    }

    renderCurrent();
  },'560px');
}

await draw();return wrap;}
