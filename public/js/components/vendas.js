// ════════════════════════════════════════════════════════════════
// ⚡ CENTRAL DE VENDAS — VittaSys  
// PDV rápido, WhatsApp-ready, carrinho fixo
// ════════════════════════════════════════════════════════════════
async function renderVendas() {
  const W = h('div', { className:'fade-in' });


  // ── Máscaras e validações ──────────────────────────────────
  const maskCPF = v => v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  const maskTel = v => { const n=v.replace(/\D/g,'').slice(0,11); if(n.length<=2)return '('+n; if(n.length<=6)return '('+n.slice(0,2)+') '+n.slice(2); if(n.length<=10)return '('+n.slice(0,2)+') '+n.slice(2,6)+'-'+n.slice(6); return '('+n.slice(0,2)+') '+n.slice(2,7)+'-'+n.slice(7); };
  const maskDate = v => { const n=v.replace(/\D/g,'').slice(0,8); if(n.length<=2)return n; if(n.length<=4)return n.slice(0,2)+'/'+n.slice(2); return n.slice(0,2)+'/'+n.slice(2,4)+'/'+n.slice(4); };
  const validCPF = v => { const n=v.replace(/\D/g,''); if(n.length!==11||/^(\d)\1+$/.test(n))return false; let s=0; for(let i=0;i<9;i++)s+=+n[i]*(10-i); let r=11-s%11; const d1=r>9?0:r; s=0; for(let i=0;i<10;i++)s+=+n[i]*(11-i); r=11-s%11; return d1===+n[9]&&(r>9?0:r)===+n[10]; };
  const parseDate = v => { const[d,m,a]=v.split('/'); if(!a||!m||!d)return null; const dt=new Date(+a,+m-1,+d); return isNaN(dt)?null:dt; };

  // ── Estado global da sessão de venda ─────────────────────────
  let _prods = null;
  let cliente = null;
  let carrinho = []; // [{tipo,id,nome,valor,qty,ehGripe,estoque}]
  let pgto = 'avista';
  let descontoVal = 0; // valor em R$
  let tabAtiva = 'vacinas'; // 'vacinas' | 'pacotes' | 'planos'

  const R = v => 'R$\u00a0' + Number(v||0).toFixed(2).replace('.',',');
  const COM = 0.01;
  const COM_GRIPE_BONUS = 10;
  const isGripe = n => /INFLUEN|GRIPE/i.test(n||'');
  const comItem = i => (i.valor*(i.qty||1)*COM) + (isGripe(i.nome)?(i.qty||1)*COM_GRIPE_BONUS:0);
  const comTotal = () => carrinho.reduce((s,i)=>s+comItem(i),0);
  const subtotal = () => carrinho.reduce((s,i)=>s+(i.valor||0)*(i.qty||1),0);
  const total = () => Math.max(0, subtotal() - descontoVal);

  async function getProdos() {
    if(!_prods) _prods = await Api.vendasProdutos().catch(()=>({vacinas:[],planos:[]}));
    return _prods;
  }

  // Pacotes por faixa etária (padrão vacinação Brasil)
  // Pacotes baseados no PDF comercial Vittalis Saúde — Plano 0-9 meses
  const PACOTES = [
    { id:'pkg2', label:'👶 2 meses', meses:2,
      nomes:['Hexacelular','Hexavalente','Hexaxim','Rotavírus','Rotavirus','Pneumo.*20','20-val','Meningoc.*B','Bexsero'] },
    { id:'pkg3', label:'👶 3 meses', meses:3,
      nomes:['Meningoc.*B','Bexsero','ACWY','Nimenrix'] },
    { id:'pkg4', label:'👶 4 meses', meses:4,
      nomes:['Pentacelular','Pentavalente','Hexacelular','Hexaxim','Rotavírus','Rotavirus','Pneumo.*20','20-val'] },
    { id:'pkg5', label:'👶 5 meses', meses:5,
      nomes:['Meningoc.*B','Bexsero','ACWY','Nimenrix'] },
    { id:'pkg6', label:'👶 6 meses', meses:6,
      nomes:['Pentacelular','Pentavalente','Hexacelular','Hexaxim','Rotavírus','Rotavirus','Pneumo.*20','20-val','Influen'] },
    { id:'pkg7', label:'👶 7 meses', meses:7,
      nomes:['Influen'] },
    { id:'pkg9', label:'👶 9 meses', meses:9,
      nomes:['Febre.*Amarela','Stamaril'] },
    { id:'pkg12', label:'👶 12 meses', meses:12,
      nomes:['Tríplice.*Viral','Triple.*Viral','Hepatite.*A','Varicela','Varivax'] },
  ];

  function vacinasDoPacote(pkg) {
    if(!_prods?.vacinas) return [];
    return pkg.nomes.flatMap(pat => {
      const re = new RegExp(pat,'i');
      return _prods.vacinas.filter(v=>re.test(v.nome)&&(v.valorVendaSugerido||0)>0).slice(0,1);
    }).filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i);
  }

  function addToCart(vac) {
    const ex = carrinho.find(c=>c.id===vac.id&&c.tipo==='vacina');
    if(ex) ex.qty=(ex.qty||1)+1;
    else carrinho.push({tipo:'vacina',id:vac.id,nome:vac.nome,valor:vac.valorVendaSugerido||0,qty:1,ehGripe:isGripe(vac.nome)});
    renderCart();
  }
  function addPacote(pkg) {
    const vacs = vacinasDoPacote(pkg);
    if(!vacs.length){Toast.show('Nenhuma vacina deste pacote no sistema','error');return;}
    vacs.forEach(v=>{
      const ex=carrinho.find(c=>c.id===v.id&&c.tipo==='vacina');
      if(ex) ex.qty=(ex.qty||1)+1;
      else carrinho.push({tipo:'vacina',id:v.id,nome:v.nome,valor:v.valorVendaSugerido||0,qty:1,ehGripe:isGripe(v.nome)});
    });
    Toast.show(`${pkg.label}: ${vacs.length} vacina${vacs.length!==1?'s':''} adicionada${vacs.length!==1?'s':''}`);
    renderCart();
  }
  function removeFromCart(item){
    carrinho=carrinho.filter(c=>c!==item); renderCart();
  }

  // ── LAYOUT PRINCIPAL ─────────────────────────────────────────
  async function draw() {
    W.innerHTML='';
    await getProdos();

    // TOPO: busca de cliente + header
    const topBar = h('div',{style:'display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap'});
    const titleEl = h('div',{style:'flex-shrink:0'});
    titleEl.innerHTML='<h1 style="font-size:20px;font-weight:800;margin:0;color:var(--text-1)">⚡ Central de Vendas</h1>';
    topBar.appendChild(titleEl);

    // Busca cliente (barra persistente no topo)
    const searchWrap = h('div',{style:'flex:1;min-width:200px;max-width:440px;position:relative'});
    const searchInp = h('input',{className:'input',placeholder:'🔍 Buscar cliente por nome, CPF, telefone...',style:'font-size:14px;padding-left:12px;border-radius:10px;width:100%'});
    const searchRes = h('div',{style:'position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.1);z-index:200;max-height:240px;overflow-y:auto;display:none'});
    searchWrap.appendChild(searchInp);
    searchWrap.appendChild(searchRes);
    let sdb;
    searchInp.addEventListener('input',e=>{
      clearTimeout(sdb);
      const q=e.target.value.trim();
      if(q.length<2){searchRes.style.display='none';return;}
      sdb=setTimeout(async()=>{
        searchRes.style.display='block';
        searchRes.innerHTML='<div style="padding:10px;color:var(--text-3);font-size:12px">Buscando...</div>';
        const r=await Api.vendasBuscarCliente(q).catch(()=>({clientes:[]}));
        searchRes.innerHTML='';
        const list=r?.clientes||[];
        if(!list.length){searchRes.innerHTML='<div style="padding:12px;color:var(--text-3);font-size:12px;text-align:center">Nenhum encontrado — cadastre abaixo</div>';return;}
        list.forEach(c=>{
          const row=h('div',{style:'padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border)',
            onClick:()=>{
              cliente={id:c.id,nome:c.nome,telefone:c.telefone,paciente_nome:c.paciente_nome,
                data_nascimento:c.paciente_nascimento||c.data_nascimento};
              searchInp.value=''; searchRes.style.display='none';
              renderCart(); Toast.show(`✓ ${c.nome} selecionado`);
            }});
          row.addEventListener('mouseenter',()=>row.style.background='var(--bg-subtle)');
          row.addEventListener('mouseleave',()=>row.style.background='');
          row.innerHTML=`<div style="font-weight:600;font-size:13px">${esc(c.nome)}</div><div style="font-size:11px;color:var(--text-3)">${c.telefone||''}${c.paciente_nome?' · 👶 '+esc(c.paciente_nome):''}</div>`;
          searchRes.appendChild(row);
        });
      },280);
    });
    document.addEventListener('click',e=>{if(!searchWrap.contains(e.target))searchRes.style.display='none';});
    topBar.appendChild(searchWrap);

    // Botão cadastrar cliente
    const btnNewCli = h('button',{className:'btn btn-outline btn-sm',style:'white-space:nowrap',onClick:()=>modalCadCliente()},
      cliente?`👤 ${esc(cliente.nome.split(' ')[0])}`:'+ Novo Cliente');
    if(cliente) btnNewCli.style.borderColor='var(--primary)';
    topBar.appendChild(btnNewCli);

    W.appendChild(topBar);

    // GRID: produtos | carrinho
    const grid = h('div',{style:'display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start'});

    // ── COLUNA ESQUERDA: produtos ─────────────────────────────
    const left = h('div');

    // Atalhos por idade
    const ataGrid = h('div',{style:'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px'});
    PACOTES.forEach(pkg=>{
      const btn = h('button',{
        style:'padding:8px 14px;border-radius:20px;border:1px solid var(--border);background:var(--bg-card);font-size:12px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:80px',
        onClick:()=>addPacote(pkg)
      });
      const vacs=vacinasDoPacote(pkg);
      btn.innerHTML=`<span>${pkg.label}</span><span style="font-size:10px;color:var(--text-3)">${vacs.length} vacina${vacs.length!==1?'s':''}</span>`;
      btn.addEventListener('mouseenter',()=>{btn.style.background='var(--primary-bg)';btn.style.borderColor='var(--primary)';});
      btn.addEventListener('mouseleave',()=>{btn.style.background='var(--bg-card)';btn.style.borderColor='var(--border)';});
      ataGrid.appendChild(btn);
    });
    const ataBox = h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px'});
    ataBox.appendChild(h('div',{style:'font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px'},'⚡ Atalhos Rápidos por Idade'));
    ataBox.appendChild(ataGrid);
    left.appendChild(ataBox);

    // TABS
    const tabs = h('div',{style:'display:flex;background:var(--bg-subtle);border-radius:10px;padding:3px;margin-bottom:12px'});
    [['vacinas','💉 Vacinas'],['pacotes','👶 Pacotes'],['planos','💎 Planos']].forEach(([k,l])=>{
      const t=h('button',{
        style:`flex:1;padding:8px 4px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s;background:${tabAtiva===k?'var(--bg-card)':'transparent'};color:${tabAtiva===k?'var(--primary)':'var(--text-3)'}`,
        onClick:()=>{tabAtiva=k;drawProds();}
      },l);
      t.dataset.tab=k; tabs.appendChild(t);
    });
    left.appendChild(tabs);

    const prodsArea = h('div');
    left.appendChild(prodsArea);
    grid.appendChild(left);

    function drawProds() {
      prodsArea.innerHTML='';
      // Update tab styles
      tabs.querySelectorAll('button').forEach(b=>{
        const on=b.dataset.tab===tabAtiva;
        b.style.background=on?'var(--bg-card)':'transparent';
        b.style.color=on?'var(--primary)':'var(--text-3)';
      });

      if(tabAtiva==='vacinas') {
        // Search input
        const si=h('input',{className:'input',placeholder:'🔍 Buscar vacina...',style:'font-size:13px;border-radius:8px;margin-bottom:10px'});
        prodsArea.appendChild(si);
        const vGrid=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px'});
        prodsArea.appendChild(vGrid);

        function renderVacs(filtro='') {
          vGrid.innerHTML='';
          const vacs=(_prods?.vacinas||[]).filter(v=>!filtro||v.nome.toLowerCase().includes(filtro.toLowerCase()));
          if(!vacs.length){vGrid.innerHTML='<div style="padding:20px;color:var(--text-3);font-size:13px;text-align:center;grid-column:1/-1">Nenhuma vacina encontrada</div>';return;}
          vacs.forEach(v=>{
            const inCart=carrinho.find(c=>c.id===v.id&&c.tipo==='vacina');
            const semPreco=!v.valorVendaSugerido||v.valorVendaSugerido===0;
            const card=h('div',{
              style:`padding:12px;border-radius:10px;border:2px solid ${inCart?'var(--primary)':'var(--border)'};background:${inCart?'var(--primary-bg)':'var(--bg-card)'};cursor:${semPreco?'default':'pointer'};opacity:${semPreco?'0.6':'1'};transition:all .15s`,
              onClick:()=>semPreco?Toast.show('Vacina sem preço cadastrado','error'):addToCart(v)
            });
            const ehG=isGripe(v.nome);
            card.innerHTML=`
              <div style="font-size:12px;font-weight:600;color:var(--text-1);line-height:1.3;margin-bottom:4px">${esc(v.nome)}</div>
              ${v.fabricante?`<div style="font-size:10px;color:var(--text-4)">${esc(v.fabricante)}</div>`:''}
              ${semPreco
                ?'<div style="font-size:10px;color:#f59e0b;margin-top:4px">⚠️ Sem preço</div>'
                :`<div style="font-size:15px;font-weight:800;color:${inCart?'var(--primary)':'var(--text-1)'};margin-top:5px">${R(v.valorVendaSugerido)}</div>
                 <div style="font-size:10px;color:#16a34a">💰 ${R(v.valorVendaSugerido*COM)}${ehG?` +${R(COM_GRIPE_BONUS)}`:''}</div>`
              }
              ${inCart?`<div style="font-size:10px;color:var(--primary);font-weight:700;margin-top:3px">✓ ${inCart.qty}x no carrinho</div>`:''}
            `;
            if(!semPreco){
              card.addEventListener('mouseenter',()=>{if(!inCart){card.style.borderColor='var(--primary)';card.style.background='var(--primary-bg)';}});
              card.addEventListener('mouseleave',()=>{if(!inCart){card.style.borderColor='var(--border)';card.style.background='var(--bg-card)';}});
            }
            vGrid.appendChild(card);
          });
        }
        let vdb;
        si.addEventListener('input',e=>{clearTimeout(vdb);vdb=setTimeout(()=>renderVacs(e.target.value),200);});
        renderVacs();
      }

      if(tabAtiva==='pacotes') {
        const pgrid=h('div',{style:'display:flex;flex-direction:column;gap:10px'});
        PACOTES.forEach(pkg=>{
          const vacs=vacinasDoPacote(pkg);
          const tot=vacs.reduce((s,v)=>s+(v.valorVendaSugerido||0),0);
          const card=h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer;transition:all .15s',
            onClick:()=>addPacote(pkg)});
          card.innerHTML=`
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <div><div style="font-size:15px;font-weight:700;color:var(--text-1)">${pkg.label}</div><div style="font-size:11px;color:var(--text-3)">${vacs.length} vacinas no pacote</div></div>
              <div style="text-align:right"><div style="font-size:18px;font-weight:800;color:var(--primary)">${R(tot)}</div><div style="font-size:10px;color:#16a34a">💰 ${R(tot*COM)}</div></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${vacs.map(v=>`<span style="padding:4px 10px;background:var(--bg-subtle);border-radius:16px;font-size:11px;font-weight:600;color:var(--text-2)">${esc(v.nome.split('(')[0].trim().slice(0,22))}</span>`).join('')}
              ${!vacs.length?'<span style="font-size:12px;color:#f59e0b">⚠️ Vacinas não encontradas no sistema</span>':''}
            </div>
          `;
          card.addEventListener('mouseenter',()=>{card.style.borderColor='var(--primary)';card.style.boxShadow='0 2px 12px rgba(43,188,179,.15)';});
          card.addEventListener('mouseleave',()=>{card.style.borderColor='var(--border)';card.style.boxShadow='none';});
          pgrid.appendChild(card);
        });
        prodsArea.appendChild(pgrid);
      }

      if(tabAtiva==='planos') {
        const pgrid=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px'});
        (_prods?.planos||[]).forEach(p=>{
          const inCart=carrinho.find(c=>c.id===p.id&&c.tipo==='plano');
          const card=h('div',{
            style:`padding:16px;border-radius:12px;border:2px solid ${inCart?'var(--primary)':'var(--border)'};background:${inCart?'var(--primary-bg)':'var(--bg-card)'};cursor:pointer;transition:all .15s`,
            onClick:()=>{
              if(inCart)carrinho=carrinho.filter(c=>!(c.id===p.id&&c.tipo==='plano'));
              else carrinho.push({tipo:'plano',id:p.id,nome:p.nome,valor:p.valorAvista||0,qty:1});
              drawProds(); renderCart();
            }
          });
          card.innerHTML=`
            <div style="font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:4px">${esc(p.nome)}</div>
            <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">👶 ${p.idadeInicio}–${p.idadeFim}m · ${p.vacinas?.length||0} vacinas</div>
            <div style="font-size:18px;font-weight:800;color:${inCart?'var(--primary)':'var(--text-1)'}">${R(p.valorAvista||0)}</div>
            <div style="font-size:11px;color:#16a34a">💰 ${R((p.valorAvista||0)*COM)}</div>
            ${inCart?'<div style="font-size:11px;color:var(--primary);font-weight:700;margin-top:4px">✓ Adicionado</div>':''}
          `;
          if(!inCart){
            card.addEventListener('mouseenter',()=>{card.style.borderColor='var(--primary)';card.style.background='var(--primary-bg)';});
            card.addEventListener('mouseleave',()=>{card.style.borderColor='var(--border)';card.style.background='var(--bg-card)';});
          }
          pgrid.appendChild(card);
        });
        prodsArea.appendChild(pgrid);
      }
    }
    drawProds();

    // ── COLUNA DIREITA: Carrinho fixo ─────────────────────────
    const cartEl = h('div',{style:'position:sticky;top:70px'});
    grid.appendChild(cartEl);
    W.appendChild(grid);

    renderCart();

    function renderCart() {
      cartEl.innerHTML='';
      const box=h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden'});

      // Header carrinho
      const ch=h('div',{style:'padding:12px 16px;background:var(--primary);color:white;display:flex;justify-content:space-between;align-items:center'});
      ch.innerHTML=`<span style="font-weight:700;font-size:14px">🛒 Carrinho</span><span style="font-size:12px;opacity:.85">${carrinho.length} item${carrinho.length!==1?'s':''}</span>`;
      box.appendChild(ch);

      // Cliente
      const cli=h('div',{style:'padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg-subtle)'});
      if(cliente){
        cli.innerHTML=`<div style="font-size:12px;font-weight:600;color:var(--text-1)">👤 ${esc(cliente.nome)}</div><div style="font-size:10px;color:var(--text-3)">${cliente.paciente_nome?'👶 '+esc(cliente.paciente_nome):cliente.telefone||''}</div>`;
        const tr=h('button',{style:'font-size:10px;color:var(--primary);border:none;background:none;cursor:pointer;float:right;margin-top:-18px',
          onClick:()=>{cliente=null;renderCart();}
        },'✕ Trocar');
        cli.appendChild(tr);
      } else {
        const b=h('button',{style:'width:100%;text-align:center;border:none;background:none;color:var(--primary);font-size:12px;font-weight:600;cursor:pointer',
          onClick:()=>modalCadCliente()
        },'+ Identificar Cliente');
        cli.appendChild(b);
      }
      box.appendChild(cli);

      // Itens
      const items=h('div',{style:'max-height:220px;overflow-y:auto;padding:8px 0'});
      if(!carrinho.length){
        items.innerHTML='<div style="padding:20px;text-align:center;color:var(--text-4);font-size:12px">Nenhum produto adicionado</div>';
      } else {
        carrinho.forEach(i=>{
          const row=h('div',{style:'display:flex;align-items:center;gap:8px;padding:7px 14px'});
          const info=h('div',{style:'flex:1;min-width:0'});
          info.innerHTML=`<div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.nome)}</div><div style="font-size:10px;color:#16a34a">💰 ${R(comItem(i))}</div>`;
          row.appendChild(info);
          // qty
          const qRow=h('div',{style:'display:flex;align-items:center;gap:4px;flex-shrink:0'});
          if(i.tipo==='vacina'){
            qRow.appendChild(h('button',{style:'width:22px;height:22px;border:1px solid var(--border);border-radius:5px;background:var(--bg-subtle);cursor:pointer;font-size:14px;line-height:1',
              onClick:()=>{if(i.qty>1)i.qty--;else carrinho=carrinho.filter(c=>c!==i);renderCart();}
            },'−'));
            qRow.appendChild(h('span',{style:'font-size:12px;font-weight:700;min-width:16px;text-align:center'},String(i.qty)));
            qRow.appendChild(h('button',{style:'width:22px;height:22px;border:1px solid var(--border);border-radius:5px;background:var(--bg-subtle);cursor:pointer;font-size:14px;line-height:1',
              onClick:()=>{i.qty++;renderCart();}
            },'+'));
          }
          qRow.appendChild(h('span',{style:'font-size:12px;font-weight:700;color:var(--text-1);min-width:60px;text-align:right'},R((i.valor||0)*(i.qty||1))));
          qRow.appendChild(h('button',{style:'border:none;background:none;cursor:pointer;color:#ef4444;font-size:14px;padding:0 2px',onClick:()=>removeFromCart(i)},'✕'));
          row.appendChild(qRow);
          items.appendChild(row);
        });
      }
      box.appendChild(items);

      // Desconto
      const discArea=h('div',{style:'padding:10px 14px;border-top:1px solid var(--border)'});
      const discRow=h('div',{style:'display:flex;gap:6px;align-items:center'});
      discRow.appendChild(h('span',{style:'font-size:11px;color:var(--text-3);flex-shrink:0'},'Desconto R$'));
      const discInp=h('input',{type:'number',min:'0',value:descontoVal||'',placeholder:'0,00',
        style:'flex:1;border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:13px;width:60px'});
      discInp.addEventListener('input',e=>{descontoVal=Math.max(0,parseFloat(e.target.value)||0);updateTotals();});
      discRow.appendChild(discInp);
      discArea.appendChild(discRow);
      box.appendChild(discArea);

      // Pagamento
      const pgRow=h('div',{style:'padding:8px 14px;display:flex;gap:5px'});
      ['avista','cartao','pix'].forEach(fp=>{
        const l={avista:'💵',cartao:'💳',pix:'📱'}[fp];
        pgRow.appendChild(h('button',{
          className:`btn btn-sm ${pgto===fp?'btn-primary':'btn-outline'}`,
          style:'flex:1;font-size:10px;padding:5px 2px',
          onClick:()=>{pgto=fp;renderCart();}
        },l+{avista:' Vista',cartao:' Cartão',pix:' PIX'}[fp]));
      });
      box.appendChild(pgRow);

      // Totais
      const tots=h('div',{style:'padding:10px 14px;border-top:1px solid var(--border);background:var(--bg-subtle)'});
      const addRow=(lbl,val,bold,cor)=>{
        const r=h('div',{style:'display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px'});
        r.innerHTML=`<span style="color:var(--text-3)">${lbl}</span><${bold?'strong':'span'} style="color:${cor||'var(--text-1)'}">${val}</${bold?'strong':'span'}>`;
        tots.appendChild(r);
      };
      addRow('Subtotal',R(subtotal()));
      if(descontoVal>0) addRow('Desconto','-'+R(descontoVal),'',`#ef4444`);
      const totRow=h('div',{style:'display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:1px solid var(--border);padding-top:8px;margin-top:4px'});
      totRow.innerHTML=`<span>Total</span><span style="color:var(--primary)">${R(total())}</span>`;
      tots.appendChild(totRow);
      box.appendChild(tots);

      // Comissão highlight
      const comBox=h('div',{style:'padding:8px 14px;background:#f0fdf4;border-top:1px solid #bbf7d0;display:flex;justify-content:space-between;align-items:center'});
      comBox.innerHTML=`<span style="font-size:11px;color:#16a34a;font-weight:700">💰 Sua Comissão</span><span style="font-size:18px;font-weight:900;color:#16a34a">${R(comTotal())}</span>`;
      box.appendChild(comBox);

      // Botão confirmar
      const canSell=carrinho.length>0&&cliente;
      const btnConf=h('button',{
        className:'btn btn-primary btn-block',
        style:`padding:14px;font-size:14px;font-weight:800;border-radius:0;opacity:${canSell?1:0.6};border-top:none`,
        disabled:!canSell,
        onClick:()=>canSell&&confirmarVenda()
      },canSell?'✓ Confirmar Venda':!cliente?'⚠️ Identifique o cliente':'⚠️ Adicione produtos');
      box.appendChild(btnConf);

      cartEl.innerHTML=''; cartEl.appendChild(box);

      function updateTotals(){
        // Re-render apenas os totais
        tots.innerHTML='';
        addRow('Subtotal',R(subtotal()));
        if(descontoVal>0) addRow('Desconto','-'+R(descontoVal),'','#ef4444');
        const tr2=h('div',{style:'display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:1px solid var(--border);padding-top:8px;margin-top:4px'});
        tr2.innerHTML=`<span>Total</span><span style="color:var(--primary)">${R(total())}</span>`;
        tots.appendChild(tr2);
        comBox.querySelector('span:last-child').textContent=R(comTotal());
      }
    }
  }

  // ── Modal cadastro rápido com máscaras ──────────────────────
  function modalCadCliente() {
    showModal('👤 Identificar Cliente',(body,close)=>{
      const fd={nome:'',telefone:'',cpf:'',paciente_nome:'',data_nascimento:'',cpfRaw:'',telRaw:'',dnRaw:''};
      let cpfOk=true, telOk=true, dnOk=true;

      body.style.display='flex'; body.style.flexDirection='column'; body.style.gap='0';

      // Nome responsável
      const mkLabel=(txt,obrig=false)=>h('label',{style:'font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:3px;display:block'},txt+(obrig?' *':''));

      const nomeWrap=h('div',{style:'margin-bottom:10px'});
      nomeWrap.appendChild(mkLabel('Nome do responsável',true));
      const nomeInp=h('input',{className:'input',placeholder:'Nome completo',style:'font-size:15px',autocomplete:'name'});
      nomeInp.addEventListener('input',e=>{fd.nome=e.target.value.trim();});
      nomeWrap.appendChild(nomeInp);
      body.appendChild(nomeWrap);

      // Tel + CPF
      const row1=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px'});

      const telWrap=h('div');
      telWrap.appendChild(mkLabel('WhatsApp',true));
      const telInp=h('input',{className:'input',placeholder:'(98) 9 9999-9999',inputMode:'tel',style:'font-size:14px'});
      const telErr=h('div',{style:'font-size:10px;color:#ef4444;margin-top:2px;display:none'},'Telefone inválido');
      telInp.addEventListener('input',e=>{
        const m=maskTel(e.target.value); e.target.value=m; fd.telefone=m; fd.telRaw=m.replace(/\D/g,'');
        telOk=fd.telRaw.length>=10; telErr.style.display=(!telOk&&fd.telRaw.length>0)?'block':'none';
      });
      telWrap.appendChild(telInp); telWrap.appendChild(telErr);
      row1.appendChild(telWrap);

      const cpfWrap=h('div');
      cpfWrap.appendChild(mkLabel('CPF (opcional)'));
      const cpfInp=h('input',{className:'input',placeholder:'000.000.000-00',inputMode:'numeric',style:'font-size:14px'});
      const cpfErr=h('div',{style:'font-size:10px;color:#ef4444;margin-top:2px;display:none'},'CPF inválido');
      cpfInp.addEventListener('input',e=>{
        const m=maskCPF(e.target.value); e.target.value=m; fd.cpf=m; fd.cpfRaw=m.replace(/\D/g,'');
        if(fd.cpfRaw.length===11){cpfOk=validCPF(fd.cpfRaw);cpfErr.style.display=cpfOk?'none':'block';}
        else{cpfOk=true;cpfErr.style.display='none';}
      });
      cpfWrap.appendChild(cpfInp); cpfWrap.appendChild(cpfErr);
      row1.appendChild(cpfWrap);
      body.appendChild(row1);

      // Divisor
      const sep=h('div',{style:'display:flex;align-items:center;gap:8px;margin:8px 0 12px'});
      sep.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
      sep.appendChild(h('span',{style:'font-size:11px;color:var(--text-4);white-space:nowrap'},'👶 Dados do paciente/bebê'));
      sep.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
      body.appendChild(sep);

      // Paciente
      const pacWrap=h('div',{style:'margin-bottom:10px'});
      pacWrap.appendChild(mkLabel('Nome do bebê/paciente',true));
      const pacInp=h('input',{className:'input',placeholder:'Nome completo do bebê',style:'font-size:14px',autocomplete:'off'});
      pacInp.addEventListener('input',e=>{fd.paciente_nome=e.target.value.trim();});
      pacWrap.appendChild(pacInp);
      body.appendChild(pacWrap);

      const dnWrap=h('div',{style:'margin-bottom:16px'});
      dnWrap.appendChild(mkLabel('Data de nascimento',true));
      const dnInp=h('input',{className:'input',placeholder:'DD/MM/AAAA',inputMode:'numeric',style:'font-size:14px'});
      const dnErr=h('div',{style:'font-size:10px;color:#ef4444;margin-top:2px;display:none'},'Data inválida ou futura');
      dnInp.addEventListener('input',e=>{
        const m=maskDate(e.target.value); e.target.value=m; fd.data_nascimento=m;
        if(m.length===10){
          const dt=parseDate(m);
          dnOk=dt&&dt<=new Date()&&dt>new Date('1900-01-01');
          dnErr.style.display=dnOk?'none':'block';
        } else {dnOk=false;dnErr.style.display='none';}
      });
      dnWrap.appendChild(dnInp); dnWrap.appendChild(dnErr);
      body.appendChild(dnWrap);

      body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'padding:14px;font-size:15px;font-weight:700',onClick:()=>{
        if(!fd.nome||fd.nome.length<3)return Toast.show('Nome do responsável obrigatório (mín. 3 letras)','error');
        if(!fd.telRaw||fd.telRaw.length<10)return Toast.show('WhatsApp obrigatório com DDD','error');
        if(!fd.cpfRaw||cpfOk===false)return Toast.show('CPF inválido','error');
        if(!fd.paciente_nome||fd.paciente_nome.length<2)return Toast.show('Nome do bebê obrigatório','error');
        if(!fd.data_nascimento||fd.data_nascimento.length<10)return Toast.show('Data de nascimento obrigatória','error');
        if(!dnOk)return Toast.show('Data de nascimento inválida ou futura','error');
        let dn=null;
        const[d,m,a]=fd.data_nascimento.split('/');
        if(a&&m&&d)dn=`${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        cliente={nome:fd.nome,telefone:fd.telefone,cpf:fd.cpf,paciente_nome:fd.paciente_nome,data_nascimento:dn};
        close();
        // Update button text
        const cliBtn=W.querySelector('[data-cliBtn]');
        if(cliBtn)cliBtn.textContent=`👤 ${cliente.nome.split(' ')[0]}`;
        renderCart?.();Toast.show(`✓ ${cliente.nome} identificado`);
      }},'Confirmar →'));

      setTimeout(()=>nomeInp.focus(),120);
    },'460px');
  }


  // ── Confirmar venda ─────────────────────────────────────────
  async function confirmarVenda() {
    showModal('✅ Confirmar Venda',(body,close)=>{
      const tot=total(); const com=comTotal();
      body.innerHTML=`
        <div style="text-align:center;padding:8px 0 16px">
          <div style="font-size:32px;margin-bottom:8px">🛒</div>
          <div style="font-size:14px;font-weight:700">Resumo da Venda</div>
          <div style="font-size:12px;color:var(--text-3)">Cliente: <strong>${esc(cliente.nome)}</strong></div>
        </div>
      `;
      const iBox=h('div',{style:'border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:12px'});
      carrinho.forEach(i=>{const r=h('div',{style:'display:flex;justify-content:space-between;padding:9px 14px;border-bottom:1px solid var(--border);font-size:13px'});r.appendChild(h('span',null,esc(i.nome)));r.appendChild(h('strong',null,R((i.valor||0)*(i.qty||1))));iBox.appendChild(r);});
      body.appendChild(iBox);
      body.innerHTML+=`<div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;margin-bottom:8px"><span>Total</span><span style="color:var(--primary)">${R(tot)}</span></div>
        <div style="display:flex;justify-content:space-between;background:#f0fdf4;border-radius:8px;padding:10px 14px;margin-bottom:14px"><span style="color:#16a34a;font-weight:700">💰 Comissão</span><span style="font-size:20px;font-weight:900;color:#16a34a">${R(com)}</span></div>`;
      const btnOk=h('button',{className:'btn btn-primary btn-block',style:'padding:14px;font-size:14px',onClick:async()=>{
        btnOk.disabled=true;btnOk.textContent='⏳ Registrando...';
        const r=await Api.vendasFechar({
          cliente:{id:cliente.id,nome:cliente.nome,telefone:cliente.telefone,paciente_nome:cliente.paciente_nome},
          data_nascimento_paciente:cliente.data_nascimento,
          itens:carrinho.map(i=>({tipo:i.tipo,id:i.id,nome:i.nome,valor:(i.valor||0)*(i.qty||1)})),
          forma_pagamento:pgto,
          desconto:descontoVal,
          vendedor_id:AppState.usuario?.id
        }).catch(e=>({error:e.message}));
        if(r?.success){
          close();Toast.show(`✅ Venda registrada! 💰 ${R(r.comissao_total||com)}`);
          carrinho=[];cliente=null;descontoVal=0;
          await draw();
        } else {Toast.show(r?.error||'Erro ao registrar','error');btnOk.disabled=false;btnOk.textContent='✓ Confirmar';}
      }},'✓ Confirmar e Registrar');
      body.appendChild(btnOk);
    },'400px');
  }

  await draw();
  return W;
}
