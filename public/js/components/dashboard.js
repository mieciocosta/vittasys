async function renderDashboard(){const wrap=h('div',{className:'fade-in'});
if(!AppState.isMaster()){
  // Non-master: show simplified welcome
  wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
    h('h1',{className:'page-title'},`Olá, ${AppState.usuario.nome.split(' ')[0]}!`),
    h('p',{className:'page-subtitle'},`Perfil: ${AppState.usuario.perfil==='ativos'?'⭐ Clientes Ativos':'📋 Clientes Espontâneos'}`))));
  const tip=h('div',{className:'card',style:{marginBottom:'20px'}});
  tip.innerHTML=`<h3 style="font-size:15px;font-weight:600;margin-bottom:8px">Acesso Rápido</h3><p style="font-size:13px;color:var(--text-3)">Use o menu lateral para acessar seus módulos. Seu perfil tem acesso apenas aos dados de <strong>${AppState.usuario.perfil==='ativos'?'clientes ativos':'clientes espontâneos'}</strong>.</p>`;
  wrap.appendChild(tip);return wrap}

// Master: full dashboard
wrap.innerHTML='<div style="text-align:center;padding:40px;color:#94a3b8">Carregando painel...</div>';
const data=await Api.dashboard();if(!data){wrap.innerHTML='<div class="empty-state">Erro ao carregar</div>';return wrap}wrap.innerHTML='';
wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
  h('h1',{className:'page-title'},'Painel VittaSys'),h('p',{className:'page-subtitle'},'👑 Visão Master — Vittalis Saúde'))));
const cards=[{l:'Doses em Estoque',v:data.estoque.total_doses,c:'#2BBCB3',i:I.box},{l:'Planos Ativos',v:data.planos.contratos_ativos||data.planos.total_contratos,c:'#1B4965',i:I.pkg},{l:'Receita Total',v:fmtMoeda(data.financeiro.total_recebido),c:'#059669',i:I.dollar},{l:'Aprovações Pendentes',v:data.aprovacoes_pendentes||0,c:data.aprovacoes_pendentes>0?'#d97706':'#059669',i:I.alert}];
const grid=h('div',{className:'dash-grid'});cards.forEach(c=>{const cd=h('div',{className:'stat-card',style:{borderLeftColor:c.c}});cd.innerHTML=`<div style="display:flex;justify-content:space-between"><div><div class="stat-label">${c.l}</div><div class="stat-value" style="color:${c.c}">${c.v}</div></div><div class="stat-icon" style="color:${c.c}">${c.i}</div></div>`;grid.appendChild(cd)});wrap.appendChild(grid);
const fr=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}});
[['Valor Contratos',fmtMoeda(data.financeiro.valor_contratos),'#1B4965'],['Total Recebido',fmtMoeda(data.financeiro.total_recebido),'#2BBCB3'],['Saldo Pendente',fmtMoeda(data.financeiro.saldo_pendente),'#d97706'],['Clientes Ativos',data.clientes.ativos,'#7c3aed']].forEach(([l,v,c])=>{fr.appendChild(h('div',{className:'fin-card',innerHTML:`<div class="fin-label">${l}</div><div class="fin-value" style="color:${c}">${v}</div>`}))});wrap.appendChild(fr);
const cols=h('div',{className:'dash-cols'});
const mc=h('div',{className:'card'});mc.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="font-size:15px;font-weight:600">Últimas Movimentações</h3></div>';
mc.querySelector('div').appendChild(iconBtn('btn-ghost','','Ver todas →',()=>AppState.setModulo('historico'),{style:{fontSize:'12px'}}));
(data.ultimas_movimentacoes||[]).forEach(m=>{const row=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:'1px solid #f1f5f9',fontSize:'13px',cursor:'pointer'},onClick:()=>{if(m.cliente_id)AppState.verCliente(m.cliente_id)}});row.innerHTML=`<div style="width:7px;height:7px;border-radius:50%;background:${m.tipo==='retirada'?'#d97706':'#059669'};flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="font-weight:500">${esc(m.nome_vacina||'-')}</div><div style="font-size:12px;color:#94a3b8">${esc(m.cliente_nome||'-')} ${m.tipo_cliente==='ativo'?'⭐':''}</div></div><div style="font-size:11px;color:#94a3b8;flex-shrink:0">${fmtDataHora(m.data_hora)}</div>`;mc.appendChild(row)});cols.appendChild(mc);
const ac=h('div',{className:'card'});ac.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="font-size:15px;font-weight:600">Alertas Vencimento</h3></div>';
ac.querySelector('div').appendChild(iconBtn('btn-ghost','','Ver todos →',()=>AppState.setModulo('alertas'),{style:{fontSize:'12px',color:'#dc2626'}}));
(data.alertas_vencimento||[]).slice(0,6).forEach(l=>{const st=statusVenc(l.dias_para_vencer);ac.innerHTML+=`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px"><span class="badge ${st.cls}">${st.label}</span><div style="flex:1"><div style="font-weight:500">${esc(l.vacina_nome)}</div><div style="font-size:12px;color:#94a3b8">Lote: ${esc(l.numero_lote)} · ${l.quantidade_disponivel} doses</div></div></div>`});
if(!data.alertas_vencimento?.length)ac.appendChild(h('div',{className:'empty-state'},'✓ Nenhum alerta'));
cols.appendChild(ac);wrap.appendChild(cols);return wrap}
