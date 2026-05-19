// ════════════════════════════════════════════════════════════════
// 💰 MEU EXTRATO — Tela da Vendedora
// Comissão, Meta, Bônus — visão mensal
// ════════════════════════════════════════════════════════════════
async function renderExtrato() {
  const W = h('div', { className: 'fade-in' });

  const META = 50000, BONUS_BASE = 500, BONUS_META = 1000;
  const R = v => 'R$\u00a0' + Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const Pct = v => Number(v||0).toFixed(1) + '%';

  let mes = new Date().toISOString().slice(0,7);
  let dados = null;

  function nomeMes(m) {
    const [a,mn] = m.split('-');
    const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return nomes[+mn-1] + ' ' + a;
  }

  function navMes(delta) {
    const [a,mn] = mes.split('-').map(Number);
    const d = new Date(a, mn-1+delta, 1);
    mes = d.toISOString().slice(0,7);
    draw();
  }

  const STATUS_COR = { ativo:'#16a34a', concluido:'#2563eb', pendente:'#f59e0b', cancelado:'#ef4444', aguardando:'#8b5cf6' };
  const STATUS_LABEL = { ativo:'Ativo', concluido:'Concluído', pendente:'Pendente', cancelado:'Cancelado', aguardando:'Aguardando' };
  const pgtoLabel = { avista:'À Vista', cartao:'Cartão', pix:'PIX' };

  async function draw() {
    W.innerHTML = '';
    W.innerHTML = '<div style="padding:20px;color:var(--text-3);font-size:13px">Carregando extrato...</div>';

    dados = await Api.comissoesExtrato({ mes, vendedor_id: AppState.usuario?.id }).catch(() => null);
    W.innerHTML = '';

    if(!dados) {
      W.innerHTML = '<div style="padding:20px;color:#ef4444">Erro ao carregar extrato.</div>';
      return;
    }

    // ── HEADER ────────────────────────────────────────────────
    const hdr = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px' });

    const leftHdr = h('div');
    leftHdr.innerHTML = `<h1 style="font-size:22px;font-weight:800;margin:0">💰 Meu Extrato</h1><p style="font-size:13px;color:var(--text-3);margin:3px 0 0">${AppState.usuario?.nome?.split(' ')[0]} · ${nomeMes(mes)}</p>`;
    hdr.appendChild(leftHdr);

    // Navegação mês
    const nav = h('div', { style: 'display:flex;align-items:center;gap:8px' });
    nav.appendChild(h('button', { className: 'btn btn-outline btn-sm', onClick: () => navMes(-1) }, '← Anterior'));
    const mesLabel = h('span', { style: 'font-size:14px;font-weight:700;color:var(--text-1);min-width:130px;text-align:center' }, nomeMes(mes));
    nav.appendChild(mesLabel);
    const futuro = mes >= new Date().toISOString().slice(0,7);
    const btnNext = h('button', { className: 'btn btn-outline btn-sm', disabled: futuro, onClick: () => navMes(1) }, 'Próximo →');
    if(futuro) btnNext.style.opacity = '0.4';
    nav.appendChild(btnNext);
    hdr.appendChild(nav);
    W.appendChild(hdr);

    // ── CARDS DE RESUMO ────────────────────────────────────────
    const cards = h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px' });

    const mkCard = (ico, lbl, val, cor, sub) => {
      const c = h('div', { style: `padding:18px 16px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;border-left:4px solid ${cor}` });
      c.innerHTML = `<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${ico} ${lbl}</div><div style="font-size:24px;font-weight:900;color:${cor};line-height:1">${val}</div>${sub?`<div style="font-size:11px;color:var(--text-3);margin-top:4px">${sub}</div>`:''}`;
      return c;
    };

    cards.appendChild(mkCard('💵', 'Total Vendido', R(dados.totalVendido), '#2563eb', `${dados.qtdVendas} venda${dados.qtdVendas!==1?'s':''}`));
    cards.appendChild(mkCard('💰', 'Comissão (1%)', R(dados.totalComissao), '#16a34a', 'Sobre vendas realizadas'));
    cards.appendChild(mkCard('🎯', 'Meta do Mês', R(META), '#7c3aed', `${Pct(dados.pctMeta)} atingido`));
    W.appendChild(cards);

    const cards2 = h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px' });
    cards2.appendChild(mkCard('📋', 'Qtd. Vendas', dados.qtdVendas, '#0891b2', 'Planos fechados'));
    cards2.appendChild(mkCard('🏆', 'Bônus Previsto', R(dados.bonusPrevisao), '#d97706', dados.totalVendido >= META ? 'Meta atingida! 🎉' : `Faltam ${R(META - dados.totalVendido)}`));
    cards2.appendChild(mkCard('📊', 'Total a Receber', R(dados.totalComissao + dados.bonusPrevisao), '#16a34a', 'Comissão + Bônus'));
    W.appendChild(cards2);

    // ── BARRA DE META ─────────────────────────────────────────
    const metaBox = h('div', { style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:20px' });
    const pct = Math.min(100, dados.pctMeta);
    const corBarra = pct >= 100 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#ef4444';
    metaBox.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:14px;font-weight:700;color:var(--text-1)">🎯 Progresso da Meta</div>
        <div style="font-size:13px;font-weight:700;color:${corBarra}">${Pct(pct)}</div>
      </div>
      <div style="background:var(--border);border-radius:8px;height:12px;overflow:hidden;margin-bottom:10px">
        <div style="height:100%;width:${pct}%;background:${corBarra};border-radius:8px;transition:width .5s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3)">
        <span>R$ 0</span>
        <span style="color:${corBarra};font-weight:600">${R(dados.totalVendido)} vendido</span>
        <span>Meta: ${R(META)}</span>
      </div>
      ${pct >= 100 ? '<div style="margin-top:10px;padding:8px 12px;background:#f0fdf4;border-radius:8px;font-size:12px;font-weight:700;color:#16a34a;text-align:center">🎉 Parabéns! Meta atingida! Bônus: '+R(BONUS_META)+'</div>' :
        pct >= 50 ? `<div style="margin-top:10px;padding:8px 12px;background:#fffbeb;border-radius:8px;font-size:12px;color:#d97706;text-align:center">Bônus parcial: ${R(BONUS_BASE)} · Faltam ${R(META - dados.totalVendido)} para dobrar</div>` :
        `<div style="margin-top:10px;padding:8px 12px;background:#fef2f2;border-radius:8px;font-size:12px;color:#ef4444;text-align:center">Venda mais ${R(META - dados.totalVendido)} para desbloquear o bônus</div>`}
    `;
    W.appendChild(metaBox);

    // ── TABELA DE VENDAS ─────────────────────────────────────
    const tabelaBox = h('div', { style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden' });
    const tHdr = h('div', { style: 'padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center' });
    tHdr.innerHTML = '<div style="font-size:14px;font-weight:700;color:var(--text-1)">📋 Detalhamento de Vendas</div>';
    tabelaBox.appendChild(tHdr);

    if(!dados.planos?.length) {
      tabelaBox.innerHTML += '<div style="padding:32px;text-align:center;color:var(--text-3);font-size:13px">Nenhuma venda registrada neste mês.</div>';
    } else {
      const tw = h('div', { style: 'overflow-x:auto' });
      const t = h('table', { style: 'width:100%;border-collapse:collapse;font-size:12px' });
      t.innerHTML = `<thead><tr style="background:var(--bg-subtle)">${['Data','Cliente','Paciente','Produto','Valor','Pgto','Status','Comissão'].map(c=>`<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;white-space:nowrap">${c}</th>`).join('')}</tr></thead>`;
      const tbody = h('tbody');
      dados.planos.forEach(p => {
        const tr = h('tr', { style: 'border-bottom:1px solid var(--border)' });
        const dt = new Date(p.criadoEm).toLocaleDateString('pt-BR');
        const cor = STATUS_COR[p.status] || '#64748b';
        tr.innerHTML = `
          <td style="padding:10px 14px;color:var(--text-2);white-space:nowrap">${dt}</td>
          <td style="padding:10px 14px;font-weight:600;color:var(--text-1)">${esc(p.cliente||'—')}</td>
          <td style="padding:10px 14px;color:var(--text-3)">${esc(p.paciente||'—')}</td>
          <td style="padding:10px 14px;color:var(--text-2);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(p.produto||'')}">${esc(p.produto||'Vacina avulsa')}</td>
          <td style="padding:10px 14px;font-weight:700;color:var(--text-1);white-space:nowrap">${R(p.valorFinal)}</td>
          <td style="padding:10px 14px;color:var(--text-3)">${pgtoLabel[p.formaPagamento]||p.formaPagamento||'—'}</td>
          <td style="padding:10px 14px"><span style="padding:3px 8px;border-radius:12px;background:${cor}20;color:${cor};font-size:10px;font-weight:700">${STATUS_LABEL[p.status]||p.status}</span></td>
          <td style="padding:10px 14px;font-weight:700;color:#16a34a;white-space:nowrap">${R(p.comissao)}</td>
        `;
        tbody.appendChild(tr);
      });
      t.appendChild(tbody);
      tw.appendChild(t);
      tabelaBox.appendChild(tw);

      // Rodapé totais
      const foot = h('div', { style: 'padding:14px 18px;border-top:2px solid var(--border);background:var(--bg-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px' });
      foot.innerHTML = `
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div><span style="font-size:11px;color:var(--text-3)">Total vendido: </span><strong style="color:var(--primary)">${R(dados.totalVendido)}</strong></div>
          <div><span style="font-size:11px;color:var(--text-3)">Comissão: </span><strong style="color:#16a34a">${R(dados.totalComissao)}</strong></div>
          <div><span style="font-size:11px;color:var(--text-3)">Bônus previsto: </span><strong style="color:#d97706">${R(dados.bonusPrevisao)}</strong></div>
        </div>
        <div style="font-size:16px;font-weight:800;color:#16a34a">Total: ${R(dados.totalComissao + dados.bonusPrevisao)}</div>
      `;
      tabelaBox.appendChild(foot);
    }

    W.appendChild(tabelaBox);
  }

  await draw();
  return W;
}
