async function renderAuditoria(){
  let nivel='usuarios',selUser=null,selDia=null,searchUser='';
  const wrap=h('div',{className:'fade-in'});

  async function draw(){
    wrap.innerHTML='';
    if(nivel!=='usuarios'){
      const bc=h('div',{style:'display:flex;gap:6px;align-items:center;margin-bottom:12px;font-size:13px'});
      bc.appendChild(h('span',{style:'cursor:pointer;color:var(--primary);font-weight:600',onClick:()=>{nivel='usuarios';selUser=null;selDia=null;draw()}},'← Usuários'));
      if(nivel==='dias'||nivel==='timeline')bc.appendChild(h('span',{style:'color:var(--text-3)'},` › ${selUser.nome}`));
      if(nivel==='timeline')bc.appendChild(h('span',{style:'color:var(--text-3)'},` › ${selDia}`));
      wrap.appendChild(bc);
    }
    wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'🔒 Auditoria'),
      h('p',{className:'page-subtitle'},nivel==='usuarios'?'Selecione um usuário':nivel==='dias'?'Selecione um dia':'Timeline detalhada'))));
    const stats=await Api.auditoriaStats()||{};
    const sr=h('div',{style:'display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap'});
    [['Total',stats.total||0,'#1B4965'],['Hoje',stats.hoje||0,'#2BBCB3'],['Logins',stats.logins_hoje||0,'#059669'],['Críticas',stats.acoes_criticas||0,'#dc2626']].forEach(([l,v,c])=>{
      sr.appendChild(h('div',{style:`flex:1;min-width:100px;padding:12px;background:white;border-radius:10px;box-shadow:0 1px 3px #0001;border-left:3px solid ${c};text-align:center`},
        h('div',{style:`font-size:22px;font-weight:800;color:${c}`},String(v)),
        h('div',{style:'font-size:10px;font-weight:600;text-transform:uppercase;color:#94a3b8'},l)));
    });
    wrap.appendChild(sr);
    if(nivel==='usuarios')await drawUsuarios();
    else if(nivel==='dias')await drawDias();
    else await drawTimeline();
  }

  async function drawUsuarios(){
    const sb=h('div',{style:'margin-bottom:16px'});
    const si=h('input',{className:'input',placeholder:'Buscar...',value:searchUser,style:'max-width:400px'});
    si.addEventListener('input',debounce(e=>{searchUser=e.target.value;draw()},300));
    sb.appendChild(si);wrap.appendChild(sb);
    const data=await Api.get('/auditoria/usuarios',searchUser?{search:searchUser}:{})||[];
    if(!data.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},'Nenhum usuário'));return}
    const pc={master:'#059669',ativos:'#2BBCB3',espontaneos:'#1B4965',operador:'#64748b'};
    const grid=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px'});
    data.sort((a,b)=>(b.total_eventos||0)-(a.total_eventos||0)).forEach(u=>{
      const c=pc[u.perfil]||'#94a3b8';
      const card=h('div',{style:`background:white;border-radius:12px;padding:16px;cursor:pointer;border:1px solid var(--border);border-left:4px solid ${c};transition:box-shadow .2s`,
        onClick:()=>{selUser=u;nivel='dias';draw()},onMouseEnter:function(){this.style.boxShadow='0 4px 12px #0002'},onMouseLeave:function(){this.style.boxShadow=''}});
      card.appendChild(h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px'},
        h('div',null,h('div',{style:'font-weight:700;font-size:15px'},esc(u.nome)),h('div',{style:'font-size:12px;color:#64748b'},`${esc(u.cargo||'')} · ${u.perfil}`)),
        h('div',{style:`width:36px;height:36px;border-radius:50%;background:${c};color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700`},u.nome.split(' ').map(n=>n[0]).join('').slice(0,2))));
      const mg=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px'});
      mg.appendChild(h('div',{innerHTML:`<span style="color:#94a3b8">Eventos:</span> <b>${u.total_eventos||0}</b>`}));
      mg.appendChild(h('div',{innerHTML:`<span style="color:#94a3b8">Críticas:</span> <b style="color:#dc2626">${u.acoes_criticas||0}</b>`}));
      if(u.ultimo_acesso)mg.appendChild(h('div',{style:'grid-column:1/-1;color:#94a3b8;font-size:11px;margin-top:4px'},`Último: ${fmtDataHora(u.ultimo_acesso)}`));
      card.appendChild(mg);grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  async function drawDias(){
    const data=await Api.get(`/auditoria/usuario/${selUser.id}/dias`)||[];
    if(!data.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},'Sem atividade'));return}
    const ds=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const list=h('div',{style:'display:flex;flex-direction:column;gap:6px'});
    data.forEach(d=>{
      const dt=new Date(d.data+'T12:00:00');
      const row=h('div',{style:'display:flex;align-items:center;gap:14px;padding:14px 18px;background:white;border-radius:10px;cursor:pointer;border:1px solid var(--border)',
        onClick:()=>{selDia=d.data;nivel='timeline';draw()},onMouseEnter:function(){this.style.background='var(--primary-bg)'},onMouseLeave:function(){this.style.background='white'}});
      row.appendChild(h('div',{style:'width:50px;text-align:center'},h('div',{style:'font-size:22px;font-weight:800;color:var(--navy)'},String(dt.getDate())),h('div',{style:'font-size:10px;font-weight:600;color:#94a3b8'},ds[dt.getDay()])));
      const fh=d2=>d2?new Date(d2).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—';
      row.appendChild(h('div',{style:'flex:1'},h('div',{style:'font-weight:600;font-size:13px'},d.data),h('div',{style:'font-size:11px;color:#64748b;margin-top:2px'},`${fh(d.primeiro)} → ${fh(d.ultimo)} · ${d.duracao_min}min`)));
      row.appendChild(h('div',{style:'display:flex;gap:8px'},h('div',{style:'padding:4px 10px;border-radius:8px;background:#e0f2fe;font-size:12px;font-weight:700;color:#0369a1'},String(d.total)),d.criticos>0?h('div',{style:'padding:4px 10px;border-radius:8px;background:#fef2f2;font-size:12px;font-weight:700;color:#dc2626'},`${d.criticos}⚠`):''));
      row.appendChild(h('div',{style:'color:#94a3b8'},'→'));
      list.appendChild(row);
    });
    wrap.appendChild(list);
  }

  async function drawTimeline(){
    const data=await Api.get(`/auditoria/usuario/${selUser.id}/dia/${selDia}`)||{};
    const{sessao,timeline}=data;
    if(sessao){
      const ss=h('div',{style:'display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap'});
      const fh=d=>d?new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—';
      [['1º Acesso',fh(sessao.primeiro),'#0369a1'],['Último',fh(sessao.ultimo),'#0369a1'],['Total',`${sessao.duracao_min||0}m`,'#1B4965'],['Ativo',`${sessao.ativo_min||0}m`,'#059669'],['Ocioso',`${sessao.ocioso_min||0}m`,'#d97706'],['Eventos',String(sessao.total_eventos||0),'#2BBCB3']].forEach(([l,v,c])=>{
        ss.appendChild(h('div',{style:`flex:1;min-width:80px;padding:10px;background:white;border-radius:8px;text-align:center;border:1px solid var(--border)`},
          h('div',{style:`font-size:16px;font-weight:700;color:${c}`},v),h('div',{style:'font-size:9px;font-weight:600;text-transform:uppercase;color:#94a3b8;margin-top:2px'},l)));
      });
      wrap.appendChild(ss);
    }
    if(!timeline||!timeline.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},'Sem eventos'));return}

    const ACOES={login:['🔑','#059669'],login_falha:['🚫','#dc2626'],logout:['🚪','#64748b'],navegacao:['📄','#94a3b8'],retirada:['💉','#d97706'],criar:['➕','#2563eb'],criar_pendente:['⏳','#7c3aed'],editar:['✏️','#7c3aed'],excluir:['🗑️','#dc2626'],aprovar:['✅','#059669'],reprovar:['❌','#dc2626'],descarte:['🗑️','#dc2626'],estorno:['↩️','#d97706'],evidencia:['📸','#d97706']};
    const CRIT=['retirada','descarte','estorno','aprovar','reprovar','excluir','criar_pendente','evidencia'];
    const tl=h('div',{style:'position:relative;padding-left:24px;border-left:2px solid var(--border)'});

    timeline.forEach(e=>{
      const[icon,color]=ACOES[e.acao]||['📌','#94a3b8'];
      const isCrit=CRIT.includes(e.acao);
      const isNav=e.acao==='navegacao';
      const hora=e.hora?new Date(e.hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—';
      const ev=h('div',{style:'position:relative;margin-bottom:6px;margin-left:12px'});
      // Dot
      ev.appendChild(h('div',{style:`position:absolute;left:${isCrit?'-32':'-30'}px;top:14px;width:${isCrit?'16':'10'}px;height:${isCrit?'16':'10'}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 2px ${color}40`}));
      // Idle gap
      if(e.gap_seconds&&e.gap_seconds>120)ev.appendChild(h('div',{style:'font-size:10px;color:#d97706;font-weight:600;margin-bottom:4px;font-style:italic'},`⏸ ${Math.round(e.gap_seconds/60)}min ocioso`));

      const bg=isCrit?'linear-gradient(135deg,#fefce8,#fffbeb)':'white';
      const bw=isCrit?'2':'1';const bc=isCrit?'#f59e0b':'var(--border)';
      const card=h('div',{style:`padding:${isCrit?'14px 16px':'8px 14px'};background:${bg};border-radius:10px;border:${bw}px solid ${bc};font-size:13px`});

      // HEADER
      const top=h('div',{style:'display:flex;justify-content:space-between;align-items:center'});
      const left=h('div',{style:'display:flex;gap:6px;align-items:center;flex-wrap:wrap'});
      left.appendChild(h('span',{style:`font-size:${isCrit?'18':'14'}px`},icon));
      left.appendChild(h('span',{className:'mono',style:`font-weight:700;font-size:${isCrit?'13':'12'}px;color:${color}`},hora));
      left.appendChild(h('span',{style:`padding:2px 8px;border-radius:4px;font-size:${isCrit?'11':'10'}px;font-weight:700;color:white;background:${color}`},e.acao.toUpperCase().replace(/_/g,' ')));
      if(e.entidade)left.appendChild(h('span',{className:'badge badge-gray',style:'font-size:10px'},e.entidade));
      if(e.entidade_id)left.appendChild(h('span',{className:'mono',style:'font-size:10px;color:#94a3b8'},`#${e.entidade_id}`));
      if(e.foto)left.appendChild(h('span',{style:'font-size:10px'},'📸'));
      if(e.latitude)left.appendChild(h('span',{style:'font-size:10px'},'📍'));
      top.appendChild(left);
      // Toggle
      const toggleBtn=h('button',{style:'border:none;background:none;cursor:pointer;font-size:10px;color:#94a3b8;padding:4px 8px;border-radius:4px;font-weight:600'});
      toggleBtn.textContent=isCrit?'▼ Detalhes':'▶';
      top.appendChild(toggleBtn);
      card.appendChild(top);

      // QUICK CONTEXT for critical
      if(isCrit&&e.detalhes&&typeof e.detalhes==='object'){
        const q=h('div',{style:'font-size:11px;color:#64748b;margin-top:4px;display:flex;gap:6px;flex-wrap:wrap'});
        ['vacina','cliente','tipo','quantidade','motivo','decisao','estoque_antes','estoque_depois','local'].forEach(k=>{
          if(e.detalhes[k]!=null)q.appendChild(h('span',{style:'background:#f1f5f9;padding:1px 6px;border-radius:3px'},`${k}: ${e.detalhes[k]}`));
        });
        if(q.childNodes.length)card.appendChild(q);
      }
      // NAV: inline meta
      if(isNav)card.appendChild(h('div',{style:'font-size:10px;color:#cbd5e1;margin-top:2px'},`${e.ip||'—'} · ${e.browser||'—'} · ${e.rota||''}`));

      // EXPANDABLE DETAIL
      const detail=h('div',{style:`display:${isCrit?'block':'none'};margin-top:10px;border-top:1px solid #e2e8f0;padding-top:10px`});
      let expanded=isCrit;
      toggleBtn.addEventListener('click',evt=>{evt.stopPropagation();expanded=!expanded;detail.style.display=expanded?'block':'none';toggleBtn.textContent=expanded?'▲ Recolher':'▼ Detalhes'});

      const grid=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px'});
      const f=(l,v,full)=>{const d=h('div',{style:full?'grid-column:1/-1':''});d.innerHTML=`<span style="color:#94a3b8;font-weight:600">${l}:</span> <span style="font-weight:500">${esc(String(v||'—'))}</span>`;return d};
      grid.appendChild(f('IP',e.ip||'⚠ não capturado'));
      grid.appendChild(f('Navegador',e.browser));
      grid.appendChild(f('Sistema',e.os));
      grid.appendChild(f('Dispositivo',e.device));
      grid.appendChild(f('Rota',e.rota));
      grid.appendChild(f('Sessão',e.sessao_id?e.sessao_id.slice(0,12)+'…':'—'));
      if(e.user_agent_raw){const ud=h('div',{style:'grid-column:1/-1;margin-top:4px'});const t=h('span',{style:'color:#94a3b8;font-size:10px;cursor:pointer;text-decoration:underline'});t.textContent='[User-Agent]';const uf=h('div',{style:'display:none;font-size:10px;color:#64748b;word-break:break-all;margin-top:2px;padding:4px;background:#f8fafc;border-radius:4px'});uf.textContent=e.user_agent_raw;t.addEventListener('click',ev2=>{ev2.stopPropagation();uf.style.display=uf.style.display==='none'?'block':'none'});ud.appendChild(t);ud.appendChild(uf);grid.appendChild(ud)}
      if(e.detalhes&&typeof e.detalhes==='object'){const dd=h('div',{style:'grid-column:1/-1;margin-top:4px'});const tg=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap'});Object.entries(e.detalhes).forEach(([k,v])=>{if(['latitude','longitude','accuracy','geo_status','geo_erro'].includes(k))return;tg.appendChild(h('span',{style:'background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:10px'},`${k}: ${v}`))});if(tg.childNodes.length){dd.appendChild(tg);grid.appendChild(dd)}}
      detail.appendChild(grid);

      // GEO + MAP
      if(e.latitude&&e.longitude){
        const md=h('div',{style:'margin-top:8px;padding:10px;background:#ecfdf5;border-radius:8px;border:1px solid #86efac'});
        const ml=h('a',{href:`https://www.google.com/maps?q=${e.latitude},${e.longitude}`,target:'_blank',rel:'noopener',style:'display:flex;align-items:center;gap:6px;text-decoration:none;color:#059669;font-weight:700;font-size:12px'});
        ml.textContent=`📍 Abrir no Google Maps (${e.latitude.toFixed(5)}, ${e.longitude.toFixed(5)})`;
        md.appendChild(ml);detail.appendChild(md);
      }else{
        const gs=(e.detalhes?.geo_status)||(e.geo_status);
        if(gs&&gs!=='ok'){const gl={negado:'🚫 Localização negada',timeout:'⏱ Timeout',indisponivel:'⚠ Indisponível',nao_capturado:'— Não capturada',erro:'❌ Erro'};
        detail.appendChild(h('div',{style:'margin-top:6px;font-size:11px;color:#d97706;padding:4px 8px;background:#fffbeb;border-radius:4px'},gl[gs]||`Geo: ${gs}`))}
      }

      // PHOTO
      if(e.foto){
        const fd=h('div',{style:'margin-top:8px;padding:10px;background:#fef3c7;border-radius:8px;border:1px solid #fcd34d;display:flex;align-items:center;gap:12px'});
        fd.appendChild(h('span',{style:'font-size:12px;color:#92400e;font-weight:700'},'📸 Evidência'));
        const th=h('img',{src:e.foto,style:'width:64px;height:64px;object-fit:cover;border-radius:8px;border:2px solid #fbbf24;cursor:pointer'});
        th.addEventListener('click',ev2=>{ev2.stopPropagation();showModal('📸 Evidência — '+e.acao.toUpperCase(),(body)=>{body.appendChild(h('img',{src:e.foto,style:'width:100%;max-width:500px;border-radius:12px;display:block;margin:0 auto'}));body.appendChild(h('div',{style:'text-align:center;margin-top:12px;font-size:12px;color:var(--text-3)'},`${hora} · ${selUser.nome} · ${e.acao} · IP: ${e.ip||'—'}`));},'560px')});
        fd.appendChild(th);detail.appendChild(fd);
      }

      card.appendChild(detail);ev.appendChild(card);tl.appendChild(ev);
    });
    wrap.appendChild(tl);
  }
  await draw();return wrap;
}
