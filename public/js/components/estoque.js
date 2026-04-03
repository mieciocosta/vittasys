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
    ['ID','id'],['Vacina','vacina_nome'],['Fabricante','fabricante'],['Lote','numero_lote'],
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
    const gr=h('div',{className:'form-grid'});
    // Name
    const d1=h('div');d1.appendChild(h('label',{className:'label',style:fd.nome_vacina?'color:var(--primary)':''},'Nome da Vacina *'+(fd.nome_vacina?' ✓':'')));
    const i1=h('input',{className:'input',value:fd.nome_vacina||'',placeholder:'Nome da vacina',style:fd.nome_vacina?'border-color:var(--primary);font-weight:600':''});
    i1.addEventListener('input',e=>{fd.nome_vacina=e.target.value});d1.appendChild(i1);gr.appendChild(d1);
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
    const i4=h('input',{className:'input',type:'date',value:valStr});
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
function modalNovaVacina(){showModal('Cadastrar Nova Vacina',(body,close)=>{
  const fd={};const gr=h('div',{className:'form-grid'});
  [['codigo','Código *','Ex: BCG'],['nome','Nome *','']].forEach(([k,l,ph])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));const inp=h('input',{className:'input',placeholder:ph});
    inp.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(inp);gr.appendChild(d)});
  // Fabricante dropdown
  const df=h('div');df.appendChild(h('label',{className:'label'},'Fabricante *'));
  df.appendChild(buildSelect([['','— Selecione —'],...FABRICANTES.map(f=>[f,f])],'',v=>{fd.fabricante=v}));gr.appendChild(df);
  [['laboratorio','Laboratório',''],['categoria','Categoria',''],['via_administracao','Via Adm.','IM, SC, Oral...'],['valor_custo_medio','Custo Médio R$','0','number'],['valor_venda_sugerido','Venda Sugerida R$','0','number']].forEach(([k,l,ph,type])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));const inp=h('input',{className:'input',type:type||'text',placeholder:ph});
    inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value):e.target.value});d.appendChild(inp);gr.appendChild(d)});
  body.appendChild(gr);
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
  [['numero_lote','Nº Lote *','BCG-202601']].forEach(([k,l,ph])=>{const d=h('div');d.appendChild(h('label',{className:'label'},l));const inp=h('input',{className:'input',placeholder:ph});inp.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(inp);gr.appendChild(d)});
  // Fabricante dropdown
  const df2=h('div');df2.appendChild(h('label',{className:'label'},'Fabricante *'));df2.appendChild(buildSelect([['','— Selecione —'],...FABRICANTES.map(f=>[f,f])],'',v=>{fd.fabricante=v}));gr.appendChild(df2);
  [['quantidade_total','Quantidade *','','number'],['validade','Validade *','','date'],['temperatura','Temperatura','2-8°C'],['local','Local','Câmara Fria Principal'],['valor_unitario','Custo Unit. R$','0','number']].forEach(([k,l,ph,type])=>{
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
