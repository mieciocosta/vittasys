// ═══════════════════════════════════════════════════════════════════════════
// ESTIMATIVA DE DEMANDA VACINAL — Somente master
// Calcula por: planos contratados + calendário vacinal (clientes espontâneos)
// ═══════════════════════════════════════════════════════════════════════════
async function renderEstimativas() {
  const wrap = h('div', { className: 'fade-in' });
  const today = new Date();
  let selMes = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  let data = null;
  let view = 'resumo';
  let loading = false;

  const CORES = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#ec4899','#06b6d4','#84cc16','#a78bfa','#fb7185','#34d399','#fbbf24'];
  const getCor = idx => CORES[idx % CORES.length];
  const mvMes = d => { const [a,m]=d.split('-').map(Number); const nd=new Date(a,m-1,1); nd.setMonth(nd.getMonth()+d.includes(nd.getFullYear())?1:1); return nd.getFullYear()+'-'+String(nd.getMonth()+1).padStart(2,'0'); };
  const addMes = (mes, n) => { const [a,m]=mes.split('-').map(Number); const d=new Date(a,m-1+n,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); };

  async function calcular() {
    loading = true; await draw();
    try { data = await Api.get('/estimativas', { mes: selMes }); }
    catch(e) { data = null; Toast.show('Erro ao calcular estimativa', 'error'); }
    loading = false; await draw();
  }

  function gerarPDF() {
    if (!data || data.total_doses === 0) return;
    const resumoRows = data.vacinas.map((v, i) => `
      <tr>
        <td><span class="dot" style="background:${getCor(i)}"></span></td>
        <td class="nome">${v.vacina_nome}${v.fabricante ? `<br><small>${v.fabricante}</small>` : ''}</td>
        <td class="c">${v.qtd_plano || 0}</td>
        <td class="c">${v.qtd_espontaneo || 0}</td>
        <td class="c total">${v.quantidade}</td>
      </tr>`).join('');
    const detSecs = data.vacinas.map((v, i) => `
      <div class="vb" style="border-left:4px solid ${getCor(i)}">
        <div class="vh"><span class="vn">${v.vacina_nome}</span>${v.fabricante?`<span class="vf">${v.fabricante}</span>`:''}<span class="vq" style="background:${getCor(i)}">${v.quantidade} dose${v.quantidade!==1?'s':''}</span></div>
        <table class="dt"><thead><tr><th>Paciente</th><th>Idade</th><th>Origem</th><th>Plano/Calendário</th></tr></thead><tbody>
        ${v.pacientes.map(p=>`<tr>
          <td class="pn">${p.nome_paciente}${p.nome_paciente!==p.nome_responsavel?`<br><small>${p.nome_responsavel}</small>`:''}</td>
          <td>${p.idade}</td>
          <td><span class="${p.fonte==='plano'?'badge-plano':'badge-esp'}">${p.fonte==='plano'?'Plano':'Espontâneo'}</span></td>
          <td class="pp">${p.plano_nome}</td>
        </tr>`).join('')}
        </tbody></table>
      </div>`).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Estimativa Vacinal — ${data.mes_extenso}</title><style>
@page{margin:15mm 13mm;size:A4}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10.5px;color:#1e293b}
.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:12px;border-bottom:3px solid #6366f1;margin-bottom:18px}
.hdr h1{font-size:19px;font-weight:800;color:#1e293b;letter-spacing:-0.4px}
.hdr p{font-size:10px;color:#64748b;margin-top:3px}
.badge-mes{display:inline-block;background:#6366f1;color:#fff;font-size:13px;font-weight:800;padding:7px 16px;border-radius:9px}
.gen{font-size:9px;color:#94a3b8;margin-top:4px;text-align:right}
.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:18px}
.card{padding:12px 14px;border-radius:9px;border:1px solid #e2e8f0;background:#f8fafc}
.cv{font-size:24px;font-weight:800;line-height:1;margin-bottom:3px}
.cl{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
.stitle{font-size:12px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:7px;margin:18px 0 10px}
.res{width:100%;border-collapse:collapse}
.res th{background:#f1f5f9;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:7px 8px;border-bottom:2px solid #e2e8f0;text-align:left}
.res th.c,.res td.c{text-align:center}
.res td{padding:9px 8px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.res .nome{font-weight:600;font-size:11px}.res .nome small{font-size:9px;color:#94a3b8;font-weight:400;display:block}
.res .total{font-size:18px;font-weight:800;color:#6366f1}
.res .tr-tot td{font-weight:700;background:#f8fafc;border-top:2px solid #cbd5e1}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%}
.vb{margin-bottom:16px;page-break-inside:avoid;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}
.vh{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.vn{font-size:12px;font-weight:700;flex:1}.vf{font-size:9px;color:#64748b}
.vq{color:#fff;font-size:9px;font-weight:700;padding:3px 9px;border-radius:10px}
.dt{width:100%;border-collapse:collapse}
.dt th{background:#fafafa;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;padding:6px 10px;border-bottom:1px solid #e2e8f0}
.dt td{padding:8px 10px;border-bottom:1px solid #f8fafc;font-size:10px;vertical-align:top}
.dt .pn{font-weight:600}.dt .pn small{font-size:8.5px;color:#94a3b8;font-weight:400;display:block}
.dt .pp{font-size:9px;color:#64748b}
.badge-plano{background:#e0e7ff;color:#4338ca;font-size:8.5px;font-weight:700;padding:2px 7px;border-radius:10px}
.badge-esp{background:#d1fae5;color:#065f46;font-size:8.5px;font-weight:700;padding:2px 7px;border-radius:10px}
.footer{margin-top:24px;padding-top:9px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8.5px;color:#94a3b8}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.vb{page-break-inside:avoid}}
</style></head><body>
<div class="hdr">
  <div><h1>🧮 Estimativa de Demanda Vacinal</h1><p>Vittalis Saúde · Baseado em planos ativos + calendário vacinal</p></div>
  <div><div class="badge-mes">${data.mes_extenso}</div><div class="gen">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
</div>
<div class="cards">
  <div class="card"><div class="cv" style="color:#6366f1">${data.total_doses}</div><div class="cl">💉 Total Doses</div></div>
  <div class="card"><div class="cv" style="color:#0ea5e9">${data.total_pacientes}</div><div class="cl">👶 Pacientes</div></div>
  <div class="card"><div class="cv" style="color:#10b981">${data.total_vacinas}</div><div class="cl">🧪 Vacinas</div></div>
  <div class="card"><div class="cv" style="color:#4338ca">${data.qtd_plano}</div><div class="cl">📋 De Planos</div></div>
  <div class="card"><div class="cv" style="color:#065f46">${data.qtd_espontaneo}</div><div class="cl">🚶 Espontâneos</div></div>
</div>
<div class="stitle">📊 RESUMO POR VACINA</div>
<table class="res"><thead><tr><th></th><th>Vacina</th><th class="c">Planos</th><th class="c">Espontâneos</th><th class="c">Total</th></tr></thead>
<tbody>${resumoRows}
<tr class="tr-tot"><td></td><td>TOTAL</td><td class="c">${data.qtd_plano}</td><td class="c">${data.qtd_espontaneo}</td><td class="c total">${data.total_doses}</td></tr>
</tbody></table>
<div class="stitle" style="margin-top:24px">📋 DETALHAMENTO POR PACIENTE</div>
${detSecs}
<div class="footer"><span>VittaSys · Vittalis Saúde</span><span>Estimativa automática · planos ativos + calendário vacinal por faixa etária</span></div>
<script>window.onload=()=>window.print();<\/script></body></html>`;

    const w = window.open('', '_blank', 'width=920,height=720');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Permita pop-ups para gerar o PDF', 'error');
  }

  async function draw() {
    wrap.innerHTML = '';

    // ── Header ─────────────────────────────────────────────────────────
    const hdr = h('div', { className: 'page-header' });
    hdr.appendChild(h('div', { className: 'page-header-left' },
      h('h1', { className: 'page-title' }, '🧮 Estimativa de Demanda Vacinal'),
      h('p', { className: 'page-subtitle' }, 'Projeção de compras por mês · Planos contratados + espontâneos por faixa etária')
    ));
    wrap.appendChild(hdr);

    // ── Controls ───────────────────────────────────────────────────────
    const ctrl = h('div', {
      style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px;padding:16px 20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border)'
    });

    // Month nav
    const navW = h('div', { style: 'display:flex;align-items:center;gap:6px' });
    const mkNavBtn = (lbl, onClick) => {
      const b = h('button', {
        style: 'width:34px;height:34px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:16px;font-weight:600;color:var(--text-2);display:flex;align-items:center;justify-content:center',
        onClick
      }, lbl);
      return b;
    };
    navW.appendChild(mkNavBtn('‹', async () => { selMes = addMes(selMes, -1); await calcular(); }));
    const mInp = h('input', { type: 'month', value: selMes,
      style: 'padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;color:var(--text-1);background:var(--bg-subtle);min-width:160px' });
    mInp.addEventListener('change', async e => { selMes = e.target.value; await calcular(); });
    navW.appendChild(mInp);
    navW.appendChild(mkNavBtn('›', async () => { selMes = addMes(selMes, 1); await calcular(); }));
    ctrl.appendChild(navW);

    ctrl.appendChild(h('div', { style: 'flex:1' }));

    if (data && data.total_doses > 0) {
      // View toggle
      const tg = h('div', { style: 'display:flex;border:1px solid var(--border);border-radius:8px;overflow:hidden' });
      [['resumo','📊 Resumo'],['detalhado','📋 Detalhado']].forEach(([v,lbl]) => {
        tg.appendChild(h('button', {
          style: `padding:8px 16px;font-size:12px;font-weight:600;border:none;cursor:pointer;${view===v?'background:var(--primary);color:white':'background:var(--bg-subtle);color:var(--text-2)'}`,
          onClick: async () => { view=v; await draw(); }
        }, lbl));
      });
      ctrl.appendChild(tg);
      // PDF
      const pdfB = h('button', { className: 'btn btn-outline btn-sm',
        style: 'display:flex;align-items:center;gap:6px;font-weight:600',
        onClick: gerarPDF });
      pdfB.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Exportar PDF`;
      ctrl.appendChild(pdfB);
    }
    wrap.appendChild(ctrl);

    // ── Loading ────────────────────────────────────────────────────────
    if (loading) {
      const ld = h('div', { style: 'text-align:center;padding:80px' });
      ld.innerHTML = `<div style="font-size:48px;margin-bottom:16px">⏳</div><div style="font-size:14px;color:var(--text-3)">Calculando estimativa…</div>`;
      wrap.appendChild(ld); return;
    }

    // ── Empty ──────────────────────────────────────────────────────────
    if (!data || data.total_doses === 0) {
      const emp = h('div', { style: 'text-align:center;padding:80px 20px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)' });
      if (!data) {
        emp.innerHTML = `<div style="font-size:52px;margin-bottom:16px">🧮</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Selecione o mês</h3>
          <p style="color:var(--text-3)">Navegue nos meses para ver a previsão de vacinas necessárias.</p>`;
        wrap.appendChild(emp);
        await calcular();
      } else {
        emp.innerHTML = `<div style="font-size:52px;margin-bottom:16px">📭</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Nenhuma dose prevista</h3>
          <p style="color:var(--text-3)">Sem doses agendadas ou clientes em faixa etária para <strong>${data.mes_extenso}</strong>.</p>`;
        wrap.appendChild(emp);
      }
      return;
    }

    // ── Summary cards ──────────────────────────────────────────────────
    const cards = h('div', { style: 'display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px' });
    [
      { val: data.total_doses,      lbl: 'Total de Doses',  ico: '💉', cor: '#6366f1' },
      { val: data.total_pacientes,  lbl: 'Pacientes',       ico: '👶', cor: '#0ea5e9' },
      { val: data.total_vacinas,    lbl: 'Vacinas',         ico: '🧪', cor: '#10b981' },
      { val: data.qtd_plano,        lbl: 'De Planos',       ico: '📋', cor: '#4338ca' },
      { val: data.qtd_espontaneo,   lbl: 'Espontâneos',     ico: '🚶', cor: '#059669' },
    ].forEach(c => {
      const card = h('div', { style: `padding:20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border);position:relative;overflow:hidden` });
      card.innerHTML = `<div style="position:absolute;top:-8px;right:-8px;font-size:52px;opacity:.07">${c.ico}</div>
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${c.lbl}</div>
        <div style="font-size:36px;font-weight:800;color:${c.cor};line-height:1">${c.val}</div>`;
      cards.appendChild(card);
    });
    wrap.appendChild(cards);

    // Legend chips
    const leg = h('div', { style: 'display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap' });
    [
      { cor: '#4338ca', bg: '#e0e7ff', lbl: '📋 Doses de planos contratados' },
      { cor: '#065f46', bg: '#d1fae5', lbl: '🚶 Previsão por calendário vacinal (espontâneos)' },
    ].forEach(l => {
      leg.appendChild(h('span', {
        style: `font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;background:${l.bg};color:${l.cor}`
      }, l.lbl));
    });
    wrap.appendChild(leg);

    const secHdr = h('h2', { style: 'font-size:14px;font-weight:700;color:var(--text-1);margin-bottom:14px' },
      view === 'resumo' ? `📊 Resumo — ${data.mes_extenso}` : `📋 Detalhado — ${data.mes_extenso}`);
    wrap.appendChild(secHdr);

    // ── RESUMO ─────────────────────────────────────────────────────────
    if (view === 'resumo') {
      const tbl = h('div', { style: 'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden' });
      const th = h('div', { style: 'display:grid;grid-template-columns:32px 1fr 110px 80px 80px 80px;padding:10px 18px;background:var(--bg-subtle);border-bottom:1px solid var(--border)' });
      ['','Vacina','Fabricante','Planos','Espontâneos','Total'].forEach((t,i) => {
        th.appendChild(h('div', { style: `font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;${i>=3?'text-align:center':''}` }, t));
      });
      tbl.appendChild(th);
      const maxQ = Math.max(...data.vacinas.map(v => v.quantidade));
      data.vacinas.forEach((v, idx) => {
        const row = h('div', { style: `display:grid;grid-template-columns:32px 1fr 110px 80px 80px 80px;padding:12px 18px;align-items:center;${idx < data.vacinas.length-1?'border-bottom:1px solid var(--border)':''}` });
        row.addEventListener('mouseenter', ()=>row.style.background='var(--bg-subtle)');
        row.addEventListener('mouseleave', ()=>row.style.background='');
        row.appendChild(h('div', { style: `width:12px;height:12px;border-radius:50%;background:${getCor(idx)}` }));
        const nc = h('div');
        nc.appendChild(h('div', { style: 'font-size:13px;font-weight:600;color:var(--text-1)' }, v.vacina_nome));
        const bar = h('div', { style: 'margin-top:4px;height:3px;background:var(--border);border-radius:2px;max-width:260px' });
        bar.appendChild(h('div', { style: `height:3px;border-radius:2px;background:${getCor(idx)};width:${Math.round(v.quantidade/maxQ*100)}%` }));
        nc.appendChild(bar);
        row.appendChild(nc);
        row.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3)' }, v.fabricante || '—'));
        row.appendChild(h('div', { style: 'text-align:center;font-size:13px;font-weight:700;color:#4338ca' }, v.qtd_plano > 0 ? String(v.qtd_plano) : '—'));
        row.appendChild(h('div', { style: 'text-align:center;font-size:13px;font-weight:700;color:#059669' }, v.qtd_espontaneo > 0 ? String(v.qtd_espontaneo) : '—'));
        row.appendChild(h('div', { style: `text-align:center;font-size:22px;font-weight:800;color:${getCor(idx)}` }, String(v.quantidade)));
        tbl.appendChild(row);
      });
      // Totals footer
      const foot = h('div', { style: 'display:grid;grid-template-columns:32px 1fr 110px 80px 80px 80px;padding:12px 18px;border-top:2px solid var(--border);background:var(--bg-subtle)' });
      foot.appendChild(h('div')); foot.appendChild(h('div', { style: 'font-size:12px;font-weight:700' }, 'TOTAL'));
      foot.appendChild(h('div'));
      foot.appendChild(h('div', { style: 'text-align:center;font-size:16px;font-weight:800;color:#4338ca' }, String(data.qtd_plano)));
      foot.appendChild(h('div', { style: 'text-align:center;font-size:16px;font-weight:800;color:#059669' }, String(data.qtd_espontaneo)));
      foot.appendChild(h('div', { style: 'text-align:center;font-size:22px;font-weight:800;color:var(--primary)' }, String(data.total_doses)));
      tbl.appendChild(foot);
      wrap.appendChild(tbl);
    }

    // ── DETALHADO ──────────────────────────────────────────────────────
    if (view === 'detalhado') {
      const con = h('div', { style: 'display:flex;flex-direction:column;gap:14px' });
      data.vacinas.forEach((v, idx) => {
        const card = h('div', { style: 'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden' });
        // Vac header
        const vh = h('div', { style: `display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,${getCor(idx)}15,${getCor(idx)}05)` });
        const vico = h('div', { style: `width:38px;height:38px;border-radius:10px;background:${getCor(idx)};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px` }, '💉');
        vh.appendChild(vico);
        const vi = h('div', { style: 'flex:1' });
        vi.appendChild(h('div', { style: 'font-size:15px;font-weight:700' }, v.vacina_nome));
        if (v.fabricante) vi.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3)' }, v.fabricante));
        vh.appendChild(vi);
        // Badges
        const badges = h('div', { style: 'display:flex;gap:8px;align-items:center' });
        if (v.qtd_plano > 0) badges.appendChild(h('span', { style: 'font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;background:#e0e7ff;color:#4338ca' }, `📋 ${v.qtd_plano} plano`));
        if (v.qtd_espontaneo > 0) badges.appendChild(h('span', { style: 'font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;background:#d1fae5;color:#065f46' }, `🚶 ${v.qtd_espontaneo} espontâneo`));
        badges.appendChild(h('span', { style: `font-size:12px;font-weight:800;padding:5px 14px;border-radius:20px;background:${getCor(idx)};color:white` }, `${v.quantidade} total`));
        vh.appendChild(badges);
        card.appendChild(vh);
        // Patient table header
        const phdr = h('div', { style: 'display:grid;grid-template-columns:1fr 90px 100px 1fr;padding:8px 18px;background:var(--bg-subtle);border-bottom:1px solid var(--border)' });
        ['Paciente','Idade','Origem','Plano / Calendário'].forEach(t => phdr.appendChild(h('div', { style: 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3)' }, t)));
        card.appendChild(phdr);
        v.pacientes.forEach((p, pi) => {
          const pr = h('div', { style: `display:grid;grid-template-columns:1fr 90px 100px 1fr;padding:10px 18px;align-items:center;${pi<v.pacientes.length-1?'border-bottom:1px solid var(--border-subtle,#f1f5f9)':''}` });
          pr.addEventListener('mouseenter', ()=>pr.style.background='var(--bg-subtle)');
          pr.addEventListener('mouseleave', ()=>pr.style.background='');
          const pn = h('div');
          pn.appendChild(h('div', { style: 'font-size:13px;font-weight:600' }, p.nome_paciente));
          if (p.nome_paciente !== p.nome_responsavel) pn.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3)' }, '↳ ' + p.nome_responsavel));
          pr.appendChild(pn);
          pr.appendChild(h('div', { style: 'font-size:12px;color:var(--text-2)' }, p.idade));
          const src = p.fonte === 'plano'
            ? h('span', { style: 'font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;background:#e0e7ff;color:#4338ca' }, '📋 Plano')
            : h('span', { style: 'font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px;background:#d1fae5;color:#065f46' }, '🚶 Espontâneo');
          pr.appendChild(src);
          pr.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3)' }, p.plano_nome));
          card.appendChild(pr);
        });
        con.appendChild(card);
      });
      wrap.appendChild(con);
    }

    wrap.appendChild(h('div', { style: 'margin-top:16px;padding:10px 14px;background:var(--bg-subtle);border-radius:8px;font-size:11px;color:var(--text-4);text-align:center' },
      `⚡ ${data.total_doses} doses previstas · ${data.mes_extenso} · ${data.qtd_plano} de planos + ${data.qtd_espontaneo} por calendário vacinal`));
  }

  await draw();
  return wrap;
}
