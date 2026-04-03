async function renderEstoque(){
  let f={page:1,limit:50,search:'',status:'',vencimento:'',sort:'validade',order:'ASC'};
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
  const t=buildSortableTable([
    ['ID',''],['Vacina','vacina_nome'],['Fabricante','fabricante'],['Lote','numero_lote'],
    ['Estoque','quantidade_disponivel'],['Unid.',''],['Validade','validade'],['Local',''],
    ['Custo','valor_unitario_custo'],['Status','status']
  ],f,draw);

  const tb=document.createElement('tbody');
  if(!data.data.length){tb.innerHTML='<tr><td colspan="10" class="empty-state">Nenhum lote encontrado</td></tr>'}
  else data.data.forEach(l=>{
    const dias=l.dias_para_vencer;const st=statusVenc(dias);
    const pct=l.quantidade_total>0?Math.round(l.quantidade_disponivel/l.quantidade_total*100):0;
    const bc=l.quantidade_disponivel<5?'#dc2626':l.quantidade_disponivel<15?'#d97706':'#2BBCB3';
    const sm2={disponivel:'badge-green',reservado:'badge-primary',esgotado:'badge-gray',vencido:'badge-red'};
    const tr=h('tr');
    if(dias<=30&&dias>=0)tr.style.background='#fffbeb';
    if(dias<0)tr.style.background='#fef2f2';
    tr.innerHTML=`<td class="mono text-muted text-sm">#${l.id}</td>
      <td class="fw-600">${esc(l.vacina_nome)}<div class="text-sm text-muted">ID: ${l.vacina_id}</div></td>
      <td class="text-muted">${esc(l.fabricante)}</td>
      <td class="mono">${esc(l.numero_lote)}</td>
      <td><div class="stock-bar"><div class="stock-bar-track"><div class="stock-bar-fill" style="width:${pct}%;background:${bc}"></div></div><span class="mono fw-600">${l.quantidade_disponivel}/${l.quantidade_total}</span></div></td>
      <td class="mono">${l.unidades_disponiveis||0}</td>
      <td><span class="badge ${st.cls}">${fmtData(l.validade)}</span><div class="text-sm text-muted">${st.label}</div></td>
      <td class="text-sm">${esc(l.local_armazenamento||'-')}</td>
      <td class="mono text-sm">${l.valor_unitario_custo?fmtMoeda(l.valor_unitario_custo):'-'}</td>
      <td><span class="badge ${sm2[l.status]||'badge-gray'}">${l.status}</span></td>`;
    tb.appendChild(tr);
  });
  t.appendChild(tb);tw.appendChild(t);
  tw.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
  wrap.appendChild(tw);
}

// ═══ CADASTRO POR CÓDIGO DE BARRAS (NOVO) ═══
function modalCadastroBarras(){showModal('Cadastro por Código de Barras',async(body,close)=>{
  const fd={quantidade:1,usuario_id:AppState.usuario?.id};
  let lookupDone=false;

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
      if(l){fd.numero_lote=l.numeroLote;fd.validade=l.validade?.toISOString?.()?.split('T')[0]||''}
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
    const gr=h('div',{className:'form-grid'});
    [['nome_vacina','Nome da Vacina *','',fd.nome_vacina],
     ['fabricante','Fabricante *','',fd.fabricante],
     ['numero_lote','Nº do Lote *','Ex: BCG-202601',fd.numero_lote],
     ['validade','Validade *','','date',fd.validade],
     ['quantidade','Quantidade','1','number',fd.quantidade],
     ['custo_unitario','Custo Unitário R$','0','number',fd.custo_unitario],
     ['local_armazenamento','Local Armazenamento','Câmara Fria Principal',null,fd.local_armazenamento],
     ['observacoes','Observações','',null,fd.observacoes],
    ].forEach(([k,l,ph,type,val])=>{
      const d=h('div');d.appendChild(h('label',{className:'label'},l));
      const inp=h('input',{className:'input',type:type||'text',placeholder:ph||'',value:val||''});
      inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value):e.target.value});
      d.appendChild(inp);gr.appendChild(d);
    });
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
function modalNovaVacina(){showModal('Cadastrar Nova Vacina',(body,close)=>{
  const fd={};const gr=h('div',{className:'form-grid'});
  [['codigo','Código *','Ex: BCG'],['nome','Nome *',''],['fabricante','Fabricante *',''],['laboratorio','Laboratório',''],['categoria','Categoria',''],['via_administracao','Via Adm.','IM, SC, Oral...'],['valor_custo_medio','Custo Médio R$','0','number'],['valor_venda_sugerido','Venda Sugerida R$','0','number']].forEach(([k,l,ph,type])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));
    const inp=h('input',{className:'input',type:type||'text',placeholder:ph});
    inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value):e.target.value});
    d.appendChild(inp);gr.appendChild(d);
  });body.appendChild(gr);
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Cadastrar',async()=>{
    if(!fd.codigo||!fd.nome||!fd.fabricante)return Toast.show('Código, nome e fabricante obrigatórios','error');
    const r=await Api.criarVacina(fd);if(r?.success){Toast.show('Vacina cadastrada!');close();draw()}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
})}

