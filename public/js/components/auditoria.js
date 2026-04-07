async function renderAuditoria(){
  let f={page:1,limit:50,search:'',acao:'',entidade:'',usuario_id:'',from:'',to:''};
  const wrap=h('div',{className:'fade-in'});

  async function draw(){
    wrap.innerHTML='';
    // Header
    wrap.appendChild(h('div',{className:'page-header'},h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'🔒 Auditoria'),
      h('p',{className:'page-subtitle'},'Trilha completa de eventos do sistema — somente master'))));

    // Stats cards
    const stats=await Api.auditoriaStats()||{};
    const sr=h('div',{className:'stats-row',style:{display:'flex',gap:'12px',marginBottom:'20px',flexWrap:'wrap'}});
    [['Total Eventos',stats.total||0,'#1B4965'],['Hoje',stats.hoje||0,'#2BBCB3'],['Logins Hoje',stats.logins_hoje||0,'#059669'],['Ações Críticas',stats.acoes_criticas||0,'#dc2626']].forEach(([l,v,c])=>{
      sr.appendChild(h('div',{style:{flex:'1',minWidth:'140px',padding:'16px',background:'white',borderRadius:'12px',boxShadow:'0 1px 3px #0001',borderLeft:`4px solid ${c}`}},
        h('div',{style:{fontSize:'28px',fontWeight:'800',color:c}},String(v)),
        h('div',{style:{fontSize:'11px',fontWeight:'600',textTransform:'uppercase',color:'#64748b',marginTop:'4px'}},l)));
    });
    wrap.appendChild(sr);

    // Filters
    const fb=h('div',{className:'filters-bar',style:{flexWrap:'wrap'}});
    fb.appendChild(buildSearchBox('Buscar por usuário, detalhes, rota...',v=>{f.search=v;f.page=1;draw()},f.search));
    fb.appendChild(buildSelect([['','Ação'],['login','Login'],['login_falha','Login Falha'],['retirada','Retirada'],['criar','Criar'],['editar','Editar'],['excluir','Excluir'],['aprovar','Aprovar'],['reprovar','Reprovar'],['descarte','Descarte'],['estorno','Estorno']],f.acao,v=>{f.acao=v;f.page=1;draw()}));
    fb.appendChild(buildSelect([['','Entidade'],['movimentacao','Movimentação'],['cliente','Cliente'],['plano','Plano'],['lote','Lote'],['vacina','Vacina'],['unidade','Unidade']],f.entidade,v=>{f.entidade=v;f.page=1;draw()}));
    // Date range
    const dFrom=h('input',{className:'input',type:'date',value:f.from,style:'width:140px',title:'De'});
    dFrom.addEventListener('change',e=>{f.from=e.target.value;f.page=1;draw()});
    fb.appendChild(dFrom);
    const dTo=h('input',{className:'input',type:'date',value:f.to,style:'width:140px',title:'Até'});
    dTo.addEventListener('change',e=>{f.to=e.target.value;f.page=1;draw()});
    fb.appendChild(dTo);
    wrap.appendChild(fb);

    // Data
    const data=await Api.auditoriaLogs(f);
    if(!data||!data.data){wrap.appendChild(h('div',{className:'empty-state'},'Erro ao carregar'));return}

    if(!data.data.length){
      wrap.appendChild(h('div',{className:'empty-state',style:{padding:'40px'}},
        h('div',{style:{fontSize:'36px',marginBottom:'12px'}},'📋'),
        h('div',{style:{fontSize:'16px',fontWeight:'600'}},'Nenhum evento encontrado'),
        h('div',{style:{fontSize:'13px',color:'var(--text-3)',marginTop:'6px'}},'Ajuste os filtros ou aguarde ações no sistema')));
      return;
    }

    // Timeline
    const tl=h('div',{style:{display:'flex',flexDirection:'column',gap:'2px'}});

    data.data.forEach(log=>{
      const acaoColors={login:'#059669',login_falha:'#dc2626',retirada:'#d97706',criar:'#2563eb',editar:'#7c3aed',excluir:'#dc2626',aprovar:'#059669',reprovar:'#dc2626',descarte:'#dc2626',estorno:'#d97706'};
      const acaoIcons={login:'🔑',login_falha:'🚫',retirada:'💉',criar:'➕',editar:'✏️',excluir:'🗑️',aprovar:'✅',reprovar:'❌',descarte:'🗑️',estorno:'↩️'};
      const color=acaoColors[log.acao]||'#64748b';
      const icon=acaoIcons[log.acao]||'📌';

      const row=h('div',{style:{display:'flex',gap:'12px',padding:'12px 16px',background:'white',borderRadius:'10px',borderLeft:`3px solid ${color}`,marginBottom:'4px',fontSize:'13px',alignItems:'flex-start'}});

      // Time column
      row.appendChild(h('div',{style:{width:'80px',flexShrink:'0',textAlign:'right'}},
        h('div',{className:'mono',style:{fontSize:'12px',fontWeight:'600',color}},fmtDataHora(log.criado_em).split(' ')[1]||''),
        h('div',{className:'mono',style:{fontSize:'10px',color:'#94a3b8'}},fmtDataHora(log.criado_em).split(' ')[0]||'')));

      // Icon
      row.appendChild(h('div',{style:{fontSize:'18px',width:'28px',textAlign:'center',flexShrink:'0'}},icon));

      // Content
      const content=h('div',{style:{flex:'1',minWidth:'0'}});
      content.appendChild(h('div',{style:{display:'flex',gap:'6px',alignItems:'center',flexWrap:'wrap'}},
        h('span',{style:{fontWeight:'700',color}},log.acao.toUpperCase().replace('_',' ')),
        log.entidade?h('span',{className:'badge badge-gray',style:'font-size:10px'},log.entidade):'',
        log.entidade_id?h('span',{className:'mono text-muted',style:'font-size:11px'},`#${log.entidade_id}`):''));

      // User
      if(log.usuario_nome){
        content.appendChild(h('div',{style:{fontSize:'12px',color:'#64748b',marginTop:'2px'}},
          `${esc(log.usuario_nome)} ${log.perfil?'('+log.perfil+')':''}`));
      }

      // Details
      if(log.detalhes){
        const det=typeof log.detalhes==='string'?JSON.parse(log.detalhes):log.detalhes;
        const detText=Object.entries(det).map(([k,v])=>`${k}: ${v}`).join(' · ');
        content.appendChild(h('div',{style:{fontSize:'11px',color:'#94a3b8',marginTop:'2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'500px'},title:detText},detText));
      }

      // IP + User Agent
      if(log.ip||log.user_agent){
        const ua=log.user_agent||'';
        const browser=ua.includes('Chrome')?'Chrome':ua.includes('Firefox')?'Firefox':ua.includes('Safari')?'Safari':'—';
        content.appendChild(h('div',{style:{fontSize:'10px',color:'#cbd5e1',marginTop:'2px'}},
          `IP: ${log.ip||'—'} · ${browser}`));
      }

      row.appendChild(content);
      tl.appendChild(row);
    });

    wrap.appendChild(tl);

    // Pagination
    if(data.pagination){
      wrap.appendChild(buildPagination(data.pagination,p=>{f.page=p;draw()}));
    }
  }

  await draw();return wrap;
}
