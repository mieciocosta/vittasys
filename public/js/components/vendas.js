async function renderVendas() {
  const wrap = h('div', { className: 'fade-in' });
  let produtos = null;

  // ── Carregar produtos uma vez ──────────────────────────────────
  async function getProdutos() {
    if (!produtos) produtos = await Api.vendasProdutos();
    return produtos;
  }

  const fmtR = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
  const comCalc = (itens) => itens.reduce((s, i) => {
    const ehG = i.nome?.toUpperCase().includes('INFLUEN') || i.nome?.toUpperCase().includes('GRIPE');
    return s + (i.valor * i.qty * 0.01) + (ehG ? 10 * i.qty : 0);
  }, 0);

  // ════════════════════════════════════════════════════════════════
  // TELA PRINCIPAL
  // ════════════════════════════════════════════════════════════════
  async function drawMain() {
    wrap.innerHTML = '';

    // Header
    const hdr = h('div', { style: 'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px' });
    const left = h('div');
    left.appendChild(h('h1', { className: 'page-title', style: 'margin-bottom:4px' }, '🛒 Vendas'));
    left.appendChild(h('p', { className: 'page-subtitle' }, `Olá, ${AppState.usuario?.nome?.split(' ')[0] || ''}! Pronto para vender?`));
    hdr.appendChild(left);

    const btnNovo = h('button', {
      className: 'btn btn-primary',
      style: 'font-size:15px;padding:14px 28px;font-weight:700;gap:8px;display:flex;align-items:center',
      onClick: () => abrirWizard()
    });
    btnNovo.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Nova Venda`;
    hdr.appendChild(btnNovo);
    wrap.appendChild(hdr);

    // Cards de resumo do mês
    const mesAtual = new Date().toISOString().slice(0, 7);
    let comissaoMes = 0;
    try {
      const com = await Api.vendasComissao({ vendedor_id: AppState.usuario?.id, mes: mesAtual });
      comissaoMes = com?.total_comissao || 0;
    } catch(e) {}

    const cards = h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px' });
    const mkCard = (ico, lbl, val, cor) => {
      const c = h('div', { style: `padding:20px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;border-left:4px solid ${cor}` });
      c.innerHTML = `<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${ico} ${lbl}</div><div style="font-size:28px;font-weight:800;color:${cor}">${val}</div>`;
      return c;
    };
    cards.appendChild(mkCard('💰', 'Comissão do Mês', fmtR(comissaoMes), '#16a34a'));
    cards.appendChild(mkCard('📋', 'Planos Ativos', '—', '#2BBCB3'));
    cards.appendChild(mkCard('💉', 'Vacinas Cadastradas', `${(produtos?.vacinas?.length || '—')}`, '#6366f1'));
    wrap.appendChild(cards);

    // Dicas rápidas
    const tips = h('div', { style: 'background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #bfdbfe;border-radius:14px;padding:20px;margin-bottom:24px' });
    tips.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:10px">💡 Fluxo de Venda</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#374151">
          <div style="width:24px;height:24px;border-radius:50%;background:#2BBCB3;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">1</div>
          Identificar cliente
        </div>
        <div style="color:#d1d5db;font-size:18px">→</div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#374151">
          <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">2</div>
          Selecionar produtos
        </div>
        <div style="color:#d1d5db;font-size:18px">→</div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#374151">
          <div style="width:24px;height:24px;border-radius:50%;background:#16a34a;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;flex-shrink:0">3</div>
          Confirmar e registrar
        </div>
      </div>
    `;
    wrap.appendChild(tips);

    // Botão central grande
    const centroBig = h('div', { style: 'text-align:center;padding:40px;background:var(--bg-card);border:2px dashed var(--border);border-radius:16px' });
    centroBig.innerHTML = `<div style="font-size:48px;margin-bottom:12px">🛒</div><div style="font-size:18px;font-weight:700;color:var(--text-1);margin-bottom:6px">Iniciar Nova Venda</div><div style="font-size:13px;color:var(--text-3);margin-bottom:20px">Clique para cadastrar cliente e selecionar produtos</div>`;
    const btn2 = h('button', { className: 'btn btn-primary', style: 'font-size:15px;padding:14px 32px', onClick: () => abrirWizard() }, '+ Nova Venda');
    centroBig.appendChild(btn2);
    wrap.appendChild(centroBig);
  }

  // ════════════════════════════════════════════════════════════════
  // WIZARD — Modal com 3 etapas
  // ════════════════════════════════════════════════════════════════
  function abrirWizard() {
    let etapa = 1;
    let cliente = null;
    let carrinho = [];
    let formaPgto = 'avista';
    let tabProd = 'planos';

    showModal('🛒 Nova Venda', async (body, close) => {

      async function renderEtapa() {
        body.innerHTML = '';

        // Barra de progresso
        const prog = h('div', { style: 'margin-bottom:24px' });
        const steps = [
          { n: 1, lbl: 'Cliente', ico: '👤' },
          { n: 2, lbl: 'Produtos', ico: '📋' },
          { n: 3, lbl: 'Confirmar', ico: '✅' },
        ];
        const stepsRow = h('div', { style: 'display:flex;align-items:center;justify-content:center;gap:0' });
        steps.forEach((s, i) => {
          const ativo = etapa === s.n;
          const done = etapa > s.n;
          const cor = done ? '#16a34a' : ativo ? 'var(--primary)' : '#d1d5db';
          const circle = h('div', { style: `width:36px;height:36px;border-radius:50%;background:${cor};color:white;display:flex;align-items:center;justify-content:center;font-size:${done?'16px':'13px'};font-weight:700;flex-shrink:0;transition:all .2s` });
          circle.textContent = done ? '✓' : s.n;
          const label = h('div', { style: `font-size:11px;font-weight:${ativo?'700':'400'};color:${ativo?'var(--text-1)':'var(--text-3)'};margin-top:4px;text-align:center` }, s.lbl);
          const step = h('div', { style: 'display:flex;flex-direction:column;align-items:center' });
          step.appendChild(circle); step.appendChild(label);
          stepsRow.appendChild(step);
          if (i < steps.length - 1) {
            const line = h('div', { style: `width:60px;height:2px;background:${etapa > s.n ? '#16a34a' : '#e5e7eb'};margin:0 4px;margin-bottom:20px;flex-shrink:0;transition:all .2s` });
            stepsRow.appendChild(line);
          }
        });
        prog.appendChild(stepsRow);
        body.appendChild(prog);

        // ── ETAPA 1: CLIENTE ──────────────────────────────────────
        if (etapa === 1) {
          const title = h('div', { style: 'font-size:16px;font-weight:700;margin-bottom:16px;color:var(--text-1)' }, '👤 Quem é o cliente?');
          body.appendChild(title);

          if (cliente) {
            const cliCard = h('div', { style: 'background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px' });
            cliCard.innerHTML = `<div><div style="font-size:14px;font-weight:700;color:#15803d">✓ ${esc(cliente.nome)}</div><div style="font-size:12px;color:#16a34a">${cliente.telefone || 'Sem telefone'} ${cliente.paciente_nome ? '· Paciente: ' + esc(cliente.paciente_nome) : ''}</div></div>`;
            const btnTroca = h('button', { className: 'btn btn-ghost btn-sm', onClick: () => { cliente = null; renderEtapa(); } }, '✏️ Trocar');
            cliCard.appendChild(btnTroca);
            body.appendChild(cliCard);

            body.appendChild(h('button', { className: 'btn btn-primary btn-block', style: 'padding:14px;font-size:15px', onClick: () => { etapa = 2; renderEtapa(); } }, 'Próximo: Produtos →'));
            return;
          }

          // Busca rápida
          const searchLabel = h('label', { className: 'label' }, 'Buscar cliente cadastrado');
          body.appendChild(searchLabel);
          const searchInp = h('input', { className: 'input', placeholder: '🔍 Nome ou telefone...', style: 'margin-bottom:8px;font-size:15px' });
          body.appendChild(searchInp);
          const resList = h('div', { style: 'border:1px solid var(--border);border-radius:10px;max-height:160px;overflow-y:auto;margin-bottom:16px' });
          body.appendChild(resList);

          let db;
          searchInp.addEventListener('input', e => {
            clearTimeout(db);
            db = setTimeout(async () => {
              const q = e.target.value.trim();
              if (q.length < 2) { resList.innerHTML = ''; return; }
              const r = await Api.get('/clientes', { q, limit: 5 }).catch(() => ({}));
              resList.innerHTML = '';
              const list = r?.clientes || [];
              if (!list.length) { resList.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-3);font-size:13px">Nenhum cliente encontrado</div>'; return; }
              list.forEach(c => {
                const row = h('div', { style: 'padding:12px;cursor:pointer;border-bottom:1px solid var(--border)', onClick: () => {
                  cliente = { id: c.id, nome: c.nome, telefone: c.telefone, paciente_nome: c.paciente_nome,
                    data_nascimento: c.paciente_nascimento || c.data_nascimento };
                  renderEtapa();
                }});
                row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-subtle)');
                row.addEventListener('mouseleave', () => row.style.background = '');
                row.innerHTML = `<div style="font-weight:600;font-size:13px">${esc(c.nome)}</div><div style="font-size:11px;color:var(--text-3)">${c.telefone || 'Sem tel'} ${c.paciente_nome ? '· ' + c.paciente_nome : ''}</div>`;
                resList.appendChild(row);
              });
            }, 350);
          });
          setTimeout(() => searchInp.focus(), 100);

          // Separador
          const sep = h('div', { style: 'text-align:center;margin:12px 0;position:relative' });
          sep.innerHTML = '<span style="background:var(--bg-card);padding:0 12px;font-size:12px;color:var(--text-3);position:relative;z-index:1">ou cadastrar novo cliente</span><div style="position:absolute;top:50%;left:0;right:0;border-top:1px solid var(--border);z-index:0"></div>';
          body.appendChild(sep);

          // Form novo cliente
          const fd = {};
          const grid = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px' });
          const mkF = (lbl, key, ph, full, type='text', inputmode='text') => {
            const d = h('div', { style: full ? 'grid-column:1/-1' : '' });
            d.appendChild(h('label', { className: 'label', style: 'font-size:11px' }, lbl));
            const inp = h('input', { className: 'input', placeholder: ph, type, inputMode: inputmode, style: 'font-size:14px' });
            inp.addEventListener('input', e => { fd[key] = e.target.value; });
            d.appendChild(inp);
            return d;
          };
          grid.appendChild(mkF('Nome do responsável *', 'nome', 'Nome completo', true));
          grid.appendChild(mkF('WhatsApp', 'telefone', '(98) 9 9999-9999', false, 'tel', 'tel'));
          grid.appendChild(mkF('Nome do bebê/paciente', 'paciente_nome', 'Nome do paciente', false));
          grid.appendChild(mkF('Data de nascimento', 'data_nascimento', 'DD/MM/AAAA', false));
          body.appendChild(grid);

          body.appendChild(h('button', { className: 'btn btn-primary btn-block', style: 'padding:14px;font-size:15px', onClick: () => {
            if (!fd.nome?.trim()) return Toast.show('Informe o nome do responsável', 'error');
            let dn = null;
            if (fd.data_nascimento) {
              const [d, m, a] = fd.data_nascimento.split('/');
              if (a && m && d) dn = `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
            }
            cliente = { nome: fd.nome.trim(), telefone: fd.telefone, paciente_nome: fd.paciente_nome, data_nascimento: dn };
            etapa = 2; renderEtapa();
          }}, 'Próximo: Produtos →'));
        }

        // ── ETAPA 2: PRODUTOS ─────────────────────────────────────
        if (etapa === 2) {
          await getProdutos();

          const comAtual = comCalc(carrinho);
          const totAtual = carrinho.reduce((s, i) => s + i.valor * i.qty, 0);

          const hd = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px' });
          hd.appendChild(h('div', { style: 'font-size:16px;font-weight:700;color:var(--text-1)' }, '📋 O que vai levar?'));
          if (carrinho.length) {
            const totBadge = h('div', { style: 'background:var(--primary-bg);border:1px solid var(--primary);border-radius:20px;padding:5px 12px;display:flex;gap:10px;align-items:center' });
            totBadge.innerHTML = `<span style="font-size:12px;color:var(--primary);font-weight:600">${carrinho.length} item${carrinho.length > 1 ? 's' : ''} · ${fmtR(totAtual)}</span>`;
            hd.appendChild(totBadge);
          }
          body.appendChild(hd);

          // Tabs
          const tabs = h('div', { style: 'display:flex;gap:6px;margin-bottom:14px;background:var(--bg-subtle);padding:4px;border-radius:10px' });
          ['planos', 'vacinas'].forEach(t => {
            const lbl = t === 'planos' ? '📋 Planos Vacinais' : '💉 Vacinas Avulsas';
            const btn = h('button', {
              style: `flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s;background:${tabProd===t?'white':'transparent'};color:${tabProd===t?'var(--primary)':'var(--text-3)'};${tabProd===t?'box-shadow:0 1px 4px rgba(0,0,0,.1)':''}`,
              onClick: () => { tabProd = t; renderEtapa(); }
            }, lbl);
            tabs.appendChild(btn);
          });
          body.appendChild(tabs);

          // Grid produtos
          const prodGrid = h('div', { style: 'display:grid;gap:8px;max-height:340px;overflow-y:auto;padding-right:4px' });

          if (tabProd === 'planos') {
            (produtos?.planos || []).forEach(p => {
              const noCart = carrinho.find(c => c.id === p.id && c.tipo === 'plano');
              const valor = formaPgto === 'cartao' ? (p.valorCartao || p.valorAvista || 0) : (p.valorAvista || 0);
              const card = h('div', {
                style: `display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:12px;border:2px solid ${noCart?'var(--primary)':'var(--border)'};background:${noCart?'var(--primary-bg)':'var(--bg-card)'};cursor:pointer;transition:all .15s`,
                onClick: () => {
                  if (noCart) carrinho = carrinho.filter(c => !(c.id === p.id && c.tipo === 'plano'));
                  else carrinho.push({ tipo:'plano', id:p.id, nome:p.nome, valor, qty:1, ehGripe:false });
                  renderEtapa();
                }
              });
              card.innerHTML = `
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--text-1)">${esc(p.nome)}</div>
                  <div style="font-size:11px;color:var(--text-3);margin-top:2px">👶 ${p.idadeInicio}–${p.idadeFim} meses · ${p.vacinas?.length||0} vacinas</div>
                  ${noCart?'<div style="font-size:11px;color:var(--primary);margin-top:3px;font-weight:600">✓ Adicionado</div>':''}
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-size:16px;font-weight:800;color:${noCart?'var(--primary)':'var(--text-1)'}">${fmtR(valor)}</div>
                  <div style="font-size:10px;color:#16a34a">💰 ${fmtR(valor*0.01)}</div>
                </div>
              `;
              prodGrid.appendChild(card);
            });
          } else {
            (produtos?.vacinas || []).filter(v => v.valorVendaSugerido > 0).forEach(v => {
              const noCart = carrinho.find(c => c.id === v.id && c.tipo === 'vacina');
              const ehG = v.nome.toUpperCase().includes('INFLUEN') || v.nome.toUpperCase().includes('GRIPE');
              const card = h('div', {
                style: `display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:10px;border:2px solid ${noCart?'var(--primary)':'var(--border)'};background:${noCart?'var(--primary-bg)':'var(--bg-card)'};cursor:pointer;transition:all .15s`,
                onClick: () => {
                  if (noCart) carrinho = carrinho.filter(c => !(c.id === v.id && c.tipo === 'vacina'));
                  else carrinho.push({ tipo:'vacina', id:v.id, nome:v.nome, valor:v.valorVendaSugerido, qty:1, ehGripe:ehG });
                  renderEtapa();
                }
              });
              card.innerHTML = `
                <div>
                  <div style="font-size:12px;font-weight:600;color:var(--text-1)">${esc(v.nome)}</div>
                  ${ehG?'<div style="display:inline-block;background:#fef9c3;color:#854d0e;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-top:3px">+R$10 bônus gripe</div>':''}
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-size:15px;font-weight:700;color:${noCart?'var(--primary)':'var(--text-1)'}">${fmtR(v.valorVendaSugerido)}</div>
                  ${noCart?'<div style="font-size:10px;color:var(--primary);font-weight:600">✓</div>':''}
                </div>
              `;
              prodGrid.appendChild(card);
            });
          }
          body.appendChild(prodGrid);

          // Resumo mini e forma pagamento
          if (carrinho.length) {
            const mini = h('div', { style: 'margin-top:14px;padding:12px;background:var(--bg-subtle);border-radius:10px;display:flex;justify-content:space-between;align-items:center' });
            mini.innerHTML = `<span style="font-size:13px;color:var(--text-2)">${carrinho.length} item${carrinho.length>1?'s':''}</span><span style="font-size:15px;font-weight:800;color:var(--primary)">${fmtR(totAtual)}</span>`;
            body.appendChild(mini);
            const comMini = h('div', { style: 'text-align:center;font-size:12px;color:#16a34a;font-weight:600;margin-top:6px' });
            comMini.textContent = `💰 Sua comissão: ${fmtR(comAtual)}`;
            body.appendChild(comMini);
          }

          // Pagamento
          const pgRow = h('div', { style: 'display:flex;gap:6px;margin-top:12px;margin-bottom:14px' });
          ['avista','cartao','pix'].forEach(fp => {
            const l = {avista:'💵 À Vista',cartao:'💳 Cartão',pix:'📱 PIX'}[fp];
            pgRow.appendChild(h('button', {
              className:`btn btn-sm ${formaPgto===fp?'btn-primary':'btn-outline'}`,
              style:'flex:1;font-size:11px',
              onClick:()=>{ formaPgto=fp; renderEtapa(); }
            }, l));
          });
          body.appendChild(pgRow);

          // Nav
          const nav = h('div', { style: 'display:grid;grid-template-columns:1fr 2fr;gap:8px' });
          nav.appendChild(h('button', { className: 'btn btn-outline', onClick: () => { etapa = 1; renderEtapa(); } }, '← Voltar'));
          nav.appendChild(h('button', {
            className: 'btn btn-primary',
            style: 'padding:12px;font-size:14px',
            disabled: !carrinho.length,
            style: `padding:12px;font-size:14px;opacity:${carrinho.length?'1':'0.5'}`,
            onClick: () => { if (carrinho.length) { etapa = 3; renderEtapa(); } else Toast.show('Adicione pelo menos um produto', 'error'); }
          }, `Revisar e Confirmar →`));
          body.appendChild(nav);
        }

        // ── ETAPA 3: CONFIRMAÇÃO ─────────────────────────────────
        if (etapa === 3) {
          const total = carrinho.reduce((s, i) => s + i.valor * i.qty, 0);
          const comissao = comCalc(carrinho);

          body.appendChild(h('div', { style: 'font-size:16px;font-weight:700;color:var(--text-1);margin-bottom:16px' }, '✅ Revisar e Confirmar'));

          // Cliente
          const cBox = h('div', { style: 'background:var(--bg-subtle);border-radius:10px;padding:14px;margin-bottom:12px' });
          cBox.innerHTML = `<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">👤 Cliente</div><div style="font-size:14px;font-weight:600;color:var(--text-1)">${esc(cliente.nome)}</div>${cliente.paciente_nome?`<div style="font-size:12px;color:var(--text-3)">Paciente: ${esc(cliente.paciente_nome)}</div>`:''}${cliente.data_nascimento?`<div style="font-size:12px;color:var(--text-3)">Nasc: ${new Date(cliente.data_nascimento+'T12:00:00').toLocaleDateString('pt-BR')}</div>`:''}`;
          body.appendChild(cBox);

          // Itens
          const iBox = h('div', { style: 'border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:12px' });
          iBox.appendChild(h('div', { style: 'padding:10px 14px;background:var(--bg-subtle);font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em' }, '📋 Itens da Venda'));
          carrinho.forEach(i => {
            const r = h('div', { style: 'display:flex;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);font-size:13px' });
            r.appendChild(h('span', { style: 'color:var(--text-1)' }, esc(i.nome)));
            r.appendChild(h('strong', null, fmtR(i.valor)));
            iBox.appendChild(r);
          });
          body.appendChild(iBox);

          // Totais
          const tBox = h('div', { style: 'background:var(--bg-subtle);border-radius:10px;padding:14px;margin-bottom:16px' });
          tBox.innerHTML = `
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
              <span style="color:var(--text-3)">Forma de pagamento</span>
              <strong>${{avista:'💵 À Vista',cartao:'💳 Cartão',pix:'📱 PIX'}[formaPgto]}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:1px solid var(--border);padding-top:10px;margin-bottom:10px">
              <span>Total</span>
              <span style="color:var(--primary)">${fmtR(total)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac">
              <span style="font-size:13px;font-weight:700;color:#16a34a">💰 Sua Comissão</span>
              <span style="font-size:20px;font-weight:800;color:#16a34a">${fmtR(comissao)}</span>
            </div>
          `;
          body.appendChild(tBox);

          const nav = h('div', { style: 'display:grid;grid-template-columns:1fr 2fr;gap:8px' });
          nav.appendChild(h('button', { className: 'btn btn-outline', onClick: () => { etapa = 2; renderEtapa(); } }, '← Voltar'));

          const btnConf = h('button', { className: 'btn btn-primary', style: 'padding:14px;font-size:15px;font-weight:700', onClick: async () => {
            btnConf.disabled = true;
            btnConf.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Registrando...';
            const payload = {
              cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, paciente_nome: cliente.paciente_nome },
              data_nascimento_paciente: cliente.data_nascimento,
              itens: carrinho.map(i => ({ tipo: i.tipo, id: i.id, nome: i.nome, valor: i.valor * i.qty })),
              forma_pagamento: formaPgto,
              vendedor_id: AppState.usuario?.id
            };
            const r = await Api.vendasFechar(payload).catch(e => null);
            if (r?.success) {
              close();
              Toast.show(`✅ Venda registrada! 💰 Comissão: ${fmtR(r.comissao_total || comissao)}`);
              await drawMain();
            } else {
              Toast.show(r?.error || 'Erro ao registrar venda', 'error');
              btnConf.disabled = false;
              btnConf.textContent = '✓ Confirmar Venda';
            }
          }}, '✓ Confirmar Venda');
          nav.appendChild(btnConf);
          body.appendChild(nav);
        }
      }

      await renderEtapa();
    }, '560px');
  }

  await getProdutos();
  await drawMain();
  return wrap;
}