// ═══ NOVO LOTE ═══
function modalNovoLote(){showModal('Cadastrar Novo Lote',async(body,close)=>{
  const fd={};const vacs=await Api.vacinas()||[];const gr=h('div',{className:'form-grid'});
  const d1=h('div');d1.appendChild(h('label',{className:'label'},'Vacina *'));
  d1.appendChild(buildSelect([['','Selecione...'],...vacs.map(v=>[v.id,`${v.nome} (${v.fabricante})`])],'',v=>{fd.vacina_id=v;fd.nome_vacina=vacs.find(x=>x.id==v)?.nome||''}));
  gr.appendChild(d1);
  [['numero_lote','Nº Lote *','BCG-202601'],['fabricante','Fabricante *',''],['quantidade_total','Quantidade *','','number'],['validade','Validade *','','date'],['temperatura','Temperatura','2-8°C'],['local','Local','Câmara Fria Principal'],['valor_unitario','Custo Unit. R$','0','number']].forEach(([k,l,ph,type])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));
    const inp=h('input',{className:'input',type:type||'text',placeholder:ph});
    inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value):e.target.value});
    d.appendChild(inp);gr.appendChild(d);
  });body.appendChild(gr);
  body.appendChild(h('div',{style:{marginTop:'12px',padding:'10px',background:'var(--primary-bg)',borderRadius:'8px',fontSize:'12px',color:'var(--primary-dark)'}},'ℹ️ Unidades com código de barras serão geradas automaticamente'));
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Cadastrar Lote',async()=>{
    if(!fd.vacina_id||!fd.numero_lote||!fd.quantidade_total||!fd.validade)return Toast.show('Preencha campos obrigatórios','error');
    fd.usuario_id=AppState.usuario?.id;
    const r=await Api.criarLote(fd);if(r?.success){Toast.show(`Lote criado com ${r.unidades_criadas} unidades!`);close();draw()}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
})}

// ═══ IMPORTAR NF-e ═══
function modalImportarNFe(){showModal('Importar NF-e (XML)',async(body,close)=>{
  const ua=h('div',{className:'upload-area'});
  ua.innerHTML=`<div style="color:var(--primary);margin-bottom:8px">${I.upload}</div><p style="font-weight:600;margin-bottom:4px">Arraste o XML ou clique para selecionar</p><p style="font-size:12px;color:var(--text-3)">Aceita arquivos .xml de NF-e</p>`;
  const fi=h('input',{type:'file',accept:'.xml',style:{display:'none'}});
  fi.addEventListener('change',async()=>{if(!fi.files[0])return;ua.innerHTML=`<div style="color:var(--primary)">📄 ${esc(fi.files[0].name)} — processando...</div>`;
    const fd=new FormData();fd.append('xml',fi.files[0]);fd.append('usuario_id',AppState.usuario?.id);
    const r=await Api.importarNFe(fd);if(r?.success){Toast.show(r.message);close();draw()}else Toast.show(r?.error||'Erro','error')});
  ua.addEventListener('click',()=>fi.click());
  ua.addEventListener('dragover',e=>{e.preventDefault();ua.classList.add('dragover')});
  ua.addEventListener('dragleave',()=>ua.classList.remove('dragover'));
  ua.addEventListener('drop',e=>{e.preventDefault();ua.classList.remove('dragover');fi.files=e.dataTransfer.files;fi.dispatchEvent(new Event('change'))});
  body.appendChild(ua);body.appendChild(fi);
},'560px')}

await draw();return wrap;}
