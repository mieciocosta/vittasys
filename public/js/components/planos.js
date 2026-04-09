async function renderPlanos(){let f={page:1,limit:50,search:'',status_contrato:'',sort:'',order:''};const wrap=h('div',{className:'fade-in'});
async function draw(){wrap.innerHTML='';
const hdr=h('div',{className:'page-header'});
hdr.appendChild(h('div',{className:'page-header-left'},h('h1',{className:'page-title'},'Planos Vacinais'),h('p',{className:'page-subtitle'},'Contratos, projeção mensal e doses')));
hdr.appendChild(h('div',{className:'page-header-actions'},iconBtn('btn btn-primary btn-sm',I.plus,'Novo Plano',()=>modalNovoPlano())));
wrap.appendChild(hdr);
const stats=await Api.planosStats();
if(stats){const sr=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}});
[['Contratos',stats.total_contratos,'#1B4965'],['Aplicadas',stats.doses_aplicadas,'#2BBCB3'],['Pendentes',stats.doses_pendentes,'#d97706'],['Valor Total',fmtMoeda(stats.valor_total),'#059669']].forEach(([l,v,c])=>{sr.appendChild(h('div',{className:'fin-card',innerHTML:`<div class="fin-label">${l}</div><div class="fin-value" style="color:${c}">${v}</div>`}))});wrap.appendChild(sr)}
const fb=h('div',{className:'filters-bar'});
fb.appendChild(buildSearchBox('Buscar plano ou cliente...',v=>{f.search=v;f.page=1;draw()},f.search));
fb.appendChild(buildSelect([['','Status'],['ativo','Ativo'],['concluido','Concluído'],['cancelado','Cancelado'],['pendente','Pendente']],f.status_contrato,v=>{f.status_contrato=v;f.page=1;draw()}));
wrap.appendChild(fb);
const data=await Api.planos(f);if(!data)return;
const tw=h('div',{className:'table-wrap'});
const t=buildSortableTable([['ID','id'],['Cliente','cliente_nome'],['Código','codigo_cliente'],['Plano','nome_plano'],['Faixa',''],['Valor','valor_final'],['Pago',''],['Saldo',''],['Progresso',''],['Status','status_contrato'],['Ações','']],f,draw);
const tb=h('tbody');
if(!data.data.length)tb.innerHTML='<tr><td colspan="11" class="empty-state">Nenhum plano</td></tr>';
else data.data.forEach(p=>{
  const prog=p.doses_total>0?Math.round(p.doses_aplicadas/p.doses_total*100):0;
  const tr=h('tr',{className:'clickable',onClick:()=>AppState.verPlano(p.id)});
  tr.style.borderLeft='3px solid var(--primary)';
  tr.innerHTML=`<td class="mono text-muted text-sm">#${p.id}</td><td class="fw-600" style="cursor:pointer" onclick="event.stopPropagation();AppState.verCliente(${p.cliente_id})">${esc(p.cliente_nome)}</td><td class="mono text-sm">${esc(p.codigo_cliente||'-')}</td><td class="fw-600">${esc(p.nome_plano)}</td><td class="text-sm">${p.idade_inicio}-${p.idade_fim}m</td><td class="mono fw-600" style="color:#059669">${fmtMoeda(p.valor_final)}</td><td class="mono" style="color:var(--primary)">${fmtMoeda(p.total_pago)}</td><td class="mono" style="color:${p.saldo_pendente>0?'#d97706':'#059669'}">${fmtMoeda(p.saldo_pendente)}</td><td><div style="display:flex;align-items:center;gap:6px"><div class="prog-bar" style="width:50px"><div class="prog-fill" style="width:${prog}%;background:${prog===100?'#059669':'var(--primary)'}"></div></div><span class="mono text-sm">${prog}%</span></div></td><td><span class="badge ${p.status_contrato==='ativo'?'badge-green':p.status_contrato==='pendente'?'badge-orange':'badge-gray'}">${p.status_contrato}</span></td>`;
  // Actions: delete only if 0% progress and 0 paid
  const actTd=document.createElement('td');actTd.style.whiteSpace='nowrap';
  if(prog===0&&(p.total_pago||0)===0){
    actTd.appendChild(iconBtn('btn btn-red btn-sm',null,'Excluir',async e=>{e.stopPropagation();
      if(!confirm(`Excluir plano "${p.nome_plano}" de ${p.cliente_nome}?`))return;
      const r=await Api.del(`/planos/${p.id}`);
      if(r?.success){Toast.show('Plano excluído');draw()}else Toast.show(r?.error||'Erro','error')
    }));
  }
  tr.appendChild(actTd);tb.appendChild(tr);
});
t.appendChild(tb);tw.appendChild(t);
tw.appendChild(buildPagination(data.pagination,p2=>{f.page=p2;draw()}));
wrap.appendChild(tw);
}

