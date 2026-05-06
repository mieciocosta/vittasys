async function renderPlanos(){let f={page:1,limit:50,search:'',status_contrato:'',sort:'',order:''};const wrap=h('div',{className:'fade-in'});
async function draw(){wrap.innerHTML='';
const hdr=h('div',{className:'page-header'});
hdr.appendChild(h('div',{className:'page-header-left'},h('h1',{className:'page-title'},'Planos Vacinais'),h('p',{className:'page-subtitle'},'Contratos, projeção mensal e doses')));
hdr.appendChild(h('div',{className:'page-header-actions'},
  AppState.isMaster()?iconBtn('btn btn-outline btn-sm',null,'⚙ Modelos',()=>modalTemplates()):null,
  iconBtn('btn btn-primary btn-sm',I.plus,'Novo Plano',()=>modalNovoPlano())));
wrap.appendChild(hdr);
const stats=await Api.planosStats();
if(stats){const sr=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}});
[['Contratos',stats.total_contratos,'#1B4965'],['Aplicadas',stats.doses_aplicadas,'#2BBCB3'],['Pendentes',stats.doses_pendentes,'#d97706'],['Valor Total',fmtMoeda(stats.valor_total),'#059669']].forEach(([l,v,c])=>{sr.appendChild(h('div',{className:'fin-card',innerHTML:`<div class="fin-label">${l}</div><div class="fin-value" style="color:${c}">${v}</div>`}))});wrap.appendChild(sr)}
const fb=h('div',{className:'filters-bar'});
fb.appendChild(buildSearchBox('Buscar plano ou cliente...',v=>{f.search=v;f.page=1;draw()},f.search));
fb.appendChild(buildSelect([['','Status'],['ativo','Ativo'],['concluido','Concluído'],['cancelado','Cancelado'],['pendente','Pendente']],f.status_contrato,v=>{f.status_contrato=v;f.page=1;draw()}));
wrap.appendChild(fb);
const [data, excPendMap]=await Promise.all([Api.planos(f), Api.exclusoesPorEntidade('plano_contratado')]);
  if(!data)return;
  const excMap=excPendMap||{};
