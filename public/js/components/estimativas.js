async function renderEstimativas() {
  const wrap = h('div', { className: 'fade-in' });
  const today = new Date();
  let selMes = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0');
  let data = null;
  let view = 'resumo';
  let loading = false;

  const CORES = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#ec4899','#06b6d4','#84cc16','#a78bfa','#fb7185','#34d399','#fbbf24'];
  const getCor = i => CORES[i % CORES.length];
  const addMes = (mes, n) => {
    const [a,m] = mes.split('-').map(Number);
    const d = new Date(a, m-1+n, 1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  };

  async function calcular() {
    loading = true; await draw();
    try { data = await Api.get('/estimativas', { mes: selMes }); }
    catch(e) { data = null; Toast.show('Erro ao calcular','error'); }
    loading = false; await draw();
  }

  // ── PDF ──────────────────────────────────────────────────────────────
  function gerarPDF() {
    if (!data || !data.total_doses) return;

    const resumoRows = data.vacinas.map((v,i) => `
      <tr>
        <td><span class="dot" style="background:${getCor(i)}"></span></td>
        <td class="nome">${v.vacina_nome}${v.fabricante?`<br><small>${v.fabricante}</small>`:''}</td>
        <td class="c bold" style="color:${getCor(i)}">${v.quantidade}</td>
      </tr>`).join('');

    const detSecs = data.vacinas.map((v,i) => `
      <div class="vb">
        <div class="vh" style="border-left:5px solid ${getCor(i)}">
          <div class="vn">${v.vacina_nome}${v.fabricante?` <span class="vf">${v.fabricante}</span>`:''}</div>
          <span class="vq" style="background:${getCor(i)}">${v.quantidade} dose${v.quantidade!==1?'s':''}</span>
        </div>
        <table class="dt">
          <thead><tr><th>Paciente</th><th>Responsável</th><th>Idade</th><th>Dose</th><th>Plano</th></tr></thead>
          <tbody>${v.pacientes.map(p=>`
            <tr>
              <td class="fw">${p.nome_paciente}</td>
              <td class="sm">${p.nome_paciente!==p.nome_responsavel?p.nome_responsavel:'-'}</td>
              <td>${p.idade}</td>
              <td class="c">D${p.dose_numero}</td>
              <td class="sm">${p.plano_nome}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Estimativa Vacinal — ${data.mes_extenso}</title><style>
@page{margin:14mm 12mm;size:A4}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10.5px;color:#1e293b;background:#fff}
/* HEADER */
.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:12px;border-bottom:3px solid #6366f1;margin-bottom:16px}
.hdr-l h1{font-size:20px;font-weight:800;letter-spacing:-0.4px}
.hdr-l p{font-size:10px;color:#64748b;margin-top:3px}
.mes-badge{background:#6366f1;color:#fff;font-size:14px;font-weight:800;padding:8px 18px;border-radius:10px;display:inline-block}
.gen-dt{font-size:9px;color:#94a3b8;margin-top:5px;text-align:right}
/* CARDS */
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.card{padding:14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc}
.cv{font-size:28px;font-weight:800;line-height:1;margin-bottom:4px}
.cl{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em}
/* SECTION TITLE */
.stitle{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:7px;margin:18px 0 10px}
/* RESUMO TABLE */
.res{width:100%;border-collapse:collapse}
.res th{background:#f1f5f9;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:7px 10px;border-bottom:2px solid #e2e8f0;text-align:left}
.res td{padding:10px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.res .nome{font-weight:600;font-size:11.5px}
.res .nome small{font-size:9px;color:#94a3b8;font-weight:400;display:block;margin-top:1px}
.res .c{text-align:center}
.res .bold{font-size:20px;font-weight:800;text-align:center}
.res .tr-tot td{font-weight:700;background:#f8fafc;border-top:2px solid #cbd5e1;font-size:13px}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;vertical-align:middle}
/* DETAIL BLOCKS */
.vb{margin-bottom:18px;page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.vh{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.vn{font-size:12.5px;font-weight:700}
.vf{font-size:9px;color:#64748b;font-weight:400;margin-left:6px}
.vq{color:#fff;font-size:9.5px;font-weight:700;padding:4px 12px;border-radius:12px}
.dt{width:100%;border-collapse:collapse}
.dt th{background:#fafafa;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:left}
.dt td{padding:8px 10px;border-bottom:1px solid #f8fafc;vertical-align:top}
.dt .fw{font-weight:600}
.dt .sm{font-size:9.5px;color:#64748b}
.dt .c{text-align:center;font-weight:700}
/* FOOTER */
.footer{margin-top:24px;padding-top:9px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8.5px;color:#94a3b8}
@media print{
  body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .vb{page-break-inside:avoid}
}
</style></head><body>

<div class="hdr">
  <div class="hdr-l">
    <h1>💉 Estimativa de Demanda Vacinal</h1>
    <p>Vittalis Saúde · Com base nos planos vacinais ativos</p>
  </div>
  <div>
    <div class="mes-badge">${data.mes_extenso}</div>
    <div class="gen-dt">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
  </div>
</div>

<div class="cards">
  <div class="card"><div class="cv" style="color:#6366f1">${data.total_doses}</div><div class="cl">💉 Total de Doses</div></div>
  <div class="card"><div class="cv" style="color:#0ea5e9">${data.total_pacientes}</div><div class="cl">👶 Pacientes</div></div>
  <div class="card"><div class="cv" style="color:#10b981">${data.total_vacinas}</div><div class="cl">🧪 Tipos de Vacina</div></div>
</div>

<div class="stitle">📊 Resumo por Vacina</div>
<table class="res">
  <thead><tr><th></th><th>Vacina</th><th class="c">Qtd. Prevista</th></tr></thead>
  <tbody>
    ${resumoRows}
    <tr class="tr-tot">
      <td></td><td>TOTAL</td>
      <td class="c" style="color:#6366f1;font-size:20px;font-weight:800">${data.total_doses}</td>
    </tr>
  </tbody>
</table>

<div class="stitle" style="margin-top:24px">📋 Detalhamento por Paciente</div>
${detSecs}

<div class="footer">
  <span>VittaSys · Vittalis Saúde</span>
  <span>Estimativa automática baseada em doses pendentes dos planos ativos</span>
</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=920,height=720');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Permita pop-ups para gerar o PDF', 'error');
  }

  // ── Draw ─────────────────────────────────────────────────────────────
  async function draw() {
    wrap.innerHTML = '';

    // Header
    const hdr = h('div', { className: 'page-header' });
    hdr.appendChild(h('div', { className: 'page-header-left' },
      h('h1', { className: 'page-title' }, '💉 Estimativa de Demanda Vacinal'),
      h('p', { className: 'page-subtitle' }, 'Projeção de compras com base nos planos vacinais ativos')
    ));
    wrap.appendChild(hdr);

    // Controls bar
    const ctrl = h('div', {
      style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px;padding:16px 20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border)'
    });

    // Month navigation
    const navW = h('div', { style: 'display:flex;align-items:center;gap:6px' });
    const navBtn = (lbl, fn) => h('button', {
      style: 'width:34px;height:34px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:17px;font-weight:600;color:var(--text-2)',
      onClick: fn
    }, lbl);
    navW.appendChild(navBtn('‹', async () => { selMes = addMes(selMes,-1); await calcular(); }));
    const mInp = h('input', { type:'month', value: selMes,
      style: 'padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;background:var(--bg-subtle);min-width:170px;cursor:pointer' });
    mInp.addEventListener('change', async e => { selMes = e.target.value; await calcular(); });
    navW.appendChild(mInp);
    navW.appendChild(navBtn('›', async () => { selMes = addMes(selMes,1); await calcular(); }));
    ctrl.appendChild(navW);
    ctrl.appendChild(h('div', { style: 'flex:1' }));

    if (data && data.total_doses > 0) {
      // View toggle
      const tg = h('div', { style: 'display:flex;border:1px solid var(--border);border-radius:8px;overflow:hidden' });
      [['resumo','📊 Resumo'],['detalhado','📋 Detalhado']].forEach(([v,lbl]) => {
        tg.appendChild(h('button', {
          style: `padding:8px 16px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all .15s;${view===v?'background:var(--primary);color:white':'background:var(--bg-subtle);color:var(--text-2)'}`,
          onClick: async () => { view = v; await draw(); }
        }, lbl));
      });
      ctrl.appendChild(tg);

      // PDF button
      const pdfB = h('button', { className:'btn btn-outline btn-sm',
        style: 'display:flex;align-items:center;gap:6px;font-weight:600', onClick: gerarPDF });
      pdfB.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Exportar PDF`;
      ctrl.appendChild(pdfB);
    }
    wrap.appendChild(ctrl);

    // Loading
    if (loading) {
      const ld = h('div', { style: 'text-align:center;padding:80px' });
      ld.innerHTML = `<div style="font-size:48px;margin-bottom:16px">⏳</div><div style="font-size:14px;color:var(--text-3)">Calculando estimativa…</div>`;
      wrap.appendChild(ld); return;
    }

    // Empty/initial
    if (!data || data.total_doses === 0) {
      const emp = h('div', { style: 'text-align:center;padding:80px 20px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)' });
      if (!data) {
        emp.innerHTML = `<div style="font-size:52px;margin-bottom:16px">💉</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Selecione o mês</h3>
          <p style="color:var(--text-3)">Use as setas para navegar entre os meses e ver a previsão.</p>`;
        wrap.appendChild(emp);
        await calcular();
      } else {
        emp.innerHTML = `<div style="font-size:52px;margin-bottom:16px">📭</div>
          <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Nenhuma dose prevista</h3>
          <p style="color:var(--text-3)">Não há doses pendentes nos planos ativos para <strong>${data.mes_extenso}</strong>.</p>`;
        wrap.appendChild(emp);
      }
      return;
    }

    // Summary cards
    const cards = h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px' });
    [
      { val: data.total_doses,     lbl: 'Doses Previstas', ico: '💉', cor: '#6366f1' },
      { val: data.total_pacientes, lbl: 'Pacientes',       ico: '👶', cor: '#0ea5e9' },
      { val: data.total_vacinas,   lbl: 'Tipos de Vacina', ico: '🧪', cor: '#10b981' },
    ].forEach(c => {
      const card = h('div', { style: `padding:24px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border);position:relative;overflow:hidden` });
      card.innerHTML = `<div style="position:absolute;top:-8px;right:-8px;font-size:56px;opacity:.07">${c.ico}</div>
        <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">${c.lbl}</div>
        <div style="font-size:40px;font-weight:800;color:${c.cor};line-height:1">${c.val}</div>`;
      cards.appendChild(card);
    });
    wrap.appendChild(cards);

    wrap.appendChild(h('h2', { style: 'font-size:15px;font-weight:700;color:var(--text-1);margin-bottom:14px' },
      view === 'resumo' ? `📊 Resumo — ${data.mes_extenso}` : `📋 Detalhado — ${data.mes_extenso}`));

    // ── RESUMO ──────────────────────────────────────────────────────────
    if (view === 'resumo') {
      const tbl = h('div', { style: 'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden' });

      // Table header
      const th = h('div', { style: 'display:grid;grid-template-columns:32px 1fr 120px 100px;padding:10px 20px;background:var(--bg-subtle);border-bottom:1px solid var(--border)' });
      ['','Vacina','Fabricante','Qtd. Prevista'].forEach((t,i) => {
        th.appendChild(h('div', { style: `font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;${i===3?'text-align:center':''}` }, t));
      });
      tbl.appendChild(th);

      const maxQ = Math.max(...data.vacinas.map(v => v.quantidade));
      data.vacinas.forEach((v, idx) => {
        const row = h('div', { style: `display:grid;grid-template-columns:32px 1fr 120px 100px;padding:14px 20px;align-items:center;${idx < data.vacinas.length-1?'border-bottom:1px solid var(--border)':''}` });
        row.addEventListener('mouseenter', ()=>row.style.background='var(--bg-subtle)');
        row.addEventListener('mouseleave', ()=>row.style.background='');

        row.appendChild(h('div', { style: `width:13px;height:13px;border-radius:50%;background:${getCor(idx)}` }));

        const nc = h('div');
        nc.appendChild(h('div', { style: 'font-size:14px;font-weight:600;color:var(--text-1)' }, v.vacina_nome));
        const bar = h('div', { style: 'margin-top:5px;height:4px;background:var(--border);border-radius:2px;max-width:280px' });
        bar.appendChild(h('div', { style: `height:4px;border-radius:2px;background:${getCor(idx)};width:${Math.round(v.quantidade/maxQ*100)}%;transition:width .4s ease` }));
        nc.appendChild(bar);
        row.appendChild(nc);

        row.appendChild(h('div', { style: 'font-size:12px;color:var(--text-3)' }, v.fabricante || '—'));
        row.appendChild(h('div', { style: `text-align:center;font-size:26px;font-weight:800;color:${getCor(idx)}` }, String(v.quantidade)));
        tbl.appendChild(row);
      });

      // Footer total
      const foot = h('div', { style: 'display:grid;grid-template-columns:32px 1fr 120px 100px;padding:14px 20px;border-top:2px solid var(--border);background:var(--bg-subtle)' });
      foot.appendChild(h('div')); foot.appendChild(h('div', { style: 'font-size:13px;font-weight:700' }, 'TOTAL'));
      foot.appendChild(h('div'));
      foot.appendChild(h('div', { style: 'text-align:center;font-size:26px;font-weight:800;color:var(--primary)' }, String(data.total_doses)));
      tbl.appendChild(foot);
      wrap.appendChild(tbl);
    }

    // ── DETALHADO ────────────────────────────────────────────────────────
    if (view === 'detalhado') {
      const con = h('div', { style: 'display:flex;flex-direction:column;gap:16px' });

      data.vacinas.forEach((v, idx) => {
        const card = h('div', { style: 'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden' });

        // Vaccine header
        const vh = h('div', { style: `display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,${getCor(idx)}18,${getCor(idx)}06)` });
        const ico = h('div', { style: `width:40px;height:40px;border-radius:10px;background:${getCor(idx)};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px` }, '💉');
        vh.appendChild(ico);
        const vi = h('div', { style: 'flex:1' });
        vi.appendChild(h('div', { style: 'font-size:16px;font-weight:700' }, v.vacina_nome));
        if (v.fabricante) vi.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3);margin-top:2px' }, v.fabricante));
        vh.appendChild(vi);
        vh.appendChild(h('div', {
          style: `font-size:13px;font-weight:800;padding:6px 18px;border-radius:20px;background:${getCor(idx)};color:white`
        }, `${v.quantidade} dose${v.quantidade!==1?'s':''}`));
        card.appendChild(vh);

        // Patient rows header
        const phdr = h('div', { style: 'display:grid;grid-template-columns:1fr 100px 80px 1fr;padding:8px 20px;background:var(--bg-subtle);border-bottom:1px solid var(--border)' });
        ['Paciente','Idade','Faixa Prevista','Plano'].forEach(t => phdr.appendChild(h('div', { style: 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3)' }, t)));
        card.appendChild(phdr);

        v.pacientes.forEach((p, pi) => {
          const pr = h('div', { style: `display:grid;grid-template-columns:1fr 100px 120px 1fr;padding:11px 20px;align-items:center;${pi<v.pacientes.length-1?'border-bottom:1px solid var(--border-subtle,#f1f5f9)':''}` });
          pr.addEventListener('mouseenter', ()=>pr.style.background='var(--bg-subtle)');
          pr.addEventListener('mouseleave', ()=>pr.style.background='');

          const pn = h('div');
          pn.appendChild(h('div', { style: 'font-size:13px;font-weight:600' }, p.nome_paciente));
          if (p.nome_paciente !== p.nome_responsavel)
            pn.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3)' }, '↳ ' + p.nome_responsavel));
          pr.appendChild(pn);
          pr.appendChild(h('div', { style: 'font-size:12px;color:var(--text-2)' }, p.idade));
          pr.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3)' }, p.faixa || '—'));
          pr.appendChild(h('div', { style: 'font-size:12px;color:var(--text-3)' }, p.plano_nome));
          card.appendChild(pr);
        });
        con.appendChild(card);
      });
      wrap.appendChild(con);
    }

    wrap.appendChild(h('div', { style: 'margin-top:18px;padding:10px 16px;background:var(--bg-subtle);border-radius:8px;font-size:11px;color:var(--text-4);text-align:center' },
      `⚡ ${data.total_doses} doses previstas em ${data.mes_extenso} · ${data.total_vacinas} vacinas · ${data.total_pacientes} pacientes · Baseado em planos vacinais ativos`));
  }

  await draw();
  return wrap;
}
