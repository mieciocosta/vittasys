async function renderUsuarios(){
const PL={master:'👑 Master',ativos:'⭐ Atend. Home',espontaneos:'📋 Atend. Consultas',atendimento:'💉 Atend. Vacinas',operador:'🔧 Operador'};
const PC={master:'#059669',ativos:'#2BBCB3',espontaneos:'#1B4965',atendimento:'#8b5cf6',operador:'#64748b'};
const isMaster=AppState.isMaster();
const wrap=h('div',{className:'fade-in'});

// Header
const hdr=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:18px'});
hdr.appendChild(h('h1',{style:'font-size:22px;font-weight:800;color:var(--navy);margin:0'},'👥 Gestão de Usuários'));
if(isMaster){hdr.appendChild(h('button',{className:'btn btn-primary',onClick:()=>modalUser(null)},'+ Novo Usuário'))}
wrap.appendChild(hdr);

// Self-service card for non-masters
if(!isMaster){
  const self=h('div',{style:'padding:16px;background:var(--bg-card);border-radius:12px;border:1px solid var(--border);margin-bottom:18px'});
  self.appendChild(h('div',{style:'font-weight:700;font-size:14px;margin-bottom:8px'},'🔐 Alterar Minha Senha'));
  self.appendChild(h('div',{style:'font-size:12px;color:var(--text-3);margin-bottom:12px'},'Você pode alterar sua senha de acesso. Para alterar nome, CPF ou data de nascimento, solicite ao master.'));
  const row=h('div',{style:'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:end'});
  const fd={pin_atual:'',pin_novo:''};
  const d1=h('div');d1.appendChild(h('label',{className:'label'},'PIN Atual'));
  const i1=h('input',{className:'input',type:'password',maxLength:'4',placeholder:'••••'});i1.addEventListener('input',e=>{fd.pin_atual=e.target.value});d1.appendChild(i1);row.appendChild(d1);
  const d2=h('div');d2.appendChild(h('label',{className:'label'},'Novo PIN'));
  const i2=h('input',{className:'input',type:'password',maxLength:'4',placeholder:'••••'});i2.addEventListener('input',e=>{fd.pin_novo=e.target.value});d2.appendChild(i2);row.appendChild(d2);
  row.appendChild(h('button',{className:'btn btn-primary',style:'padding:10px',onClick:async()=>{
    if(!fd.pin_atual||!fd.pin_novo)return Toast.show('Preencha ambos os campos','error');
    if(!/^\d{4}$/.test(fd.pin_novo))return Toast.show('PIN deve ter 4 dígitos','error');
    const r=await Api.put(`/usuarios/${AppState.usuario.id}`,{pin_atual:fd.pin_atual,pin_novo:fd.pin_novo,_caller_id:AppState.usuario.id,_caller_perfil:AppState.usuario.perfil});
    if(r?.success){Toast.show('Senha alterada!');i1.value='';i2.value=''}else Toast.show(r?.error||'Erro','error');
  }},'💾 Alterar'));
  self.appendChild(row);wrap.appendChild(self);
  wrap.appendChild(h('div',{style:'padding:20px;text-align:center;color:var(--text-3);font-size:13px'},'Para gerenciar usuários, acesse com perfil Master.'));
  return wrap;
}

// Master view — full user table
const [users, excPendMap]=await Promise.all([Api.get('/usuarios/admin'), Api.exclusoesPorEntidade('usuario')]);
  const excMap=excPendMap||{};

// Stats
const st=h('div',{style:'display:flex;gap:8px;margin-bottom:16px'});
const ativos=users.filter(u=>u.ativo).length;const inativos=users.filter(u=>!u.ativo).length;
const perfis={};users.filter(u=>u.ativo).forEach(u=>{perfis[u.perfil]=(perfis[u.perfil]||0)+1});
st.appendChild(h('div',{style:'padding:8px 14px;background:var(--primary-bg);border-left:3px solid var(--primary);border-radius:8px;flex:1'},
  h('span',{style:'font-size:18px;font-weight:800;color:var(--primary)'},String(ativos)),h('span',{style:'font-size:10px;color:var(--text-3);margin-left:6px'},'Ativos')));
if(inativos)st.appendChild(h('div',{style:'padding:8px 14px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:8px;flex:1'},
  h('span',{style:'font-size:18px;font-weight:800;color:#dc2626'},String(inativos)),h('span',{style:'font-size:10px;color:var(--text-3);margin-left:6px'},'Inativos')));
Object.entries(perfis).forEach(([p,c])=>{
  st.appendChild(h('div',{style:`padding:8px 14px;background:${PC[p]}10;border-left:3px solid ${PC[p]};border-radius:8px;flex:1`},
    h('span',{style:`font-size:18px;font-weight:800;color:${PC[p]}`},String(c)),h('span',{style:'font-size:10px;color:var(--text-3);margin-left:6px'},PL[p]||p)));
});
wrap.appendChild(st);

// Table
const tbl=h('div',{style:'background:var(--bg-card);border-radius:12px;border:1px solid var(--border);overflow:hidden'});
const thead=h('div',{style:'display:grid;grid-template-columns:auto 1fr 120px 100px 100px 120px;padding:10px 14px;background:var(--bg-subtle);font-size:10px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border)'});
['','Nome / Cargo','CPF','Perfil','Status','Ações'].forEach(t=>thead.appendChild(h('div',{style:t===''?'width:36px':''},t)));
tbl.appendChild(thead);

users.forEach(u=>{
  const row=h('div',{style:`display:grid;grid-template-columns:auto 1fr 120px 100px 100px 120px;padding:10px 14px;align-items:center;border-bottom:1px solid #f1f5f9;${!u.ativo?'opacity:0.5':''}`});
  // Avatar
  const ini=u.nome.split(' ').map(n=>n[0]).join('').slice(0,2);
  row.appendChild(h('div',{style:`width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${PC[u.perfil]||'#64748b'},var(--navy));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white`},ini));
  // Name + Cargo + Email
  const info=h('div',{style:'padding-left:8px'});
  info.innerHTML=`<div style="font-weight:700;font-size:13px">${esc(u.nome)}</div><div style="font-size:11px;color:var(--text-3)">${esc(u.cargo||'')}${u.email?' · '+esc(u.email):''}</div>`;
  row.appendChild(info);
  // CPF
  row.appendChild(h('div',{style:'font-size:11px;color:var(--text-3);font-family:var(--mono)'},esc(u.cpf||'—')));
  // Perfil badge
  row.appendChild(h('div',{style:`font-size:10px;font-weight:700;color:${PC[u.perfil]||'#64748b'}`},PL[u.perfil]||u.perfil));
  // Status
  row.appendChild(h('div',{style:`font-size:10px;font-weight:700;color:${u.ativo?'#059669':'#dc2626'}`},u.ativo?'✓ Ativo':'✗ Inativo'));
  // Actions
  const acts=h('div',{style:'display:flex;gap:4px'});
  acts.appendChild(h('button',{style:'border:none;background:var(--bg-subtle);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer',title:'Editar',onClick:()=>modalUser(u)},'✏️'));
  acts.appendChild(h('button',{style:'border:none;background:#f59e0b20;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer',title:'Resetar senha para 1234',onClick:async()=>{
    confirmarSimples('Resetar Senha',`Resetar a senha de ${u.nome} para 1234?`,async()=>{
      const r=await Api.post(`/usuarios/${u.id}/reset-pin`);Toast.show(r?.message||'Resetado');
    },'🔑 Resetar','btn btn-primary');
  }},'🔑'));
  const excPend=excMap[u.id];
  const isMasterUser=AppState.isMaster();

  if(!u.ativo&&!isMasterUser){
    // Non-master: hide inactive users entirely
    row.style.display='none';
  }else if(!u.ativo&&isMasterUser){
    // Master: inactive user → reativar only
    acts.appendChild(h('button',{
      style:'border:none;background:#05966910;border:1px solid #059669;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;color:#059669;cursor:pointer',
      title:'Reativar usuário',
      onClick:async()=>{
        const r=await Api.post(`/usuarios/${u.id}/reativar`);
        if(r?.success){Toast.show(r.message);AppState.notify();}
        else Toast.show(r?.error||'Erro','error');
      }
    },'↩ Reativar'));
  }else if(excPend){
    // Pending deletion — locked badge
    acts.appendChild(h('div',{style:'display:flex;align-items:center;gap:4px;padding:4px 8px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px'},
      h('span',null,'⏳'),
      h('span',{style:'font-size:10px;font-weight:600;color:#92400e'},'Exclusão pendente')
    ));
  }else if(u.ativo){acts.appendChild(h('button',{style:'border:none;background:#dc262610;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer',title:'Desativar',onClick:async()=>{
    await confirmarExclusao({
      entidade:'usuario',entidadeId:u.id,
      label:`Usuário ${u.nome}`,
      snapshot:{id:u.id,nome:u.nome,perfil:u.perfil,cargo:u.cargo},
      deleteFn:()=>Api.delete(`/usuarios/${u.id}`),
      onSuccess:()=>AppState.notify()
    });
  }},'🚫'))}
  else{acts.appendChild(h('button',{style:'border:none;background:#05966910;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer',title:'Reativar',onClick:async()=>{
    const r=await Api.post(`/usuarios/${u.id}/reativar`);if(r?.success){Toast.show(r.message);AppState.notify()}else Toast.show(r?.error||'Erro','error');
  }},'✓'))}
  row.appendChild(acts);tbl.appendChild(row);
});
wrap.appendChild(tbl);

// Info box
const infoBox=h('div',{style:'margin-top:14px;padding:12px;background:#eff6ff;border-radius:10px;font-size:11px;color:#1e40af;line-height:1.6'});
infoBox.innerHTML=`<strong>Regras de segurança:</strong><br>
  • Senha padrão de novos usuários: <strong>1234</strong><br>
  • Exclusão é <strong>soft delete</strong> — o usuário fica inativo mas todas as auditorias são preservadas<br>
  • Apenas o <strong>Master</strong> pode alterar nome, CPF e data de nascimento<br>
  • O próprio usuário pode alterar apenas sua <strong>senha</strong> (precisa informar a atual)<br>
  • Perfil <strong>Atend. Vacinas</strong>: atendimento de vacinas, bipagem, planos e cadastro de clientes`;
wrap.appendChild(infoBox);

return wrap;

function modalUser(u){showModal(u?'✏️ Editar Usuário':'+ Novo Usuário',async(body,close)=>{
  const fd={nome:u?.nome||'',cargo:u?.cargo||'',email:u?.email||'',cpf:u?.cpf||'',
    data_nascimento:u?.dataNascimento?new Date(u.dataNascimento).toISOString().slice(0,10):'',
    perfil:u?.perfil||'atendimento',pin_novo:''};

  // Nome
  const d1=h('div',{style:'margin-bottom:14px'});d1.appendChild(h('label',{className:'label',style:'font-size:13px'},'👤 NOME COMPLETO'));
  const i1=h('input',{className:'input',style:'font-size:14px;padding:10px',value:fd.nome});i1.addEventListener('input',e=>{fd.nome=e.target.value});d1.appendChild(i1);body.appendChild(d1);

  // Cargo + Email
  const row1=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px'});
  const d2=h('div');d2.appendChild(h('label',{className:'label',style:'font-size:13px'},'💼 CARGO'));
  const i2=h('input',{className:'input',style:'font-size:13px;padding:10px',value:fd.cargo,placeholder:'Ex: Enfermeira, Técnico...'});i2.addEventListener('input',e=>{fd.cargo=e.target.value});d2.appendChild(i2);row1.appendChild(d2);
  const d3=h('div');d3.appendChild(h('label',{className:'label',style:'font-size:13px'},'📧 EMAIL'));
  const i3=h('input',{className:'input',style:'font-size:13px;padding:10px',value:fd.email,placeholder:'email@vittalis.com'});i3.addEventListener('input',e=>{fd.email=e.target.value});d3.appendChild(i3);row1.appendChild(d3);
  body.appendChild(row1);

  // CPF + Data Nascimento
  const row2=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px'});
  const d4=h('div');d4.appendChild(h('label',{className:'label',style:'font-size:13px'},'🆔 CPF'));
  const i4=h('input',{className:'input',style:'font-size:13px;padding:10px',value:fd.cpf,placeholder:'000.000.000-00'});i4.addEventListener('input',e=>{fd.cpf=e.target.value});d4.appendChild(i4);row2.appendChild(d4);
  const d5=h('div');d5.appendChild(h('label',{className:'label',style:'font-size:13px'},'📅 DATA NASCIMENTO'));
  const i5=h('input',{className:'input',type:'date',style:'font-size:13px;padding:10px',value:fd.data_nascimento});i5.addEventListener('change',e=>{fd.data_nascimento=e.target.value});d5.appendChild(i5);row2.appendChild(d5);
  body.appendChild(row2);

  // Perfil — toggle buttons
  const pd=h('div',{style:'margin-bottom:14px'});pd.appendChild(h('label',{className:'label',style:'font-size:13px'},'🏷️ PERFIL'));
  const pBtns=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap;margin-top:6px'});
  Object.entries(PL).forEach(([k,v])=>{
    pBtns.appendChild(h('button',{type:'button','data-p':k,
      className:`btn btn-sm ${fd.perfil===k?'btn-primary':'btn-outline'}`,style:`font-size:11px;padding:6px 12px;border-left:3px solid ${PC[k]}`,
      onClick:()=>{fd.perfil=k;pBtns.querySelectorAll('[data-p]').forEach(b=>b.className='btn btn-sm btn-outline');event.target.className='btn btn-sm btn-primary'}},v));
  });
  pd.appendChild(pBtns);body.appendChild(pd);

  // PIN (only for new or master reset)
  if(!u){
    const pinInfo=h('div',{style:'padding:10px;background:#f0fffe;border-radius:8px;margin-bottom:14px;font-size:12px;color:var(--primary)'});
    pinInfo.innerHTML='🔐 Senha padrão: <strong>1234</strong>';
    body.appendChild(pinInfo);
  }else{
    const pd2=h('div',{style:'margin-bottom:14px'});pd2.appendChild(h('label',{className:'label',style:'font-size:13px'},'🔐 NOVA SENHA (deixe vazio para manter)'));
    const i6=h('input',{className:'input',type:'password',maxLength:'4',style:'font-size:13px;padding:10px',placeholder:'••••'});
    i6.addEventListener('input',e=>{fd.pin_novo=e.target.value});pd2.appendChild(i6);body.appendChild(pd2);
  }

  // Save
  body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'font-size:14px;padding:14px',onClick:async()=>{
    if(!fd.nome.trim())return Toast.show('Nome obrigatório','error');
    if(!fd.cargo.trim())return Toast.show('Cargo obrigatório','error');
    const payload={...fd,_caller_id:AppState.usuario.id,_caller_perfil:AppState.usuario.perfil};
    let r;
    if(u){
      r=await Api.put(`/usuarios/${u.id}`,payload);
    }else{
      r=await Api.post('/usuarios',payload);
    }
    if(r?.success){Toast.show(r.message||'Salvo!');close();AppState.notify()}
    else Toast.show(r?.error||'Erro','error');
  }},u?'💾 Salvar':'+ Criar Usuário'));
},'520px')}
}