const tw=h('div',{className:'table-wrap'});
const t=buildSortableTable([['ID','id'],['Cliente','cliente_nome'],['Código','codigo_cliente'],['Plano','nome_plano'],['Faixa',''],['Valor','valor_final'],['Pago',''],['Saldo',''],['Progresso',''],['Status','status_contrato'],['Ações','']],f,draw);
const tb=h('tbody');
if(!data.data.length)tb.innerHTML='<tr><td colspan="11" class="empty-state">Nenhum plano</td></tr>';
else data.data.forEach(p=>{
  const prog=p.doses_total>0?Math.round(p.doses_aplicadas/p.doses_total*100):0;
  const tr=h('tr',{className:'clickable',onClick:()=>AppState.verPlano(p.id)});
  tr.style.borderLeft='3px solid var(--primary)';
  tr.innerHTML=`<td class="mono text-muted text-sm">#${p.id}</td><td class="fw-600" style="cursor:pointer" onclick="event.stopPropagation();AppState.verCliente(${p.cliente_id})">${esc(p.cliente_nome)}</td><td class="mono text-sm">${esc(p.codigo_cliente||'-')}</td><td class="fw-600">${esc(p.nome_plano)}</td><td class="text-sm">${p.idade_inicio}-${p.idade_fim}m</td><td class="mono fw-600" style="color:#059669">${fmtMoeda(p.valor_final)}</td><td class="mono" style="color:var(--primary)">${fmtMoeda(p.total_pago)}</td><td class="mono" style="color:${p.saldo_pendente>0?'#d97706':'#059669'}">${fmtMoeda(p.saldo_pendente)}</td><td><div style="display:flex;align-items:center;gap:6px"><div class="prog-bar" style="width:50px"><div class="prog-fill" style="width:${prog}%;background:${prog===100?'#059669':'var(--primary)'}"></div></div><span class="mono text-sm">${prog}%</span></div></td><td><span class="badge ${p.status_contrato==='ativo'?'badge-green':p.status_contrato==='finalizado'?'badge-primary':p.status_contrato==='pendente'?'badge-orange':'badge-gray'}">${p.status_contrato==='finalizado'?'✓ Finalizado':p.status_contrato}</span></td>`;
  // Actions
  const actTd=document.createElement('td');actTd.style.whiteSpace='nowrap';
  const excPend=excMap[p.id];
  const isInativoPlano=p.status_contrato==='cancelado'||p.status_contrato==='inativo';
  const isMasterUser=AppState.isMaster();
  if(isInativoPlano&&!isMasterUser){tr.style.display='none';}
  if(excPend){
    const badge=h('div',{style:'display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px'});
    badge.appendChild(h('span',{style:'font-size:14px'},'⏳'));
    const info=h('div');
    info.appendChild(h('div',{style:'font-size:11px;font-weight:700;color:#92400e'},'Exclusão pendente'));
    info.appendChild(h('div',{style:'font-size:10px;color:#92400e;opacity:0.8'},excPend.solicitanteNome||'—'));
    badge.appendChild(info);
    actTd.appendChild(badge);
  }else{
    actTd.appendChild(iconBtn('btn btn-outline btn-sm',null,'✏️',async e=>{e.stopPropagation();
      modalEditarPlano(p);
    }));
    if(prog===0&&(p.total_pago||0)===0){
      actTd.appendChild(iconBtn('btn btn-red btn-sm',null,'Excluir',async e=>{e.stopPropagation();
        await confirmarExclusao({
          entidade:'plano_contratado',entidadeId:p.id,
          label:`Plano "${p.nome_plano}" de ${p.cliente_nome}`,
          snapshot:{id:p.id,nome_plano:p.nome_plano,cliente_nome:p.cliente_nome,valor_final:p.valor_final},
          deleteFn:()=>Api.del(`/planos/${p.id}`),
          onSuccess:()=>draw()
        });
      }));
    }
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
      fd.plano_id=t.id;fd.nome_plano=t.nome;fd.idade_inicio=t.idade_inicio;fd.idade_fim=t.idade_fim;fd.valor_bruto=t.valor_tabela;fd.vacinas_custom=null;
      fd._valor_avista=t.valor_avista;fd._valor_cartao=t.valor_cartao;fd._parcelas=t.parcelas;fd._desc_pag=t.desc_pagamento;
      planGrid.querySelectorAll('div[data-plan]').forEach(d=>{d.style.borderColor='var(--border)';d.style.background=''});
      btn.style.borderColor='var(--primary)';btn.style.background='var(--primary-bg)';
      customBtn.style.borderColor='var(--primary)';customBtn.style.background='';
      customDiv.style.display='none';
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
  s2.appendChild(planGrid);
  // Custom plan option
  const customBtn=h('div',{style:'margin-top:10px;padding:12px;border-radius:10px;border:2px dashed var(--primary);cursor:pointer;text-align:center;transition:all .15s',
    onClick:async()=>{
      planGrid.querySelectorAll('div[data-plan]').forEach(d=>{d.style.borderColor='var(--border)';d.style.background=''});
      customBtn.style.borderColor='var(--primary)';customBtn.style.background='var(--primary-bg)';
      fd.plano_id=null;fd.nome_plano='';fd.vacinas_custom=[];
      customDiv.style.display='';
    }});
  customBtn.innerHTML='<div style="font-size:14px">➕</div><div style="font-weight:600;font-size:12px;color:var(--primary)">Plano Personalizado</div><div style="font-size:10px;color:var(--text-3)">Crie um plano sob medida para este cliente</div>';
  s2.appendChild(customBtn);
  // Custom plan fields (hidden initially)
  const customDiv=h('div',{style:'display:none;margin-top:12px;padding:14px;background:#f0fffe;border-radius:10px;border:1px solid var(--primary)'});
  const cgr=h('div',{className:'form-grid',style:'margin-bottom:10px'});
  // Name
  const cnDiv=h('div');cnDiv.appendChild(h('label',{className:'label'},'Nome do Plano *'));
  const cnInp=h('input',{className:'input',placeholder:'Ex: Plano Vacinal 3 a 5 meses'});
  cnInp.addEventListener('input',function(e){fd.nome_plano=e.target.value});cnDiv.appendChild(cnInp);cgr.appendChild(cnDiv);
  // Age range
  const caDiv=h('div');caDiv.appendChild(h('label',{className:'label'},'Faixa Etária (meses)'));
  const caRow=h('div',{style:'display:flex;gap:6px;align-items:center'});
  const caI1=h('input',{className:'input',type:'number',placeholder:'0',style:'width:70px;text-align:center'});
  caI1.addEventListener('input',function(e){fd.idade_inicio=parseInt(e.target.value)||0});
  const caI2=h('input',{className:'input',type:'number',placeholder:'18',style:'width:70px;text-align:center'});
  caI2.addEventListener('input',function(e){fd.idade_fim=parseInt(e.target.value)||18});
  caRow.appendChild(caI1);caRow.appendChild(h('span',{style:'font-size:12px;color:var(--text-3)'},'a'));caRow.appendChild(caI2);caRow.appendChild(h('span',{style:'font-size:11px;color:var(--text-3)'},'meses'));
  caDiv.appendChild(caRow);cgr.appendChild(caDiv);
  customDiv.appendChild(cgr);
  // Add vaccines
  customDiv.appendChild(h('label',{className:'label',style:'font-size:12px'},'💉 Vacinas do Plano'));
  const cvList=h('div',{style:'margin-bottom:8px'});customDiv.appendChild(cvList);
  function renderCVacs(){cvList.innerHTML='';(fd.vacinas_custom||[]).forEach(function(vc,i){
    var row=h('div',{style:'display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #d1fae5;font-size:12px'});
    row.appendChild(h('span',{style:'flex:1;font-weight:600'},esc(vc._nome||'')));
    row.appendChild(h('span',{style:'font-size:11px;color:var(--text-3)'},vc.doses+' dose(s)'));
    row.appendChild(h('button',{style:'border:none;background:#dc262610;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:10px;color:#dc2626',onClick:function(){fd.vacinas_custom.splice(i,1);renderCVacs()}},'✗'));
    cvList.appendChild(row)})}
  var cvacinas=[];
  Api.vacinas().then(function(v){cvacinas=v||[]});
  var cvRow=h('div',{style:'display:flex;gap:6px;align-items:end'});
  var cvSelDiv=h('div',{style:'flex:1'});
  var cvSel=buildSelect([['','— Vacina —']],'',(function(){}));
  setTimeout(function(){
    cvSelDiv.innerHTML='';
    cvSel=buildSelect([['','— Selecione —']].concat((cvacinas||[]).map(function(v){return[v.id,v.nome]})),'',function(){});
    cvSelDiv.appendChild(cvSel)},500);
  cvSelDiv.appendChild(cvSel);cvRow.appendChild(cvSelDiv);
  var cvDoseInp=h('input',{className:'input',type:'number',value:'1',min:'1',style:'width:60px;text-align:center'});
  cvRow.appendChild(cvDoseInp);
  cvRow.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'height:38px',onClick:function(){
    var vid=cvSel.value;if(!vid)return Toast.show('Selecione uma vacina','error');
    var vac=cvacinas.find(function(v){return v.id==vid});
    if(!fd.vacinas_custom)fd.vacinas_custom=[];
    fd.vacinas_custom.push({vacina_id:+vid,doses:parseInt(cvDoseInp.value)||1,mes_inicio:fd.idade_inicio||0,mes_fim:fd.idade_fim||18,_nome:vac?vac.nome:''});
    cvSel.value='';cvDoseInp.value='1';renderCVacs()
  }},'+'));
  customDiv.appendChild(cvRow);
  s2.appendChild(customDiv);
  body.appendChild(s2);

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
    if(!fd.plano_id&&!fd.nome_plano)return Toast.show('Selecione um plano ou crie um personalizado','error');
    if(fd.vacinas_custom?.length&&!fd.nome_plano)return Toast.show('Informe o nome do plano personalizado','error');
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