function modalNovoPlano(){showModal('Novo Plano Vacinal',async(body,close)=>{
  const fd={tipo_plano:'padrao',percentual_desconto:0,isencao_taxa:0,contrato_assinado:0,status_contrato:'ativo'};
  const [templates,usuarios]= await Promise.all([Api.planosTemplates(),Api.usuarios()]);
  const vendedores=(usuarios||[]).filter(u=>['Vendedora','Gestora'].some(c=>u.cargo.includes(c))||true);

  // Step 1: Select client
  const s1=h('div');s1.appendChild(h('label',{className:'label'},'1. SELECIONAR CLIENTE'));
  const cSearch=h('input',{className:'input',placeholder:'Buscar cliente por nome ou CPF...'});
  s1.appendChild(cSearch);
  const cList=h('div',{style:{maxHeight:'150px',overflow:'auto',marginTop:'8px'}});
  s1.appendChild(cList);
  const selCliente=h('div',{id:'sel-cliente',style:{display:'none',padding:'10px',background:'var(--primary-bg)',borderRadius:'8px',margin:'8px 0',fontWeight:'600'}});
  s1.appendChild(selCliente);
  cSearch.addEventListener('input',debounce(async(e)=>{
    const q=e.target.value;if(q.length<2){cList.innerHTML='';return}
    const cls=await Api.buscarClientes(q)||[];cList.innerHTML='';
    cls.forEach(c=>{const it=h('div',{className:'client-pick-item',onClick:()=>{
      fd.cliente_id=c.id;selCliente.textContent=`✓ ${c.nome} ${c.codigo_cliente?'['+c.codigo_cliente+']':''}`;selCliente.style.display='block';cList.innerHTML='';cSearch.value=c.nome;
    }});it.innerHTML=`<div style="flex:1"><span class="fw-600">${esc(c.nome)}</span> ${c.codigo_cliente?'<span class="mono text-muted">['+c.codigo_cliente+']</span>':''} ${tipoClienteBadge(c.tipo_cliente)}</div>`;cList.appendChild(it)});
  },250));
  body.appendChild(s1);

  // Step 2: Select plan template
  const s2=h('div',{style:{marginTop:'16px'}});s2.appendChild(h('label',{className:'label'},'2. SELECIONAR PLANO'));
  const planGrid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}});
  (templates||[]).forEach(t=>{
    const btn=h('div',{style:{padding:'12px',borderRadius:'10px',border:'2px solid var(--border)',cursor:'pointer',transition:'all .15s'},onClick:()=>{
      fd.plano_id=t.id;fd.nome_plano=t.nome;fd.idade_inicio=t.idade_inicio;fd.idade_fim=t.idade_fim;fd.valor_bruto=t.valor_tabela;
      fd._valor_avista=t.valor_avista;fd._valor_cartao=t.valor_cartao;fd._parcelas=t.parcelas;fd._desc_pag=t.desc_pagamento;
      planGrid.querySelectorAll('div[data-plan]').forEach(d=>{d.style.borderColor='var(--border)';d.style.background=''});
      btn.style.borderColor='var(--primary)';btn.style.background='var(--primary-bg)';
      // Update valor bruto field if it exists
      const vbInput=body.querySelector('#plan-valor-bruto');
      if(vbInput)vbInput.value=t.valor_avista||t.valor_tabela;
    }});btn.setAttribute('data-plan','1');
    let priceHtml=`<span style="font-weight:700;color:#059669">${fmtMoeda(t.valor_avista||t.valor_tabela)}</span> à vista`;
    if(t.valor_cartao)priceHtml+=` · <span style="color:#64748b">${fmtMoeda(t.valor_cartao)} cartão</span>`;
    if(t.desc_pagamento)priceHtml+=` <span style="font-size:10px;color:#94a3b8">(${esc(t.desc_pagamento)})</span>`;
    btn.innerHTML=`<div style="font-weight:600;font-size:13px">${esc(t.nome)}</div><div style="font-size:11px;margin-top:4px">${t.vacinas?.length||0} vacinas · ${priceHtml}</div>`;
    planGrid.appendChild(btn);
  });
  s2.appendChild(planGrid);body.appendChild(s2);

  // Step 3: Vendor + Financials + Payment method
  const s3=h('div',{style:{marginTop:'16px'}});s3.appendChild(h('label',{className:'label'},'3. VENDEDOR, PAGAMENTO E VALORES'));
  const fg=h('div',{className:'form-grid'});

  // Forma de pagamento
  const fpDiv=h('div');fpDiv.appendChild(h('label',{className:'label'},'Forma de Pagamento'));
  fpDiv.appendChild(buildSelect([['avista','💵 À Vista'],['cartao','💳 Cartão/Crédito']],'avista',v=>{
    fd.forma_pagamento=v;
    // Update valor bruto based on selection
    const vbInput=body.querySelector('#plan-valor-bruto');
    if(vbInput){
      if(v==='cartao'&&fd._valor_cartao)vbInput.value=fd._valor_cartao;
      else if(fd._valor_avista)vbInput.value=fd._valor_avista;
      else vbInput.value=fd.valor_bruto||0;
      fd.valor_bruto=parseFloat(vbInput.value)||0;
    }
  }));
  fg.appendChild(fpDiv);

  // Vendedor
  const vd=h('div');vd.appendChild(h('label',{className:'label'},'Vendedor *'));
  vd.appendChild(buildSelect([['','Selecione...'],...vendedores.map(u=>[u.id,u.nome])],fd.vendedor_id||'',v=>{fd.vendedor_id=parseInt(v)}));
  fg.appendChild(vd);
  // Vacinador
  const vc=h('div');vc.appendChild(h('label',{className:'label'},'Vacinador'));
  vc.appendChild(buildSelect([['','Selecione...'],...(usuarios||[]).map(u=>[u.id,u.nome])],fd.vacinador_id||'',v=>{fd.vacinador_id=parseInt(v)}));
  fg.appendChild(vc);
  // Valor bruto
  const vbDiv=h('div');vbDiv.appendChild(h('label',{className:'label'},'Valor Bruto R$'));
  const vbInp=h('input',{className:'input',type:'number',placeholder:'0',value:fd.valor_bruto||'',id:'plan-valor-bruto'});vbInp.addEventListener('input',e=>{fd.valor_bruto=parseFloat(e.target.value)||0});vbDiv.appendChild(vbInp);fg.appendChild(vbDiv);
  // Desconto
  const dcDiv=h('div');dcDiv.appendChild(h('label',{className:'label'},'Desconto %'));
  const dcInp=h('input',{className:'input',type:'number',placeholder:'0',max:'100'});dcInp.addEventListener('input',e=>{fd.percentual_desconto=parseFloat(e.target.value)||0});dcDiv.appendChild(dcInp);fg.appendChild(dcDiv);
  // Custo
  const ccDiv=h('div');ccDiv.appendChild(h('label',{className:'label'},'Custo R$'));
  const ccInp=h('input',{className:'input',type:'number',placeholder:'0'});ccInp.addEventListener('input',e=>{fd.valor_custo=parseFloat(e.target.value)||0});ccDiv.appendChild(ccInp);fg.appendChild(ccDiv);
  // Data
  const dtDiv=h('div');dtDiv.appendChild(h('label',{className:'label'},'Data Início'));
  const dtInp=h('input',{className:'input',type:'date',value:new Date().toISOString().split('T')[0]});dtInp.addEventListener('input',e=>{fd.data_inicio_plano=e.target.value});fd.data_inicio_plano=dtInp.value;dtDiv.appendChild(dtInp);fg.appendChild(dtDiv);
  s3.appendChild(fg);body.appendChild(s3);

  // Submit
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',null,'Criar Plano Vacinal',async()=>{
    if(!fd.cliente_id)return Toast.show('Selecione um cliente','error');
    if(!fd.plano_id&&!fd.nome_plano)return Toast.show('Selecione um plano','error');
    if(!fd.vendedor_id)return Toast.show('Vendedor é obrigatório','error');
    if(!fd.valor_bruto)return Toast.show('Informe o valor bruto','error');
    const fimPlano=new Date(fd.data_inicio_plano||new Date());fimPlano.setMonth(fimPlano.getMonth()+18);
    fd.data_fim_plano=fimPlano.toISOString().split('T')[0];
    fd.data_venda=fd.data_inicio_plano;
    const r=await Api.criarPlano(fd);
    if(r?.success){Toast.show('Plano criado com sucesso!');close();draw();}
    else Toast.show(r?.error||'Erro ao criar plano','error');
  },{style:{marginTop:'20px'}}));

},'640px')}

