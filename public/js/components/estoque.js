async function renderEstoque(){let f={page:1,limit:50,search:'',status:'',vencimento:'',sort:'validade',order:'ASC'};const wrap=h('div',{className:'fade-in'});
async function draw(){wrap.innerHTML='';
const hdr=h('div',{className:'page-header'});
hdr.appendChild(h('div',{className:'page-header-left'},h('h1',{className:'page-title'},'Estoque / Câmara Fria'),h('p',{className:'page-subtitle'},'Lotes, validades, unidades e importação de NF-e')));
const acts=h('div',{className:'page-header-actions'});
acts.appendChild(iconBtn('btn btn-outline btn-sm', I.plus, 'Cadastrar Vacina', ()=>modalNovaVacina()));
acts.appendChild(iconBtn('btn btn-outline btn-sm', I.plus, 'Novo Lote', ()=>modalNovoLote()));
acts.appendChild(iconBtn('btn btn-primary btn-sm', I.upload, 'Importar NF-e (XML)', ()=>modalImportarNFe()));
hdr.appendChild(acts);wrap.appendChild(hdr);

const fb=h('div',{className:'filters-bar'});
fb.appendChild(buildSearchBox('Buscar vacina, lote ou fabricante...',v=>{f.search=v;f.page=1;draw()},f.search));
fb.appendChild(buildSelect([['','Status'],['disponivel','Disponível'],['reservado','Reservado'],['esgotado','Esgotado'],['vencido','Vencido']],f.status,v=>{f.status=v;f.page=1;draw()}));
fb.appendChild(buildSelect([['','Validade'],['proximo','Próx. 30d'],['vencido','Vencidos']],f.vencimento,v=>{f.vencimento=v;f.page=1;draw()}));
wrap.appendChild(fb);

const data=await Api.lotes(f);if(!data){wrap.appendChild(h('div',{className:'empty-state'},'Erro ao carregar'));return}
const tw=h('div',{className:'table-wrap'});
const t=buildSortableTable([['Vacina','vacina_nome'],['Fabricante','fabricante'],['Lote','numero_lote'],['Estoque','quantidade_disponivel'],['Unid.',''],['Reserv.',''],['Validade','validade'],['Local',''],['Custo Unit.','valor_unitario_custo'],['Status','status']],f,draw);
const tb=h('tbody');
if(!data.data.length){tb.innerHTML='<tr><td colspan="10" class="empty-state">Nenhum lote encontrado</td></tr>';}
else data.data.forEach(l=>{
  const dias=l.dias_para_vencer,st=statusVenc(dias);
  const pct=l.quantidade_total>0?Math.round(l.quantidade_disponivel/l.quantidade_total*100):0;
  const bc=l.quantidade_disponivel<5?'#dc2626':l.quantidade_disponivel<15?'#d97706':'#2BBCB3';
  const sm={disponivel:'badge-green',reservado:'badge-primary',esgotado:'badge-gray',vencido:'badge-red'};
  const tr=h('tr');
  if(dias<=30&&dias>=0)tr.style.background='#fffbeb';
  if(dias<0)tr.style.background='#fef2f2';
  tr.innerHTML=`<td class="fw-600">${esc(l.vacina_nome)}</td><td class="text-muted">${esc(l.fabricante)}</td><td class="mono">${esc(l.numero_lote)}</td><td><div class="stock-bar"><div class="stock-bar-track"><div class="stock-bar-fill" style="width:${pct}%;background:${bc}"></div></div><span class="mono fw-600">${l.quantidade_disponivel}/${l.quantidade_total}</span></div></td><td class="mono">${l.unidades_disponiveis||0}</td><td class="mono">${l.quantidade_reservada||0}</td><td><span class="badge ${st.cls}">${fmtData(l.validade)}</span><div class="text-sm text-muted">${st.label}</div></td><td class="text-sm">${esc(l.local_armazenamento||'-')}</td><td class="mono text-sm">${l.valor_unitario_custo?fmtMoeda(l.valor_unitario_custo):'-'}</td><td><span class="badge ${sm[l.status]||'badge-gray'}">${l.status}</span></td>`;
  tb.appendChild(tr);
});
t.appendChild(tb);tw.appendChild(t);
tw.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
wrap.appendChild(tw);
}

function modalImportarNFe(){showModal('Importar Nota Fiscal (XML)',async(body,close)=>{
  const ua=h('div',{className:'upload-area'});
  ua.innerHTML=`<div style="color:var(--primary);margin-bottom:8px">${I.upload}</div><p style="font-weight:600;margin-bottom:4px">Arraste o XML ou clique para selecionar</p><p style="font-size:12px;color:var(--text-3)">Aceita arquivos .xml de NF-e</p>`;
  const fi=h('input',{type:'file',accept:'.xml',style:{display:'none'}});
  fi.addEventListener('change',async()=>{
    if(!fi.files[0])return;
    ua.innerHTML=`<div style="color:var(--primary);font-weight:600">📄 ${esc(fi.files[0].name)}</div><p style="font-size:13px;color:var(--text-3);margin-top:4px">Processando importação...</p>`;
    const fd=new FormData();fd.append('xml',fi.files[0]);fd.append('usuario_id',AppState.usuario.id);
    const r=await Api.importarNFe(fd);
    if(r&&r.success){
      Toast.show(r.message);
      body.innerHTML='';
      body.innerHTML=`<div style="padding:16px;background:var(--green-bg);border-radius:12px;margin-bottom:16px"><div style="font-weight:700;color:var(--green-text);margin-bottom:4px">✓ NF ${esc(r.numero_nota)} importada!</div><div style="font-size:13px;color:var(--green-text)">Fornecedor: ${esc(r.fornecedor)}<br>Valor: ${fmtMoeda(r.valor_total)}<br>${r.total_itens} vacinas · ${r.total_unidades} unidades criadas</div></div>`;
      const tbl=document.createElement('table');tbl.style.cssText='width:100%;font-size:13px;border-collapse:collapse';
      tbl.innerHTML='<thead><tr style="border-bottom:2px solid var(--border)"><th style="padding:8px;text-align:left">Vacina</th><th style="padding:8px">Qtd</th><th style="padding:8px">V.Unit.</th><th style="padding:8px">Total</th><th style="padding:8px">Lote</th></tr></thead>';
      let tbodyHtml='';r.itens_importados.forEach(it=>{tbodyHtml+=`<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px;font-weight:600">${esc(it.nome)}</td><td style="padding:8px" class="mono">${it.quantidade}</td><td style="padding:8px" class="mono">${fmtMoeda(it.valor_unitario)}</td><td style="padding:8px" class="mono">${fmtMoeda(it.valor_total)}</td><td style="padding:8px" class="mono">${esc(it.lote)}</td></tr>`});
      tbl.innerHTML+='<tbody>'+tbodyHtml+'</tbody>';body.appendChild(tbl);
      body.appendChild(iconBtn('btn btn-primary btn-block',null,'Fechar e Atualizar',()=>{close();draw()},{style:{marginTop:'16px'}}));
    }else{Toast.show(r?.error||'Erro ao importar','error');ua.innerHTML=`<div style="color:var(--red)">${esc(r?.error||'Erro na importação')}</div>`;}
  });
  ua.addEventListener('click',()=>fi.click());
  ua.addEventListener('dragover',e=>{e.preventDefault();ua.classList.add('dragover')});
  ua.addEventListener('dragleave',()=>ua.classList.remove('dragover'));
  ua.addEventListener('drop',e=>{e.preventDefault();ua.classList.remove('dragover');fi.files=e.dataTransfer.files;fi.dispatchEvent(new Event('change'))});
  body.appendChild(ua);body.appendChild(fi);
},'600px')}

function modalNovaVacina(){showModal('Cadastrar Nova Vacina',(body,close)=>{
  const fd={};
  const gr=h('div',{className:'form-grid'});
  [['codigo','Código *','Ex: MEN-B'],['nome','Nome *','Nome comercial'],['nome_tecnico','Nome Técnico',''],['fabricante','Fabricante *',''],['laboratorio','Laboratório',''],['categoria','Categoria','Básica, Premium...'],['apresentacao','Apresentação','Seringa, Ampola...'],['via_administracao','Via Adm.','IM, SC, Oral...'],['valor_custo_medio','Custo Médio R$','0','number'],['valor_venda_sugerido','Venda Sugerida R$','0','number']].forEach(([k,l,ph,type])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));
    const inp=h('input',{className:'input',type:type||'text',placeholder:ph});
    inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value):e.target.value});
    d.appendChild(inp);gr.appendChild(d);
  });
  body.appendChild(gr);
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Cadastrar Vacina',async()=>{
    if(!fd.codigo||!fd.nome||!fd.fabricante)return Toast.show('Preencha código, nome e fabricante','error');
    const r=await Api.criarVacina(fd);
    if(r?.success){Toast.show('Vacina cadastrada!');close();draw();}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
})}

