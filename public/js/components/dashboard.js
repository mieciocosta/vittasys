
// ── Agenda Widget (painel — somente leitura) ────────────────────────────────
async function renderAgendaWidget(container){
  const today=new Date();today.setHours(0,0,0,0);
  let selDate=new Date(today);

  const fmtISO=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const fmtLabel=d=>{const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];const diff=Math.round((d-today)/(864e5));const pref=diff===0?'Hoje':diff===1?'Amanhã':diff===-1?'Ontem':'';return `${pref?pref+', ':''}${DIAS[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`};

  async function draw(){
    container.innerHTML='';

    // Header com navegação de data
    const hdr=h('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px'});
    const navRow=h('div',{style:'display:flex;align-items:center;gap:8px'});

    const btnPrev=h('button',{style:'width:34px;height:34px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:18px;font-weight:600;color:var(--text-2)',
      onClick:async()=>{selDate=new Date(selDate);selDate.setDate(selDate.getDate()-1);await draw();}
    },'‹');

    const isToday=fmtISO(selDate)===fmtISO(today);
    const dateBtn=h('button',{style:`padding:7px 14px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-weight:700;background:${isToday?'var(--primary)':'var(--bg-subtle)'};color:${isToday?'white':'var(--text-1)'};cursor:pointer`,
      onClick:async()=>{selDate=new Date(today);await draw();}
    },isToday?'📅 Hoje':fmtLabel(selDate));

    const btnNext=h('button',{style:'width:34px;height:34px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:18px;font-weight:600;color:var(--text-2)',
      onClick:async()=>{selDate=new Date(selDate);selDate.setDate(selDate.getDate()+1);await draw();}
    },'›');

    navRow.appendChild(btnPrev);navRow.appendChild(dateBtn);navRow.appendChild(btnNext);
    hdr.appendChild(navRow);

    const verBtn=h('button',{className:'btn btn-ghost btn-sm',style:'font-size:11px',
      onClick:()=>AppState.setModulo('agenda')
    },'Ver agenda completa →');
    hdr.appendChild(verBtn);
    container.appendChild(hdr);

    // Loading
    const loading=h('div',{style:'text-align:center;padding:24px;color:var(--text-3);font-size:13px'},'⏳ Carregando...');
    container.appendChild(loading);

    const data=await Api.agendaList({data:fmtISO(selDate)});
    loading.remove();

    const items=data?.agendamentos||[];

    if(!items.length){
      container.appendChild(h('div',{style:'text-align:center;padding:24px;color:var(--text-3)'},
        h('div',{style:'font-size:28px;margin-bottom:6px'},'📅'),
        h('div',{style:'font-size:13px;font-weight:600'},'Sem agendamentos'),
        h('div',{style:'font-size:11px;margin-top:2px'},'Nenhuma vacina agendada para este dia')
      ));
      return;
    }

    // Contador
    container.appendChild(h('div',{style:'font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px'},
      `${items.length} agendamento${items.length!==1?'s':''}`));

    // Lista de agendamentos (somente leitura)
    items.forEach(ag=>{
      const st={agendado:{cl:'badge-warn',lbl:'Agendado'},confirmado:{cl:'badge-ok',lbl:'Confirmado'},realizado:{cl:'badge-ok',lbl:'✓ Feito'},faltou:{cl:'badge-err',lbl:'Faltou'},cancelado:{cl:'badge-err',lbl:'Cancelado'}}[ag.status]||{cl:'badge-warn',lbl:ag.status};
      const row=h('div',{style:'display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)'});

      // Horário
      row.appendChild(h('div',{style:'font-size:12px;font-weight:700;color:var(--primary);min-width:44px;padding-top:2px'},ag.horario||'--:--'));

      // Info
      const info=h('div',{style:'flex:1;min-width:0'});
      const pNome=h('div',{style:'font-size:13px;font-weight:600;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis'},esc(ag.paciente_nome||ag.cliente_nome||'—'));
      info.appendChild(pNome);
      if(ag.vacina_nome)info.appendChild(h('div',{style:'font-size:11px;color:var(--text-3);margin-top:1px'},`💉 ${esc(ag.vacina_nome)}`));
      if(ag.regiao_nome)info.appendChild(h('div',{style:'font-size:10px;color:var(--text-4);margin-top:1px'},`📍 ${esc(ag.regiao_nome)}`));
      row.appendChild(info);

      // Status badge
      row.appendChild(h('span',{className:`badge ${st.cl}`,style:'font-size:9px;flex-shrink:0;margin-top:2px'},st.lbl));
      container.appendChild(row);
    });
  }

  await draw();
}

async function renderDashboard(){const wrap=h('div',{className:'fade-in'});
if(!AppState.isMaster()){
  // Non-master: show simplified welcome
  wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
    h('h1',{className:'page-title'},`Olá, ${AppState.usuario.nome.split(' ')[0]}!`),
    h('p',{className:'page-subtitle'},`Perfil: ${AppState.usuario.perfil==='ativos'?'⭐ Atend. Home':AppState.usuario.perfil==='espontaneos'?'📋 Atend. Consultas':AppState.usuario.perfil==='atendimento'?'💉 Atend. Vacinas':'👑 Master'}`))));
  const tip=h('div',{className:'card',style:{marginBottom:'20px'}});
  tip.innerHTML=`<h3 style="font-size:15px;font-weight:600;margin-bottom:8px">Acesso Rápido</h3><p style="font-size:13px;color:var(--text-3)">Use o menu lateral para acessar seus módulos.</p>`;
  wrap.appendChild(tip);
  // Agenda widget — somente leitura para todos os perfis
  const agCard=h('div',{className:'card'});
  agCard.appendChild(h('div',{style:'display:flex;align-items:center;gap:8px;margin-bottom:4px'},
    h('span',{style:'font-size:16px'},'📅'),
    h('h3',{style:'font-size:15px;font-weight:700;margin:0'},'Agenda do Dia')
  ));
  const agBody=h('div');agCard.appendChild(agBody);
  wrap.appendChild(agCard);
  renderAgendaWidget(agBody);
  return wrap}

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
cols.appendChild(ac);wrap.appendChild(cols);
// Agenda widget no painel master
const agCardM=h('div',{className:'card',style:'margin-top:0'});
agCardM.appendChild(h('div',{style:'display:flex;align-items:center;gap:8px;margin-bottom:4px'},
  h('span',{style:'font-size:16px'},'📅'),
  h('h3',{style:'font-size:15px;font-weight:700;margin:0'},'Agenda do Dia')
));
const agBodyM=h('div');agCardM.appendChild(agBodyM);
wrap.appendChild(agCardM);
renderAgendaWidget(agBodyM);
return wrap}