await draw();return wrap;}

async function renderPlanoDetalhe(){const wrap=h('div',{className:'fade-in'});
const pc=await Api.plano(AppState.planoDetalhe);if(!pc){wrap.appendChild(h('div',{className:'empty-state'},'Plano não encontrado'));return wrap}
wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
  iconBtn('btn btn-ghost btn-sm',I.chevL,'Voltar',()=>AppState.setModulo('planos')),
  h('h1',{className:'page-title',style:{marginTop:'8px'}},pc.nome_plano),
  h('p',{className:'page-subtitle',innerHTML:`${esc(pc.cliente_nome)} ${pc.codigo_cliente?'['+pc.codigo_cliente+']':''} · ${pc.idade_inicio}-${pc.idade_fim} meses · Vendedor: ${esc(pc.vendedor_nome||'-')}`})
)));
const sr=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'24px'}});
// Financial cards with custo adicional
const custoExtra=(pc.excecoes_fora_plano||[]).filter(e=>e.status==='concluido').length;
const custoExtraLabel=custoExtra>0?` (+${custoExtra} extra)`:'';
[['Valor Plano',fmtMoeda(pc.valor_final),'#1B4965'],['Pago',fmtMoeda(pc.total_pago),'#2BBCB3'],['Saldo',fmtMoeda(pc.saldo_pendente),'#d97706'],['Desconto',pc.percentual_desconto+'%','#7c3aed'],['Extras Aprovados',String(custoExtra),'#d97706']].forEach(([l,v,c])=>{sr.appendChild(h('div',{className:'fin-card',innerHTML:`<div class="fin-label">${l}</div><div class="fin-value" style="color:${c};font-size:20px">${v}</div>`}))});wrap.appendChild(sr);
// Doses
const dc=h('div',{className:'card',style:{marginBottom:'20px'}});dc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Doses (${pc.doses?.length||0})`));
(pc.doses||[]).forEach(d=>{const row=h('div',{style:{display:'flex',alignItems:'center',gap:'12px',padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});row.innerHTML=`<span class="badge ${d.status==='aplicada'?'badge-green':d.status==='pendente'?'badge-orange':'badge-gray'}">${d.status}</span><span class="fw-600">${esc(d.vacina_nome)}</span><span class="text-muted">Dose ${d.dose_numero}</span><span class="mono text-muted">${d.competencia||'-'}</span>${d.data_aplicacao?`<span class="text-sm text-muted">Em: ${fmtData(d.data_aplicacao)}</span>`:''}${d.local_aplicacao?`<span class="text-sm text-muted">${esc(d.local_aplicacao)}</span>`:''}${d.tipo_excecao?`<span class="badge badge-orange" style="font-size:10px">${d.tipo_excecao}</span>`:''}`;dc.appendChild(row)});wrap.appendChild(dc);

// ═══ EXCEÇÕES FORA DO PLANO ═══
if(pc.excecoes_fora_plano?.length){
  const ex=h('div',{className:'card',style:{marginBottom:'20px'}});
  ex.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px',color:'#d97706'}},`⚠ Exceções Fora do Plano (${pc.excecoes_fora_plano.length})`));
  pc.excecoes_fora_plano.forEach(e=>{
    const stColor=e.status==='concluido'?'badge-green':e.status==='pendente_aprovacao'?'badge-orange':'badge-red';
    const stLabel=e.status==='concluido'?'Aprovada':e.status==='pendente_aprovacao'?'⏳ Pendente':'✗ Recusada';
    const row=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});
    row.innerHTML=`<span class="badge ${stColor}">${stLabel}</span><span class="fw-600">${esc(e.vacina)}</span><span class="mono text-muted">${fmtDataHora(e.data)}</span>${e.justificativa?`<span class="text-sm text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.justificativa)}</span>`:''}${e.motivo_reprovacao?`<span class="text-sm" style="color:#dc2626">${esc(e.motivo_reprovacao)}</span>`:''}`;
    ex.appendChild(row);
  });
  wrap.appendChild(ex);
}
// Projeção
if(pc.projecao_mensal?.length){const pm=h('div',{className:'card',style:{marginBottom:'20px'}});pm.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},'Projeção Mensal'));
pc.projecao_mensal.forEach(p=>{const pct=p.previstas>0?Math.round(p.aplicadas/p.previstas*100):0;const row=h('div',{style:{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f1f5f9'}});row.innerHTML=`<span class="mono fw-600" style="width:70px;color:var(--navy)">${p.competencia}</span><div style="flex:1"><div class="prog-bar" style="height:8px"><div class="prog-fill" style="width:${pct}%;background:${pct===100?'#059669':'var(--primary)'}"></div></div></div><span class="mono text-sm">${p.aplicadas}/${p.previstas}</span><span class="badge ${pct===100?'badge-green':'badge-orange'}">${pct}%</span>`;pm.appendChild(row)});wrap.appendChild(pm)}
// Pagamentos
if(pc.pagamentos?.length){const pg=h('div',{className:'card'});pg.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Pagamentos (${pc.pagamentos.length})`));
pc.pagamentos.forEach(p=>{const row=h('div',{style:{display:'flex',alignItems:'center',gap:'12px',padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});row.innerHTML=`<span class="mono">${fmtData(p.data_pagamento)}</span><span class="mono fw-600" style="color:var(--primary)">${fmtMoeda(p.valor_pago)}</span><span class="badge badge-primary">${p.forma_pagamento}</span><span class="text-muted">${p.numero_parcela}ª parcela</span>`;pg.appendChild(row)});wrap.appendChild(pg)}
return wrap;}