// ═══ EDITAR PLANO CONTRATADO ═══
function modalEditarPlano(pc){showModal('✏️ Editar Plano — '+pc.nome_plano,async(body,close)=>{
  const isMaster=AppState.isMaster();
  const fd={nome_plano:pc.nome_plano,valor_bruto:pc.valor_bruto||pc.valor_final||0,percentual_desconto:pc.percentual_desconto||pc.percentualDesconto||0,
    valor_custo:pc.valor_custo||pc.valorCusto||0,status_contrato:pc.status_contrato||pc.statusContrato,
    forma_pagamento:pc.forma_pagamento||pc.formaPagamento||'avista',
    _caller_id:AppState.usuario?.id,_caller_perfil:AppState.usuario?.perfil,_caller_nome:AppState.usuario?.nome};

  if(!isMaster){
    const notice=h('div',{style:'padding:10px 14px;background:#fff7ed;border-left:3px solid #f97316;border-radius:8px;margin-bottom:16px;font-size:12px;color:#9a3412'});
    notice.innerHTML='⚠️ <strong>Perfil Operador:</strong> Suas alterações serão enviadas para aprovação do Master antes de serem aplicadas.';
    body.appendChild(notice);
  }

  // Client info
  body.appendChild(h('div',{style:'padding:10px;background:var(--bg-subtle);border-radius:8px;margin-bottom:16px;font-size:12px'},
    h('strong',null,(pc.cliente_nome||'')+' '),h('span',{className:'mono',style:'color:var(--text-3)'},pc.codigo_cliente||'')));

  const gr=h('div',{className:'form-grid',style:'margin-bottom:16px'});
  // Nome do Plano
  const d0=h('div',{style:'grid-column:1/-1'});d0.appendChild(h('label',{className:'label'},'NOME DO PLANO'));
  const i0=h('input',{className:'input',value:fd.nome_plano||'',style:'font-weight:600'});
  i0.addEventListener('input',function(e){fd.nome_plano=e.target.value});d0.appendChild(i0);gr.appendChild(d0);
  // Valor Bruto
  const d1=h('div');d1.appendChild(h('label',{className:'label'},'VALOR BRUTO R$'));
  const i1=h('input',{className:'input',type:'number',value:fd.valor_bruto,step:'0.01'});
  i1.addEventListener('input',function(e){fd.valor_bruto=parseFloat(e.target.value)||0});d1.appendChild(i1);gr.appendChild(d1);
  // Desconto
  const d2=h('div');d2.appendChild(h('label',{className:'label'},'DESCONTO %'));
  const i2=h('input',{className:'input',type:'number',value:fd.percentual_desconto,max:'100'});
  i2.addEventListener('input',function(e){fd.percentual_desconto=parseFloat(e.target.value)||0});d2.appendChild(i2);gr.appendChild(d2);
  // Custo
  const d3=h('div');d3.appendChild(h('label',{className:'label'},'CUSTO R$'));
  const i3=h('input',{className:'input',type:'number',value:fd.valor_custo,step:'0.01'});
  i3.addEventListener('input',function(e){fd.valor_custo=parseFloat(e.target.value)||0});d3.appendChild(i3);gr.appendChild(d3);
  // Forma pagamento
  const d4=h('div');d4.appendChild(h('label',{className:'label'},'FORMA PAGAMENTO'));
  d4.appendChild(buildSelect([['avista','À Vista'],['cartao','Cartão']], fd.forma_pagamento,function(v){fd.forma_pagamento=v}));
  gr.appendChild(d4);
  // Status
  const d5=h('div');d5.appendChild(h('label',{className:'label'},'STATUS'));
  d5.appendChild(buildSelect([['ativo','Ativo'],['finalizado','Finalizado'],['cancelado','Cancelado'],['pendente','Pendente']], fd.status_contrato,function(v){fd.status_contrato=v}));
  gr.appendChild(d5);
  body.appendChild(gr);

  body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'font-size:14px;padding:12px',onClick:async function(){
    const r=await Api.editarPlano(pc.id,fd);
    if(r?.success){
      Toast.show(r.message||(r.pendente?'Enviado para aprovação':'Plano atualizado'));
      close();
      // Refresh list or detail
      if(typeof draw==='function')draw();
      if(AppState.modulo==='plano-detalhe')AppState.notify();
    }else Toast.show(r?.error||'Erro','error');
  }},isMaster?'💾 Salvar Alterações':'📤 Enviar para Aprovação'));
},'500px')}

