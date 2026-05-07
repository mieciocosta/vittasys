async function renderEstimativas() {
  const wrap = h('div', { className: 'fade-in' });
  const today = new Date();
  let selMes    = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0');
  let margemPct = 20;
  let data      = null;
  let loading   = false;
  let sortCol   = 'status';
  let sortAsc   = true;
  let filtroStatus = 'todos'; // todos | urgente | atencao | ok

  const addMes = (mes, n) => {
    const [a,m] = mes.split('-').map(Number);
    const d = new Date(a, m-1+n, 1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  };

  const STATUS_CFG = {
    urgente: { label:'🔴 Comprar Urgente', bg:'#fef2f2', border:'#fca5a5', color:'#dc2626', dot:'#ef4444' },
    atencao: { label:'🟡 Atenção',         bg:'#fffbeb', border:'#fcd34d', color:'#d97706', dot:'#f59e0b' },
    ok:      { label:'🟢 Suficiente',      bg:'#f0fdf4', border:'#86efac', color:'#16a34a', dot:'#22c55e' }
  };

  async function calcular() {
    loading = true; await draw();
    try { data = await Api.get('/estimativas', { mes: selMes, margem_pct: margemPct }); }
    catch(e) { data = null; Toast.show('Erro ao calcular','error'); }
    loading = false; await draw();
  }

  function sortedTabela() {
    if (!data) return [];
    let rows = [...data.tabela];
    if (filtroStatus !== 'todos') rows = rows.filter(v => v.status === filtroStatus);
    const ord = { urgente:0, atencao:1, ok:2 };
    rows.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'status') { va = ord[a.status]; vb = ord[b.status]; }
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
    return rows;
  }

  function thSort(label, col) {
    const isActive = sortCol === col;
    const arrow = isActive ? (sortAsc ? ' ↑' : ' ↓') : '';
    return h('th', {
      style: `padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${isActive?'var(--primary)':'var(--text-3)'};cursor:pointer;white-space:nowrap;user-select:none`,
      onClick: () => { if (sortCol===col) sortAsc=!sortAsc; else { sortCol=col; sortAsc=true; } draw(); }
    }, label + arrow);
  }

  function gerarPDF() {
    if (!data || !data.tabela.length) return;
    const rows = sortedTabela().map((v,i) => {
      const sc = STATUS_CFG[v.status];
      return `<tr>
        <td class="nome">${v.nome}</td>
        <td class="c">${v.demanda_prevista}</td>
        <td class="c">${v.estoque_atual}</td>
        <td class="c">${v.doses_reservadas}</td>
        <td class="c">${v.estoque_disponivel}</td>
        <td class="c">${v.margem_seguranca}</td>
        <td class="c bold" style="color:${v.sugestao_compra>0?'#dc2626':'#16a34a'}">${v.sugestao_compra}</td>
        <td class="c"><span style="background:${sc.bg};color:${sc.color};border:1px solid ${sc.border};padding:3px 8px;border-radius:10px;font-size:9px;font-weight:700">${sc.label}</span></td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Estimativa de Vacinas — ${data.mes_extenso}</title><style>
@page{margin:14mm 12mm;size:A4 landscape}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#1e293b}
.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:12px;border-bottom:3px solid #6366f1;margin-bottom:16px}
.hdr h1{font-size:18px;font-weight:800;letter-spacing:-0.3px}.hdr p{font-size:10px;color:#64748b;margin-top:3px}
.badge-mes{background:#6366f1;color:#fff;font-size:13px;font-weight:800;padding:7px 16px;border-radius:9px;display:inline-block}
.gen{font-size:8.5px;color:#94a3b8;margin-top:4px;text-align:right}
.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}
.card{padding:12px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc}
.cv{font-size:22px;font-weight:800;line-height:1;margin-bottom:3px}
.cl{font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
table{width:100%;border-collapse:collapse}
th{background:#f1f5f9;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:7px 10px;border-bottom:2px solid #e2e8f0;text-align:left}
td{padding:9px 10px;border-bottom:1px solid #f5f5f5;vertical-align:middle}
.nome{font-weight:600;font-size:11px}
.c{text-align:center}
.bold{font-size:14px;font-weight:800}
tr:hover td{background:#fafafa}
.footer{margin-top:18px;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8.5px;color:#94a3b8}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="hdr">
  <div><h1>💊 Estimativa de Compra de Vacinas</h1><p>Vittalis Saúde · Margem de segurança: ${data.margem_pct}%</p></div>
  <div><div class="badge-mes">${data.mes_extenso}</div><div class="gen">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
</div>
<div class="cards">
  <div class="card"><div class="cv" style="color:#6366f1">${data.tabela.length}</div><div class="cl">Vacinas Analisadas</div></div>
  <div class="card"><div class="cv" style="color:#dc2626">${data.totais.urgentes}</div><div class="cl">🔴 Compra Urgente</div></div>
  <div class="card"><div class="cv" style="color:#d97706">${data.totais.atencao}</div><div class="cl">🟡 Atenção</div></div>
  <div class="card"><div class="cv" style="color:#16a34a">${data.totais.ok}</div><div class="cl">🟢 Suficientes</div></div>
  <div class="card"><div class="cv" style="color:#6366f1">${data.totais.total_sugestao}</div><div class="cl">💊 Total Sugerido</div></div>
</div>
<table>
  <thead><tr>
    <th>Vacina</th><th class="c">Demanda Prevista</th><th class="c">Estoque Atual</th>
    <th class="c">Reservadas</th><th class="c">Disponível</th><th class="c">Margem</th>
    <th class="c">Sugestão Compra</th><th class="c">Status</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">
  <span>VittaSys · Vittalis Saúde</span>
  <span>Demanda = Doses de Planos + Histórico Médio · Sugestão = Demanda + Margem − Estoque Disponível</span>
</div>
<script>window.onload=()=>window.print();<\/script></body></html>`;

    const w = window.open('', '_blank', 'width=1000,height=720');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Permita pop-ups para gerar o PDF','error');
  }

  async function draw() {
    wrap.innerHTML = '';

    // ── Header ──────────────────────────────────────────────────────────
    const hdr = h('div', { className: 'page-header' });
    hdr.appendChild(h('div', { className: 'page-header-left' },
      h('h1', { className: 'page-title' }, '💊 Estimativa de Compra de Vacinas'),
      h('p', { className: 'page-subtitle' }, 'Planejamento de compras · Planos ativos + histórico + estoque')
    ));
    wrap.appendChild(hdr);

    // ── Controls ─────────────────────────────────────────────────────────
    const ctrl = h('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding:16px 20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border)' });

    // Month nav
    const navW = h('div', { style: 'display:flex;align-items:center;gap:6px' });
    const navBtn = (lbl, fn) => h('button', { style:'width:34px;height:34px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:17px;color:var(--text-2)', onClick: fn }, lbl);
    navW.appendChild(navBtn('‹', async () => { selMes=addMes(selMes,-1); await calcular(); }));
    const mInp = h('input', { type:'month', value: selMes, style:'padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;background:var(--bg-subtle);min-width:170px;cursor:pointer' });
    mInp.addEventListener('change', async e => { selMes=e.target.value; await calcular(); });
    navW.appendChild(mInp);
    navW.appendChild(navBtn('›', async () => { selMes=addMes(selMes,1); await calcular(); }));
    ctrl.appendChild(navW);

    // Separator
    ctrl.appendChild(h('div', { style:'width:1px;height:30px;background:var(--border)' }));

    // Margem de segurança
    const margemW = h('div', { style:'display:flex;align-items:center;gap:8px' });
    margemW.appendChild(h('label', { style:'font-size:12px;font-weight:600;color:var(--text-2);white-space:nowrap' }, '🛡️ Margem:'));
    const margemInp = h('input', { type:'number', min:'0', max:'100', value: margemPct,
      style:'width:64px;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;text-align:center;background:var(--bg-subtle)' });
    margemInp.addEventListener('change', async e => { margemPct = parseInt(e.target.value)||20; await calcular(); });
    margemW.appendChild(margemInp);
    margemW.appendChild(h('span', { style:'font-size:13px;font-weight:600;color:var(--text-3)' }, '%'));
    ctrl.appendChild(margemW);

    ctrl.appendChild(h('div', { style:'flex:1' }));

    // Filter chips
    if (data && data.tabela.length) {
      const chips = h('div', { style:'display:flex;gap:6px' });
      [
        ['todos','Todas','#6366f1'],
        ['urgente','🔴 Urgente','#dc2626'],
        ['atencao','🟡 Atenção','#d97706'],
        ['ok','🟢 OK','#16a34a']
      ].forEach(([v,lbl,cor]) => {
        chips.appendChild(h('button', {
          style: `padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid;cursor:pointer;transition:all .15s;${filtroStatus===v?`background:${cor};color:white;border-color:${cor}`:`background:transparent;color:${cor};border-color:${cor}40`}`,
          onClick: async () => { filtroStatus=v; await draw(); }
        }, lbl));
      });
      ctrl.appendChild(chips);

      // PDF
      const pdfB = h('button', { className:'btn btn-outline btn-sm', style:'display:flex;align-items:center;gap:6px;font-weight:600', onClick: gerarPDF });
      pdfB.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Exportar PDF`;
      ctrl.appendChild(pdfB);
    }
    wrap.appendChild(ctrl);

    // ── Loading ─────────────────────────────────────────────────────────
    if (loading) {
      wrap.appendChild(h('div',{style:'text-align:center;padding:80px'},
        h('div',{style:'font-size:48px;margin-bottom:16px'},'⏳'),
        h('div',{style:'font-size:14px;color:var(--text-3)'},'Calculando estimativa…')
      )); return;
    }

    // ── Initial / empty ─────────────────────────────────────────────────
    if (!data) {
      const emp = h('div',{style:'text-align:center;padding:80px 20px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'});
      emp.innerHTML=`<div style="font-size:52px;margin-bottom:16px">💊</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Selecione o mês</h3>
        <p style="color:var(--text-3)">Use as setas para navegar e ver a estimativa de compra.</p>`;
      wrap.appendChild(emp); await calcular(); return;
    }

    if (!data.tabela.length) {
      const emp = h('div',{style:'text-align:center;padding:80px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'});
      emp.innerHTML=`<div style="font-size:52px;margin-bottom:16px">📭</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Sem dados para este mês</h3>
        <p style="color:var(--text-3)">Não há planos ativos, histórico ou estoque para <strong>${data.mes_extenso}</strong>.</p>`;
      wrap.appendChild(emp); return;
    }

    // ── Summary cards ───────────────────────────────────────────────────
    const cards = h('div',{style:'display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px'});
    [
      {val:data.tabela.length,     lbl:'Vacinas',        ico:'🧪', cor:'#6366f1'},
      {val:data.totais.urgentes,   lbl:'Compra Urgente', ico:'🔴', cor:'#dc2626'},
      {val:data.totais.atencao,    lbl:'Atenção',        ico:'🟡', cor:'#d97706'},
      {val:data.totais.ok,         lbl:'Suficientes',    ico:'🟢', cor:'#16a34a'},
      {val:data.totais.total_sugestao, lbl:'Total Sugerido', ico:'💊', cor:'#6366f1'},
    ].forEach(c => {
      const card = h('div',{style:`padding:18px 16px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border);position:relative;overflow:hidden`});
      card.innerHTML=`<div style="position:absolute;top:-8px;right:-8px;font-size:50px;opacity:.07">${c.ico}</div>
        <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${c.lbl}</div>
        <div style="font-size:34px;font-weight:800;color:${c.cor};line-height:1">${c.val}</div>`;
      cards.appendChild(card);
    });
    wrap.appendChild(cards);

    // ── Formula legend ──────────────────────────────────────────────────
    const formula = h('div',{style:'margin-bottom:16px;padding:10px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;font-size:12px;color:#0369a1;display:flex;align-items:center;gap:8px'});
    formula.innerHTML = `<span style="font-size:16px">📐</span><span><strong>Regra de cálculo:</strong> Sugestão de Compra = Demanda Prevista + Margem de Segurança (${data.margem_pct}%) − Estoque Disponível &nbsp;|&nbsp; <strong>Demanda</strong> = Doses de Planos Ativos + Média Histórica Mensal</span>`;
    wrap.appendChild(formula);

    // ── Table ───────────────────────────────────────────────────────────
    const tblWrap = h('div',{style:'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden'});
    const tbl = document.createElement('table');
    tbl.style.cssText = 'width:100%;border-collapse:collapse';

    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    trh.style.cssText = 'background:var(--bg-subtle)';
    [
      ['nome','Vacina'],['demanda_prevista','Demanda Prevista'],
      ['estoque_atual','Estoque Atual'],['doses_reservadas','Reservadas'],
      ['estoque_disponivel','Disponível'],['margem_seguranca','Margem'],
      ['sugestao_compra','Sugestão Compra'],['status','Status']
    ].forEach(([col,lbl]) => trh.appendChild(thSort(lbl, col)));
    thead.appendChild(trh);
    tbl.appendChild(thead);

    const tbody = document.createElement('tbody');
    const rows = sortedTabela();

    if (rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 8; td.style.cssText = 'text-align:center;padding:40px;color:var(--text-3)';
      td.textContent = 'Nenhuma vacina corresponde ao filtro selecionado.';
      tr.appendChild(td); tbody.appendChild(tr);
    }

    rows.forEach(v => {
      const sc = STATUS_CFG[v.status];
      const tr = document.createElement('tr');
      tr.style.cssText = 'transition:background .1s;cursor:default';
      tr.addEventListener('mouseenter', () => tr.style.background = 'var(--bg-subtle)');
      tr.addEventListener('mouseleave', () => tr.style.background = '');

      const tdStyle = 'padding:12px 14px;border-bottom:1px solid var(--border);vertical-align:middle';
      const tdNum   = (val, color='var(--text-1)', size='16px') => {
        const td = document.createElement('td');
        td.style.cssText = tdStyle + ';text-align:center';
        td.innerHTML = `<span style="font-size:${size};font-weight:800;color:${color}">${val}</span>`;
        return td;
      };

      // Nome + alertas
      const tdNome = document.createElement('td');
      tdNome.style.cssText = tdStyle;
      let alertas = '';
      if (v.lotes_vencendo.length) alertas += `<span title="Lotes vencendo" style="font-size:10px;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:8px;padding:2px 6px;margin-left:6px">⚠️ ${v.lotes_vencendo.length} lot${v.lotes_vencendo.length>1?'es':''} vencendo</span>`;
      tdNome.innerHTML = `<div style="font-size:13px;font-weight:700;color:var(--text-1)">${esc(v.nome)}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:2px">📋 Planos: ${v.demanda_planos} &nbsp;|&nbsp; 📊 Hist. médio: ${v.media_historica}/mês${alertas}</div>`;
      tr.appendChild(tdNome);

      tr.appendChild(tdNum(v.demanda_prevista, '#6366f1'));
      tr.appendChild(tdNum(v.estoque_atual, v.estoque_atual < v.demanda_prevista ? '#d97706' : 'var(--text-1)'));
      tr.appendChild(tdNum(v.doses_reservadas, '#94a3b8', '14px'));
      tr.appendChild(tdNum(v.estoque_disponivel, v.estoque_disponivel < v.demanda_prevista ? '#dc2626' : '#16a34a'));
      tr.appendChild(tdNum(v.margem_seguranca, '#64748b', '14px'));

      // Sugestão de compra (destaque principal)
      const tdSug = document.createElement('td');
      tdSug.style.cssText = tdStyle + ';text-align:center';
      if (v.sugestao_compra > 0) {
        tdSug.innerHTML = `<span style="font-size:22px;font-weight:800;color:#dc2626">${v.sugestao_compra}</span><div style="font-size:9px;color:#94a3b8;margin-top:1px">doses</div>`;
      } else {
        tdSug.innerHTML = `<span style="font-size:18px;font-weight:700;color:#16a34a">✓</span>`;
      }
      tr.appendChild(tdSug);

      // Status badge
      const tdStatus = document.createElement('td');
      tdStatus.style.cssText = tdStyle + ';text-align:center';
      tdStatus.innerHTML = `<span style="display:inline-block;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${sc.bg};color:${sc.color};border:1px solid ${sc.border}">${sc.label}</span>`;
      tr.appendChild(tdStatus);

      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    tblWrap.appendChild(tbl);
    wrap.appendChild(tblWrap);

    wrap.appendChild(h('div',{style:'margin-top:14px;padding:10px 16px;background:var(--bg-subtle);border-radius:8px;font-size:11px;color:var(--text-4);text-align:center'},
      `⚡ ${data.tabela.length} vacinas analisadas · ${data.mes_extenso} · Margem ${data.margem_pct}% · Para evoluir para previsão com IA, conecte os dados históricos via integração`
    ));
  }

  await draw();
  return wrap;
}
