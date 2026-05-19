// ════════════════════════════════════════════════════════════════
// 📊 DESEMPENHO COMERCIAL — Painel Master
// Comparativo vendedoras, ranking, metas
// ════════════════════════════════════════════════════════════════
async function renderDesempenho() {
  const W = h('div', { className: 'fade-in' });

  const META = 50000;
  const R = v => 'R$\u00a0' + Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const Pct = v => Number(v||0).toFixed(1) + '%';

  let mes = new Date().toISOString().slice(0,7);
  let dados = null;
  let filtroVendedor = '';

  function nomeMes(m) {
    const [a,mn] = m.split('-');
    return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][+mn-1] + '/' + a;
  }

  function navMes(d) {
    const [a,mn] = mes.split('-').map(Number);
    const dt = new Date(a, mn-1+d, 1);
    mes = dt.toISOString().slice(0,7);
    draw();
  }

  const STATUS_COR = { ativo:'#16a34a', concluido:'#2563eb', pendente:'#f59e0b', cancelado:'#ef4444' };
  const pgtoLabel = { avista:'À Vista', cartao:'Cartão', pix:'PIX' };

  async function draw() {
    W.innerHTML = '<div style="padding:20px;color:var(--text-3);font-size:13px">Carregando dashboard...</div>';
    dados = await Api.comissoesDashboard({ mes }).catch(() => null);
    W.innerHTML = '';

    if(!dados) { W.innerHTML = '<div style="padding:20px;color:#ef4444">Erro ao carregar.</div>'; return; }

    // ── HEADER ────────────────────────────────────────────────
    const hdr = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px' });
    const lH = h('div');
    lH.innerHTML = `<h1 style="font-size:22px;font-weight:800;margin:0">📊 Desempenho Comercial</h1><p style="font-size:13px;color:var(--text-3);margin:3px 0 0">${nomeMes(mes)} · ${dados.qtdVendas} vendas</p>`;
    hdr.appendChild(lH);

    const nav = h('div', { style: 'display:flex;align-items:center;gap:8px' });
    nav.appendChild(h('button', { className: 'btn btn-outline btn-sm', onClick: () => navMes(-1) }, '← Anterior'));
    nav.appendChild(h('span', { style: 'font-size:14px;font-weight:700;min-width:100px;text-align:center' }, nomeMes(mes)));
    const futuro = mes >= new Date().toISOString().slice(0,7);
    const bN = h('button', { className: 'btn btn-outline btn-sm', disabled: futuro, onClick: () => navMes(1) }, 'Próximo →');
    if(futuro) bN.style.opacity = '0.4';
    nav.appendChild(bN);
    hdr.appendChild(nav);
    W.appendChild(hdr);

    // ── CARDS GLOBAIS ─────────────────────────────────────────
    const topCards = h('div', { style: 'display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px' });
    const mkC = (ico,lbl,val,cor,sub) => {
      const c = h('div', { style: `padding:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:14px;border-left:4px solid ${cor}` });
      c.innerHTML = `<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">${ico} ${lbl}</div><div style="font-size:22px;font-weight:900;color:${cor};line-height:1.1">${val}</div>${sub?`<div style="font-size:11px;color:var(--text-3);margin-top:4px">${sub}</div>`:''}`;
      return c;
    };
    topCards.appendChild(mkC('💵','Faturamento',R(dados.totalGeral),'#2563eb',`${dados.qtdVendas} vendas no mês`));
    topCards.appendChild(mkC('💰','Total Comissões',R(dados.totalCom),'#16a34a','Soma de todas as vendedoras'));
    topCards.appendChild(mkC('👥','Vendedoras Ativas',dados.porVendedor?.length||0,'#7c3aed','Com vendas no período'));
    topCards.appendChild(mkC('📈','Ticket Médio',R(dados.qtdVendas?dados.totalGeral/dados.qtdVendas:0),'#0891b2','Por venda'));
    W.appendChild(topCards);

    // ── RANKING VENDEDORAS ────────────────────────────────────
    const rankBox = h('div', { style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px' });
    rankBox.appendChild(h('div', { style: 'font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:14px' }, '🏆 Ranking de Vendedoras'));

    const vendedores = dados.porVendedor || [];
    if(!vendedores.length) {
      rankBox.innerHTML += '<div style="padding:16px;text-align:center;color:var(--text-3);font-size:13px">Nenhuma venda registrada.</div>';
    } else {
      vendedores.forEach((v, idx) => {
        const pct = Math.min(100, v.pctMeta);
        const cor = pct>=100?'#16a34a':pct>=50?'#f59e0b':'#ef4444';
        const medal = ['🥇','🥈','🥉'][idx] || `${idx+1}º`;
        const card = h('div', { style: `background:var(--bg-subtle);border-radius:12px;padding:14px;margin-bottom:8px;border:1px solid var(--border)` });
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span style="font-size:22px;flex-shrink:0">${ medal}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:700;color:var(--text-1)">${esc(v.nome)}</div>
              <div style="font-size:11px;color:var(--text-3)">${v.cargo||v.perfil} · ${v.qtd} venda${v.qtd!==1?'s':''}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:16px;font-weight:800;color:var(--primary)">${R(v.totalVendido)}</div>
              <div style="font-size:11px;color:#16a34a">💰 ${R(v.comissao)}</div>
            </div>
          </div>
          <div style="background:var(--border);border-radius:6px;height:8px;overflow:hidden;margin-bottom:6px">
            <div style="height:100%;width:${pct}%;background:${cor};border-radius:6px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-3)">
            <span>${Pct(pct)} da meta</span>
            <span>Bônus: ${R(v.bonus)}</span>
            <span>Ticket médio: ${R(v.ticketMedio)}</span>
          </div>
        `;
        rankBox.appendChild(card);
        // Botão ver extrato individual
        const btnVer = h('button', { className: 'btn btn-ghost btn-sm', style: 'margin-top:4px;font-size:11px;width:100%', onClick: () => {
          filtroVendedor = String(v.id);
          drawTabela();
        }}, `Ver vendas de ${v.nome.split(' ')[0]} →`);
        rankBox.appendChild(btnVer);
      });
    }
    W.appendChild(rankBox);

    // ── GRID: Ranking Produtos + Tabela ──────────────────────
    const grid2 = h('div', { style: 'display:grid;grid-template-columns:260px 1fr;gap:14px' });

    // Ranking produtos
    const prodBox = h('div', { style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;padding:16px' });
    prodBox.appendChild(h('div', { style: 'font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text-1)' }, '📋 Produtos Mais Vendidos'));
    (dados.ranking||[]).forEach((p, i) => {
      const maxVal = dados.ranking[0]?.total || 1;
      const pct = (p.total/maxVal)*100;
      const d = h('div', { style: 'margin-bottom:10px' });
      d.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="font-weight:600;color:var(--text-1);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.nome)}</span><span style="color:var(--primary);font-weight:700">${R(p.total)}</span></div><div style="background:var(--border);border-radius:4px;height:5px"><div style="height:100%;width:${pct}%;background:var(--primary);border-radius:4px"></div></div>`;
      prodBox.appendChild(d);
    });
    if(!dados.ranking?.length) prodBox.innerHTML += '<div style="font-size:12px;color:var(--text-3);text-align:center;padding:16px">Sem dados</div>';
    grid2.appendChild(prodBox);

    // Tabela vendas
    const tabelaBox = h('div', { style: 'background:var(--bg-card);border:1px solid var(--border);border-radius:14px;overflow:hidden' });
    const tHdr = h('div', { style: 'padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px' });
    tHdr.innerHTML = '<div style="font-size:13px;font-weight:700">📋 Todas as Vendas</div>';

    // Filtro vendedor
    const sel = h('select', { style: 'border:1px solid var(--border);border-radius:8px;padding:5px 8px;font-size:12px;background:var(--bg-card);color:var(--text-1)', onChange: e => { filtroVendedor = e.target.value; drawTabela(); } });
    sel.appendChild(h('option', { value: '' }, 'Todas as vendedoras'));
    (dados.porVendedor||[]).forEach(v => sel.appendChild(h('option', { value: String(v.id) }, v.nome)));
    if(filtroVendedor) sel.value = filtroVendedor;
    tHdr.appendChild(sel);
    tabelaBox.appendChild(tHdr);

    const tbody_wrap = h('div', { style: 'overflow-x:auto;max-height:400px;overflow-y:auto' });
    tabelaBox.appendChild(tbody_wrap);
    grid2.appendChild(tabelaBox);

    function drawTabela() {
      tbody_wrap.innerHTML = '';
      sel.value = filtroVendedor;
      const lista = (dados.planos||[]).filter(p => !filtroVendedor || String((dados.porVendedor?.find(v=>v.nome===p.vendedor)||{id:null})?.id||'') === filtroVendedor || p.vendedor?.toLowerCase().includes((dados.porVendedor?.find(v=>String(v.id)===filtroVendedor)||{nome:''}).nome?.toLowerCase()||''));
      if(!lista.length) { tbody_wrap.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px">Sem vendas para este filtro.</div>'; return; }
      const t = h('table', { style: 'width:100%;border-collapse:collapse;font-size:12px' });
      t.innerHTML = `<thead><tr style="background:var(--bg-subtle)">${['Data','Vendedora','Cliente','Produto','Valor','Pgto','Status','Comissão'].map(c=>`<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:var(--text-3);white-space:nowrap;text-transform:uppercase">${c}</th>`).join('')}</tr></thead>`;
      const tb = h('tbody');
      lista.forEach(p => {
        const tr = h('tr', { style: 'border-bottom:1px solid var(--border)' });
        const cor = STATUS_COR[p.status]||'#64748b';
        const dt = new Date(p.criadoEm).toLocaleDateString('pt-BR');
        tr.innerHTML = `
          <td style="padding:9px 12px;color:var(--text-2);white-space:nowrap">${dt}</td>
          <td style="padding:9px 12px;font-weight:600;color:var(--text-1)">${esc(p.vendedor||'—')}</td>
          <td style="padding:9px 12px;color:var(--text-2)">${esc(p.cliente||'—')}</td>
          <td style="padding:9px 12px;color:var(--text-2);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.produto||'—')}</td>
          <td style="padding:9px 12px;font-weight:700;white-space:nowrap">${R(p.valorFinal)}</td>
          <td style="padding:9px 12px;color:var(--text-3)">${pgtoLabel[p.formaPagamento]||p.formaPagamento||'—'}</td>
          <td style="padding:9px 12px"><span style="padding:2px 7px;border-radius:10px;background:${cor}20;color:${cor};font-size:10px;font-weight:700">${p.status||'—'}</span></td>
          <td style="padding:9px 12px;font-weight:700;color:#16a34a;white-space:nowrap">${R(p.comissao)}</td>
        `;
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      tbody_wrap.appendChild(t);
    }
    drawTabela();

    W.appendChild(grid2);
  }

  await draw();
  return W;
}
