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
fb.appendChild(buildSearchBox('Buscar por nome, CPF (com ou sem pontuação), código, celular...',v=>{f.search=v;f.page=1;draw()},f.search));
// Only show type filter if user can see both
if(!perfilFilter){
  fb.appendChild(buildFilterChips([['','Todos'],['ativo','⭐ Ativos'],['espontaneo','Espontâneos']],f.tipo_cliente,v=>{f.tipo_cliente=v;f.page=1;draw()}));
}
fb.appendChild(buildSelect([['','Tipo Paciente'],['bebe','Bebê'],['crianca','Criança'],['adulto','Adulto']],f.tipo_paciente,v=>{f.tipo_paciente=v;f.page=1;draw()}));
wrap.appendChild(fb);

const [data, excPendMap]=await Promise.all([Api.clientes(f), Api.exclusoesPorEntidade('cliente')]);
  if(!data)return;
  const excMap=excPendMap||{};
const tw=h('div',{className:'table-wrap'});
const t=buildSortableTable([['ID','id'],['Código','codigo'],['Cliente','nome'],['Idade','nascimento'],['Tipo','tipo'],['Celular',''],['Planos',''],['Status','status'],['Ações','']],f,draw);
const tb=h('tbody');
if(!data.data.length)tb.innerHTML='<tr><td colspan="9" class="empty-state">Nenhum cliente encontrado</td></tr>';
else data.data.forEach(c=>{
  const tr=h('tr',{className:'clickable'});
  if(c.tipo_cliente==='ativo')tr.style.borderLeft='3px solid var(--primary)';
  const isChild=c.tipo_paciente==='crianca'||c.tipo_paciente==='bebe';
  const respNome=c.responsavel_nome||'';
  const pacNome=c.nome;
  const celular=c.telefone||c.responsavel_telefone||'-';
  tr.innerHTML=`<td class="mono text-muted text-sm">#${c.id}</td>
    <td class="mono fw-600" style="color:var(--primary);cursor:pointer" onclick="AppState.verCliente(${c.id})">${esc(c.codigo_cliente||'-')}</td>
    <td style="cursor:pointer" onclick="AppState.verCliente(${c.id})">
      ${isChild&&respNome
        ?`<div class="fw-600">👶 ${esc(pacNome)}</div><div class="text-sm" style="color:#64748b">👤 ${esc(respNome)}</div>`
        :`<div class="fw-600">${esc(pacNome)}</div>`}
      ${c.observacoes?`<div class="text-sm" style="color:#d97706;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📋 ${esc(c.observacoes.slice(0,40))}</div>`:''}</td>
    <td class="text-sm">${c.data_nascimento?fmtIdade(c.data_nascimento):'-'}</td>
    <td>${tipoClienteBadge(c.tipo_cliente)}</td>
    <td class="text-sm">${esc(celular)}</td>
    <td class="mono fw-600" style="color:${(c.planos_ativos||0)>0?'#7c3aed':'#94a3b8'}">${c.planos_ativos||0}</td>
    <td><span class="badge ${c.status==='ativo'?'badge-green':'badge-gray'}">${c.status}</span></td>`;
  const actTd=document.createElement('td');actTd.style.whiteSpace='nowrap';
  const excPend=excMap[c.id];
  const isInativo=c.status==='inativo';
  const isMasterUser=AppState.isMaster();

  if(isInativo&&!isMasterUser){
    // Non-master: skip inativo rows entirely — row already added to table, hide it
    tr.style.display='none';
  }else if(isInativo&&isMasterUser){
    // Master: inativo record → show Reativar only
    const badge=h('div',{style:'display:flex;align-items:center;gap:6px'});
    badge.appendChild(h('span',{style:'font-size:11px;color:#64748b;font-style:italic'},'inativo'));
    actTd.appendChild(badge);
    actTd.appendChild(h('button',{
      style:'margin-left:8px;padding:4px 10px;background:#05966910;border:1px solid #059669;border-radius:6px;font-size:11px;font-weight:600;color:#059669;cursor:pointer',
      onClick:async()=>{
        confirmarSimples('Reativar Cliente','Reativar o cliente '+c.nome+'? Ele voltará a aparecer normalmente no sistema.',async()=>{
          const r=await Api.reativarCliente(c.id);
          if(r?.success){Toast.show(r.message||'Cliente reativado');draw();}
          else Toast.show(r?.error||'Erro ao reativar','error');
        },'↩ Reativar','btn btn-primary');
      }
    },'↩ Reativar'));
  }else if(excPend){
    // Pending deletion — locked badge
    const badge=h('div',{style:'display:flex;align-items:center;gap:6px;padding:6px 10px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px'});
    badge.appendChild(h('span',{style:'font-size:14px'},'⏳'));
    const info=h('div');
    info.appendChild(h('div',{style:'font-size:11px;font-weight:700;color:#92400e'},'Exclusão pendente'));
    info.appendChild(h('div',{style:'font-size:10px;color:#92400e;opacity:0.8'},excPend.solicitanteNome||'—'));
    badge.appendChild(info);
    actTd.appendChild(badge);
  }else{
    // Normal: edit + delete
    actTd.appendChild(iconBtn('btn btn-outline btn-sm',null,'Editar',e=>{
      e.stopPropagation();editId=c.id;formData={};
      ['codigo_cliente','nome','data_nascimento','sexo','cpf','telefone','email','tipo_paciente','tipo_cliente','responsavel_nome','responsavel_parentesco','responsavel_cpf','responsavel_telefone','paciente_nome','paciente_nascimento','paciente_sexo','paciente_cpf','vendedor_id','vacinador_id','status','observacoes','observacoes_clinicas','endereco','bairro','cep','regiao_id'].forEach(k=>{if(c[k]!=null)formData[k]=c[k]});
      showForm=true;draw();
    },{style:{marginRight:'4px'}}));
    if((c.planos_ativos||0)===0&&(c.total_movimentacoes||0)===0){
      actTd.appendChild(iconBtn('btn btn-red btn-sm',null,'Excluir',async e=>{e.stopPropagation();
        await confirmarExclusao({
          entidade:'cliente',entidadeId:c.id,
          label:`Cliente ${c.nome}`,
          snapshot:{id:c.id,nome:c.nome,cpf:c.cpf,telefone:c.telefone},
          deleteFn:()=>Api.deletarCliente(c.id),
          onSuccess:()=>draw()
        });
      }));
    }
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
    [['nome','Nome'],['cpf','CPF'],['telefone','Celular'],['email','E-mail'],['data_nascimento','Nascimento'],['responsavel_nome','Responsável'],['parentesco','Parentesco'],['tipo_paciente','Tipo Paciente'],['endereco','Endereço'],['cep','CEP'],['cidade','Cidade'],['uf','UF']].forEach(([k,l])=>{
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
  const container=h('div');

  // Detect initial mode
  if(!fd._tipo_cadastro){
    if(fd.tipo_paciente==='crianca'||fd.tipo_paciente==='bebe'||fd.responsavel_nome)fd._tipo_cadastro='crianca';
    else fd._tipo_cadastro='adulto';
  }

  function renderForm(){
    container.innerHTML='';
    const fm=h('div',{className:'card slide-up',style:{marginBottom:'20px'}});
    const modo=fd._tipo_cadastro;

    // ═══ SELETOR DE TIPO — Botões visuais ═══
    const selSec=h('div',{style:{marginBottom:'20px'}});
    selSec.appendChild(h('div',{style:{fontSize:'13px',fontWeight:'600',color:'var(--text-3)',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}},'Tipo de cadastro'));
    const btnGrid=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}});

    [['adulto','👤','Adulto','Paciente é o próprio contratante'],
     ['crianca','👶','Criança / Bebê','Com responsável financeiro'],
     ['idoso','🧓','Idoso','Com responsável financeiro']
    ].forEach(([tipo,icon,label,desc])=>{
      const isActive=modo===tipo||(modo==='crianca'&&tipo==='crianca')||(modo==='bebe'&&tipo==='crianca');
      const btn=h('button',{
        className:`applicator-card${isActive?' active':''}`,
        style:{padding:'16px 12px',textAlign:'center',border:isActive?'2px solid var(--primary)':'2px solid var(--border)',background:isActive?'var(--primary-bg)':'var(--bg-card)'},
        onClick:()=>{
          fd._tipo_cadastro=tipo;
          if(tipo==='adulto'){fd.tipo_paciente='adulto';fd.responsavel_nome='';fd.responsavel_parentesco=''}
          else if(tipo==='crianca'){fd.tipo_paciente='crianca'}
          else{fd.tipo_paciente='adulto'} // idoso is still 'adulto' type but with responsavel
          renderForm();
        }
      });
      btn.appendChild(h('div',{style:{fontSize:'24px',marginBottom:'4px'}},icon));
      btn.appendChild(h('div',{style:{fontWeight:'700',fontSize:'14px',color:isActive?'var(--primary)':'var(--text-1)'}},label));
      btn.appendChild(h('div',{style:{fontSize:'11px',color:'var(--text-3)',marginTop:'2px'}},desc));
      btnGrid.appendChild(btn);
    });
    selSec.appendChild(btnGrid);fm.appendChild(selSec);

    const needsResp=modo==='crianca'||modo==='idoso';

    if(needsResp){
      // ═══ RESPONSÁVEL FINANCEIRO ═══
      const respSec=h('div',{className:'client-form-section'});
      respSec.appendChild(h('h4',{style:{color:'var(--navy)'}},'👤 Responsável Financeiro / Contratante'));
      const respGrid=h('div',{className:'client-form-grid'});
      [fld('Nome do Responsável *','responsavel_nome',fd),
       fldMask('CPF Responsável *','cpf',maskCPF,fd),
       fldMask('Celular Responsável *','telefone',maskTel,fd),
       fld('E-mail','email',fd,'email'),
       fldSel('Parentesco *','responsavel_parentesco',[['','— Selecione —'],['mae','Mãe'],['pai','Pai'],['avo','Avó/Avô'],['tio','Tio/Tia'],['outro','Outro']],fd),
       fldSel('Tipo Cliente','tipo_cliente',[['ativo','⭐ Ativo'],['espontaneo','Espontâneo']],fd),
       fldSel('Status','status',[['ativo','Ativo'],['inativo','Inativo']],fd)
      ].forEach(el=>respGrid.appendChild(el));
      respSec.appendChild(respGrid);fm.appendChild(respSec);

      // ═══ PACIENTE ═══
      const pacSec=h('div',{className:'client-form-section'});
      pacSec.appendChild(h('h4',{style:{color:'var(--primary)'}},(modo==='crianca'?'👶':'🧓')+' Paciente (quem receberá as vacinas)'));
      const pacGrid=h('div',{className:'client-form-grid'});
      const tipoOpts=modo==='crianca'?[['crianca','Criança'],['bebe','Bebê']]:[['adulto','Adulto'],['idoso','Idoso']];
      [fld('Nome do Paciente *','nome',fd),
       fldDate('Data de Nascimento *','data_nascimento',fd),
       fldSel('Sexo','sexo',[['','—'],['M','Masculino'],['F','Feminino']],fd),
       fldSel('Tipo Paciente','tipo_paciente',tipoOpts,fd),
       fld('Obs. Clínicas','observacoes_clinicas',fd)
      ].forEach(el=>pacGrid.appendChild(el));
      pacSec.appendChild(pacGrid);fm.appendChild(pacSec);
    }else{
      // ═══ ADULTO — Formulário unificado ═══
      const sec=h('div',{className:'client-form-section'});
      sec.appendChild(h('h4',{style:{color:'var(--navy)'}},'👤 Dados do Cliente'));
      const grid=h('div',{className:'client-form-grid'});
      [fld('Nome Completo *','nome',fd),
       fldDate('Data de Nascimento *','data_nascimento',fd),
       fldSel('Sexo','sexo',[['','—'],['M','Masculino'],['F','Feminino']],fd),
       fldMask('CPF *','cpf',maskCPF,fd),
       fldMask('Celular *','telefone',maskTel,fd),
       fld('E-mail','email',fd,'email'),
       fldSel('Tipo Cliente','tipo_cliente',[['ativo','⭐ Ativo'],['espontaneo','Espontâneo']],fd),
       fldSel('Status','status',[['ativo','Ativo'],['inativo','Inativo']],fd),
       fld('Obs. Clínicas','observacoes_clinicas',fd)
      ].forEach(el=>grid.appendChild(el));
      sec.appendChild(grid);fm.appendChild(sec);
    }

    // ═══ ENDEREÇO ═══
    const endSec=h('div',{className:'client-form-section'});
    endSec.appendChild(h('h4',{style:{color:'var(--navy)'}},'📍 Endereço'));
    const endGrid=h('div',{className:'client-form-grid'});
    [fld('Endereço Completo','endereco',fd),
     fld('Bairro','bairro',fd),
     fld('CEP','cep',fd),
    ].forEach(el=>endGrid.appendChild(el));
    // Region quick-select buttons
    const regDiv=h('div');regDiv.appendChild(h('label',{className:'label'},'Região'));
    const regBtns=h('div',{style:'display:flex;gap:6px;flex-wrap:wrap'});
    const regsCache=window._vittaRegioes||[];
    if(regsCache.length){
      regsCache.forEach(r=>{
        const isAct=fd.regiao_id==r.id;
        regBtns.appendChild(h('button',{type:'button',className:`btn btn-sm ${isAct?'btn-primary':'btn-outline'}`,
          style:`font-size:11px;border-left:3px solid ${r.cor}`,
          onClick:()=>{fd.regiao_id=r.id;renderForm()}},r.nome));
      });
    }else{
      // Load async
      Api.regioes().then(regs=>{window._vittaRegioes=regs||[];if(regs?.length)renderForm()});
      regBtns.appendChild(h('span',{style:'font-size:11px;color:var(--text-3)'},'Carregando regiões...'));
    }
    regDiv.appendChild(regBtns);
    endGrid.appendChild(regDiv);
    endSec.appendChild(endGrid);fm.appendChild(endSec);

    // ═══ OBSERVAÇÕES ═══
    fm.appendChild(h('div',{className:'client-form-section'},
      h('h4',null,'Observações'),
      fldArea('Gerais','observacoes',fd)
    ));

    // ═══ SUBMIT ═══
    fm.appendChild(iconBtn('btn btn-primary btn-lg btn-block',null,editId?'Salvar Alterações':'Cadastrar Cliente',async()=>{
      if(needsResp){
        if(!fd.responsavel_nome||fd.responsavel_nome.trim().length<3)return Toast.show('Nome do responsável é obrigatório','error');
        if(!fd.nome||fd.nome.trim().length<2)return Toast.show('Nome do paciente é obrigatório','error');
        if(!fd.data_nascimento)return Toast.show('Nascimento do paciente é obrigatório','error');
        if(!fd.cpf&&!editId)return Toast.show('CPF do responsável é obrigatório','error');
        if(!fd.telefone&&!editId)return Toast.show('Celular do responsável é obrigatório','error');
        if(!fd.responsavel_parentesco)return Toast.show('Parentesco é obrigatório','error');
        fd.paciente_nome=fd.nome;fd.paciente_nascimento=fd.data_nascimento;fd.paciente_sexo=fd.sexo;
      }else{
        if(!fd.nome||fd.nome.trim().length<3)return Toast.show('Nome é obrigatório (mínimo 3 caracteres)','error');
        if(!fd.data_nascimento)return Toast.show('Data de nascimento é obrigatória','error');
        if(!fd.cpf&&!editId)return Toast.show('CPF é obrigatório','error');
        if(!fd.telefone&&!editId)return Toast.show('Celular é obrigatório','error');
        const nasc=new Date(fd.data_nascimento);const idade=(new Date()-nasc)/(365.25*24*60*60*1000);
        if(idade<18)return Toast.show('⚠ Responsável deve ter 18+ anos. Selecione "Criança/Bebê" para menores.','error');
        fd.tipo_paciente='adulto';
      }
      if(fd.cpf&&fd.cpf.replace(/\D/g,'').length>=11&&!validarCPF(fd.cpf))return Toast.show('CPF inválido','error');

      if(editId){const r=await Api.atualizarCliente(editId,fd);if(r?.success){Toast.show('Atualizado!');onDone()}else Toast.show(r?.error||'Erro','error')}
      else{const r=await Api.criarCliente(fd);if(r?.success){Toast.show(`${fd.nome} cadastrado! ${r.codigo_cliente?'['+r.codigo_cliente+']':''}`);onDone()}else Toast.show(r?.error||'Erro','error')}
    },{style:{marginTop:'16px'}}));

    container.appendChild(fm);
  }

  renderForm();
  return container;
}
function fld(l,k,fd,type){const d=h('div');d.appendChild(h('label',{className:'label'},l));const i=h('input',{className:'input',type:type||'text',value:fd[k]||'',maxLength:'200'});i.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(i);return d}
function fldDate(l,k,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));
  // Format ISO date to YYYY-MM-DD for input type=date
  let val=fd[k]||'';if(val&&val.length>10)val=val.slice(0,10);
  const i=h('input',{className:'input',type:'date',value:val});i.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(i);return d}
function fldSel(l,k,opts,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));d.appendChild(buildSelect(opts,fd[k]||'',v=>{fd[k]=v}));return d}
function fldMask(l,k,maskFn,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));d.appendChild(inputComMascara('input','',maskFn,v=>{fd[k]=v},fd[k]||''));return d}
function fldArea(l,k,fd){const d=h('div');d.appendChild(h('label',{className:'label'},l));const ta=h('textarea',{className:'input',style:{minHeight:'60px',resize:'vertical'}});ta.value=fd[k]||'';ta.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(ta);return d}

async function renderClienteDetalhe(){const wrap=h('div',{className:'fade-in'});
const c=await Api.cliente(AppState.clienteDetalhe);if(!c){wrap.appendChild(h('div',{className:'empty-state'},'Não encontrado'));return wrap}
const isChild=(c.tipo_paciente==='crianca'||c.tipo_paciente==='bebe')&&c.responsavel_nome;
const celular=c.telefone||c.responsavel_telefone||'-';
wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
  iconBtn('btn btn-outline btn-sm',I.chevL,AppState._returnTo==='agenda'?'Voltar para Agenda':'Voltar para Clientes',()=>{const rt=AppState._returnTo;AppState._returnTo=null;AppState.setModulo(rt||'clientes')}),
  h('h1',{className:'page-title',style:{marginTop:'10px'}},isChild?`👶 ${c.nome}`:`${c.nome} ${c.codigo_cliente?'['+c.codigo_cliente+']':''}`),
  h('p',{className:'page-subtitle',innerHTML:isChild?`${tipoClienteBadge(c.tipo_cliente)} · Resp: ${esc(c.responsavel_nome)} · Cel: ${esc(celular)}`:`${tipoClienteBadge(c.tipo_cliente)} · Cel: ${esc(celular)} · CPF: ${esc(c.cpf||'-')}`})
)));
// ═══ RESPONSÁVEL ═══
const resp=h('div',{className:'card',style:{marginBottom:'16px'}});
if(isChild){
  const par=c.responsavel_parentesco==='mae'?'Mãe':c.responsavel_parentesco==='pai'?'Pai':c.responsavel_parentesco||'-';
  resp.innerHTML=`<h3 style="font-size:15px;font-weight:600;margin-bottom:14px">👤 Responsável Financeiro</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px"><div><div class="label">Nome</div><div class="fw-600">${esc(c.responsavel_nome)}</div></div><div><div class="label">Parentesco</div><div>${esc(par)}</div></div><div><div class="label">CPF</div><div>${esc(c.cpf||'-')}</div></div><div><div class="label">Celular</div><div>${esc(celular)}</div></div><div><div class="label">E-mail</div><div>${esc(c.email||'-')}</div></div></div>`;
}else{
  resp.innerHTML=`<h3 style="font-size:15px;font-weight:600;margin-bottom:14px">👤 Dados do Cliente</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px"><div><div class="label">Nome</div><div class="fw-600">${esc(c.nome)}</div></div><div><div class="label">CPF</div><div>${esc(c.cpf||'-')}</div></div><div><div class="label">Celular</div><div>${esc(celular)}</div></div><div><div class="label">E-mail</div><div>${esc(c.email||'-')}</div></div><div><div class="label">Nascimento</div><div>${c.data_nascimento?fmtData(c.data_nascimento)+' ('+fmtIdade(c.data_nascimento)+')':'-'}</div></div><div><div class="label">Sexo</div><div>${c.sexo==='M'?'Masculino':c.sexo==='F'?'Feminino':'-'}</div></div><div><div class="label">Tipo</div><div>${tipoPacienteBadge(c.tipo_paciente)}</div></div><div><div class="label">Status</div><div><span class="badge ${c.status==='ativo'?'badge-green':'badge-gray'}">${c.status}</span></div></div></div>`;
}
wrap.appendChild(resp);
// ═══ PACIENTE (child) ═══
if(isChild){const pac=h('div',{className:'card',style:{marginBottom:'16px'}});
pac.innerHTML=`<h3 style="font-size:15px;font-weight:600;margin-bottom:14px">👶 Paciente</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px"><div><div class="label">Nome</div><div class="fw-600">${esc(c.nome)}</div></div><div><div class="label">Nascimento</div><div>${c.data_nascimento?fmtData(c.data_nascimento)+' ('+fmtIdade(c.data_nascimento)+')':'-'}</div></div><div><div class="label">Sexo</div><div>${c.sexo==='M'?'Masc':c.sexo==='F'?'Fem':'-'}</div></div><div><div class="label">Tipo</div><div>${tipoPacienteBadge(c.tipo_paciente)}</div></div><div><div class="label">Status</div><div><span class="badge ${c.status==='ativo'?'badge-green':'badge-gray'}">${c.status}</span></div></div>${c.observacoes_clinicas?`<div style="grid-column:1/-1"><div class="label">Obs. Clínicas</div><div style="color:#d97706">⚠ ${esc(c.observacoes_clinicas)}</div></div>`:''}</div>`;
wrap.appendChild(pac)}
if(c.observacoes){const ob=h('div',{className:'card',style:{marginBottom:'16px'}});ob.innerHTML=`<h3 style="font-size:15px;font-weight:600;margin-bottom:8px">📋 Observações</h3><div>${esc(c.observacoes)}</div>`;wrap.appendChild(ob)}
// Legacy pacientes array (if exists)
if(c.pacientes?.length){const pc=h('div',{className:'card',style:{marginBottom:'16px'}});pc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Pacientes Adicionais (${c.pacientes.length})`));
c.pacientes.forEach(p=>{const row=h('div',{style:{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});
row.innerHTML=`<span class="fw-600">${esc(p.nome)}</span> ${tipoPacienteBadge(p.tipo_paciente)} ${p.e_o_proprio_cliente?'<span class="badge badge-gray">Próprio</span>':''} <span class="text-muted">${p.data_nascimento?fmtIdade(p.data_nascimento):''}</span>`;
pc.appendChild(row)});wrap.appendChild(pc)}

if(c.planos?.length){const plc=h('div',{className:'card',style:{marginBottom:'16px'}});plc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Planos (${c.planos.length})`));
c.planos.forEach(p=>{const prog=p.doses?.length?Math.round(p.doses.filter(d=>d.status==='aplicada').length/p.doses.length*100):0;
const row=h('div',{style:{padding:'12px',background:'var(--bg-subtle)',borderRadius:'12px',marginBottom:'8px',cursor:'pointer'},onClick:()=>AppState.verPlano(p.id)});
row.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div><span class="fw-600">${esc(p.nome_plano)}</span> <span class="badge ${p.status_contrato==='ativo'?'badge-green':'badge-gray'}">${p.status_contrato}</span></div><div class="mono fw-600" style="color:var(--primary)">${fmtMoeda(p.valor_final)}</div></div>
<div style="display:flex;align-items:center;gap:8px"><div class="prog-bar" style="flex:1"><div class="prog-fill" style="width:${prog}%;background:var(--primary)"></div></div><span class="mono text-sm">${prog}%</span><span class="text-sm text-muted">Pago: ${fmtMoeda(p.total_pago)} · Saldo: ${fmtMoeda(p.saldo_pendente)}</span></div>`;
plc.appendChild(row)});wrap.appendChild(plc)}

// ═══ EXCEÇÕES FORA DO PLANO ═══
if(c.excecoes_fora_plano?.length){
  const exc=h('div',{className:'card',style:{marginBottom:'16px'}});
  exc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px',color:'#d97706'}},`⚠ Exceções Fora do Plano (${c.excecoes_fora_plano.length})`));
  c.excecoes_fora_plano.forEach(e=>{
    const stBadge=e.status==='concluido'?'badge-green':e.status==='pendente_aprovacao'?'badge-orange':'badge-red';
    const stLabel=e.status==='concluido'?'Aprovada':e.status==='pendente_aprovacao'?'⏳ Pendente':'✗ Recusada';
    const row=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});
    row.innerHTML=`<span class="mono text-sm">${fmtDataHora(e.data)}</span><span class="badge ${stBadge}">${stLabel}</span><span class="fw-600">${esc(e.vacina||'-')}</span>${e.justificativa?`<span class="text-sm text-muted">${esc(e.justificativa)}</span>`:''}${e.motivo_reprovacao?`<span class="text-sm" style="color:#dc2626">${esc(e.motivo_reprovacao)}</span>`:''}`;
    exc.appendChild(row);
  });
  wrap.appendChild(exc);
}

if(c.movimentacoes?.length){const mc=h('div',{className:'card'});mc.appendChild(h('h3',{style:{fontSize:'15px',fontWeight:'600',marginBottom:'14px'}},`Histórico de Vacinação (${c.movimentacoes.length})`));
c.movimentacoes.slice(0,20).forEach(m=>{const row=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px'}});
const stBadge=m.status==='pendente_aprovacao'?'badge-orange':m.status==='reprovado'?'badge-red':m.tipo==='retirada'?'badge-orange':'badge-green';
const stLabel=m.status==='pendente_aprovacao'?'⏳ Pendente':m.status==='reprovado'?'✗ Reprovado':m.tipo;
const foraPlano=m.motivo_padrao==='vacina_fora_plano'?'<span class="badge badge-orange" style="font-size:10px">Fora do plano</span>':'';
const planoTag=m.plano_nome?`<span class="badge badge-primary" style="font-size:10px">${esc(m.plano_nome)}</span>`:'';
row.innerHTML=`<span class="mono text-sm">${fmtDataHora(m.data_hora)}</span><span class="badge ${stBadge}">${stLabel}</span><span class="fw-600">${esc(m.nome_vacina||'-')}</span>${foraPlano}${planoTag}<span class="text-muted mono">${esc(m.numero_lote||'-')}</span>${m.local_aplicacao?`<span class="text-sm text-muted">${esc(m.local_aplicacao)}</span>`:''}`;mc.appendChild(row)});wrap.appendChild(mc)}
return wrap;}