function modalNovoLote(){showModal('Cadastrar Novo Lote',async(body,close)=>{
  const fd={};const vacs=await Api.vacinas()||[];
  const gr=h('div',{className:'form-grid'});
  // Vacina select
  const d1=h('div');d1.appendChild(h('label',{className:'label'},'Vacina *'));
  d1.appendChild(buildSelect([['','Selecione...'],...vacs.map(v=>[v.id,`${v.nome} (${v.fabricante})`])],'',v=>{fd.vacina_id=v}));
  gr.appendChild(d1);
  [['numero_lote','Nº Lote *','BCG-202601'],['fabricante','Fabricante *',''],['quantidade_total','Quantidade *','','number'],['validade','Validade *','','date'],['temperatura','Temperatura','2-8°C'],['local','Local Armaz.','Câmara Fria Principal'],['valor_unitario','Custo Unit. R$','0','number']].forEach(([k,l,ph,type])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));
    const inp=h('input',{className:'input',type:type||'text',placeholder:ph});
    inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value):e.target.value});
    d.appendChild(inp);gr.appendChild(d);
  });
  body.appendChild(gr);
  body.appendChild(h('div',{style:{marginTop:'12px',padding:'12px',background:'var(--primary-bg)',borderRadius:'8px',fontSize:'12px',color:'var(--primary-dark)'}},'ℹ️ Unidades com código de barras serão geradas automaticamente'));
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Cadastrar Lote',async()=>{
    if(!fd.vacina_id||!fd.numero_lote||!fd.quantidade_total||!fd.validade)return Toast.show('Preencha campos obrigatórios','error');
    const r=await Api.criarLote(fd);
    if(r?.success){Toast.show(`Lote criado com ${r.unidades_criadas} unidades!`);close();draw();}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
})}

await draw();return wrap;}
