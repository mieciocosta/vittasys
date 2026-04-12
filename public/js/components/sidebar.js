function renderSidebar(alertCount){const u=AppState.usuario;const ini=u.nome.split(' ').map(n=>n[0]).join('').slice(0,2);
const perfilLabel={master:'👑 Master',ativos:'⭐ Ativos',espontaneos:'📋 Espontâneos',operador:'🔧 Operador'};
const allItems=[
  {key:'dashboard',icon:I.dash,label:'Painel'},
  {sep:'Operações'},
  {key:'retirada',icon:I.barcode,label:'Retirada (Bipe)',dot:true},
  {key:'estoque',icon:I.box,label:'Estoque / Câmara'},
  {key:'historico',icon:I.history,label:'Movimentações'},
  {sep:'Gestão'},
  {key:'planos',icon:I.pkg,label:'Planos Vacinais'},
  {key:'clientes',icon:I.users,label:'Clientes'},
  {key:'agenda',icon:I.calendar,label:'Agenda'},
  {key:'financeiro',icon:I.dollar,label:'Financeiro'},
  {key:'metas',icon:I.target,label:'Metas'},
  {key:'aprovacoes',icon:I.check,label:'Aprovações',dot:true},
  {key:'auditoria',icon:I.history,label:'Auditoria'},
  {sep:'Sistema'},
  {key:'alertas',icon:I.alert,label:'Alertas',count:alertCount||0},
];
// Filter by permissions
const items=allItems.filter(it=>{
  if(it.sep)return true;
  return AppState.temPermissao(it.key);
});

const nav=h('nav',{className:'sidebar'});
const brand=h('div',{className:'sb-brand',style:{cursor:'pointer'},onClick:()=>AppState.setModulo('dashboard')});
const logoImg=h('img',{src:'assets/logos/logo-horizontal-white.png',alt:'Vittalis',style:'height:32px'});
logoImg.onerror=function(){this.replaceWith(h('span',{style:{fontSize:'18px',fontWeight:'700',color:'#f1f5f9'}},'💎 VittaSys'))};
brand.appendChild(logoImg);
brand.appendChild(h('div',{className:'sb-brand-sub'},'Sistema de Gestão de Vacinação'));
nav.appendChild(brand);

const nw=h('div',{className:'sb-nav'});
items.forEach(it=>{
  if(it.sep){nw.appendChild(h('div',{className:'sb-sep'},it.sep));return}
  const btn=h('button',{className:`nav-btn ${AppState.modulo===it.key?'active':''}`,onClick:()=>AppState.setModulo(it.key)});
  btn.innerHTML=it.icon+`<span>${it.label}</span>`;
  if(it.dot)btn.appendChild(h('span',{className:'dot'}));
  if(it.count>0)btn.appendChild(h('span',{className:'count'},String(it.count)));
  nw.appendChild(btn);
});
nav.appendChild(nw);

const ud=h('div',{className:'sb-user'});
ud.innerHTML=`<div class="sb-avatar">${ini}</div><div class="sb-user-info"><div class="sb-user-name">${esc(u.nome)}</div><div class="sb-user-role">${esc(u.cargo)} · ${perfilLabel[u.perfil]||u.perfil}</div></div>`;
ud.appendChild(h('button',{className:'sb-logout',onClick:()=>AppState.logout(),innerHTML:I.logout}));
nav.appendChild(ud);return nav}
