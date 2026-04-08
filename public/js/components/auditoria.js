async function renderAuditoria(){
  let nivel='usuarios';
  let selUser=null,selDia=null,searchUser='';
  const wrap=h('div',{className:'fade-in'});

  async function draw(){
    wrap.innerHTML='';

    // Breadcrumb
    if(nivel!=='usuarios'){
      const bc=h('div',{style:'display:flex;gap:6px;align-items:center;margin-bottom:12px;font-size:13px'});
      bc.appendChild(h('span',{style:'cursor:pointer;color:var(--primary);font-weight:600',onClick:()=>{nivel='usuarios';selUser=null;selDia=null;draw()}},'← Usuários'));
      if(nivel==='dias'||nivel==='timeline')bc.appendChild(h('span',{style:'color:var(--text-3)'},` › ${selUser.nome}`));
      if(nivel==='timeline')bc.appendChild(h('span',{style:'color:var(--text-3)'},` › ${selDia}`));
      wrap.appendChild(bc);
    }

    // Header
    wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'🔒 Auditoria'),
      h('p',{className:'page-subtitle'},nivel==='usuarios'?'Selecione um usuário para investigar':nivel==='dias'?'Selecione um dia':'Timeline detalhada'))));

    // Global stats
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

  // ═══ LEVEL 1: USER CARDS ═══
  async function drawUsuarios(){
    const sb=h('div',{style:'margin-bottom:16px'});
    const si=h('input',{className:'input',placeholder:'Buscar por nome, perfil ou e-mail...',value:searchUser,style:'max-width:400px'});
    si.addEventListener('input',debounce(e=>{searchUser=e.target.value;draw()},300));
    sb.appendChild(si);wrap.appendChild(sb);

    const data=await Api.get('/auditoria/usuarios',searchUser?{search:searchUser}:{})||[];
    if(!data.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},'Nenhum usuário encontrado'));return}

    const perfilColors={master:'#059669',ativos:'#2BBCB3',espontaneos:'#1B4965',operador:'#64748b'};
    const grid=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px'});

    data.sort((a,b)=>(b.total_eventos||0)-(a.total_eventos||0)).forEach(u=>{
      const c=perfilColors[u.perfil]||'#94a3b8';
      const card=h('div',{style:`background:white;border-radius:12px;padding:16px;cursor:pointer;border:1px solid var(--border);border-left:4px solid ${c};transition:box-shadow .2s`,
        onClick:()=>{selUser=u;nivel='dias';draw()},
        onMouseEnter:function(){this.style.boxShadow='0 4px 12px #0002'},
        onMouseLeave:function(){this.style.boxShadow=''}});
      card.appendChild(h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px'},
        h('div',null,h('div',{style:'font-weight:700;font-size:15px'},esc(u.nome)),h('div',{style:'font-size:12px;color:#64748b'},`${esc(u.cargo||'')} · ${esc(u.perfil)}`)),
        h('div',{style:`width:36px;height:36px;border-radius:50%;background:${c};color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700`},u.nome.split(' ').map(n=>n[0]).join('').slice(0,2))));
      const mg=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px'});
      mg.appendChild(h('div',null,h('span',{style:'color:#94a3b8'},'Eventos: '),h('span',{style:'font-weight:700'},String(u.total_eventos||0))));
      mg.appendChild(h('div',null,h('span',{style:'color:#94a3b8'},'Críticas: '),h('span',{style:'font-weight:700;color:#dc2626'},String(u.acoes_criticas||0))));
      mg.appendChild(h('div',{style:'grid-column:1/-1;color:#94a3b8;font-size:11px;margin-top:4px'},u.ultimo_acesso?`Último acesso: ${fmtDataHora(u.ultimo_acesso)}`:'Sem atividade'));
      card.appendChild(mg);grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  // ═══ LEVEL 2: DAYS (most recent first) ═══
  async function drawDias(){
    const data=await Api.get(`/auditoria/usuario/${selUser.id}/dias`)||[];
    if(!data.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},'Nenhuma atividade'));return}
    const diasSemana=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const list=h('div',{style:'display:flex;flex-direction:column;gap:6px'});
    data.forEach(d=>{
      const dt=new Date(d.data+'T12:00:00');
      const row=h('div',{style:'display:flex;align-items:center;gap:14px;padding:14px 18px;background:white;border-radius:10px;cursor:pointer;border:1px solid var(--border);transition:background .15s',
        onClick:()=>{selDia=d.data;nivel='timeline';draw()},
        onMouseEnter:function(){this.style.background='var(--primary-bg)'},onMouseLeave:function(){this.style.background='white'}});
      row.appendChild(h('div',{style:'width:50px;text-align:center;flex-shrink:0'},
        h('div',{style:'font-size:22px;font-weight:800;color:var(--navy)'},String(dt.getDate())),
        h('div',{style:'font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase'},diasSemana[dt.getDay()])));
      row.appendChild(h('div',{style:'flex:1'},
        h('div',{style:'font-weight:600;font-size:13px'},d.data),
        h('div',{style:'font-size:11px;color:#64748b;margin-top:2px'},`${fmtHora(d.primeiro)} → ${fmtHora(d.ultimo)} · ${d.duracao_min} min`)));
      row.appendChild(h('div',{style:'display:flex;gap:8px;flex-shrink:0'},
        h('div',{style:'padding:4px 10px;border-radius:8px;background:#e0f2fe;font-size:12px;font-weight:700;color:#0369a1'},`${d.total}`),
        d.criticos>0?h('div',{style:'padding:4px 10px;border-radius:8px;background:#fef2f2;font-size:12px;font-weight:700;color:#dc2626'},`${d.criticos} ⚠`):''));
      row.appendChild(h('div',{style:'color:#94a3b8;font-size:16px'},'→'));
      list.appendChild(row);
    });
    wrap.appendChild(list);
  }

  function fmtHora(d){if(!d)return'—';try{return new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch(e){return'—'}}

  // ═══ LEVEL 3: TIMELINE (most recent first, expandable) ═══
  async function drawTimeline(){
    const data=await Api.get(`/auditoria/usuario/${selUser.id}/dia/${selDia}`)||{};
    const{sessao,timeline}=data;

    // Session summary
    if(sessao){
      const ss=h('div',{style:'display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap'});
      [['1º Acesso',fmtHora(sessao.primeiro),'#0369a1'],['Último',fmtHora(sessao.ultimo),'#0369a1'],
       ['Total',`${sessao.duracao_min||0}m`,'#1B4965'],['Ativo',`${sessao.ativo_min||0}m`,'#059669'],
       ['Ocioso',`${sessao.ocioso_min||0}m`,'#d97706'],['Eventos',String(sessao.total_eventos||0),'#2BBCB3']
      ].forEach(([l,v,c])=>{
        ss.appendChild(h('div',{style:`flex:1;min-width:80px;padding:10px;background:white;border-radius:8px;text-align:center;border:1px solid var(--border)`},
          h('div',{style:`font-size:16px;font-weight:700;color:${c}`},v),
          h('div',{style:'font-size:9px;font-weight:600;text-transform:uppercase;color:#94a3b8;margin-top:2px'},l)));
      });
      wrap.appendChild(ss);
    }

    if(!timeline||!timeline.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},'Nenhum evento'));return}

    const ACOES={login:['🔑','#059669'],login_falha:['🚫','#dc2626'],logout:['🚪','#64748b'],navegacao:['📄','#94a3b8'],retirada:['💉','#d97706'],criar:['➕','#2563eb'],criar_pendente:['⏳','#7c3aed'],editar:['✏️','#7c3aed'],excluir:['🗑️','#dc2626'],aprovar:['✅','#059669'],reprovar:['❌','#dc2626'],descarte:['🗑️','#dc2626'],estorno:['↩️','#d97706'],evidencia:['📸','#d97706']};
    const CRITICAS=['retirada','descarte','estorno','aprovar','reprovar','excluir','criar_pendente','evidencia'];

    const tl=h('div',{style:'position:relative;padding-left:24px;border-left:2px solid var(--border)'});

    timeline.forEach(e=>{
      const[icon,color]=ACOES[e.acao]||['📌','#94a3b8'];
      const isCrit=CRITICAS.includes(e.acao);
      const hora=e.hora?new Date(e.hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—';

      const ev=h('div',{style:'position:relative;margin-bottom:6px;margin-left:12px'});

      // Dot
      ev.appendChild(h('div',{style:`position:absolute;left:-30px;top:14px;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 2px ${color}40`}));

      // Idle gap
      if(e.gap_seconds&&e.gap_seconds>120){
        ev.appendChild(h('div',{style:'font-size:10px;color:#d97706;font-weight:600;margin-bottom:4px;font-style:italic'},`⏸ ${Math.round(e.gap_seconds/60)} min ocioso`));
      }

      const card=h('div',{style:`padding:12px 16px;background:${isCrit?'#fefce8':'white'};border-radius:10px;border:1px solid ${isCrit?'#fcd34d':'var(--border)'};font-size:13px;cursor:pointer;transition:background .1s`});

      // Top row: time + action + entity (always visible)
      const top=h('div',{style:'display:flex;justify-content:space-between;align-items:center'});
      top.appendChild(h('div',{style:'display:flex;gap:6px;align-items:center;flex-wrap:wrap'},
        h('span',{style:'font-size:16px'},icon),
        h('span',{className:'mono',style:`font-weight:700;color:${color}`},hora),
        h('span',{style:`padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:white;background:${color}`},e.acao.toUpperCase().replace(/_/g,' ')),
        e.entidade?h('span',{className:'badge badge-gray',style:'font-size:10px'},e.entidade):'',
        e.entidade_id?h('span',{className:'mono',style:'font-size:10px;color:#94a3b8'},`#${e.entidade_id}`):''));
      top.appendChild(h('div',{style:'font-size:10px;color:#94a3b8'},e.device||''));
      card.appendChild(top);

      // ═══ EXPANDABLE DETAIL PANEL ═══
      const detail=h('div',{style:'display:none;margin-top:10px;border-top:1px solid #e2e8f0;padding-top:10px'});

      const grid=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px'});
      const field=(l,v,full)=>{const d=h('div',{style:full?'grid-column:1/-1':''});d.innerHTML=`<span style="color:#94a3b8;font-weight:600">${l}:</span> <span style="color:#334155;font-weight:500">${esc(String(v||'—'))}</span>`;return d};

      grid.appendChild(field('IP',e.ip||'não capturado'));
      grid.appendChild(field('Navegador',e.browser));
      grid.appendChild(field('Sistema',e.os));
      grid.appendChild(field('Dispositivo',e.device));
      grid.appendChild(field('Rota',e.rota));
      grid.appendChild(field('Sessão',e.sessao_id?e.sessao_id.slice(0,12)+'…':'—'));

      // User agent (expandable)
      if(e.user_agent_raw){
        const uaDiv=h('div',{style:'grid-column:1/-1'});
        uaDiv.innerHTML=`<span style="color:#94a3b8;font-weight:600">User-Agent:</span> <span style="color:#94a3b8;font-size:10px;cursor:pointer;text-decoration:underline" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">[expandir]</span><div style="display:none;font-size:10px;color:#64748b;word-break:break-all;margin-top:2px;padding:4px;background:#f8fafc;border-radius:4px">${esc(e.user_agent_raw)}</div>`;
        grid.appendChild(uaDiv);
      }

      // Details (before/after, justificativa, etc)
      if(e.detalhes&&typeof e.detalhes==='object'){
        const detDiv=h('div',{style:'grid-column:1/-1;margin-top:4px'});
        const tags=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap'});
        Object.entries(e.detalhes).forEach(([k,v])=>{
          if(['latitude','longitude','accuracy','geo_status','geo_erro'].includes(k))return;
          tags.appendChild(h('span',{style:'background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:10px'},`${k}: ${v}`));
        });
        detDiv.appendChild(tags);
        grid.appendChild(detDiv);
      }

      detail.appendChild(grid);

      // ═══ GEOLOCATION + MAP ═══
      if(e.latitude&&e.longitude){
        const mapDiv=h('div',{style:'margin-top:8px;padding:8px;background:#ecfdf5;border-radius:8px;border:1px solid #86efac'});
        mapDiv.innerHTML=`<a href="https://www.google.com/maps?q=${e.latitude},${e.longitude}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:6px;text-decoration:none;color:#059669;font-weight:700;font-size:12px">
          📍 Abrir no Google Maps <span style="font-weight:400;color:#64748b">(${e.latitude.toFixed(5)}, ${e.longitude.toFixed(5)})</span></a>`;
        detail.appendChild(mapDiv);
      }else if(e.detalhes?.geo_status){
        const geoStatus={'negado':'🚫 Localização negada pelo operador','timeout':'⏱ Timeout na obtenção da localização','indisponivel':'⚠ Geolocalização indisponível neste dispositivo','erro':'❌ Erro ao obter localização'};
        detail.appendChild(h('div',{style:'margin-top:6px;font-size:11px;color:#d97706'},geoStatus[e.detalhes.geo_status]||`Geo: ${e.detalhes.geo_status}`));
      }

      // ═══ PHOTO EVIDENCE ═══
      if(e.foto){
        const fotoDiv=h('div',{style:'margin-top:8px;display:flex;align-items:center;gap:10px'});
        fotoDiv.appendChild(h('span',{style:'font-size:11px;color:#d97706;font-weight:700'},'📸 Evidência fotográfica:'));
        const thumb=h('img',{src:e.foto,style:'width:56px;height:56px;object-fit:cover;border-radius:8px;border:2px solid #fcd34d;cursor:pointer',
          onClick:()=>{
            showModal('📸 Evidência — '+e.acao.toUpperCase(),(body)=>{
              body.appendChild(h('img',{src:e.foto,style:'width:100%;max-width:500px;border-radius:12px;display:block;margin:0 auto'}));
              body.appendChild(h('div',{style:'text-align:center;margin-top:12px;font-size:12px;color:var(--text-3)'},
                `${hora} · ${selUser.nome} · ${e.acao} · IP: ${e.ip||'—'}`));
            },'560px');
          }});
        fotoDiv.appendChild(thumb);
        detail.appendChild(fotoDiv);
      }

      card.appendChild(detail);

      // Toggle expand
      card.addEventListener('click',(evt)=>{
        if(evt.target.tagName==='A'||evt.target.tagName==='IMG'||evt.target.closest('a'))return;
        detail.style.display=detail.style.display==='none'?'block':'none';
      });

      ev.appendChild(card);tl.appendChild(ev);
    });
    wrap.appendChild(tl);
  }

  await draw();return wrap;
}
