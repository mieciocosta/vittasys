// ════════════════════════════════════════════════════════════════
// ⚡ CENTRAL DE VENDAS — VittaSys v2
// Arquitetura corrigida: estado global + renderCart sempre acessível
// ════════════════════════════════════════════════════════════════
async function renderVendas() {
  const W = h('div', { className: 'fade-in' });

  // ══ ESTADO GLOBAL ════════════════════════════════════════════
  let _prods = null;
  let cliente = null;
  let carrinho = [];
  let pgto = 'avista';
  let descontoRaw = 0; // valor em R$ sempre positivo
  let tabAtiva = 'vacinas';
  let _cartEl = null; // referência ao elemento do carrinho

  // ══ CONSTANTES ═══════════════════════════════════════════════
  const COM = 0.01;
  const COM_GRIPE = 10;
  const DESCONTO_MAX_PCT = { master: 100, atendimento: 15, vendas: 5 };
  const perfil = AppState.usuario?.perfil || 'vendas';
  const maxDescPct = DESCONTO_MAX_PCT[perfil] ?? 5;

  // ══ HELPERS ══════════════════════════════════════════════════
  const R = v => 'R$\u00a0' + Math.max(0, Number(v||0)).toFixed(2).replace('.',',');
  const isGripe = n => /INFLUEN|GRIPE/i.test(n||'');
  const comItem = i => ((i.valor||0)*(i.qty||1)*COM) + (isGripe(i.nome)?COM_GRIPE*(i.qty||1):0);
  const comTotal = () => carrinho.reduce((s,i) => s+comItem(i), 0);
  const subtotal = () => carrinho.reduce((s,i) => s+(i.valor||0)*(i.qty||1), 0);
  const total = () => Math.max(0, subtotal() - descontoRaw);

  // Máscaras
  const maskTel = v => { const n=v.replace(/\D/g,'').slice(0,11); if(n.length<=2)return '('+n; if(n.length<=6)return '('+n.slice(0,2)+') '+n.slice(2); if(n.length<=10)return '('+n.slice(0,2)+') '+n.slice(2,6)+'-'+n.slice(6); return '('+n.slice(0,2)+') '+n.slice(2,7)+'-'+n.slice(7); };
  const maskDate = v => { const n=v.replace(/\D/g,'').slice(0,8); if(n.length<=2)return n; if(n.length<=4)return n.slice(0,2)+'/'+n.slice(2); return n.slice(0,2)+'/'+n.slice(2,4)+'/'+n.slice(4); };
  const maskCPF = v => v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  const validCPF = v => { const n=v.replace(/\D/g,''); if(n.length!==11||/^(\d)\1+$/.test(n))return false; let s=0; for(let i=0;i<9;i++)s+=+n[i]*(10-i); const d1=11-s%11>9?0:11-s%11; s=0; for(let i=0;i<10;i++)s+=+n[i]*(11-i); return d1===+n[9]&&(11-s%11>9?0:11-s%11)===+n[10]; };
  const parseDate = v => { const[d,m,a]=v.split('/'); if(!a||!m||!d)return null; const dt=new Date(+a,+m-1,+d); return isNaN(dt.getTime())?null:dt; };

  // ══ NORMALIZAÇÃO DE VACINAS (deduplicar similares) ════════════
  const NORM_MAP = [
    { key:'meningo-b',  label:'Meningocócica B',        pats:[/bexsero/i,/men.*b\b/i,/meningo.*\bb\b/i,/\bmen b\b/i] },
    { key:'acwy',       label:'Meningocócica ACWY',      pats:[/nimenrix/i,/acwy/i,/meningo.*acwy/i] },
    { key:'hexa',       label:'Hexacelular',             pats:[/hexaxim/i,/hexacelular/i,/hexavalente/i,/dtpa-vip-hib-hb/i] },
    { key:'penta',      label:'Pentacelular',            pats:[/pentacelular/i,/pentavalente/i] },
    { key:'pneumo20',   label:'Pneumocócica 20',         pats:[/pneumo.*20/i,/20-val/i,/vaxneuvance.*20/i] },
    { key:'pneumo15',   label:'Pneumocócica 15',         pats:[/pneumo.*15/i,/15-val/i,/vaxneuvance/i] },
    { key:'rotavirus',  label:'Rotavírus',               pats:[/rotav/i,/rotateq/i] },
    { key:'influenza',  label:'Influenza',               pats:[/influen/i,/influvac/i,/gripe/i] },
    { key:'febre-am',   label:'Febre Amarela',           pats:[/febre.?amarela/i,/stamaril/i] },
    { key:'hep-a',      label:'Hepatite A',              pats:[/hepatite.?a\b/i,/hepatite.?a\s*inf/i] },
    { key:'hep-ab',     label:'Hepatite A+B',            pats:[/twinrix/i,/hepatite.?a.?b/i,/a\+b/i] },
    { key:'hpv',        label:'HPV 9-valente',           pats:[/gardasil/i,/hpv/i] },
    { key:'varicela',   label:'Varicela',                pats:[/varicela/i,/varivax/i] },
    { key:'triplice',   label:'Tríplice Viral',          pats:[/tríplice.?viral/i,/triple.?viral/i,/m-m-r/i,/sarampo.*caxumba/i] },
    { key:'herpes',     label:'Herpes Zóster',           pats:[/zóster/i,/zoster/i,/shingrix/i] },
    { key:'abrysvo',    label:'Abrysvo (VSR)',           pats:[/abrysvo/i,/sincicial/i,/\bvsr\b/i] },
    { key:'dtpa',       label:'dTpa',                    pats:[/refortrix(?!.*ipv)/i,/\bdtpa\b(?!.*ipv)/i] },
    { key:'dtpa-ipv',   label:'dTpa+IPV',                pats:[/refortrix.?ipv/i,/dtpa.*ipv/i,/dtpa-vip/i] },
    { key:'bcg',        label:'BCG',                     pats:[/\bbcg\b/i] },
    { key:'hep-b',      label:'Hepatite B',              pats:[/hepatite.?b\b/i] },
  ];

  function normVacina(v) {
    for(const n of NORM_MAP) {
      if(n.pats.some(p => p.test(v.nome))) return n;
    }
    return { key: 'vac-' + v.id, label: v.nome };
  }

  function deduplicarVacinas(lista) {
    const map = new Map();
    for(const v of lista) {
      const norm = normVacina(v);
      if(!map.has(norm.key)) {
        map.set(norm.key, { ...v, nomeOriginal: v.nome, nome: norm.label, _ids: [v.id] });
      } else {
        const ex = map.get(norm.key);
        ex._ids.push(v.id);
        // Manter maior preço, consolidar fabricante
        if(!ex.valorVendaSugerido && v.valorVendaSugerido) ex.valorVendaSugerido = v.valorVendaSugerido;
      }
    }
    return Array.from(map.values());
  }

  // ══ PACOTES POR FAIXA ETÁRIA (conforme PDF Vittalis) ═════════
  const PACOTES = [
    { id:'pkg2',  label:'👶 2 meses',  meses:2,  keys:['hexa','pneumo20','rotavirus','meningo-b'] },
    { id:'pkg3',  label:'👶 3 meses',  meses:3,  keys:['meningo-b','acwy'] },
    { id:'pkg4',  label:'👶 4 meses',  meses:4,  keys:['penta','pneumo20','rotavirus'] },
    { id:'pkg5',  label:'👶 5 meses',  meses:5,  keys:['meningo-b','acwy'] },
    { id:'pkg6',  label:'👶 6 meses',  meses:6,  keys:['penta','pneumo20','rotavirus','influenza'] },
    { id:'pkg7',  label:'👶 7 meses',  meses:7,  keys:['influenza'] },
    { id:'pkg9',  label:'👶 9 meses',  meses:9,  keys:['febre-am'] },
    { id:'pkg12', label:'👶 12 meses', meses:12, keys:['triplice','hep-a','varicela'] },
  ];

  async function getProds() {
    if(!_prods) {
      const raw = await Api.vendasProdutos().catch(()=>({vacinas:[],planos:[]}));
      _prods = { ...raw, vacinasNorm: deduplicarVacinas(raw.vacinas||[]) };
    }
    return _prods;
  }

  // ══ OPERAÇÕES DO CARRINHO ════════════════════════════════════
  function addToCart(vac) {
    const ex = carrinho.find(c => c._normKey === (vac._normKey||vac.id) && c.tipo==='vacina');
    if(ex) { ex.qty=(ex.qty||1)+1; }
    else { carrinho.push({ tipo:'vacina', id:vac.id, _ids:vac._ids||[vac.id], _normKey:vac._normKey||(vac.id+''), nome:vac.nome, valor:vac.valorVendaSugerido||0, qty:1, ehGripe:isGripe(vac.nome) }); }
    RC();
  }

  function addPacote(pkg) {
    if(!_prods) return;
    const vacNorm = _prods.vacinasNorm || [];
    const vacsMap = new Map(vacNorm.map(v=>{ const n=normVacina(v); return [n.key, v]; }));
    let added = 0;
    for(const key of pkg.keys) {
      const v = vacsMap.get(key);
      if(v && v.valorVendaSugerido > 0) { addToCartRaw(v); added++; }
    }
    if(!added) Toast.show('Nenhuma vacina deste pacote com preço cadastrado','error');
    else Toast.show(`${pkg.label}: ${added} vacina${added!==1?'s':''} adicionada${added!==1?'s':''}`);
    RC();
  }

  function addToCartRaw(vac) {
    const key = vac._normKey || normVacina(vac).key;
    const ex = carrinho.find(c=>c._normKey===key&&c.tipo==='vacina');
    if(ex) ex.qty=(ex.qty||1)+1;
    else carrinho.push({tipo:'vacina',id:vac.id,_ids:vac._ids||[vac.id],_normKey:key,nome:vac.nome,valor:vac.valorVendaSugerido||0,qty:1,ehGripe:isGripe(vac.nome)});
  }

  function removeFromCart(item) {
    carrinho = carrinho.filter(c => c !== item);
    RC();
  }

  function changeQty(item, delta) {
    const newQty = (item.qty||1) + delta;
    if(newQty <= 0) carrinho = carrinho.filter(c => c !== item);
    else item.qty = newQty;
    RC();
  }

  // ══ RENDER CARRINHO (RC) — chamado de QUALQUER lugar ═════════
  function RC() {
    if(!_cartEl) return;
    _cartEl.innerHTML = '';
    const box = h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)'});

    // Header
    const hd=h('div',{style:'padding:11px 16px;background:var(--primary);color:white;display:flex;justify-content:space-between;align-items:center'});
    hd.innerHTML=`<span style="font-weight:700;font-size:14px">🛒 Carrinho</span><span style="font-size:12px;opacity:.85">${carrinho.length} item${carrinho.length!==1?'s':''}</span>`;
    box.appendChild(hd);

    // Cliente
    const cliDiv=h('div',{style:'padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg-subtle);min-height:42px;display:flex;align-items:center;justify-content:space-between'});
    if(cliente){
      const info=h('div',{style:'min-width:0'});
      info.innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">👤 ${esc(cliente.nome)}</div><div style="font-size:10px;color:var(--text-3)">${cliente.paciente_nome?'👶 '+esc(cliente.paciente_nome):(cliente.telefone||'')}</div>`;
      cliDiv.appendChild(info);
      const acts=h('div',{style:'display:flex;gap:4px;flex-shrink:0;margin-left:6px'});
      acts.appendChild(h('button',{style:'border:none;background:none;cursor:pointer;font-size:10px;color:var(--primary);font-weight:600',onClick:()=>modalCadCliente(true)},'Trocar'));
      acts.appendChild(h('button',{style:'border:none;background:none;cursor:pointer;font-size:14px;color:#ef4444',onClick:()=>confirmarRemoverCliente()},'✕'));
      cliDiv.appendChild(acts);
    } else {
      const btn=h('button',{style:'width:100%;border:none;background:none;color:var(--primary);font-size:12px;font-weight:600;cursor:pointer;text-align:center',onClick:()=>modalCadCliente()},'+ Identificar Cliente');
      cliDiv.appendChild(btn);
    }
    box.appendChild(cliDiv);

    // Itens
    const items=h('div',{style:'max-height:240px;overflow-y:auto'});
    if(!carrinho.length){
      items.innerHTML='<div style="padding:18px;text-align:center;color:var(--text-4);font-size:12px">Selecione vacinas ou planos</div>';
    } else {
      carrinho.forEach(i=>{
        const row=h('div',{style:'display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--border)'});
        // Info
        const info=h('div',{style:'flex:1;min-width:0'});
        info.innerHTML=`<div style="font-size:11px;font-weight:600;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(i.nome)}">${esc(i.nome)}</div><div style="font-size:10px;color:#16a34a">💰 ${R(comItem(i))}</div>`;
        row.appendChild(info);
        // Qty controls (só vacinas)
        if(i.tipo==='vacina'){
          const qc=h('div',{style:'display:flex;align-items:center;gap:3px;flex-shrink:0'});
          const mkBtn=(lbl,fn)=>{
            const b=h('button',{style:'width:22px;height:22px;border:1px solid var(--border);border-radius:5px;background:var(--bg-subtle);cursor:pointer;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;color:var(--text-1)',onClick:fn},lbl);
            return b;
          };
          qc.appendChild(mkBtn('−',()=>changeQty(i,-1)));
          qc.appendChild(h('span',{style:'font-size:12px;font-weight:700;min-width:18px;text-align:center;color:var(--text-1)'},String(i.qty||1)));
          qc.appendChild(mkBtn('+',()=>changeQty(i,1)));
          row.appendChild(qc);
        }
        // Valor
        row.appendChild(h('span',{style:'font-size:12px;font-weight:700;color:var(--text-1);min-width:58px;text-align:right;flex-shrink:0'},R((i.valor||0)*(i.qty||1))));
        // Remover
        const remBtn=h('button',{
          style:'border:none;background:none;cursor:pointer;color:#ef4444;font-size:16px;padding:0 2px;flex-shrink:0;line-height:1',
          onClick:()=>removeFromCart(i)
        },'✕');
        row.appendChild(remBtn);
        items.appendChild(row);
      });
    }
    box.appendChild(items);

    // Desconto com máscara monetária
    const discDiv=h('div',{style:'padding:8px 14px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px'});
    discDiv.appendChild(h('span',{style:'font-size:11px;color:var(--text-3);white-space:nowrap'},'Desconto R$'));
    const discInp=h('input',{
      type:'text', inputMode:'decimal',
      value:descontoRaw>0?descontoRaw.toFixed(2).replace('.',','):'',
      placeholder:'0,00',
      style:'flex:1;border:1px solid var(--border);border-radius:7px;padding:6px 8px;font-size:13px;min-width:0'
    });
    const maxDesc = subtotal() * (maxDescPct/100);
    discInp.addEventListener('input',e=>{
      // Remove tudo que não é número ou vírgula
      let v=e.target.value.replace(/[^0-9,]/g,'').replace(/,/g,'.');
      const num=parseFloat(v)||0;
      descontoRaw=Math.min(Math.max(0,num), maxDesc);
      updateTots();
    });
    discInp.addEventListener('blur',e=>{
      e.target.value=descontoRaw>0?descontoRaw.toFixed(2).replace('.',','):'';
    });
    discDiv.appendChild(discInp);
    if(maxDescPct<100) discDiv.appendChild(h('span',{style:'font-size:9px;color:var(--text-4);white-space:nowrap'},`max ${maxDescPct}%`));
    box.appendChild(discDiv);

    // Forma de pagamento
    const pgRow=h('div',{style:'display:flex;gap:4px;padding:8px 14px'});
    ['avista','cartao','pix'].forEach(fp=>{
      pgRow.appendChild(h('button',{
        className:`btn btn-sm ${pgto===fp?'btn-primary':'btn-outline'}`,
        style:'flex:1;font-size:10px;padding:5px 2px',
        onClick:()=>{pgto=fp;RC();}
      },{avista:'💵 Vista',cartao:'💳 Cartão',pix:'📱 PIX'}[fp]));
    });
    box.appendChild(pgRow);

    // Totais
    const totsDiv=h('div',{style:'padding:10px 14px;border-top:1px solid var(--border);background:var(--bg-subtle)'});
    function updateTots(){
      totsDiv.innerHTML='';
      const addR=(l,v,cor,bold)=>{
        const r=h('div',{style:'display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px'});
        r.innerHTML=`<span style="color:var(--text-3)">${l}</span><${bold?'strong':'span'} style="color:${cor||'var(--text-1)'}">${v}</${bold?'strong':'span'}>`;
        totsDiv.appendChild(r);
      };
      addR('Subtotal',R(subtotal()));
      if(descontoRaw>0) addR('Desconto','-'+R(descontoRaw),'#ef4444');
      const tr=h('div',{style:'display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:1px solid var(--border);padding-top:8px;margin-top:4px'});
      tr.innerHTML=`<span>Total</span><span style="color:var(--primary)">${R(total())}</span>`;
      totsDiv.appendChild(tr);
    }
    updateTots();
    box.appendChild(totsDiv);

    // Comissão
    const comDiv=h('div',{style:'padding:8px 14px;background:#f0fdf4;border-top:1px solid #bbf7d0;display:flex;justify-content:space-between;align-items:center'});
    comDiv.innerHTML=`<span style="font-size:11px;color:#16a34a;font-weight:700">💰 Sua Comissão</span><span style="font-size:18px;font-weight:900;color:#16a34a">${R(comTotal())}</span>`;
    box.appendChild(comDiv);

    // Botão confirmar
    const canSell=carrinho.length>0&&cliente;
    const btnConf=h('button',{
      style:`width:100%;padding:14px;border:none;cursor:${canSell?'pointer':'default'};font-size:14px;font-weight:800;background:${canSell?'var(--primary)':'var(--border)'};color:${canSell?'white':'var(--text-3)'};transition:all .2s`,
      onClick:()=>{if(canSell)confirmarVenda();}
    },canSell?'✓ Confirmar Venda':!cliente?'⚠️ Identifique o cliente':'⚠️ Adicione produtos');
    box.appendChild(btnConf);

    _cartEl.appendChild(box);
  }

  // ══ MODAL CLIENTE com máscaras completas ═════════════════════
  function modalCadCliente(modoTroca=false) {
    const clienteAntes = cliente; // salvar para restaurar se cancelar
    showModal(modoTroca?'👤 Trocar Cliente':'👤 Identificar Cliente',(body,close)=>{
      const onClose=()=>{ if(modoTroca&&!cliente) cliente=clienteAntes; close(); RC(); };
      const fd={nome:'',telefone:'',cpf:'',paciente_nome:'',data_nascimento:''};
      let cpfOk=true,telOk=false,dnOk=false;

      const mkL=(t,req=false)=>h('label',{style:'font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:3px;display:block'},t+(req?' *':''));

      // Busca
      body.appendChild(mkL('Buscar cliente cadastrado'));
      const si=h('input',{className:'input',placeholder:'🔍 Nome, CPF, telefone ou código...',style:'font-size:14px;margin-bottom:4px'});
      const sRes=h('div',{style:'border:1px solid var(--border);border-radius:8px;max-height:150px;overflow-y:auto;margin-bottom:12px;display:none'});
      body.appendChild(si); body.appendChild(sRes);
      let sdb;
      si.addEventListener('input',e=>{
        clearTimeout(sdb);
        const q=e.target.value.trim();
        if(q.length<2){sRes.style.display='none';return;}
        sdb=setTimeout(async()=>{
          sRes.style.display='block';
          sRes.innerHTML='<div style="padding:10px;font-size:12px;color:var(--text-3)">Buscando...</div>';
          const r=await Api.vendasBuscarCliente(q).catch(()=>({clientes:[]}));
          sRes.innerHTML='';
          const list=r?.clientes||[];
          if(!list.length){sRes.innerHTML='<div style="padding:10px;text-align:center;font-size:12px;color:var(--text-3)">Não encontrado</div>';return;}
          list.forEach(c=>{
            const row=h('div',{style:'padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border)',
              onClick:()=>{cliente={id:c.id,nome:c.nome,telefone:c.telefone,paciente_nome:c.paciente_nome,data_nascimento:c.paciente_nascimento||c.data_nascimento};close();RC();Toast.show(`✓ ${c.nome}`);} });
            row.addEventListener('mouseenter',()=>row.style.background='var(--bg-subtle)');
            row.addEventListener('mouseleave',()=>row.style.background='');
            row.innerHTML=`<div style="font-weight:600;font-size:13px">${esc(c.nome)}</div><div style="font-size:11px;color:var(--text-3)">${c.telefone||''}${c.paciente_nome?' · 👶 '+esc(c.paciente_nome):''}</div>`;
            sRes.appendChild(row);
          });
        },280);
      });
      setTimeout(()=>si.focus(),100);

      const sep=h('div',{style:'display:flex;align-items:center;gap:8px;margin:10px 0'});
      sep.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
      sep.appendChild(h('span',{style:'font-size:11px;color:var(--text-4)'},'ou novo cliente'));
      sep.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
      body.appendChild(sep);

      // Nome responsável
      const nW=h('div',{style:'margin-bottom:8px'});
      nW.appendChild(mkL('Nome do responsável',true));
      const nI=h('input',{className:'input',placeholder:'Nome completo',style:'font-size:15px'});
      nI.addEventListener('input',e=>fd.nome=e.target.value);
      nW.appendChild(nI); body.appendChild(nW);

      // Tel + CPF
      const g1=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px'});
      const tW=h('div'); tW.appendChild(mkL('WhatsApp *',false));
      const tI=h('input',{className:'input',placeholder:'(98) 9 9999-9999',inputMode:'tel',style:'font-size:14px'});
      const tE=h('div',{style:'font-size:9px;color:#ef4444;display:none'},'Telefone inválido');
      tI.addEventListener('input',e=>{const m=maskTel(e.target.value);e.target.value=m;fd.telefone=m;telOk=m.replace(/\D/g,'').length>=10;tE.style.display=!telOk&&m.length>4?'block':'none';});
      tW.appendChild(tI); tW.appendChild(tE); g1.appendChild(tW);
      const cW=h('div'); cW.appendChild(mkL('CPF (opcional)'));
      const cI=h('input',{className:'input',placeholder:'000.000.000-00',inputMode:'numeric',style:'font-size:14px'});
      const cE=h('div',{style:'font-size:9px;color:#ef4444;display:none'},'CPF inválido');
      cI.addEventListener('input',e=>{const m=maskCPF(e.target.value);e.target.value=m;fd.cpf=m;const raw=m.replace(/\D/g,'');if(raw.length===11){cpfOk=validCPF(raw);cE.style.display=cpfOk?'none':'block';}else{cpfOk=true;cE.style.display='none';}});
      cW.appendChild(cI); cW.appendChild(cE); g1.appendChild(cW);
      body.appendChild(g1);

      // Paciente
      const sep2=h('div',{style:'display:flex;align-items:center;gap:8px;margin:10px 0 8px'});
      sep2.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
      sep2.appendChild(h('span',{style:'font-size:11px;color:var(--text-4)'},'👶 Dados do bebê'));
      sep2.appendChild(h('div',{style:'flex:1;height:1px;background:var(--border)'}));
      body.appendChild(sep2);

      const pW=h('div',{style:'margin-bottom:8px'}); pW.appendChild(mkL('Nome do bebê/paciente *'));
      const pI=h('input',{className:'input',placeholder:'Nome completo do bebê',style:'font-size:14px'});
      pI.addEventListener('input',e=>fd.paciente_nome=e.target.value);
      pW.appendChild(pI); body.appendChild(pW);

      const dW=h('div',{style:'margin-bottom:14px'}); dW.appendChild(mkL('Data de nascimento *'));
      const dI=h('input',{className:'input',placeholder:'DD/MM/AAAA',inputMode:'numeric',style:'font-size:14px'});
      const dE=h('div',{style:'font-size:9px;color:#ef4444;display:none'},'Data inválida');
      dI.addEventListener('input',e=>{const m=maskDate(e.target.value);e.target.value=m;fd.data_nascimento=m;if(m.length===10){const dt=parseDate(m);dnOk=!!(dt&&dt<=new Date()&&dt>new Date('1900-01-01'));dE.style.display=dnOk?'none':'block';}else{dnOk=false;dE.style.display='none';}});
      dW.appendChild(dI); dW.appendChild(dE); body.appendChild(dW);

      body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'padding:13px;font-size:14px;font-weight:700',onClick:()=>{
        if(!fd.nome?.trim()||fd.nome.trim().length<3)return Toast.show('Nome obrigatório (mín. 3 letras)','error');
        if(!fd.telefone||!telOk)return Toast.show('WhatsApp obrigatório com DDD','error');
        if(!cpfOk)return Toast.show('CPF inválido','error');
        if(!fd.paciente_nome?.trim())return Toast.show('Nome do bebê obrigatório','error');
        if(!fd.data_nascimento||fd.data_nascimento.length<10)return Toast.show('Data de nascimento obrigatória','error');
        if(!dnOk)return Toast.show('Data inválida ou futura','error');
        const[d,m,a]=fd.data_nascimento.split('/');
        cliente={nome:fd.nome.trim(),telefone:fd.telefone,cpf:fd.cpf,paciente_nome:fd.paciente_nome.trim(),data_nascimento:a&&m&&d?`${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`:null};
        close();RC();Toast.show(`✓ ${cliente.nome}`);
      }},'Salvar e continuar →'));
    },'460px');
  }

  function confirmarRemoverCliente(){
    showModal('Remover cliente?',(body,close)=>{
      body.innerHTML=`<p style="font-size:13px;color:var(--text-2);margin-bottom:14px">Deseja remover <strong>${esc(cliente?.nome||'')}</strong> desta venda?</p>`;
      const g=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:8px'});
      g.appendChild(h('button',{className:'btn btn-outline',onClick:()=>{close();}}, 'Cancelar'));
      g.appendChild(h('button',{className:'btn btn-danger',style:'background:#ef4444;color:white;border:none;border-radius:8px;padding:10px;cursor:pointer;font-weight:700',onClick:()=>{cliente=null;close();RC();}}, 'Remover'));
      body.appendChild(g);
    },'360px');
  }

  // ══ CONFIRMAR VENDA ═══════════════════════════════════════════
  async function confirmarVenda() {
    showModal('✅ Confirmar Venda',(body,close)=>{
      const tot=total(), com=comTotal();
      body.innerHTML=`<div style="text-align:center;padding:8px 0 14px"><div style="font-size:30px">🛒</div><div style="font-size:14px;font-weight:700">Resumo da Venda</div><div style="font-size:12px;color:var(--text-3)">Cliente: <strong>${esc(cliente.nome)}</strong></div></div>`;
      const iB=h('div',{style:'border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px'});
      carrinho.forEach(i=>{const r=h('div',{style:'display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border);font-size:12px'});r.appendChild(h('span',null,`${i.qty>1?i.qty+'× ':''}${esc(i.nome)}`));r.appendChild(h('strong',null,R((i.valor||0)*(i.qty||1))));iB.appendChild(r);});
      body.appendChild(iB);
      body.innerHTML+=`<div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;margin-bottom:8px"><span>Total</span><span style="color:var(--primary)">${R(tot)}</span></div><div style="display:flex;justify-content:space-between;background:#f0fdf4;border-radius:8px;padding:10px 12px;margin-bottom:14px"><span style="color:#16a34a;font-weight:700">💰 Comissão</span><span style="font-size:20px;font-weight:900;color:#16a34a">${R(com)}</span></div>`;
      const bC=h('button',{className:'btn btn-primary btn-block',style:'padding:14px;font-size:14px;font-weight:800',onClick:async()=>{
        bC.disabled=true;bC.textContent='⏳ Registrando...';
        const r=await Api.vendasFechar({
          cliente:{id:cliente.id,nome:cliente.nome,telefone:cliente.telefone,paciente_nome:cliente.paciente_nome},
          data_nascimento_paciente:cliente.data_nascimento,
          itens:carrinho.map(i=>({tipo:i.tipo,id:i.id,nome:i.nome,valor:(i.valor||0)*(i.qty||1)})),
          forma_pagamento:pgto,desconto:descontoRaw,vendedor_id:AppState.usuario?.id
        }).catch(e=>({error:e.message||'Erro'}));
        if(r?.success){
          close();Toast.show(`✅ Venda registrada! 💰 ${R(r.comissao_total||com)}`);
          carrinho=[];cliente=null;descontoRaw=0;RC();
        } else {Toast.show(r?.error||'Erro ao registrar','error');bC.disabled=false;bC.textContent='✓ Confirmar';}
      }},'✓ Confirmar e Registrar');
      body.appendChild(bC);
    },'400px');
  }

  // ══ DRAW PRINCIPAL ════════════════════════════════════════════
  async function draw() {
    W.innerHTML='';
    await getProds();

    // Top bar
    const top=h('div',{style:'display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap'});
    top.appendChild(h('h1',{style:'font-size:20px;font-weight:800;margin:0;flex-shrink:0'},'⚡ Central de Vendas'));

    // Busca cliente
    const sW=h('div',{style:'flex:1;min-width:180px;max-width:400px;position:relative'});
    const sI=h('input',{className:'input',placeholder:'🔍 Buscar cliente por nome, CPF, telefone...',style:'font-size:13px;width:100%'});
    const sR=h('div',{style:'position:absolute;top:calc(100% + 3px);left:0;right:0;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);z-index:300;max-height:200px;overflow-y:auto;display:none'});
    sW.appendChild(sI); sW.appendChild(sR);
    let sdb2;
    sI.addEventListener('input',e=>{
      clearTimeout(sdb2);const q=e.target.value.trim();
      if(q.length<2){sR.style.display='none';return;}
      sdb2=setTimeout(async()=>{
        sR.style.display='block';sR.innerHTML='<div style="padding:10px;font-size:12px;color:var(--text-3)">Buscando...</div>';
        const r=await Api.vendasBuscarCliente(q).catch(()=>({clientes:[]}));
        sR.innerHTML='';
        const list=r?.clientes||[];
        if(!list.length){sR.innerHTML='<div style="padding:10px;text-align:center;font-size:12px;color:var(--text-3)">Não encontrado — cadastre abaixo</div>';return;}
        list.forEach(c=>{
          const row=h('div',{style:'padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border)',
            onClick:()=>{cliente={id:c.id,nome:c.nome,telefone:c.telefone,paciente_nome:c.paciente_nome,data_nascimento:c.paciente_nascimento||c.data_nascimento};sI.value='';sR.style.display='none';RC();Toast.show(`✓ ${c.nome} selecionado`);}});
          row.addEventListener('mouseenter',()=>row.style.background='var(--bg-subtle)');
          row.addEventListener('mouseleave',()=>row.style.background='');
          row.innerHTML=`<div style="font-weight:600;font-size:13px">${esc(c.nome)}</div><div style="font-size:11px;color:var(--text-3)">${c.telefone||''}${c.paciente_nome?' · 👶 '+esc(c.paciente_nome):''}</div>`;
          sR.appendChild(row);
        });
      },280);
    });
    document.addEventListener('click',e=>{if(!sW.contains(e.target))sR.style.display='none';});
    top.appendChild(sW);
    top.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>modalCadCliente()},'+ Novo Cliente'));
    W.appendChild(top);

    // Grid produtos + carrinho
    const grid=h('div',{style:'display:grid;grid-template-columns:1fr 310px;gap:14px;align-items:start'});

    // Esquerda: produtos
    const left=h('div');

    // Atalhos por idade
    const ataBox=h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px'});
    ataBox.appendChild(h('div',{style:'font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px'},'⚡ Atalhos Rápidos por Idade'));
    const ataRow=h('div',{style:'display:flex;flex-wrap:wrap;gap:6px'});
    PACOTES.forEach(pkg=>{
      const vacsMap=new Map((_prods?.vacinasNorm||[]).map(v=>[normVacina(v).key,v]));
      const count=pkg.keys.filter(k=>vacsMap.has(k)&&(vacsMap.get(k).valorVendaSugerido||0)>0).length;
      const btn=h('button',{
        style:'padding:7px 12px;border-radius:18px;border:1px solid var(--border);background:var(--bg-card);font-size:11px;font-weight:600;cursor:pointer;text-align:center',
        onClick:()=>addPacote(pkg)
      });
      btn.innerHTML=`<div>${pkg.label}</div><div style="font-size:9px;color:var(--text-3)">${count} vacina${count!==1?'s':''}</div>`;
      btn.addEventListener('mouseenter',()=>{btn.style.background='var(--primary-bg)';btn.style.borderColor='var(--primary)';});
      btn.addEventListener('mouseleave',()=>{btn.style.background='var(--bg-card)';btn.style.borderColor='var(--border)';});
      ataRow.appendChild(btn);
    });
    ataBox.appendChild(ataRow);
    left.appendChild(ataBox);

    // Tabs
    const tabs=h('div',{style:'display:flex;background:var(--bg-subtle);border-radius:10px;padding:3px;margin-bottom:10px'});
    [['vacinas','💉 Vacinas'],['pacotes','👶 Pacotes'],['planos','💎 Planos']].forEach(([k,l])=>{
      const t=h('button',{style:`flex:1;padding:8px 4px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s`,onClick:()=>{tabAtiva=k;drawProds();}},l);
      t.dataset.tab=k; tabs.appendChild(t);
    });
    left.appendChild(tabs);

    const prodsArea=h('div');
    left.appendChild(prodsArea);
    grid.appendChild(left);

    // Direita: carrinho
    _cartEl=h('div',{style:'position:sticky;top:66px'});
    grid.appendChild(_cartEl);
    W.appendChild(grid);
    RC(); // render inicial do carrinho

    function drawProds(){
      prodsArea.innerHTML='';
      tabs.querySelectorAll('button').forEach(b=>{const on=b.dataset.tab===tabAtiva;b.style.background=on?'var(--bg-card)':'transparent';b.style.color=on?'var(--primary)':'var(--text-3)';});

      if(tabAtiva==='vacinas'){
        const si2=h('input',{className:'input',placeholder:'🔍 Buscar vacina...',style:'font-size:13px;border-radius:8px;margin-bottom:8px'});
        prodsArea.appendChild(si2);
        const vg=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:7px'});
        prodsArea.appendChild(vg);
        function rvacs(f=''){
          vg.innerHTML='';
          const list=(_prods?.vacinasNorm||[]).filter(v=>!f||v.nome.toLowerCase().includes(f.toLowerCase())||v.nomeOriginal?.toLowerCase().includes(f.toLowerCase()));
          if(!list.length){vg.innerHTML='<div style="grid-column:1/-1;padding:20px;text-align:center;color:var(--text-3);font-size:13px">Nenhuma vacina encontrada</div>';return;}
          list.forEach(v=>{
            const nk=normVacina(v).key;
            const inC=carrinho.find(c=>c._normKey===nk&&c.tipo==='vacina');
            const sem=!v.valorVendaSugerido;
            const card=h('div',{
              style:`padding:11px;border-radius:10px;border:2px solid ${inC?'var(--primary)':'var(--border)'};background:${inC?'var(--primary-bg)':'var(--bg-card)'};cursor:${sem?'default':'pointer'};opacity:${sem?.65:1};transition:all .15s`,
              onClick:()=>sem?Toast.show('Vacina sem preço','error'):(v._normKey=nk,addToCart(v))
            });
            const ehG=isGripe(v.nome);
            card.innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--text-1);line-height:1.3;margin-bottom:3px">${esc(v.nome)}</div>${v.fabricante?`<div style="font-size:9px;color:var(--text-4)">${esc(v.fabricante)}</div>`:''}${sem?'<div style="font-size:10px;color:#f59e0b;margin-top:4px">⚠️ Sem preço</div>':`<div style="font-size:14px;font-weight:800;color:${inC?'var(--primary)':'var(--text-1)'};margin-top:4px">${R(v.valorVendaSugerido)}</div><div style="font-size:10px;color:#16a34a">💰 ${R(v.valorVendaSugerido*COM)}${ehG?` +${R(COM_GRIPE)}`:''}</div>`}${inC?`<div style="font-size:10px;color:var(--primary);font-weight:700;margin-top:2px">✓ ${inC.qty}x</div>`:''}`;
            if(!sem){card.addEventListener('mouseenter',()=>{if(!inC){card.style.borderColor='var(--primary)';card.style.background='var(--primary-bg)';}});card.addEventListener('mouseleave',()=>{if(!inC){card.style.borderColor='var(--border)';card.style.background='var(--bg-card)';}});}
            vg.appendChild(card);
          });
        }
        let vdb2;si2.addEventListener('input',e=>{clearTimeout(vdb2);vdb2=setTimeout(()=>rvacs(e.target.value),200);});
        rvacs();
      }

      if(tabAtiva==='pacotes'){
        const vacsMap=new Map((_prods?.vacinasNorm||[]).map(v=>[normVacina(v).key,v]));
        const pList=h('div',{style:'display:flex;flex-direction:column;gap:8px'});
        PACOTES.forEach(pkg=>{
          const vacs=pkg.keys.map(k=>vacsMap.get(k)).filter(Boolean).filter(v=>v.valorVendaSugerido>0);
          const tot=vacs.reduce((s,v)=>s+(v.valorVendaSugerido||0),0);
          const card=h('div',{style:'background:var(--bg-card);border:1px solid var(--border);border-radius:11px;padding:14px;cursor:pointer;transition:all .15s',onClick:()=>addPacote(pkg)});
          card.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px"><div><div style="font-size:14px;font-weight:700">${pkg.label}</div><div style="font-size:11px;color:var(--text-3)">${vacs.length} vacina${vacs.length!==1?'s':''}</div></div><div style="text-align:right"><div style="font-size:17px;font-weight:800;color:var(--primary)">${R(tot)}</div><div style="font-size:10px;color:#16a34a">💰 ${R(tot*COM)}</div></div></div><div style="display:flex;flex-wrap:wrap;gap:4px">${vacs.map(v=>`<span style="padding:3px 8px;background:var(--bg-subtle);border-radius:12px;font-size:10px;font-weight:600;color:var(--text-2)">${esc(v.nome)}</span>`).join('')}${!vacs.length?'<span style="font-size:11px;color:#f59e0b">⚠️ Vacinas sem preço</span>':''}</div>`;
          card.addEventListener('mouseenter',()=>{card.style.borderColor='var(--primary)';card.style.boxShadow='0 2px 10px rgba(43,188,179,.15)';});
          card.addEventListener('mouseleave',()=>{card.style.borderColor='var(--border)';card.style.boxShadow='none';});
          pList.appendChild(card);
        });
        prodsArea.appendChild(pList);
      }

      if(tabAtiva==='planos'){
        const pg=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px'});
        (_prods?.planos||[]).forEach(p=>{
          const inC=carrinho.find(c=>c.id===p.id&&c.tipo==='plano');
          const card=h('div',{style:`padding:14px;border-radius:11px;border:2px solid ${inC?'var(--primary)':'var(--border)'};background:${inC?'var(--primary-bg)':'var(--bg-card)'};cursor:pointer;transition:all .15s`,
            onClick:()=>{if(inC)carrinho=carrinho.filter(c=>!(c.id===p.id&&c.tipo==='plano'));else carrinho.push({tipo:'plano',id:p.id,_normKey:'plan-'+p.id,nome:p.nome,valor:p.valorAvista||0,qty:1});drawProds();RC();}});
          card.innerHTML=`<div style="font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:3px">${esc(p.nome)}</div><div style="font-size:10px;color:var(--text-3);margin-bottom:6px">👶 ${p.idadeInicio}–${p.idadeFim}m · ${p.vacinas?.length||0} vacinas</div><div style="font-size:17px;font-weight:800;color:${inC?'var(--primary)':'var(--text-1)'}">${R(p.valorAvista||0)}</div><div style="font-size:10px;color:#16a34a">💰 ${R((p.valorAvista||0)*COM)}</div>${inC?'<div style="font-size:10px;color:var(--primary);font-weight:700;margin-top:4px">✓ Adicionado</div>':''}`;
          if(!inC){card.addEventListener('mouseenter',()=>{card.style.borderColor='var(--primary)';card.style.background='var(--primary-bg)';});card.addEventListener('mouseleave',()=>{card.style.borderColor='var(--border)';card.style.background='var(--bg-card)';});}
          pg.appendChild(card);
        });
        prodsArea.appendChild(pg);
      }
    }
    drawProds();
  }

  await draw();
  return W;
}
