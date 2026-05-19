// ════════════════════════════════════════════════════════════════
// ⚡ CENTRAL DE VENDAS RÁPIDAS — VittaSys
// Foco: velocidade, PDV, WhatsApp, sem burocracia
// ════════════════════════════════════════════════════════════════
async function renderVendas() {
  const wrap = h('div', { className: 'fade-in', style: 'height:100%' });
  let _produtos = null;

  const R = v => 'R$\u00a0' + Number(v||0).toFixed(2).replace('.',',');
  const COM_RATE = 0.01;
  const COM_GRIPE = 10;
  const isGripe = n => /INFLUEN|GRIPE/i.test(n||'');
  const calcCom = items => items.reduce((s,i)=>{
    const base = (i.valor||0)*(i.qty||1)*COM_RATE;
    const bonus = isGripe(i.nome) ? COM_GRIPE*(i.qty||1) : 0;
    return s+base+bonus;
  },0);

  async function prods() {
    if (!_produtos) _produtos = await Api.vendasProdutos().catch(()=>({vacinas:[],planos:[]}));
    return _produtos;
  }

  // ── TELA PRINCIPAL ─────────────────────────────────────────────
  async function drawHome() {
    wrap.innerHTML='';
    await prods();

    // Top bar
    const top = h('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:20px'});
    top.appendChild(h('div',null,
      h('h1',{className:'page-title',style:'margin:0;font-size:22px'},'⚡ Central de Vendas'),
      h('p',{className:'page-subtitle',style:'margin:4px 0 0'},'Rápido como o WhatsApp')
    ));
    const btnNova = h('button',{className:'btn btn-primary',
      style:'font-size:15px;padding:13px 24px;font-weight:800;border-radius:12px;display:flex;align-items:center;gap:8px',
      onClick:()=>openVenda()});
    btnNova.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>Nova Venda';
    top.appendChild(btnNova);
    wrap.appendChild(top);

    // Comissão do mês
    let comMes=0, vendasMes=0;
    try {
      const mes = new Date().toISOString().slice(0,7);
      const c = await Api.vendasComissao({vendedor_id:AppState.usuario?.id, mes});
      comMes=c?.total_comissao||0; vendasMes=c?.planos?.length||0;
    }catch(e){}

    // Cards rápidos
    const cards = h('div',{style:'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px'});
    const mkC=(ico,lbl,val,bg,cor)=>{
      const c=h('div',{style:`padding:18px 16px;background:${bg};border-radius:14px;border:1px solid ${cor}20`});
      c.innerHTML=`<div style="font-size:11px;font-weight:700;color:${cor};text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">${ico} ${lbl}</div><div style="font-size:26px;font-weight:900;color:${cor}">${val}</div>`;
      return c;
    };
    cards.appendChild(mkC('💰','Comissão do Mês',R(comMes),'#f0fdf4','#16a34a'));
    cards.appendChild(mkC('📋','Vendas no Mês',vendasMes,'#eff6ff','#2563eb'));
    cards.appendChild(mkC('💉','Vacinas Cadastradas',_produtos?.vacinas?.filter(v=>v.valorVendaSugerido>0).length||0,'#f5f3ff','#7c3aed'));
    wrap.appendChild(cards);

    // Vacinas mais vendidas (atalho rápido)
    const destaque = h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px'});
    destaque.appendChild(h('div',{style:'font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px'},'💉 Venda Rápida — Vacinas Mais Comuns'));
    const chips = h('div',{style:'display:flex;flex-wrap:wrap;gap:8px'});
    const favoritas = ['Influen','Pneumo','Meningo','Hexa','Rotavírus','Varicela','HPV','Febre','Hepatite'];
    favoritas.forEach(f=>{
      const vac = _produtos?.vacinas?.find(v=>v.nome.toUpperCase().includes(f.toUpperCase()) && v.valorVendaSugerido>0);
      if(!vac) return;
      const chip = h('button',{
        style:`padding:8px 14px;border-radius:20px;border:1px solid var(--border);background:var(--bg-subtle);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s`,
        onClick:()=>openVendaRapida(vac)
      });
      chip.innerHTML=`💉 ${vac.nome.split('(')[0].trim().slice(0,20)} <span style="color:var(--primary);font-weight:700">${R(vac.valorVendaSugerido)}</span>`;
      chip.addEventListener('mouseenter',()=>chip.style.background='var(--primary-bg)');
      chip.addEventListener('mouseleave',()=>chip.style.background='var(--bg-subtle)');
      chips.appendChild(chip);
    });
    destaque.appendChild(chips);
    wrap.appendChild(destaque);

    // Planos
    const planosBox = h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:16px'});
    planosBox.appendChild(h('div',{style:'font-size:12px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px'},'💎 Planos Vacinais'));
    const planosGrid = h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px'});
    (_produtos?.planos||[]).forEach(p=>{
      const card = h('div',{
        style:'padding:14px;border-radius:10px;border:1px solid var(--border);background:var(--bg-subtle);cursor:pointer;transition:all .15s',
        onClick:()=>openVendaComPlano(p)
      });
      card.innerHTML=`<div style="font-size:13px;font-weight:700;color:var(--text-1)">${esc(p.nome)}</div><div style="font-size:11px;color:var(--text-3);margin:3px 0">👶 ${p.idadeInicio}–${p.idadeFim}m · ${p.vacinas?.length||0} vacinas</div><div style="font-size:17px;font-weight:800;color:var(--primary)">${R(p.valorAvista||0)}</div><div style="font-size:10px;color:#16a34a">💰 comissão: ${R((p.valorAvista||0)*COM_RATE)}</div>`;
      card.addEventListener('mouseenter',()=>card.style.borderColor='var(--primary)');
      card.addEventListener('mouseleave',()=>card.style.borderColor='var(--border)');
      planosGrid.appendChild(card);
    });
    planosBox.appendChild(planosGrid);
    wrap.appendChild(planosBox);
  }

  // ── DRAWER DE VENDA ───────────────────────────────────────────
  function openVenda(planoPresel=null, vacPresel=null) {
    let cliente=null, carrinho=[], pgto='avista', etapa=1;
    if(planoPresel) carrinho=[{tipo:'plano',id:planoPresel.id,nome:planoPresel.nome,valor:planoPresel.valorAvista||0,qty:1}];
    if(vacPresel) carrinho=[{tipo:'vacina',id:vacPresel.id,nome:vacPresel.nome,valor:vacPresel.valorVendaSugerido||0,qty:1}];

    // Drawer lateral
    const overlay = h('div',{style:'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1200;backdrop-filter:blur(2px)',
      onClick:e=>{if(e.target===overlay)fecharDrawer();}});
    const drawer = h('div',{style:'position:fixed;top:0;right:-520px;width:min(520px,100vw);height:100vh;background:var(--bg-card);z-index:1300;box-shadow:-8px 0 32px rgba(0,0,0,.2);display:flex;flex-direction:column;transition:right .25s cubic-bezier(.4,0,.2,1);overflow:hidden'});
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    setTimeout(()=>drawer.style.right='0',10);

    function fecharDrawer(){
      drawer.style.right='-520px';
      setTimeout(()=>{overlay.remove();drawer.remove();},260);
    }

    function render(){
      drawer.innerHTML='';

      // Header drawer
      const dh=h('div',{style:'padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--bg-subtle);flex-shrink:0'});
      // Steps
      const steps=h('div',{style:'display:flex;align-items:center;gap:6px'});
      [{n:1,l:'Cliente'},{n:2,l:'Produtos'},{n:3,l:'Fechar'}].forEach((s,i)=>{
        const done=etapa>s.n, ativo=etapa===s.n;
        const dot=h('div',{style:`width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;background:${done?'#16a34a':ativo?'var(--primary)':'var(--border)'};color:${done||ativo?'white':'var(--text-3)'}`},done?'✓':String(s.n));
        const lbl=h('span',{style:`font-size:11px;font-weight:${ativo?'700':'400'};color:${ativo?'var(--text-1)':'var(--text-3)'}`},s.l);
        steps.appendChild(dot); steps.appendChild(lbl);
        if(i<2) steps.appendChild(h('div',{style:`width:16px;height:2px;background:${etapa>s.n?'#16a34a':'var(--border)'}`,style:'width:16px;height:2px;background:var(--border);flex-shrink:0'}));
      });
      dh.appendChild(steps);
      dh.appendChild(h('button',{style:'border:none;background:none;font-size:20px;cursor:pointer;color:var(--text-3);padding:4px',onClick:fecharDrawer},'✕'));
      drawer.appendChild(dh);

      // Content
      const content=h('div',{style:'flex:1;overflow-y:auto;padding:20px'});

      // ── E1: CLIENTE ───────────────────────────────────────────
      if(etapa===1){
        if(cliente){
          const ok=h('div',{style:'background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'});
          ok.innerHTML=`<div><div style="font-size:14px;font-weight:700;color:#15803d">✓ ${esc(cliente.nome)}</div><div style="font-size:12px;color:#16a34a">${cliente.telefone||'Sem tel'}${cliente.paciente_nome?' · '+esc(cliente.paciente_nome):''}</div></div>`;
          const tr=h('button',{className:'btn btn-ghost btn-sm',onClick:()=>{cliente=null;render()}},'Trocar');
          ok.appendChild(tr); content.appendChild(ok);
          const btn=h('button',{className:'btn btn-primary btn-block',style:'padding:14px;font-size:15px;font-weight:700;border-radius:12px',onClick:()=>{etapa=2;render()}},'Próximo: Produtos →');
          content.appendChild(btn);
        } else {
          content.appendChild(h('div',{style:'font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:12px'},'👤 Quem está comprando?'));
          // Busca
          const inp=h('input',{className:'input',placeholder:'🔍 Buscar por nome, CPF ou telefone...',style:'font-size:15px;margin-bottom:6px;border-radius:10px'});
          content.appendChild(inp);
          const res=h('div',{style:'border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:16px;min-height:40px'});
          content.appendChild(res);
          let db;
          inp.addEventListener('input',e=>{
            clearTimeout(db);
            db=setTimeout(async()=>{
              const q=e.target.value.trim();
              if(q.length<2){res.innerHTML='<div style="padding:12px;text-align:center;color:var(--text-4);font-size:12px">Digite para buscar</div>';return;}
              res.innerHTML='<div style="padding:12px;text-align:center;color:var(--text-3);font-size:12px">Buscando...</div>';
              const r=await Api.get('/clientes',{q,limit:6}).catch(()=>({}));
              res.innerHTML='';
              const list=r?.clientes||[];
              if(!list.length){res.innerHTML='<div style="padding:12px;text-align:center;color:var(--text-3);font-size:12px">Nenhum cliente encontrado</div>';return;}
              list.forEach(c=>{
                const row=h('div',{style:'padding:11px 14px;cursor:pointer;border-bottom:1px solid var(--border)',onClick:()=>{
                  cliente={id:c.id,nome:c.nome,telefone:c.telefone,paciente_nome:c.paciente_nome,data_nascimento:c.pacienteNascimento||c.dataNascimento};
                  etapa=2;render();
                }});
                row.addEventListener('mouseenter',()=>row.style.background='var(--bg-subtle)');
                row.addEventListener('mouseleave',()=>row.style.background='');
                row.innerHTML=`<div style="font-weight:600;font-size:13px">${esc(c.nome)}</div><div style="font-size:11px;color:var(--text-3)">${c.telefone||''}${c.paciente_nome?' · '+esc(c.paciente_nome):''}</div>`;
                res.appendChild(row);
              });
            },300);
          });
          setTimeout(()=>inp.focus(),150);

          // Separador
          const sep=h('div',{style:'display:flex;align-items:center;gap:8px;margin-bottom:14px'});
          sep.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
          sep.appendChild(h('span',{style:'font-size:11px;color:var(--text-4)'},'ou novo cliente'));
          sep.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
          content.appendChild(sep);

          // Form enxuto
          const fd={};
          const mkF=(ph,key,type='text',im='text',full=false)=>{
            const i=h('input',{className:'input',placeholder:ph,type,inputMode:im,style:`font-size:14px;border-radius:10px;${full?'margin-bottom:8px':''}`});
            i.addEventListener('input',e=>fd[key]=e.target.value);
            return i;
          };
          const g=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px'});
          const nInp=mkF('* Nome do responsável','nome');
          nInp.style.gridColumn='1/-1';
          content.appendChild(nInp);
          const telInp=mkF('WhatsApp','telefone','tel','tel');
          const nascInp=mkF('Nasc. paciente (DD/MM/AAAA)','data_nascimento');
          const pacInp=mkF('Nome do paciente','paciente_nome');
          g.appendChild(telInp); g.appendChild(nascInp);
          content.appendChild(g);
          content.appendChild(pacInp);
          content.appendChild(h('div',{style:'height:12px'}));

          content.appendChild(h('button',{className:'btn btn-primary btn-block',style:'padding:13px;font-size:14px;font-weight:700;border-radius:12px',onClick:()=>{
            if(!fd.nome?.trim())return Toast.show('Nome obrigatório','error');
            let dn=null;
            if(fd.data_nascimento){const[d,m,a]=fd.data_nascimento.split('/');if(a&&m&&d)dn=`${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;}
            cliente={nome:fd.nome.trim(),telefone:fd.telefone,paciente_nome:fd.paciente_nome,data_nascimento:dn};
            etapa=2;render();
          }},'Salvar e continuar →'));
        }
      }

      // ── E2: PRODUTOS ──────────────────────────────────────────
      if(etapa===2){
        // Search rápido
        const srch=h('input',{className:'input',placeholder:'🔍 Buscar vacina ou plano...',style:'font-size:14px;border-radius:10px;margin-bottom:14px'});
        let filtro='';
        srch.addEventListener('input',e=>{filtro=e.target.value.toLowerCase();renderProd();});
        content.appendChild(srch);
        setTimeout(()=>srch.focus(),100);

        // Categorias tabs
        let tabV='planos';
        const tabs=h('div',{style:'display:flex;background:var(--bg-subtle);border-radius:10px;padding:3px;margin-bottom:12px'});
        const mkT=(l,v)=>{
          const t=h('button',{style:`flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s`,
            onClick:()=>{tabV=v;renderProd();}});
          t.dataset.tab=v; return t;
        };
        const tPlano=mkT('💎 Planos','planos'); const tVac=mkT('💉 Vacinas','vacinas');
        tabs.appendChild(tPlano); tabs.appendChild(tVac);
        content.appendChild(tabs);
        const lista=h('div',{style:'display:flex;flex-direction:column;gap:6px'});
        content.appendChild(lista);

        function renderProd(){
          tPlano.style.background=tabV==='planos'?'var(--bg-card)':'transparent';
          tPlano.style.color=tabV==='planos'?'var(--primary)':'var(--text-3)';
          tVac.style.background=tabV==='vacinas'?'var(--bg-card)':'transparent';
          tVac.style.color=tabV==='vacinas'?'var(--primary)':'var(--text-3)';
          lista.innerHTML='';
          if(tabV==='planos'){
            (_produtos?.planos||[]).filter(p=>!filtro||p.nome.toLowerCase().includes(filtro)).forEach(p=>{
              const sel=carrinho.find(c=>c.id===p.id&&c.tipo==='plano');
              const row=h('div',{style:`display:flex;justify-content:space-between;align-items:center;padding:13px 14px;border-radius:10px;border:2px solid ${sel?'var(--primary)':'var(--border)'};background:${sel?'var(--primary-bg)':'var(--bg-card)'};cursor:pointer;transition:all .15s`,
                onClick:()=>{
                  if(sel)carrinho=carrinho.filter(c=>!(c.id===p.id&&c.tipo==='plano'));
                  else carrinho.push({tipo:'plano',id:p.id,nome:p.nome,valor:p.valorAvista||0,qty:1});
                  renderProd();updateFooter();
                }});
              row.innerHTML=`<div><div style="font-size:13px;font-weight:700;color:var(--text-1)">${esc(p.nome)}</div><div style="font-size:11px;color:var(--text-3)">👶 ${p.idadeInicio}–${p.idadeFim}m · ${p.vacinas?.length||0} vacinas</div></div><div style="text-align:right"><div style="font-size:16px;font-weight:800;color:${sel?'var(--primary)':'var(--text-1)'}">${R(p.valorAvista||0)}</div><div style="font-size:10px;color:#16a34a">💰 ${R((p.valorAvista||0)*COM_RATE)}</div>${sel?'<div style="font-size:11px;color:var(--primary);font-weight:700">✓</div>':''}</div>`;
              lista.appendChild(row);
            });
          } else {
            (_produtos?.vacinas||[]).filter(v=>v.valorVendaSugerido>0&&(!filtro||v.nome.toLowerCase().includes(filtro))).forEach(v=>{
              const sel=carrinho.find(c=>c.id===v.id&&c.tipo==='vacina');
              const ehG=isGripe(v.nome);
              const row=h('div',{style:`display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-radius:10px;border:2px solid ${sel?'var(--primary)':'var(--border)'};background:${sel?'var(--primary-bg)':'var(--bg-card)'};cursor:pointer;transition:all .15s`,
                onClick:()=>{
                  if(sel)carrinho=carrinho.filter(c=>!(c.id===v.id&&c.tipo==='vacina'));
                  else carrinho.push({tipo:'vacina',id:v.id,nome:v.nome,valor:v.valorVendaSugerido,qty:1,ehGripe:ehG});
                  renderProd();updateFooter();
                }});
              row.innerHTML=`<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(v.nome)}</div>${ehG?'<div style="font-size:9px;background:#fef9c3;color:#854d0e;display:inline-block;padding:1px 6px;border-radius:6px;font-weight:700;margin-top:2px">+R$10 bônus</div>':''}</div><div style="text-align:right;flex-shrink:0;margin-left:8px"><div style="font-size:15px;font-weight:700;color:${sel?'var(--primary)':'var(--text-1)'}">${R(v.valorVendaSugerido)}</div>${sel?'<div style="font-size:10px;color:var(--primary);font-weight:700">✓</div>':''}</div>`;
              lista.appendChild(row);
            });
          }
        }
        renderProd();
      }

      // ── E3: FECHAR ────────────────────────────────────────────
      if(etapa===3){
        const tot=carrinho.reduce((s,i)=>s+(i.valor||0)*(i.qty||1),0);
        const com=calcCom(carrinho);

        content.appendChild(h('div',{style:'font-size:14px;font-weight:700;margin-bottom:14px'},'✅ Resumo da Venda'));

        const cliBox=h('div',{style:'background:var(--bg-subtle);border-radius:10px;padding:13px;margin-bottom:12px'});
        cliBox.innerHTML=`<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">👤 Cliente</div><div style="font-size:14px;font-weight:600">${esc(cliente.nome)}</div>${cliente.paciente_nome?`<div style="font-size:12px;color:var(--text-3)">${esc(cliente.paciente_nome)}</div>`:''}`;
        content.appendChild(cliBox);

        const iBox=h('div',{style:'border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:12px'});
        carrinho.forEach(i=>{
          const r=h('div',{style:'display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px'});
          r.appendChild(h('span',{style:'color:var(--text-1)'},esc(i.nome)));
          r.appendChild(h('strong',null,R(i.valor*(i.qty||1))));
          iBox.appendChild(r);
        });
        content.appendChild(iBox);

        // Pagamento
        const pgRow=h('div',{style:'display:flex;gap:6px;margin-bottom:12px'});
        ['avista','cartao','pix'].forEach(fp=>{
          const l={avista:'💵 À Vista',cartao:'💳 Cartão',pix:'📱 PIX'}[fp];
          pgRow.appendChild(h('button',{
            className:`btn btn-sm ${pgto===fp?'btn-primary':'btn-outline'}`,
            style:'flex:1;font-size:11px',
            onClick:()=>{pgto=fp;render();}
          },l));
        });
        content.appendChild(pgRow);

        const totBox=h('div',{style:'background:var(--bg-subtle);border-radius:10px;padding:14px;margin-bottom:14px'});
        totBox.innerHTML=`
          <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;margin-bottom:10px">
            <span>Total</span><span style="color:var(--primary)">${R(tot)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac">
            <span style="font-size:13px;font-weight:700;color:#16a34a">💰 Sua Comissão</span>
            <span style="font-size:22px;font-weight:900;color:#16a34a">${R(com)}</span>
          </div>
        `;
        content.appendChild(totBox);

        const btnConf=h('button',{className:'btn btn-primary btn-block',style:'padding:15px;font-size:15px;font-weight:800;border-radius:12px',onClick:async()=>{
          btnConf.disabled=true;btnConf.textContent='⏳ Registrando...';
          const r=await Api.vendasFechar({
            cliente:{id:cliente.id,nome:cliente.nome,telefone:cliente.telefone,paciente_nome:cliente.paciente_nome},
            data_nascimento_paciente:cliente.data_nascimento,
            itens:carrinho.map(i=>({tipo:i.tipo,id:i.id,nome:i.nome,valor:i.valor*(i.qty||1)})),
            forma_pagamento:pgto,vendedor_id:AppState.usuario?.id
          }).catch(()=>null);
          if(r?.success){fecharDrawer();Toast.show(`✅ Venda fechada! 💰 Comissão: ${R(r.comissao_total||com)}`);drawHome();}
          else{Toast.show(r?.error||'Erro ao registrar','error');btnConf.disabled=false;btnConf.textContent='✓ Confirmar Venda';}
        }},'✓ Confirmar Venda');
        content.appendChild(btnConf);
      }

      drawer.appendChild(content);

      // Footer fixo com carrinho + navegação
      function updateFooter(){
        footer.innerHTML='';
        const tot=carrinho.reduce((s,i)=>s+(i.valor||0)*(i.qty||1),0);
        const com=calcCom(carrinho);
        if(etapa===2){
          footer.style.display='block';
          const sumRow=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px'});
          sumRow.innerHTML=`<span style="font-size:12px;color:var(--text-3)">${carrinho.length} item${carrinho.length!==1?'s':''} · <span style="color:#16a34a;font-weight:600">💰 ${R(com)}</span></span><span style="font-size:16px;font-weight:800;color:var(--primary)">${R(tot)}</span>`;
          footer.appendChild(sumRow);
          const nav=h('div',{style:'display:grid;grid-template-columns:1fr 2fr;gap:8px'});
          nav.appendChild(h('button',{className:'btn btn-outline',onClick:()=>{etapa=1;render();}},'← Voltar'));
          const btn=h('button',{className:'btn btn-primary',style:`padding:12px;font-size:14px;font-weight:700;opacity:${carrinho.length?1:0.5}`,
            onClick:()=>{if(carrinho.length){etapa=3;render();}else Toast.show('Adicione um produto','error');}
          },carrinho.length?`Fechar Venda →`:'Selecione um produto');
          nav.appendChild(btn);
          footer.appendChild(nav);
        } else if(etapa===1||etapa===3){
          footer.style.display=etapa===3?'none':'none';
        }
      }

      const footer=h('div',{style:'padding:14px 20px;border-top:1px solid var(--border);background:var(--bg-card);flex-shrink:0'});
      drawer.appendChild(footer);
      updateFooter();
    }

    render();
  }

  function openVendaRapida(vac){ openVenda(null,vac); }
  function openVendaComPlano(plano){ openVenda(plano,null); }

  await drawHome();
  return wrap;
}
