async function renderVendas() {
  const wrap = h('div', { className: 'fade-in' });

  // ── Estado do PDV ─────────────────────────────────────────────
  let produtos = null;
  let carrinho = []; // [{tipo, id, nome, valor, qty, ehGripe}]
  let cliente = null; // {id?, nome, telefone, paciente_nome, data_nascimento}
  let formaPgto = 'avista';
  let etapa = 'produtos'; // 'produtos' | 'cliente' | 'resumo'

  const comissaoTotal = () => carrinho.reduce((s, item) => {
    const c = (item.valor * item.qty) * 0.01;
    const bonus = item.ehGripe ? 10 * item.qty : 0;
    return s + c + bonus;
  }, 0);

  const totalVenda = () => carrinho.reduce((s, i) => s + i.valor * i.qty, 0);

  const fmtR = v => 'R$ ' + v.toFixed(2).replace('.', ',');

  // ── DRAW ──────────────────────────────────────────────────────
  async function draw() {
    wrap.innerHTML = '';

    // Header
    const hdr = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px' });
    hdr.appendChild(h('div', null,
      h('h1', { className: 'page-title', style: 'margin:0' }, '🛒 Vendas'),
      h('p', { className: 'page-subtitle' }, 'Selecione produtos e finalize a venda')
    ));

    // Comissão badge
    const comBadge = h('div', { style: 'background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:10px 18px;text-align:center' });
    comBadge.innerHTML = `<div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.05em">Minha Comissão</div><div style="font-size:22px;font-weight:800;color:#16a34a">${fmtR(comissaoTotal())}</div>`;
    hdr.appendChild(comBadge);
    wrap.appendChild(hdr);

    // Carregar produtos se necessário
    if (!produtos) {
      produtos = await Api.vendasProdutos();
    }

    // Layout PDV: produtos | carrinho
    const layout = h('div', { style: 'display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start' });

    // ── LADO ESQUERDO: Produtos ──────────────────────────────────
    const left = h('div');

    // TABS: Planos / Vacinas
    let tabAtiva = wrap._tabAtiva || 'planos';
    const tabs = h('div', { style: 'display:flex;gap:8px;margin-bottom:16px' });
    const mkTab = (lbl, key) => {
      const t = h('button', {
        className: `btn ${tabAtiva === key ? 'btn-primary' : 'btn-outline'}`,
        style: 'font-size:13px',
        onClick: () => { wrap._tabAtiva = key; draw(); }
      }, lbl);
      return t;
    };
    tabs.appendChild(mkTab('📋 Planos', 'planos'));
    tabs.appendChild(mkTab('💉 Vacinas Avulsas', 'vacinas'));
    left.appendChild(tabs);

    if (tabAtiva === 'planos') {
      // Grid de planos
      const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px' });
      (produtos?.planos || []).forEach(p => {
        const noCart = carrinho.find(c => c.id === p.id && c.tipo === 'plano');
        const card = h('div', {
          style: `padding:16px;border-radius:14px;border:2px solid ${noCart ? 'var(--primary)' : 'var(--border)'};background:${noCart ? 'var(--primary-bg)' : 'var(--bg-card)'};cursor:pointer;transition:all .15s`,
          onClick: () => {
            const valor = formaPgto === 'cartao' ? (p.valorCartao || p.valorAvista || 0) : (p.valorAvista || 0);
            if (noCart) {
              carrinho = carrinho.filter(c => !(c.id === p.id && c.tipo === 'plano'));
            } else {
              carrinho.push({ tipo: 'plano', id: p.id, nome: p.nome, valor, qty: 1, ehGripe: false });
            }
            draw();
          }
        });
        card.innerHTML = `
          <div style="font-size:13px;font-weight:700;color:var(--text-1);margin-bottom:6px">${esc(p.nome)}</div>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">👶 ${p.idadeInicio}–${p.idadeFim} meses · ${p.vacinas?.length || 0} vacinas</div>
          <div style="font-size:18px;font-weight:800;color:var(--primary)">${fmtR(p.valorAvista || 0)}</div>
          <div style="font-size:10px;color:var(--text-4);margin-top:2px">${p.descPagamento || 'À vista'}</div>
          ${noCart ? '<div style="margin-top:8px;font-size:11px;font-weight:700;color:var(--primary)">✓ No carrinho</div>' : ''}
        `;
        grid.appendChild(card);
      });
      left.appendChild(grid);
    } else {
      // Lista de vacinas
      const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px' });
      (produtos?.vacinas || []).filter(v => v.valorVendaSugerido > 0).forEach(v => {
        const ehGripe = v.nome.toUpperCase().includes('INFLUEN') || v.nome.toUpperCase().includes('GRIPE');
        const noCart = carrinho.find(c => c.id === v.id && c.tipo === 'vacina');
        const card = h('div', {
          style: `padding:12px;border-radius:12px;border:2px solid ${noCart ? 'var(--primary)' : 'var(--border)'};background:${noCart ? 'var(--primary-bg)' : 'var(--bg-card)'};cursor:pointer;position:relative`,
          onClick: () => {
            if (noCart) {
              carrinho = carrinho.filter(c => !(c.id === v.id && c.tipo === 'vacina'));
            } else {
              carrinho.push({ tipo: 'vacina', id: v.id, nome: v.nome, valor: v.valorVendaSugerido, qty: 1, ehGripe });
            }
            draw();
          }
        });
        card.innerHTML = `
          ${ehGripe ? '<div style="position:absolute;top:6px;right:6px;background:#fef9c3;color:#854d0e;font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px">+R$10 bonus</div>' : ''}
          <div style="font-size:12px;font-weight:600;color:var(--text-1);margin-bottom:6px;line-height:1.3">${esc(v.nome)}</div>
          <div style="font-size:16px;font-weight:800;color:var(--primary)">${fmtR(v.valorVendaSugerido)}</div>
          ${noCart ? '<div style="font-size:10px;color:var(--primary);font-weight:700;margin-top:4px">✓ Selecionada</div>' : ''}
        `;
        grid.appendChild(card);
      });
      left.appendChild(grid);
    }

    layout.appendChild(left);

    // ── LADO DIREITO: Carrinho ───────────────────────────────────
    const right = h('div', { style: 'position:sticky;top:80px' });
    const cartBox = h('div', { style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:16px' });

    // Cliente
    const cliSection = h('div', { style: 'margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border)' });
    cliSection.appendChild(h('div', { style: 'font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px' }, '👤 Cliente'));
    if (cliente) {
      const cliInfo = h('div', { style: 'display:flex;justify-content:space-between;align-items:center' });
      cliInfo.appendChild(h('div', null,
        h('div', { style: 'font-size:13px;font-weight:700;color:var(--text-1)' }, esc(cliente.nome)),
        h('div', { style: 'font-size:11px;color:var(--text-3)' }, cliente.telefone || 'Sem telefone')
      ));
      cliInfo.appendChild(h('button', { className: 'btn btn-ghost btn-sm', onClick: () => { cliente = null; draw(); } }, '✕'));
      cliSection.appendChild(cliInfo);
    } else {
      cliSection.appendChild(h('button', { className: 'btn btn-outline btn-block', style: 'font-size:12px', onClick: () => abrirModalCliente() }, '+ Identificar Cliente'));
    }
    cartBox.appendChild(cliSection);

    // Itens do carrinho
    const itensBox = h('div', { style: 'min-height:60px;margin-bottom:14px' });
    if (!carrinho.length) {
      itensBox.appendChild(h('div', { style: 'text-align:center;padding:20px;color:var(--text-4);font-size:13px' }, 'Nenhum item selecionado'));
    } else {
      carrinho.forEach(item => {
        const row = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)' });
        const info = h('div', { style: 'flex:1;min-width:0' });
        info.appendChild(h('div', { style: 'font-size:12px;font-weight:600;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, esc(item.nome)));
        const com = (item.valor * item.qty * 0.01) + (item.ehGripe ? 10 * item.qty : 0);
        info.appendChild(h('div', { style: 'font-size:10px;color:#16a34a' }, `comissão: ${fmtR(com)}`));
        row.appendChild(info);
        const vals = h('div', { style: 'text-align:right;flex-shrink:0;margin-left:8px' });
        vals.appendChild(h('div', { style: 'font-size:13px;font-weight:700;color:var(--text-1)' }, fmtR(item.valor * item.qty)));
        vals.appendChild(h('button', { style: 'font-size:10px;color:#ef4444;border:none;background:none;cursor:pointer', onClick: () => { carrinho = carrinho.filter(c => c !== item); draw(); } }, '✕ Remover'));
        row.appendChild(vals);
        itensBox.appendChild(row);
      });
    }
    cartBox.appendChild(itensBox);

    // Forma de pagamento
    const pgtoRow = h('div', { style: 'display:flex;gap:6px;margin-bottom:14px' });
    ['avista', 'cartao', 'pix'].forEach(fp => {
      const lbl = { avista: '💵 À Vista', cartao: '💳 Cartão', pix: '📱 PIX' }[fp];
      pgtoRow.appendChild(h('button', {
        className: `btn btn-sm ${formaPgto === fp ? 'btn-primary' : 'btn-outline'}`,
        style: 'flex:1;font-size:10px',
        onClick: () => { formaPgto = fp; draw(); }
      }, lbl));
    });
    cartBox.appendChild(pgtoRow);

    // Totais
    const tots = h('div', { style: 'background:var(--bg-subtle);border-radius:10px;padding:12px;margin-bottom:14px' });
    tots.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
        <span style="color:var(--text-3)">Subtotal</span>
        <strong>${fmtR(totalVenda())}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
        <span style="color:#16a34a">💰 Sua Comissão</span>
        <strong style="color:#16a34a">${fmtR(comissaoTotal())}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:1px solid var(--border);padding-top:8px">
        <span>Total</span>
        <span style="color:var(--primary)">${fmtR(totalVenda())}</span>
      </div>
    `;
    cartBox.appendChild(tots);

    // Botão finalizar
    const btnFin = h('button', {
      className: 'btn btn-primary btn-block',
      style: 'font-size:14px;padding:14px;font-weight:700',
      disabled: !carrinho.length || !cliente,
      onClick: () => finalizarVenda()
    }, carrinho.length && cliente ? '✓ Finalizar Venda' : !cliente ? '⚠️ Identifique o cliente' : '⚠️ Adicione produtos');
    if (!carrinho.length || !cliente) btnFin.style.opacity = '0.6';
    cartBox.appendChild(btnFin);

    right.appendChild(cartBox);
    layout.appendChild(right);
    wrap.appendChild(layout);
  }

  // ── Modal: Cadastrar / Buscar Cliente ─────────────────────────
  function abrirModalCliente() {
    showModal('👤 Cliente', async (body, close) => {
      let buscaResult = [];
      const fd = { nome: '', telefone: '', paciente_nome: '', data_nascimento: '' };

      // Busca rápida
      const searchBox = h('div', { style: 'margin-bottom:16px' });
      searchBox.appendChild(h('label', { className: 'label' }, 'Buscar cliente existente'));
      const inp = h('input', { className: 'input', placeholder: 'Nome ou telefone...', inputMode: 'text' });
      let debounce;
      inp.addEventListener('input', e => {
        clearTimeout(debounce);
        debounce = setTimeout(async () => {
          if (e.target.value.length < 2) { resultList.innerHTML = ''; return; }
          const r = await Api.get('/clientes', { q: e.target.value, limit: 5 });
          resultList.innerHTML = '';
          (r?.clientes || []).forEach(c => {
            const row = h('div', { style: 'padding:10px;border-bottom:1px solid var(--border);cursor:pointer;border-radius:8px', onClick: () => {
              cliente = { id: c.id, nome: c.nome, telefone: c.telefone };
              close(); draw();
            }});
            row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-subtle)');
            row.addEventListener('mouseleave', () => row.style.background = '');
            row.innerHTML = `<div style="font-size:13px;font-weight:600">${esc(c.nome)}</div><div style="font-size:11px;color:var(--text-3)">${c.telefone || 'Sem telefone'}</div>`;
            resultList.appendChild(row);
          });
        }, 350);
      });
      searchBox.appendChild(inp);
      const resultList = h('div', { style: 'border:1px solid var(--border);border-radius:8px;max-height:200px;overflow-y:auto;margin-top:6px' });
      searchBox.appendChild(resultList);
      body.appendChild(searchBox);

      // Divisor
      const div = h('div', { style: 'text-align:center;margin:14px 0;color:var(--text-3);font-size:12px;position:relative' });
      div.innerHTML = '<span style="background:var(--bg-card);padding:0 10px;position:relative;z-index:1">ou cadastrar novo</span><hr style="position:absolute;top:50%;left:0;right:0;border:none;border-top:1px solid var(--border);z-index:0">';
      body.appendChild(div);

      // Formulário novo cliente
      const form = h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px' });
      const mkField = (lbl, key, placeholder, span1) => {
        const d = h('div', { style: span1 ? 'grid-column:1/-1' : '' });
        d.appendChild(h('label', { className: 'label', style: 'font-size:11px' }, lbl));
        const i = h('input', { className: 'input', placeholder, style: 'font-size:14px' });
        i.addEventListener('input', e => { fd[key] = e.target.value; });
        d.appendChild(i);
        return d;
      };
      form.appendChild(mkField('Nome do Responsável *', 'nome', 'Nome completo', true));
      form.appendChild(mkField('Telefone (WhatsApp)', 'telefone', '(98) 9...', false));
      form.appendChild(mkField('Nome do Paciente', 'paciente_nome', 'Nome do bebê', false));
      form.appendChild(mkField('Nasc. Paciente', 'data_nascimento', 'DD/MM/AAAA', false));
      body.appendChild(form);

      body.appendChild(h('div', { style: 'margin-top:14px' }));
      body.appendChild(h('button', {
        className: 'btn btn-primary btn-block', style: 'padding:12px',
        onClick: () => {
          if (!fd.nome.trim()) return Toast.show('Informe o nome', 'error');
          cliente = { nome: fd.nome.trim(), telefone: fd.telefone, paciente_nome: fd.paciente_nome,
            data_nascimento: fd.data_nascimento ? (() => {
              const [d,m,a] = fd.data_nascimento.split('/');
              return a && m && d ? `${a}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` : null;
            })() : null };
          close(); draw();
        }
      }, '✓ Confirmar Cliente'));
    }, '500px');
  }

  // ── Finalizar Venda ──────────────────────────────────────────
  async function finalizarVenda() {
    showModal('✓ Confirmar Venda', (body, close) => {
      body.innerHTML = `
        <div style="text-align:center;padding:10px 0 20px">
          <div style="font-size:36px;margin-bottom:10px">🛒</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:6px">Resumo da Venda</div>
          <div style="font-size:13px;color:var(--text-3);margin-bottom:16px">Cliente: <strong>${esc(cliente.nome)}</strong></div>
        </div>
      `;

      const lista = h('div', { style: 'margin-bottom:16px' });
      carrinho.forEach(i => {
        const row = h('div', { style: 'display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px' });
        row.appendChild(h('span', null, esc(i.nome)));
        row.appendChild(h('strong', null, fmtR(i.valor * i.qty)));
        lista.appendChild(row);
      });
      const totRow = h('div', { style: 'display:flex;justify-content:space-between;padding:10px 0;font-size:15px;font-weight:800' });
      totRow.appendChild(h('span', null, 'Total'));
      totRow.appendChild(h('span', { style: 'color:var(--primary)' }, fmtR(totalVenda())));
      lista.appendChild(totRow);
      const comRow = h('div', { style: 'display:flex;justify-content:space-between;padding:6px 10px;background:#f0fdf4;border-radius:8px;font-size:13px;font-weight:700;color:#16a34a' });
      comRow.appendChild(h('span', null, '💰 Comissão'));
      comRow.appendChild(h('span', null, fmtR(comissaoTotal())));
      lista.appendChild(comRow);
      body.appendChild(lista);

      const btnConf = h('button', { className: 'btn btn-primary btn-block', style: 'padding:14px;font-size:14px;font-weight:700', onClick: async () => {
        btnConf.disabled = true; btnConf.textContent = 'Processando...';
        const payload = {
          cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, paciente_nome: cliente.paciente_nome },
          data_nascimento_paciente: cliente.data_nascimento,
          itens: carrinho.map(i => ({ tipo: i.tipo, id: i.id, nome: i.nome, valor: i.valor * i.qty })),
          forma_pagamento: formaPgto,
          vendedor_id: AppState.usuario?.id
        };
        const r = await Api.vendasFechar(payload);
        if (r?.success) {
          close();
          Toast.show(`✅ Venda finalizada! Comissão: ${fmtR(r.comissao_total || comissaoTotal())}`);
          carrinho = []; cliente = null; draw();
        } else {
          Toast.show(r?.error || 'Erro ao finalizar', 'error');
          btnConf.disabled = false; btnConf.textContent = '✓ Confirmar';
        }
      }}, '✓ Confirmar e Registrar');
      body.appendChild(btnConf);
    }, '420px');
  }

  await draw();
  return wrap;
}
