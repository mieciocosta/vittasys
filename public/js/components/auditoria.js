async function renderAuditoria(){
  let nivel='usuarios'; // usuarios | dias | timeline
  let selUser=null,selDia=null;
  let searchUser='';
  const wrap=h('div',{className:'fade-in'});

  async function draw(){
    wrap.innerHTML='';

    // Header
    const hdr=h('div',{className:'page-header'});
    hdr.appendChild(h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'🔒 Auditoria'),
      h('p',{className:'page-subtitle'},nivel==='usuarios'?'Selecione um usuário para investigar':
        nivel==='dias'?`${selUser.nome} — Selecione um dia`:
        `${selUser.nome} — ${selDia}`)));

    // Breadcrumb
    if(nivel!=='usuarios'){
      const bc=h('div',{style:{display:'flex',gap:'8px',alignItems:'center',marginBottom:'16px'}});
      bc.appendChild(h('span',{style:'cursor:pointer;color:var(--primary);font-weight:600;font-size:13px',onClick:()=>{nivel='usuarios';selUser=null;selDia=null;draw()}},'Usuários'));
      if(nivel==='dias'||nivel==='timeline'){
        bc.appendChild(h('span',{style:'color:var(--text-3)'},' › '));
        bc.appendChild(h('span',{style:`cursor:pointer;color:${nivel==='timeline'?'var(--primary)':'var(--text-2)'};font-weight:600;font-size:13px`,onClick:()=>{nivel='dias';selDia=null;draw()}},selUser.nome));
      }
      if(nivel==='timeline'){
        bc.appendChild(h('span',{style:'color:var(--text-3)'},' › '));
        bc.appendChild(h('span',{style:'font-weight:600;font-size:13px;color:var(--text-2)'},selDia));
      }
      wrap.appendChild(bc);
    }
    wrap.appendChild(hdr);

    // Stats
    const stats=await Api.auditoriaStats()||{};
    const sr=h('div',{style:{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}});
    [['Total',stats.total||0,'#1B4965'],['Hoje',stats.hoje||0,'#2BBCB3'],['Logins',stats.logins_hoje||0,'#059669'],['Críticas',stats.acoes_criticas||0,'#dc2626']].forEach(([l,v,c])=>{
      sr.appendChild(h('div',{style:{flex:'1',minWidth:'100px',padding:'12px',background:'white',borderRadius:'10px',boxShadow:'0 1px 3px #0001',borderLeft:`3px solid ${c}`,textAlign:'center'}},
        h('div',{style:{fontSize:'22px',fontWeight:'800',color:c}},String(v)),
        h('div',{style:{fontSize:'10px',fontWeight:'600',textTransform:'uppercase',color:'#94a3b8'}},l)));
    });
    wrap.appendChild(sr);

    if(nivel==='usuarios')await drawUsuarios();
    else if(nivel==='dias')await drawDias();
    else if(nivel==='timeline')await drawTimeline();
  }

  // ═══ LEVEL 1: USERS ═══
  async function drawUsuarios(){
    const sb=h('div',{style:{marginBottom:'16px'}});
    const si=h('input',{className:'input',placeholder:'Buscar por nome, perfil ou e-mail...',value:searchUser,style:'max-width:400px'});
    si.addEventListener('input',debounce(e=>{searchUser=e.target.value;drawUsuarios()},300));
    sb.appendChild(si);wrap.appendChild(sb);

    const data=await Api.get('/auditoria/usuarios',searchUser?{search:searchUser}:{})||[];
    if(!data.length){wrap.appendChild(h('div',{className:'empty-state',style:{padding:'40px'}},'Nenhum usuário encontrado'));return}

    const grid=h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}});
    const perfilColors={master:'#059669',ativos:'#2BBCB3',espontaneos:'#1B4965',operador:'#64748b'};

    data.sort((a,b)=>(b.total_eventos||0)-(a.total_eventos||0)).forEach(u=>{
      const card=h('div',{style:{background:'white',borderRadius:'12px',padding:'16px',cursor:'pointer',border:'1px solid var(--border)',borderLeft:`4px solid ${perfilColors[u.perfil]||'#94a3b8'}`,transition:'box-shadow .2s'},
        onClick:()=>{selUser=u;nivel='dias';draw()},
        onMouseEnter:function(){this.style.boxShadow='0 4px 12px #0002'},
        onMouseLeave:function(){this.style.boxShadow=''}});

      card.appendChild(h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}},
        h('div',null,
          h('div',{style:{fontWeight:'700',fontSize:'15px'}},esc(u.nome)),
          h('div',{style:{fontSize:'12px',color:'#64748b'}},`${esc(u.cargo)} · ${esc(u.perfil)}`)),
        h('div',{style:{width:'36px',height:'36px',borderRadius:'50%',background:perfilColors[u.perfil]||'#94a3b8',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'700'}},u.nome.split(' ').map(n=>n[0]).join('').slice(0,2))));

      const mg=h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',fontSize:'12px'}});
      mg.appendChild(h('div',null,h('span',{style:'color:#94a3b8'},'Eventos: '),h('span',{style:'font-weight:700'},String(u.total_eventos||0))));
      mg.appendChild(h('div',null,h('span',{style:'color:#94a3b8'},'Críticas: '),h('span',{style:'font-weight:700;color:#dc2626'},String(u.acoes_criticas||0))));
      mg.appendChild(h('div',{style:'grid-column:1/-1;color:#94a3b8;font-size:11px;margin-top:4px'},u.ultimo_acesso?`Último: ${fmtDataHora(u.ultimo_acesso)}`:'Sem atividade'));
      card.appendChild(mg);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  }

  // ═══ LEVEL 2: DAYS ═══
  async function drawDias(){
    const data=await Api.get(`/auditoria/usuario/${selUser.id}/dias`)||[];
    if(!data.length){wrap.appendChild(h('div',{className:'empty-state',style:{padding:'40px'}},'Nenhuma atividade registrada'));return}

    const list=h('div',{style:{display:'flex',flexDirection:'column',gap:'6px'}});
    data.forEach(d=>{
      const row=h('div',{style:{display:'flex',alignItems:'center',gap:'14px',padding:'14px 18px',background:'white',borderRadius:'10px',cursor:'pointer',border:'1px solid var(--border)',transition:'background .15s'},
        onClick:()=>{selDia=d.data;nivel='timeline';draw()},
        onMouseEnter:function(){this.style.background='var(--primary-bg)'},
        onMouseLeave:function(){this.style.background='white'}});

      // Date
      const dt=new Date(d.data+'T12:00:00');
      const diasSemana=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
      row.appendChild(h('div',{style:{width:'50px',textAlign:'center',flexShrink:'0'}},
        h('div',{style:{fontSize:'22px',fontWeight:'800',color:'var(--navy)'}},String(dt.getDate())),
        h('div',{style:{fontSize:'10px',fontWeight:'600',color:'#94a3b8',textTransform:'uppercase'}},diasSemana[dt.getDay()])));

      // Stats
      row.appendChild(h('div',{style:{flex:'1'}},
        h('div',{style:{fontWeight:'600',fontSize:'13px'}},d.data),
        h('div',{style:{fontSize:'11px',color:'#64748b',marginTop:'2px'}},`${fmtDataHora(d.primeiro).split(' ')[1]||'—'} → ${fmtDataHora(d.ultimo).split(' ')[1]||'—'} · ${d.duracao_min} min`)));

      // Counters
      row.appendChild(h('div',{style:{display:'flex',gap:'8px',flexShrink:'0'}},
        h('div',{style:{padding:'4px 10px',borderRadius:'8px',background:'#e0f2fe',fontSize:'12px',fontWeight:'700',color:'#0369a1'}},`${d.total} eventos`),
        d.criticos>0?h('div',{style:{padding:'4px 10px',borderRadius:'8px',background:'#fef2f2',fontSize:'12px',fontWeight:'700',color:'#dc2626'}},`${d.criticos} críticos`):''));

      // Arrow
      row.appendChild(h('div',{style:{color:'#94a3b8',fontSize:'16px'}},'→'));
      list.appendChild(row);
    });
    wrap.appendChild(list);
  }

  // ═══ LEVEL 3: TIMELINE ═══
  async function drawTimeline(){
    const data=await Api.get(`/auditoria/usuario/${selUser.id}/dia/${selDia}`)||{};
    const{sessao,timeline}=data;

    // Session summary
    if(sessao){
      const ss=h('div',{style:{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}});
      [['Primeiro Acesso',sessao.primeiro?fmtDataHora(sessao.primeiro).split(' ')[1]:'—','#0369a1'],
       ['Último Acesso',sessao.ultimo?fmtDataHora(sessao.ultimo).split(' ')[1]:'—','#0369a1'],
       ['Tempo Total',`${sessao.duracao_min||0} min`,'#1B4965'],
       ['Tempo Ativo',`${sessao.ativo_min||0} min`,'#059669'],
       ['Tempo Ocioso',`${sessao.ocioso_min||0} min`,'#d97706'],
       ['Eventos',String(sessao.total_eventos||0),'#2BBCB3']
      ].forEach(([l,v,c])=>{
        ss.appendChild(h('div',{style:{flex:'1',minWidth:'100px',padding:'10px',background:'white',borderRadius:'8px',textAlign:'center',border:'1px solid var(--border)'}},
          h('div',{style:{fontSize:'16px',fontWeight:'700',color:c}},v),
          h('div',{style:{fontSize:'9px',fontWeight:'600',textTransform:'uppercase',color:'#94a3b8',marginTop:'2px'}},l)));
      });
      wrap.appendChild(ss);
    }

    if(!timeline||!timeline.length){wrap.appendChild(h('div',{className:'empty-state'},'Nenhum evento'));return}

    // Timeline
    const tl=h('div',{style:{position:'relative',paddingLeft:'24px',borderLeft:'2px solid var(--border)'}});

    const acaoColors={login:'#059669',login_falha:'#dc2626',logout:'#64748b',navegacao:'#94a3b8',retirada:'#d97706',criar:'#2563eb',criar_pendente:'#7c3aed',editar:'#7c3aed',excluir:'#dc2626',aprovar:'#059669',reprovar:'#dc2626',descarte:'#dc2626',estorno:'#d97706'};
    const acaoIcons={login:'🔑',login_falha:'🚫',logout:'🚪',navegacao:'📄',retirada:'💉',criar:'➕',criar_pendente:'⏳',editar:'✏️',excluir:'🗑️',aprovar:'✅',reprovar:'❌',descarte:'🗑️',estorno:'↩️'};
    const criticas=['retirada','descarte','estorno','aprovar','reprovar','excluir','criar_pendente'];

    timeline.forEach(e=>{
      const color=acaoColors[e.acao]||'#94a3b8';
      const icon=acaoIcons[e.acao]||'📌';
      const isCrit=criticas.includes(e.acao);

      const ev=h('div',{style:{position:'relative',marginBottom:'8px',marginLeft:'12px'}});

      // Dot on timeline
      ev.appendChild(h('div',{style:{position:'absolute',left:'-30px',top:'12px',width:'12px',height:'12px',borderRadius:'50%',background:color,border:'2px solid white',boxShadow:'0 0 0 2px '+color+'40'}}));

      // Idle gap indicator
      if(e.gap_seconds&&e.gap_seconds>120){
        const gapMin=Math.round(e.gap_seconds/60);
        ev.appendChild(h('div',{style:{fontSize:'10px',color:'#d97706',fontWeight:'600',marginBottom:'4px',fontStyle:'italic'}},`⏸ ${gapMin} min ocioso`));
      }

      const card=h('div',{style:{padding:'12px 16px',background:isCrit?'#fefce8':'white',borderRadius:'10px',border:`1px solid ${isCrit?'#fcd34d':'var(--border)'}`,fontSize:'13px'}});

      // Top row: time + action + entity
      const top=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}});
      const hora=e.hora?new Date(e.hora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—';
      top.appendChild(h('div',{style:{display:'flex',gap:'6px',alignItems:'center'}},
        h('span',{style:'font-size:16px'},icon),
        h('span',{className:'mono',style:`font-weight:700;color:${color}`},hora),
        h('span',{style:`padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:white;background:${color}`},e.acao.toUpperCase().replace(/_/g,' ')),
        e.entidade?h('span',{className:'badge badge-gray',style:'font-size:10px'},e.entidade):'',
        e.entidade_id?h('span',{className:'mono',style:'font-size:10px;color:#94a3b8'},`#${e.entidade_id}`):''));
      top.appendChild(h('div',{style:{display:'flex',gap:'6px',alignItems:'center',fontSize:'10px',color:'#94a3b8'}},
        h('span',null,e.device),h('span',null,e.browser),h('span',null,e.os)));
      card.appendChild(top);

      // Details
      if(e.detalhes&&typeof e.detalhes==='object'){
        const det=h('div',{style:{fontSize:'11px',color:'#475569',display:'flex',gap:'8px',flexWrap:'wrap'}});
        Object.entries(e.detalhes).forEach(([k,v])=>{
          if(k==='latitude'||k==='longitude')return;
          det.appendChild(h('span',{style:'background:#f1f5f9;padding:2px 6px;border-radius:4px'},`${k}: ${v}`));
        });
        card.appendChild(det);
      }

      // IP + Route
      const meta=h('div',{style:{fontSize:'10px',color:'#cbd5e1',marginTop:'4px',display:'flex',gap:'12px'}});
      if(e.ip)meta.appendChild(h('span',null,`IP: ${e.ip}`));
      if(e.rota)meta.appendChild(h('span',null,`Rota: ${e.rota}`));
      if(e.sessao_id)meta.appendChild(h('span',null,`Sessão: ${e.sessao_id.slice(0,8)}`));
      card.appendChild(meta);

      // Map link if coordinates
      if(e.latitude&&e.longitude){
        const mapLink=h('a',{href:`https://www.google.com/maps?q=${e.latitude},${e.longitude}`,target:'_blank',style:'font-size:11px;color:var(--primary);text-decoration:none;display:flex;align-items:center;gap:4px;margin-top:4px'});
        mapLink.textContent=`📍 Ver no mapa (${e.latitude.toFixed(4)}, ${e.longitude.toFixed(4)})`;
        card.appendChild(mapLink);
      }

      ev.appendChild(card);tl.appendChild(ev);
    });
    wrap.appendChild(tl);
  }

  await draw();return wrap;
}