// ═══ GERENCIAR MODELOS DE PLANO ═══
function modalTemplates(){showModal('⚙ Modelos de Plano Vacinal',async(body,close)=>{
  async function listTemplates(){
    body.innerHTML='';
    const tpls=await Api.planosTemplates()||[];
    if(!tpls.length){body.appendChild(h('div',{style:'text-align:center;padding:20px;color:var(--text-3)'},'Nenhum modelo cadastrado'));
    }else{
      tpls.forEach(t=>{
        const row=h('div',{style:'display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #f1f5f9'});
        const info=h('div',{style:'flex:1'});
        info.innerHTML=`<div style="font-weight:700;font-size:13px">${esc(t.nome)}</div>
          <div style="font-size:11px;color:var(--text-3)">${t.idade_inicio}-${t.idade_fim} meses · ${(t.vacinas||[]).length} vacinas · <span style="color:#059669;font-weight:600">${fmtMoeda(t.valor_avista||t.valor_tabela)}</span> à vista${t.valor_cartao?' · '+fmtMoeda(t.valor_cartao)+' cartão':''}</div>`;
        row.appendChild(info);
        row.appendChild(h('button',{style:'border:none;background:var(--bg-subtle);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px',onClick:()=>editTemplate(t)},'✏️'));
        if(AppState.isMaster()){row.appendChild(h('button',{style:'border:none;background:#dc262610;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px',onClick:async()=>{
          await confirmarExclusao({entidade:'template_plano',entidadeId:t.id,label:`Modelo "${t.nome}"`,snapshot:{id:t.id,nome:t.nome},deleteFn:()=>Api.excluirTemplate(t.id),onSuccess:()=>listTemplates()});
        }},'🗑'))}
        body.appendChild(row);
      });
    }
    body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'margin-top:14px',onClick:()=>editTemplate(null)},'+ Novo Modelo de Plano'));
  }
  async function editTemplate(t){
    body.innerHTML='';
    const vacs=await Api.vacinas()||[];
    const fd={nome:t?.nome||'',descricao:t?.descricao||'',idade_inicio:t?.idade_inicio||0,idade_fim:t?.idade_fim||18,
      valor_tabela:t?.valor_tabela||0,valor_avista:t?.valor_avista||0,valor_cartao:t?.valor_cartao||0,
      parcelas:t?.parcelas||1,desc_pagamento:t?.desc_pagamento||'',
      vacinas:(t?.vacinas||[]).map(v=>({vacina_id:v.vacinaId||v.vacina_id,doses:v.doses,mes_inicio:v.mesPrevInicio||v.mes_inicio||0,mes_fim:v.mesPrevFim||v.mes_fim||18,nome:v.vacina_nome||v.vacina?.nome||''}))};
    body.appendChild(h('label',{className:'label',style:'font-size:13px'},'📋 NOME DO PLANO *'));
    const ni=h('input',{className:'input',style:'font-size:14px;padding:10px;margin-bottom:14px',value:fd.nome,placeholder:'Ex: Plano Vacinal 0 a 6 meses'});
    ni.addEventListener('input',e=>{fd.nome=e.target.value});body.appendChild(ni);
    const gr=h('div',{className:'form-grid',style:'margin-bottom:14px'});
    [['idade_inicio','IDADE INÍCIO (meses)','number'],['idade_fim','IDADE FIM (meses)','number'],
     ['valor_avista','VALOR À VISTA R$','number'],['valor_cartao','VALOR CARTÃO R$','number'],
     ['parcelas','PARCELAS','number'],['desc_pagamento','DESC. PAGAMENTO','text']].forEach(([k,l,type])=>{
      const d=h('div');d.appendChild(h('label',{className:'label'},l));
      const inp=h('input',{className:'input',type:type,value:fd[k]||'',placeholder:'0'});
      inp.addEventListener('input',e=>{fd[k]=type==='number'?parseFloat(e.target.value)||0:e.target.value});
      d.appendChild(inp);gr.appendChild(d)});
    body.appendChild(gr);
    // Vaccines selection
    body.appendChild(h('label',{className:'label',style:'font-size:13px'},'💉 VACINAS DO PLANO'));
    const vacList=h('div',{style:'margin-bottom:14px'});
    function renderVacs(){
      vacList.innerHTML='';
      fd.vacinas.forEach((v,i)=>{
        const row=h('div',{style:'display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid #f1f5f9'});
        row.appendChild(h('span',{style:'flex:1;font-size:12px;font-weight:600'},esc(v.nome||'Vacina #'+(i+1))));
        row.appendChild(h('span',{style:'font-size:11px;color:var(--text-3)'},v.doses+' dose(s)'));
        row.appendChild(h('button',{style:'border:none;background:#dc262610;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:10px',onClick:()=>{fd.vacinas.splice(i,1);renderVacs()}},'✗'));
        vacList.appendChild(row)});
    }
    renderVacs();body.appendChild(vacList);
    // Add vaccine
    const addRow=h('div',{style:'display:flex;gap:6px;margin-bottom:14px;align-items:end'});
    const avd=h('div',{style:'flex:1'});avd.appendChild(h('label',{className:'label'},'Vacina'));
    const avSel=buildSelect([['','— Selecione —'],...vacs.map(v=>[v.id,v.nome])],'',()=>{});avd.appendChild(avSel);addRow.appendChild(avd);
    const add=h('div',{style:'width:70px'});add.appendChild(h('label',{className:'label'},'Doses'));
    const adInp=h('input',{className:'input',type:'number',value:'1',min:'1',style:'text-align:center'});add.appendChild(adInp);addRow.appendChild(add);
    addRow.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'height:38px;margin-bottom:0',onClick:()=>{
      const vid=avSel.value;if(!vid)return Toast.show('Selecione uma vacina','error');
      const vac=vacs.find(v=>v.id==vid);
      fd.vacinas.push({vacina_id:+vid,doses:parseInt(adInp.value)||1,mes_inicio:0,mes_fim:18,nome:vac?.nome||''});
      avSel.value='';adInp.value='1';renderVacs()
    }},'+'));
    body.appendChild(addRow);
    // Buttons
    const btns=h('div',{style:'display:flex;gap:8px'});
    btns.appendChild(h('button',{className:'btn btn-primary',style:'flex:1;padding:12px;font-size:13px',onClick:async()=>{
      if(!fd.nome)return Toast.show('Nome obrigatório','error');
      fd.valor_tabela=fd.valor_avista||fd.valor_cartao||0;
      const r=t?await Api.editarTemplate(t.id,fd):await Api.criarTemplate(fd);
      if(r?.success){Toast.show(t?'Modelo atualizado!':'Modelo criado!');listTemplates()}else Toast.show(r?.error||'Erro','error');
    }},t?'💾 Salvar':'+ Criar Modelo'));
    btns.appendChild(h('button',{className:'btn btn-outline',style:'flex:1;padding:12px;font-size:13px',onClick:()=>listTemplates()},'← Voltar'));
    body.appendChild(btns);
  }
  await listTemplates();
},'600px')}

