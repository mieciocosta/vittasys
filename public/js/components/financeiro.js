async function renderFinanceiro(){let f={page:1,limit:50,search:'',forma_pagamento:'',sort:'',order:''};const wrap=h('div',{className:'fade-in'});
async function draw(){wrap.innerHTML='';
const hdr=h('div',{className:'page-header'});
hdr.appendChild(h('div',{className:'page-header-left'},h('h1',{className:'page-title'},'Financeiro'),h('p',{className:'page-subtitle'},'Pagamentos, receitas e margens')));
hdr.appendChild(h('div',{className:'page-header-actions'},iconBtn('btn btn-primary btn-sm',I.plus,'Novo Lançamento',()=>modalNovoPagamento())));
wrap.appendChild(hdr);
const res=await Api.finResumo();
if(res){const gr=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}});
[['Valor Contratos',fmtMoeda(res.valor_contratos),'#1B4965'],['Total Recebido',fmtMoeda(res.total_recebido),'#2BBCB3'],['Saldo Pendente',fmtMoeda(res.saldo_pendente),'#d97706'],['Lucro Previsto',fmtMoeda(res.lucro_previsto),'#059669']].forEach(([l,v,c])=>{gr.appendChild(h('div',{className:'fin-card',innerHTML:`<div class="fin-label">${l}</div><div class="fin-value" style="color:${c}">${v}</div>`}))});wrap.appendChild(gr);
const gr2=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}});
[['Margem Média',res.margem_media.toFixed(1)+'%','#7c3aed'],['Descontos',fmtMoeda(res.desconto_total),'#d97706'],['Planos Ativos',res.total_planos,'#1B4965'],['Quitados',res.planos_quitados,'#2BBCB3']].forEach(([l,v,c])=>{gr2.appendChild(h('div',{className:'fin-card',innerHTML:`<div class="fin-label">${l}</div><div class="fin-value" style="color:${c}">${v}</div>`}))});wrap.appendChild(gr2)}
const fb=h('div',{className:'filters-bar'});
fb.appendChild(buildSearchBox('Buscar cliente ou plano...',v=>{f.search=v;f.page=1;draw()},f.search));
fb.appendChild(buildSelect([['','Forma Pgto'],['pix','PIX'],['cartao_credito','Cartão Créd.'],['cartao_debito','Cartão Déb.'],['dinheiro','Dinheiro'],['boleto','Boleto']],f.forma_pagamento,v=>{f.forma_pagamento=v;f.page=1;draw()}));
wrap.appendChild(fb);
const data=await Api.pagamentos(f);if(!data)return;
const tw=h('div',{className:'table-wrap'});
const t=buildSortableTable([['ID',''],['Data','data_pagamento'],['Cliente','cliente_nome'],['Plano','nome_plano'],['Valor Pago','valor_pago'],['Parcela',''],['Forma','forma_pagamento'],['Vendedor','vendedor_nome']],f,draw);
const tb=h('tbody');
if(!data.data.length)tb.innerHTML='<tr><td colspan="8" class="empty-state">Nenhum pagamento</td></tr>';
else data.data.forEach(p=>{
  const fm={pix:'PIX',cartao_credito:'Cartão Créd.',cartao_debito:'Cartão Déb.',dinheiro:'Dinheiro',boleto:'Boleto',transferencia:'Transf.'};
  const tr=h('tr',{className:'clickable',onClick:()=>{if(p.plano_contratado_id)AppState.verPlano(p.plano_contratado_id)}});
  tr.innerHTML=`<td class="mono text-muted text-sm">#${p.id}</td><td class="mono">${fmtData(p.data_pagamento)}</td><td class="fw-600">${esc(p.cliente_nome)}</td><td class="text-sm">${esc(p.nome_plano)}</td><td class="mono fw-600" style="color:var(--primary)">${fmtMoeda(p.valor_pago)}</td><td class="mono">${p.numero_parcela||1}x</td><td><span class="badge badge-primary">${fm[p.forma_pagamento]||p.forma_pagamento}</span></td><td class="text-sm text-muted">${esc(p.vendedor_nome||'-')}</td>`;
  tb.appendChild(tr);
});
t.appendChild(tb);tw.appendChild(t);
tw.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
wrap.appendChild(tw);
}
function modalNovoPagamento(){showModal('Novo Lançamento Financeiro',async(body,close)=>{
  const fd={criado_por:AppState.usuario.id};
  const planos=(await Api.planos({limit:100}))?.data||[];
  const gr=h('div',{className:'form-grid'});
  // Plano select
  const pd=h('div');pd.appendChild(h('label',{className:'label'},'Plano/Contrato *'));
  pd.appendChild(buildSelect([['','Selecione o plano...'],...planos.map(p=>[p.id,`${p.cliente_nome} — ${p.nome_plano} (${fmtMoeda(p.valor_final)})`])],fd.plano_contratado_id||'',v=>{fd.plano_contratado_id=parseInt(v)}));
  gr.appendChild(pd);
  [['valor_pago','Valor Pago R$ *','number'],['data_pagamento','Data Pagamento *','date'],['numero_parcela','Nº Parcela','number']].forEach(([k,l,type])=>{
    const d=h('div');d.appendChild(h('label',{className:'label'},l));
    const inp=h('input',{className:'input',type,placeholder:type==='number'?'0':''});
    inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value):e.target.value});
    d.appendChild(inp);gr.appendChild(d);
  });
  const fpd=h('div');fpd.appendChild(h('label',{className:'label'},'Forma Pagamento'));
  fpd.appendChild(buildSelect([['pix','PIX'],['cartao_credito','Cartão Crédito'],['cartao_debito','Cartão Débito'],['dinheiro','Dinheiro'],['boleto','Boleto'],['transferencia','Transferência']],'pix',v=>{fd.forma_pagamento=v}));
  gr.appendChild(fpd);
  const od=h('div');od.appendChild(h('label',{className:'label'},'Observação'));
  const oinp=h('input',{className:'input',placeholder:'Opcional'});oinp.addEventListener('input',e=>{fd.observacao=e.target.value});od.appendChild(oinp);gr.appendChild(od);
  body.appendChild(gr);
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Registrar Pagamento',async()=>{
    if(!fd.plano_contratado_id||!fd.valor_pago||!fd.data_pagamento)return Toast.show('Preencha campos obrigatórios','error');
    const r=await Api.criarPagamento(fd);
    if(r?.success){Toast.show('Pagamento registrado!');close();draw();}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'16px'}}));
},'560px')}
await draw();return wrap;}
