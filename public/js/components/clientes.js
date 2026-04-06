async function renderClientes(){
  // Auto-filter by user profile
  const perfilFilter=AppState.filtroClientePerfil();
  let f={page:1,limit:50,search:'',tipo_cliente:perfilFilter,tipo_paciente:'',sort:'',order:''};
  let showForm=false,editId=null,formData={};
  const wrap=h('div',{className:'fade-in'});

async function draw(){wrap.innerHTML='';
const hdr=h('div',{className:'page-header'});
const titleSuffix=perfilFilter==='ativo'?' — Ativos':perfilFilter==='espontaneo'?' — Espontâneos':'';
hdr.appendChild(h('div',{className:'page-header-left'},
  h('h1',{className:'page-title'},`Clientes${titleSuffix}`),
  h('p',{className:'page-subtitle'},'Cadastro, pacientes vinculados e importação inteligente')
));
const acts=h('div',{className:'page-header-actions'});
acts.appendChild(iconBtn('btn btn-outline btn-sm',I.upload,'Importar com IA',()=>modalImportarIA()));
acts.appendChild(iconBtn(`btn ${showForm?'btn-red':'btn-primary'} btn-sm`,showForm?I.x:I.plus,showForm?'Cancelar':'Novo Cliente',()=>{
  showForm=!showForm;editId=null;
  if(showForm)formData={tipo_cliente:perfilFilter||'espontaneo',tipo_paciente:'adulto',status:'ativo'};
  draw();
}));
hdr.appendChild(acts);wrap.appendChild(hdr);

if(showForm){wrap.appendChild(buildClienteForm(formData,editId,async()=>{showForm=false;editId=null;formData={};draw()}))}

const fb=h('div',{className:'filters-bar'});
fb.appendChild(buildSearchBox('Buscar por nome, CPF (com ou sem pontuação), código, telefone...',v=>{f.search=v;f.page=1;draw()},f.search));
// Only show type filter if user can see both
if(!perfilFilter){
  fb.appendChild(buildFilterChips([['','Todos'],['ativo','⭐ Ativos'],['espontaneo','Espontâneos']],f.tipo_cliente,v=>{f.tipo_cliente=v;f.page=1;draw()}));
}
fb.appendChild(buildSelect([['','Tipo Paciente'],['bebe','Bebê'],['crianca','Criança'],['adulto','Adulto']],f.tipo_paciente,v=>{f.tipo_paciente=v;f.page=1;draw()}));
wrap.appendChild(fb);

const data=await Api.clientes(f);if(!data)return;
const tw=h('div',{className:'table-wrap'});const t=h('table');
const thead=document.createElement('thead');const headerRow=document.createElement('tr');
[['ID',''],['Código','codigo'],['Cliente','nome'],['Idade','nascimento'],['Tipo','tipo'],['Telefone',''],['Planos',''],['Vendedor',''],['Status','status'],['Ações','']].forEach(([label,sortKey])=>{
  const th=document.createElement('th');th.textContent=label;
  if(sortKey){th.style.cursor='pointer';th.title='Ordenar por '+label;
    th.onclick=()=>{if(f.sort===sortKey)f.order=f.order==='DESC'?'ASC':'DESC';else{f.sort=sortKey;f.order='ASC'}draw()};
    if(f.sort===sortKey)th.textContent+=f.order==='DESC'?' ▼':' ▲';}
  headerRow.appendChild(th);
});thead.appendChild(headerRow);t.appendChild(thead);
const tb=h('tbody');
if(!data.data.length)tb.innerHTML='<tr><td colspan="10" class="empty-state">Nenhum cliente encontrado</td></tr>';
else data.data.forEach(c=>{
  const tr=h('tr',{className:'clickable'});
  if(c.tipo_cliente==='ativo')tr.style.borderLeft='3px solid var(--primary)';
  tr.innerHTML=`<td class="mono text-muted text-sm">#${c.id}</td>
    <td class="mono fw-600" style="color:var(--primary);cursor:pointer" onclick="AppState.verCliente(${c.id})">${esc(c.codigo_cliente||'-')}</td>
    <td style="cursor:pointer" onclick="AppState.verCliente(${c.id})"><div class="fw-600">${esc(c.nome)}</div>${c.observacoes_clinicas?`<div class="text-sm" style="color:#d97706">⚠ ${esc(c.observacoes_clinicas.slice(0,30))}</div>`:''}</td>
    <td class="text-sm">${c.data_nascimento?fmtIdade(c.data_nascimento):'-'}</td>
    <td>${tipoClienteBadge(c.tipo_cliente)}</td>
    <td class="text-sm">${esc(c.telefone||'-')}</td>
    <td class="mono fw-600" style="color:${(c.planos_ativos||0)>0?'#7c3aed':'#94a3b8'}">${c.planos_ativos||0}</td>
    <td class="text-sm text-muted">${esc(c.vendedor_nome||'-')}</td>
    <td><span class="badge ${c.status==='ativo'?'badge-green':'badge-gray'}">${c.status}</span></td>`;
  const actTd=document.createElement('td');actTd.style.whiteSpace='nowrap';
  actTd.appendChild(iconBtn('btn btn-outline btn-sm',null,'Editar',e=>{
    e.stopPropagation();editId=c.id;formData={};
    ['codigo_cliente','nome','data_nascimento','sexo','cpf','telefone','email','tipo_paciente','tipo_cliente','responsavel_nome','responsavel_parentesco','responsavel_cpf','responsavel_telefone','vendedor_id','vacinador_id','status','observacoes','observacoes_clinicas'].forEach(k=>{if(c[k]!=null)formData[k]=c[k]});
    showForm=true;draw();
  },{style:{marginRight:'4px'}}));
  if((c.planos_ativos||0)===0&&(c.total_movimentacoes||0)===0){
    actTd.appendChild(iconBtn('btn btn-red btn-sm',null,'Excluir',async e=>{e.stopPropagation();if(!confirm(`Desativar ${c.nome}?`))return;
      const r=await Api.deletarCliente(c.id);if(r?.success){Toast.show('Desativado');draw()}else Toast.show(r?.error||'Erro','error')}));
  }
  tr.appendChild(actTd);tb.appendChild(tr);
});
t.appendChild(tb);tw.appendChild(t);
tw.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
wrap.appendChild(tw);
}

// ═══ AI IMPORT MODAL ═══
function modalImportarIA(){showModal('Cadastro Inteligente com IA',async(body,close)=>{
  // WhatsApp tip
  body.appendChild(h('div',{style:{padding:'14px',background:'var(--green-bg)',borderRadius:'10px',marginBottom:'16px',border:'1px solid var(--green-badge)'}},
    h('div',{style:{fontWeight:'600',fontSize:'13px',color:'var(--green-text)',marginBottom:'4px'}},'💬 Melhor método: WhatsApp exportado (.txt)'),
    h('div',{style:{fontSize:'12px',color:'var(--green-text)'}},'No WhatsApp: toque ⋮ > Mais > Exportar conversa > Sem mídia. Arraste o .txt aqui.')
  ));
  // File upload
  const uploadArea=h('div',{className:'upload-area',style:{padding:'24px'}});
  uploadArea.innerHTML=`<div style="color:var(--primary);margin-bottom:6px">${I.upload}</div><p style="font-weight:600;margin-bottom:2px">Arraste o arquivo .txt exportado do WhatsApp</p><p style="font-size:12px;color:var(--text-3)">Também aceita: .csv, .png, .jpg, .pdf</p>`;
  const fi=h('input',{type:'file',accept:'.txt,.csv,.text,.png,.jpg,.jpeg,.pdf',style:{display:'none'}});
  uploadArea.addEventListener('click',()=>fi.click());
  uploadArea.addEventListener('dragover',e=>{e.preventDefault();uploadArea.classList.add('dragover')});
  uploadArea.addEventListener('dragleave',()=>uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop',e=>{e.preventDefault();uploadArea.classList.remove('dragover');fi.files=e.dataTransfer.files;processFile()});
  fi.addEventListener('change',processFile);
  body.appendChild(uploadArea);body.appendChild(fi);
  body.appendChild(h('div',{style:{textAlign:'center',margin:'14px 0',color:'var(--text-4)',fontSize:'12px'}},'— ou cole o texto diretamente —'));
  const ta=h('textarea',{className:'input',placeholder:'Cole aqui o texto da conversa ou dados do cliente...\n\nExemplo:\nmeu nome é maria silva\ncpf 123.456.789-00\n98999990000\nmãe do bebê João, nascido em 15/01/2025',style:{minHeight:'100px',resize:'vertical',fontFamily:'var(--mono)',fontSize:'11px'}});
  body.appendChild(ta);
  body.appendChild(iconBtn('btn btn-primary btn-block btn-lg',I.search,'Analisar Texto',async()=>{
    if(!ta.value.trim())return Toast.show('Cole algum texto para analisar','error');
    resultArea.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-3)">🔍 Analisando...</div>';
    const r2=await Api.extrairClienteIATexto(ta.value);showResult(r2,resultArea,close);
  },{style:{marginTop:'12px'}}));
  const resultArea=h('div',{style:{marginTop:'16px'}});body.appendChild(resultArea);

  async function processFile(){if(!fi.files[0])return;const fname=fi.files[0].name;const fext=fname.split('.').pop().toLowerCase();
    uploadArea.innerHTML=`<div style="color:var(--primary);font-weight:600">📄 ${esc(fname)}</div><div style="font-size:12px;color:var(--text-3);margin-top:4px">${fext==='txt'?'Processando WhatsApp...':'OCR em andamento...'}</div>`;
    resultArea.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-3)">🔍 Processando...</div>';
    const fd=new FormData();fd.append('arquivo',fi.files[0]);const r2=await Api.extrairClienteIA(fd);showResult(r2,resultArea,close)}

  function showResult(r2,area,closeFn){
    if(!r2||!r2.success){area.innerHTML=`<div style="color:var(--red);padding:12px;background:var(--red-bg);border-radius:8px">${esc(r2?.error||'Erro')}</div>`;return}
    area.innerHTML='';
    const confC={alta:'badge-green',media:'badge-orange',baixa:'badge-red',nenhuma:'badge-gray'};const cl=r2.confianca_label||'nenhuma';
    const metLbl={whatsapp_arquivo:'💬 WhatsApp .txt',whatsapp_texto:'💬 WhatsApp',texto_direto:'📝 Texto',ocr_imagem:'📸 OCR',arquivo_texto:'📄 Arquivo'};
    area.appendChild(h('div',{style:{padding:'12px',background:'var(--primary-bg)',borderRadius:'10px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}},
      h('span',{innerHTML:`<span class="badge ${confC[cl]}">${cl} ${r2.confianca||0}%</span>`}),
      h('span',{innerHTML:`<span class="badge badge-navy">${metLbl[r2.metodo]||r2.metodo||'?'}</span>`}),
      h('span',{style:{fontSize:'12px',color:'var(--text-3)'}},`${Object.keys(r2.campos||{}).length} campos`)
    ));
    if(r2.sugestoes?.length){const sg=h('div',{style:{marginBottom:'12px'}});r2.sugestoes.forEach(s=>{sg.appendChild(h('div',{style:{fontSize:'12px',color:'var(--text-3)',marginBottom:'3px'}},'• '+s))});area.appendChild(sg)}
    if(r2.texto_bruto){const tp=h('details',{style:{marginBottom:'14px'}});tp.appendChild(h('summary',{style:{cursor:'pointer',color:'var(--text-3)',fontSize:'12px',fontWeight:'500'}},'📋 Ver texto bruto'));
      tp.appendChild(h('pre',{style:{marginTop:'6px',padding:'10px',background:'var(--bg-subtle)',borderRadius:'8px',whiteSpace:'pre-wrap',fontSize:'11px',maxHeight:'120px',overflow:'auto',fontFamily:'var(--mono)'}},r2.texto_bruto.slice(0,600)));area.appendChild(tp)}
    const campos=r2.campos||{};const previewData={...campos,tipo_cliente:perfilFilter||'espontaneo',status:'ativo'};
    area.appendChild(h('div',{className:'label',style:{marginBottom:'8px'}},'DADOS EXTRAÍDOS — revise antes de cadastrar'));
    const gr=h('div',{className:'form-grid'});
    [['nome','Nome'],['cpf','CPF'],['telefone','Telefone'],['email','E-mail'],['data_nascimento','Nascimento'],['responsavel_nome','Responsável'],['parentesco','Parentesco'],['tipo_paciente','Tipo Paciente'],['endereco','Endereço'],['cep','CEP'],['cidade','Cidade'],['uf','UF']].forEach(([k,l])=>{
      const d=h('div');const has=campos[k]&&String(campos[k]).length>0;
      d.appendChild(h('label',{className:'label',style:{color:has?'var(--primary)':'var(--text-4)'}},l+(has?' ✓':'')));
      const inp=h('input',{className:'input',value:previewData[k]||'',placeholder:l,style:{borderColor:has?'var(--primary)':'var(--border)',fontWeight:has?'600':'400'}});
      inp.addEventListener('input',e=>{previewData[k]=e.target.value});d.appendChild(inp);gr.appendChild(d)});
    area.appendChild(gr);
    if(campos.paciente_e_proprio)area.appendChild(h('div',{style:{padding:'8px 12px',background:'var(--primary-bg)',borderRadius:'8px',fontSize:'12px',color:'var(--primary-dark)',margin:'12px 0'}},'✓ Paciente é o próprio cliente'));
    area.appendChild(iconBtn('btn btn-primary btn-block btn-lg',I.check,'Usar Dados e Cadastrar',async()=>{formData=previewData;showForm=true;closeFn();draw()},{style:{marginTop:'8px'}}))
  }
},'660px')}

await draw();return wrap;}

function buildClienteForm(fd,editId,onDone){
  const fm=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
  fm.appendChild(h('div',{className:'client-form-section'},
    h('h4',null,'Dados do Cliente / Responsável Financeiro'),
    h('div',{className:'client-form-grid'},
      fld('Nome Completo *','nome',fd),fldDate('Data de Nascimento *','data_nascimento',fd),
      fldSel('Sexo','sexo',[['','—'],['M','Masculino'],['F','Feminino']],fd),
      fldMask('CPF *','cpf',maskCPF,fd),fldMask('Telefone *','telefone',maskTel,fd),
      fld('E-mail','email',fd,'email'),
      fldSel('Tipo Cliente','tipo_cliente',[['ativo','⭐ Ativo'],['espontaneo','Espontâneo']],fd),
      fldSel('Status','status',[['ativo','Ativo'],['inativo','Inativo'],['pendente','Pendente']],fd)
    )
  ));
  if(!editId){
    fm.appendChild(h('div',{className:'client-form-section'},
      h('h4',null,'Paciente (quem receberá as vacinas)'),
      h('div',{style:{marginBottom:'12px'}},
        (()=>{const chk=h('label',{style:{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'13px'}});
        const inp=h('input',{type:'checkbox'});inp.addEventListener('change',e=>{fd.paciente_e_proprio=e.target.checked;if(e.target.checked){fd.paciente_nome=fd.nome;fd.paciente_tipo='adulto'}});
        chk.appendChild(inp);chk.appendChild(document.createTextNode('O paciente é o próprio cliente'));return chk})()
      ),
      h('div',{className:'client-form-grid'},
        fld('Nome do Paciente','paciente_nome',fd),fldDate('Nascimento','paciente_nascimento',fd),
        fldSel('Sexo','paciente_sexo',[['','—'],['M','Masc'],['F','Fem']],fd),
        fldSel('Tipo','paciente_tipo',[['bebe','Bebê'],['crianca','Criança'],['adulto','Adulto']],fd),
        fld('Obs. Clínicas','paciente_obs',fd))
    ));
  }
  fm.appendChild(h('div',{className:'client-form-section'},
    h('h4',null,'Observações'),
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}},fldArea('Gerais','observacoes',fd),fldArea('Clínicas','observacoes_clinicas',fd))
  ));
  fm.appendChild(iconBtn('btn btn-primary btn-lg',null,editId?'Salvar Alterações':'Cadastrar Cliente',async()=>{
    if(!fd.nome||fd.nome.trim().length<3)return Toast.show('Nome é obrigatório (mínimo 3 caracteres)','error');
    if(!editId){
      if(!fd.cpf)return Toast.show('CPF é obrigatório','error');
      if(!fd.data_nascimento)return Toast.show('Data de nascimento é obrigatória','error');
      if(!fd.telefone)return Toast.show('Telefone é obrigatório','error');
    }
    if(fd.cpf&&fd.cpf.replace(/\D/g,'').length>=11&&!validarCPF(fd.cpf))return Toast.show('CPF inválido — verifique os dígitos','error');
    if(fd.data_nascimento&&!validarNascimento(fd.data_nascimento))return Toast.show('Data de nascimento inválida','error');
    if(editId){const r=await Api.atualizarCliente(editId,fd);if(r?.success){Toast.show('Atualizado!');onDone()}else Toast.show(r?.error||'Erro','error')}
    else{const r=await Api.criarCliente(fd);if(r?.success){Toast.show(`${fd.nome} cadastrado! ${r.codigo_cliente?'['+r.codigo_cliente+']':''}`);onDone()}else Toast.show(r?.error||'Erro','error')}
  }));
  return fm;
}
function fld(l,k,fd,type){const d=h('div');d.appendChild(h('label',{className:'label'},l));const i=h('input',{className:'input',type:type||'text',value:fd[k]||'',maxLength:'200'});i.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(i);return d}
function fldDate(l,k,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));const i=h('input',{className:'input',type:'date',value:fd[k]||''});i.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(i);return d}
function fldSel(l,k,opts,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));d.appendChild(buildSelect(opts,fd[k]||'',v=>{fd[k]=v}));return d}
function fldMask(l,k,maskFn,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));d.appendChild(inputComMascara('input','',maskFn,v=>{fd[k]=v},fd[k]||''));return d}
function fldArea(l,k,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));const ta=h('textarea',{className:'input',style:{minHeight:'60px',resize:'vertical'}});ta.value=fd[k]||'';ta.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(ta);return d}