await draw();return wrap;}

async function renderPlanoDetalhe(){const wrap=h('div',{className:'fade-in'});
const pc=await Api.plano(AppState.planoDetalhe);if(!pc){wrap.appendChild(h('div',{className:'empty-state'},'Plano não encontrado'));return wrap}
wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
  iconBtn('btn btn-ghost btn-sm',I.chevL,'Voltar',()=>AppState.setModulo('planos')),
  h('h1',{className:'page-title',style:{marginTop:'8px'}},pc.nome_plano),
  h('p',{className:'page-subtitle',innerHTML:`${esc(pc.cliente_nome)} ${pc.codigo_cliente?'['+pc.codigo_cliente+']':''} · ${pc.idade_inicio}-${pc.idade_fim} meses · Vendedor: ${esc(pc.vendedor_nome||'-')} · <span class="badge ${pc.status_contrato==='ativo'?'badge-green':pc.status_contrato==='finalizado'?'badge-primary':'badge-gray'}">${pc.status_contrato==='finalizado'?'✓ Finalizado':pc.status_contrato}</span>`})
),h('div',{className:'page-header-actions'},
  iconBtn('btn btn-outline btn-sm',null,'✏️ Editar Plano',()=>modalEditarPlano(pc))
)));
// Progress bar
const dosesApp=(pc.doses||[]).filter(d=>d.status==='aplicada').length;
const dosesTot=(pc.doses||[]).length;
const progPct=dosesTot>0?Math.round(dosesApp/dosesTot*100):0;
const progBar=h('div',{style:{marginBottom:'16px',padding:'12px',background:'var(--bg-card)',borderRadius:'12px',border:'1px solid var(--border)'}});
progBar.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="fw-600" style="font-size:13px">Progresso do Plano</span><span class="mono fw-600" style="color:${progPct===100?'#059669':'var(--primary)'}">${dosesApp}/${dosesTot} doses · ${progPct}%</span></div><div class="prog-bar" style="height:10px"><div class="prog-fill" style="width:${progPct}%;background:${progPct===100?'#059669':'var(--primary)'}"></div></div>`;
wrap.appendChild(progBar);
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