async function renderClienteDetalhe(){const wrap=h('div',{className:'fade-in'});
const c=await Api.cliente(AppState.clienteDetalhe);if(!c){wrap.appendChild(h('div',{className:'empty-state'},'Não encontrado'));return wrap}
wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
  iconBtn('btn btn-outline btn-sm',I.chevL,'Voltar para Clientes',()=>AppState.setModulo('clientes')),
  h('h1',{className:'page-title',style:{marginTop:'10px'}},`${c.nome} ${c.codigo_cliente?'['+c.codigo_cliente+']':''}`),
  h('p',{className:'page-subtitle',innerHTML:`${tipoClienteBadge(c.tipo_cliente)} · Tel: ${esc(c.telefone||'-')} · CPF: ${esc(c.cpf||'-')}`})
)));
const info=h('div',{className:'card',style:{marginBottom:'20px'}});
info.innerHTML=`<h3 style="font-size:15px;font-weight:600;margin-bottom:14px">Dados do Cliente</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
<div><div class="label">Vendedor</div><div>${esc(c.vendedor_nome||'-')}</div></div><div><div class="label">Vacinador</div><div>${esc(c.vacinador_nome||'-')}</div></div><div><div class="label">Tipo</div><div>${tipoPacienteBadge(c.tipo_paciente)}</div></div><div><div class="label">Status</div><div><span class="badge ${c.status==='ativo'?'badge-green':'badge-gray'}">${c.status}</span></div></div>
${c.observacoes_clinicas?`<div style="grid-column:span 4"><div class="label">Obs. Clínicas</div><div style="color:#d97706">⚠ ${esc(c.observacoes_clinicas)}</div></div>`:''}
${c.observacoes?`<div style="grid-column:span 4"><div class="label">Observações</div><div>${esc(c.observacoes)}</div></div>`:''}</div>`;wrap.appendChild(info);
if(c.pacientes?.length){const pc=h('div',{className:'card',style:{marginBottom:'20px'}});pc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Pacientes (${c.pacientes.length})`));
c.pacientes.forEach(p=>{const row=h('div',{style:{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});
row.innerHTML=`<span class="fw-600">${esc(p.nome)}</span> ${tipoPacienteBadge(p.tipo_paciente)} ${p.e_o_proprio_cliente?'<span class="badge badge-gray">Próprio</span>':''} <span class="text-muted">${p.data_nascimento?fmtIdade(p.data_nascimento):''}</span> ${p.observacoes_clinicas?'<span class="text-sm" style="color:#d97706">⚠ '+esc(p.observacoes_clinicas)+'</span>':''}`;
pc.appendChild(row)});wrap.appendChild(pc)}
if(c.planos?.length){const plc=h('div',{className:'card',style:{marginBottom:'20px'}});plc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Planos (${c.planos.length})`));
c.planos.forEach(p=>{const prog=p.doses?.length?Math.round(p.doses.filter(d=>d.status==='aplicada').length/p.doses.length*100):0;
const row=h('div',{style:{padding:'12px',background:'var(--bg-subtle)',borderRadius:'12px',marginBottom:'8px',cursor:'pointer'},onClick:()=>AppState.verPlano(p.id)});
row.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div><span class="fw-600">${esc(p.nome_plano)}</span> <span class="badge ${p.status_contrato==='ativo'?'badge-green':'badge-gray'}">${p.status_contrato}</span></div><div class="mono fw-600" style="color:var(--primary)">${fmtMoeda(p.valor_final)}</div></div>
<div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="flex:1"><div class="prog-fill" style="width:${prog}%;background:var(--primary)"></div></div><span class="mono text-sm">${prog}%</span><span class="text-sm text-muted">Pago: ${fmtMoeda(p.total_pago)} · Saldo: ${fmtMoeda(p.saldo_pendente)}</span></div>`;
plc.appendChild(row)});wrap.appendChild(plc)}
if(c.movimentacoes?.length){const mc=h('div',{className:'card'});mc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Histórico de Vacinação (${c.movimentacoes.length})`));
c.movimentacoes.slice(0,20).forEach(m=>{const row=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});
row.innerHTML=`<span class="mono text-sm">${fmtDataHora(m.data_hora)}</span><span class="badge ${m.tipo==='retirada'?'badge-orange':'badge-green'}">${m.tipo}</span><span class="fw-600">${esc(m.nome_vacina||'-')}</span><span class="text-muted mono">${esc(m.numero_lote||'-')}</span>${m.local_aplicacao?`<span class="text-sm text-muted">${esc(m.local_aplicacao)}</span>`:''}`;mc.appendChild(row)});wrap.appendChild(mc)}
return wrap;}
