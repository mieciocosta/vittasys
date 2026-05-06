// ═══════════════════════════════════════════════════════════════════════════
// ESTIMATIVA DE DEMANDA VACINAL — Somente master
// ═══════════════════════════════════════════════════════════════════════════

async function renderEstimativas() {
  const wrap = h('div', { className: 'fade-in' });

  // ── State ──────────────────────────────────────────────────────────────
  const today = new Date();
  let selMes = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  let data = null;
  let view = 'resumo'; // 'resumo' | 'detalhado'
  let loading = false;

  // ── Helpers ────────────────────────────────────────────────────────────
  const CORES = [
    '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
    '#8b5cf6','#14b8a6','#f97316','#ec4899','#06b6d4',
    '#84cc16','#a78bfa','#fb7185','#34d399','#fbbf24'
  ];
  const getCor = (idx) => CORES[idx % CORES.length];

  function mesAnterior(mes) {
    const [a, m] = mes.split('-').map(Number);
    const d = new Date(a, m - 2, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function mesProximo(mes) {
    const [a, m] = mes.split('-').map(Number);
    const d = new Date(a, m, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  // ── Main draw ─────────────────────────────────────────────────────────
  async function draw() {
    wrap.innerHTML = '';

    // ── Page header ────────────────────────────────────────────────────
    const hdr = h('div', { className: 'page-header' });
    hdr.appendChild(h('div', { className: 'page-header-left' },
      h('h1', { className: 'page-title' }, '🧮 Estimativa de Demanda Vacinal'),
      h('p', { className: 'page-subtitle' }, 'Projeção de vacinas necessárias com base nos planos ativos e calendário vacinal')
    ));
    wrap.appendChild(hdr);

    // ── Controls bar ───────────────────────────────────────────────────
    const ctrl = h('div', {
      style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:28px;padding:20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border)'
    });

    // Month navigation
    const navGroup = h('div', { style: 'display:flex;align-items:center;gap:6px' });

    const btnPrev = h('button', {
      style: 'padding:8px 12px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:14px;color:var(--text-2);transition:all 0.15s',
      onClick: async () => {
        selMes = mesAnterior(selMes); await calcular();
      }
    }, '‹');

    const mesInput = h('input', {
      type: 'month',
      value: selMes,
      style: 'padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:600;color:var(--text-1);background:var(--bg-subtle);cursor:pointer;min-width:160px'
    });
    mesInput.addEventListener('change', async e => { selMes = e.target.value; await calcular(); });

    const btnNext = h('button', {
      style: 'padding:8px 12px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:14px;color:var(--text-2);transition:all 0.15s',
      onClick: async () => {
        selMes = mesProximo(selMes); await calcular();
      }
    }, '›');

    navGroup.appendChild(btnPrev);
    navGroup.appendChild(mesInput);
    navGroup.appendChild(btnNext);
    ctrl.appendChild(navGroup);

    // Spacer
    ctrl.appendChild(h('div', { style: 'flex:1' }));

    // View toggle
    if (data && data.total_doses > 0) {
      const toggleGroup = h('div', { style: 'display:flex;border:1px solid var(--border);border-radius:8px;overflow:hidden' });
      ['resumo', 'detalhado'].forEach(v => {
        const lbl = v === 'resumo' ? '📊 Resumo' : '📋 Detalhado';
        const btn = h('button', {
          style: `padding:8px 16px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all 0.15s;${view === v ? 'background:var(--primary);color:white' : 'background:var(--bg-subtle);color:var(--text-2)'}`,
          onClick: async () => { view = v; await draw(); }
        }, lbl);
        toggleGroup.appendChild(btn);
      });
      ctrl.appendChild(toggleGroup);

      // PDF button
      const pdfBtn = h('button', {
        className: 'btn btn-outline btn-sm',
        style: 'display:flex;align-items:center;gap:6px;font-weight:600',
        onClick: () => gerarPDF()
      });
      pdfBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> Exportar PDF`;
      ctrl.appendChild(pdfBtn);
    }

    wrap.appendChild(ctrl);

    // ── Loading state ─────────────────────────────────────────────────
    if (loading) {
      const ld = h('div', { style: 'text-align:center;padding:80px 20px' });
      ld.innerHTML = `<div style="font-size:40px;margin-bottom:16px">⏳</div><div style="font-size:14px;color:var(--text-3)">Calculando estimativa...</div>`;
      wrap.appendChild(ld); return;
    }

    // ── Empty / initial state ─────────────────────────────────────────
    if (!data) {
      const emp = h('div', {
        style: 'text-align:center;padding:80px 20px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'
      });
      emp.innerHTML = `<div style="font-size:56px;margin-bottom:16px">🧮</div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-1);margin-bottom:8px">Calcule a Estimativa</h3>
        <p style="font-size:14px;color:var(--text-3);max-width:400px;margin:0 auto">Selecione o mês desejado para ver a projeção de vacinas necessárias com base nos planos ativos.</p>`;
      wrap.appendChild(emp);
      await calcular();
      return;
    }

    // ── No data ───────────────────────────────────────────────────────
    if (data.total_doses === 0) {
      const emp = h('div', {
        style: 'text-align:center;padding:80px 20px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'
      });
      emp.innerHTML = `<div style="font-size:56px;margin-bottom:16px">📭</div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-1);margin-bottom:8px">Nenhuma dose prevista</h3>
        <p style="font-size:14px;color:var(--text-3)">Não há doses pendentes nos planos ativos para <strong>${data.mes_extenso}</strong>.</p>`;
      wrap.appendChild(emp); return;
    }

    // ── Summary cards ─────────────────────────────────────────────────
    const cards = h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px' });
    [
      { val: data.total_doses, lbl: 'Doses Previstas', sub: 'Total do mês', icon: '💉', cor: '#6366f1' },
      { val: data.total_pacientes, lbl: 'Pacientes', sub: 'Serão atendidos', icon: '👶', cor: '#0ea5e9' },
      { val: data.total_vacinas, lbl: 'Vacinas', sub: 'Tipos diferentes', icon: '🧪', cor: '#10b981' }
    ].forEach(c => {
      const card = h('div', {
        style: `padding:24px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border);position:relative;overflow:hidden`
      });
      card.innerHTML = `
        <div style="position:absolute;top:-10px;right:-10px;font-size:60px;opacity:0.08">${c.icon}</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-3);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px">${c.lbl}</div>
        <div style="font-size:40px;font-weight:800;color:${c.cor};line-height:1;margin-bottom:6px">${c.val}</div>
        <div style="font-size:12px;color:var(--text-4)">${c.sub}</div>`;
      cards.appendChild(card);
    });
    wrap.appendChild(cards);

    // ── Section title ─────────────────────────────────────────────────
    const secTitle = h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:16px' });
    secTitle.appendChild(h('h2', { style: 'font-size:15px;font-weight:700;color:var(--text-1)' },
      view === 'resumo' ? '📊 Resumo por Vacina' : '📋 Lista Detalhada por Vacina'
    ));
    secTitle.appendChild(h('span', {
      style: 'font-size:11px;background:var(--primary-bg);color:var(--primary-dark);padding:2px 8px;border-radius:20px;font-weight:600'
    }, data.mes_extenso));
    wrap.appendChild(secTitle);

    // ── RESUMO VIEW ───────────────────────────────────────────────────
    if (view === 'resumo') {
      const tbl = h('div', { style: 'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden' });

      // Header
      const thead = h('div', {
        style: 'display:grid;grid-template-columns:40px 1fr 120px 80px;gap:0;padding:12px 20px;background:var(--bg-subtle);border-bottom:1px solid var(--border)'
      });
      ['', 'Vacina', 'Fabricante', 'Qtd.'].forEach((t, i) => {
        thead.appendChild(h('div', {
          style: `font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;${i === 3 ? 'text-align:right' : ''}`
        }, t));
      });
      tbl.appendChild(thead);

      // Rows
      const maxQtd = Math.max(...data.vacinas.map(v => v.quantidade));
      data.vacinas.forEach((v, idx) => {
        const row = h('div', {
          style: `display:grid;grid-template-columns:40px 1fr 120px 80px;gap:0;padding:14px 20px;align-items:center;${idx < data.vacinas.length - 1 ? 'border-bottom:1px solid var(--border)' : ''};transition:background 0.1s`,
        });
        row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-subtle)');
        row.addEventListener('mouseleave', () => row.style.background = '');

        // Color dot
        const dot = h('div', { style: `width:12px;height:12px;border-radius:50%;background:${getCor(idx)};flex-shrink:0` });
        row.appendChild(dot);

        // Name + bar
        const nameCell = h('div');
        nameCell.appendChild(h('div', { style: 'font-size:14px;font-weight:600;color:var(--text-1)' }, v.vacina_nome));
        const bar = h('div', { style: 'margin-top:4px;height:4px;background:var(--border);border-radius:2px;max-width:300px' });
        const fill = h('div', {
          style: `height:4px;border-radius:2px;background:${getCor(idx)};width:${Math.round(v.quantidade / maxQtd * 100)}%;transition:width 0.4s ease`
        });
        bar.appendChild(fill);
        nameCell.appendChild(bar);
        row.appendChild(nameCell);

        // Fabricante
        row.appendChild(h('div', { style: 'font-size:12px;color:var(--text-3)' }, v.fabricante || '—'));

        // Qty badge
        const qtdBadge = h('div', {
          style: `text-align:right;font-size:22px;font-weight:800;color:${getCor(idx)}`
        }, String(v.quantidade));
        row.appendChild(qtdBadge);

        tbl.appendChild(row);
      });

      // Footer total
      const footer = h('div', {
        style: 'display:grid;grid-template-columns:40px 1fr 120px 80px;padding:14px 20px;border-top:2px solid var(--border);background:var(--bg-subtle)'
      });
      footer.appendChild(h('div'));
      footer.appendChild(h('div', { style: 'font-size:13px;font-weight:700;color:var(--text-1)' }, 'TOTAL'));
      footer.appendChild(h('div'));
      footer.appendChild(h('div', { style: 'text-align:right;font-size:22px;font-weight:800;color:var(--primary)' }, String(data.total_doses)));
      tbl.appendChild(footer);
      wrap.appendChild(tbl);
    }

    // ── DETALHADO VIEW ────────────────────────────────────────────────
    if (view === 'detalhado') {
      const container = h('div', { style: 'display:flex;flex-direction:column;gap:16px' });

      data.vacinas.forEach((v, idx) => {
        const card = h('div', {
          style: `background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden`
        });

        // Vaccine header
        const vh = h('div', {
          style: `display:flex;align-items:center;gap:14px;padding:16px 20px;background:linear-gradient(135deg,${getCor(idx)}18,${getCor(idx)}08);border-bottom:1px solid var(--border);cursor:pointer`
        });

        const vdot = h('div', { style: `width:36px;height:36px;border-radius:10px;background:${getCor(idx)};display:flex;align-items:center;justify-content:center;flex-shrink:0` });
        vdot.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="m19 8-7 7-3-3"/><path d="M3 21 21 3"/></svg>`;
        vh.appendChild(vdot);

        const vinfo = h('div', { style: 'flex:1' });
        vinfo.appendChild(h('div', { style: 'font-size:15px;font-weight:700;color:var(--text-1)' }, v.vacina_nome));
        if (v.fabricante) vinfo.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3);margin-top:2px' }, v.fabricante));
        vh.appendChild(vinfo);

        const qtdPill = h('div', {
          style: `padding:6px 16px;border-radius:20px;background:${getCor(idx)};color:white;font-size:14px;font-weight:800`
        }, v.quantidade + ' dose' + (v.quantidade !== 1 ? 's' : ''));
        vh.appendChild(qtdPill);
        card.appendChild(vh);

        // Patients table
        const ptbl = h('div');
        const pthdr = h('div', {
          style: 'display:grid;grid-template-columns:1fr 100px 80px 1fr;gap:0;padding:10px 20px;background:var(--bg-subtle);border-bottom:1px solid var(--border)'
        });
        ['Paciente', 'Idade', 'Dose', 'Plano'].forEach(t => {
          pthdr.appendChild(h('div', { style: 'font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em' }, t));
        });
        ptbl.appendChild(pthdr);

        v.pacientes.forEach((p, pi) => {
          const prow = h('div', {
            style: `display:grid;grid-template-columns:1fr 100px 80px 1fr;gap:0;padding:12px 20px;align-items:center;${pi < v.pacientes.length - 1 ? 'border-bottom:1px solid var(--border-subtle,#f1f5f9)' : ''}`,
          });
          prow.addEventListener('mouseenter', () => prow.style.background = 'var(--bg-subtle)');
          prow.addEventListener('mouseleave', () => prow.style.background = '');

          // Paciente name
          const pname = h('div');
          pname.appendChild(h('div', { style: 'font-size:13px;font-weight:600;color:var(--text-1)' }, p.nome_paciente));
          if (p.nome_paciente !== p.nome_responsavel) {
            pname.appendChild(h('div', { style: 'font-size:11px;color:var(--text-3)' }, '↳ ' + p.nome_responsavel));
          }
          prow.appendChild(pname);

          prow.appendChild(h('div', { style: 'font-size:12px;color:var(--text-2)' }, p.idade));
          prow.appendChild(h('div', {
            style: `font-size:11px;font-weight:700;padding:3px 8px;border-radius:12px;background:${getCor(idx)}20;color:${getCor(idx)};display:inline-block`
          }, 'Dose ' + p.dose_numero));
          prow.appendChild(h('div', { style: 'font-size:12px;color:var(--text-3)' }, p.plano_nome));
          ptbl.appendChild(prow);
        });

        card.appendChild(ptbl);
        container.appendChild(card);
      });

      wrap.appendChild(container);
    }

    // Bottom note
    wrap.appendChild(h('div', {
      style: 'margin-top:20px;padding:12px 16px;background:var(--bg-subtle);border-radius:8px;font-size:11px;color:var(--text-4);text-align:center'
    }, `⚡ Baseado em ${data.total_doses} doses pendentes nos planos ativos · ${data.mes_extenso} · Gerado em ${new Date().toLocaleDateString('pt-BR', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' })}`));
  }

  // ── Calcular ──────────────────────────────────────────────────────────
  async function calcular() {
    loading = true;
    await draw();
    try {
      data = await Api.get('/estimativas', { mes: selMes });
    } catch (e) {
      data = null;
      Toast.show('Erro ao calcular estimativa', 'error');
    }
    loading = false;
    await draw();
  }

  // ── PDF Generator ─────────────────────────────────────────────────────
  function gerarPDF() {
    if (!data || data.total_doses === 0) return;

    const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const [anoN, mesN] = data.mes.split('-').map(Number);

    // Build vaccine rows for summary
    const resumoRows = data.vacinas.map((v, i) => `
      <tr>
        <td><span class="dot" style="background:${getCor(i)}"></span></td>
        <td class="nome">${v.vacina_nome}</td>
        <td class="fab">${v.fabricante || '—'}</td>
        <td class="qtd">${v.quantidade}</td>
      </tr>`).join('');

    // Build detail sections
    const detalheSecs = data.vacinas.map((v, i) => {
      const pacRows = v.pacientes.map(p => `
        <tr>
          <td class="nome">${p.nome_paciente}${p.nome_paciente !== p.nome_responsavel ? `<br><small>${p.nome_responsavel}</small>` : ''}</td>
          <td>${p.idade}</td>
          <td>Dose ${p.dose_numero}</td>
          <td class="plano">${p.plano_nome}</td>
        </tr>`).join('');
      return `
        <div class="vac-block">
          <div class="vac-header" style="border-left:4px solid ${getCor(i)}">
            <span class="vac-name">${v.vacina_nome}</span>
            ${v.fabricante ? `<span class="vac-fab">${v.fabricante}</span>` : ''}
            <span class="vac-qtd" style="background:${getCor(i)}">${v.quantidade} dose${v.quantidade !== 1 ? 's' : ''}</span>
          </div>
          <table class="det-table">
            <thead><tr><th>Paciente</th><th>Idade</th><th>Dose</th><th>Plano</th></tr></thead>
            <tbody>${pacRows}</tbody>
          </table>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Estimativa Vacinal — ${data.mes_extenso}</title>
<style>
  @page { margin: 16mm 14mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: white; }

  /* HEADER */
  .header { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px; border-bottom:2px solid #6366f1; margin-bottom:20px; }
  .header-left h1 { font-size:20px; font-weight:800; color:#1e293b; letter-spacing:-0.5px; }
  .header-left p { font-size:11px; color:#64748b; margin-top:2px; }
  .header-right { text-align:right; }
  .mes-badge { display:inline-block; background:#6366f1; color:white; font-size:14px; font-weight:800; padding:8px 18px; border-radius:10px; letter-spacing:0.02em; }
  .gen-date { font-size:9px; color:#94a3b8; margin-top:4px; }

  /* STAT CARDS */
  .cards { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:22px; }
  .card { padding:14px 16px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; }
  .card-val { font-size:28px; font-weight:800; line-height:1; margin-bottom:4px; }
  .card-lbl { font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.06em; }

  /* SECTION TITLE */
  .sec-title { font-size:13px; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:12px; margin-top:22px; }
  .sec-title:first-of-type { margin-top:0; }

  /* RESUMO TABLE */
  .res-table { width:100%; border-collapse:collapse; margin-bottom:4px; }
  .res-table th { background:#f1f5f9; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#64748b; padding:8px 10px; text-align:left; border-bottom:2px solid #e2e8f0; }
  .res-table td { padding:10px 10px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
  .res-table .nome { font-weight:600; font-size:12px; }
  .res-table .fab { color:#64748b; font-size:10px; }
  .res-table .qtd { font-size:20px; font-weight:800; text-align:right; }
  .res-table tr:last-child td { border-bottom:none; }
  .res-table .total-row td { font-weight:700; background:#f8fafc; border-top:2px solid #e2e8f0; }
  .dot { display:inline-block; width:10px; height:10px; border-radius:50%; }

  /* DETAIL SECTION */
  .vac-block { margin-bottom:18px; page-break-inside:avoid; }
  .vac-header { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#f8fafc; border-radius:8px 8px 0 0; margin-bottom:0; }
  .vac-name { font-size:13px; font-weight:700; flex:1; }
  .vac-fab { font-size:10px; color:#64748b; }
  .vac-qtd { color:white; font-size:10px; font-weight:700; padding:3px 10px; border-radius:12px; }
  .det-table { width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 8px 8px; overflow:hidden; }
  .det-table th { background:#f8fafc; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; padding:7px 12px; text-align:left; border-bottom:1px solid #e2e8f0; }
  .det-table td { padding:9px 12px; border-bottom:1px solid #f8fafc; font-size:11px; vertical-align:top; }
  .det-table .nome { font-weight:600; }
  .det-table .nome small { font-size:9px; color:#94a3b8; font-weight:400; }
  .det-table .plano { color:#64748b; font-size:10px; }
  .det-table tr:last-child td { border-bottom:none; }

  /* FOOTER */
  .footer { margin-top:28px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; }

  @media print {
    .vac-block { page-break-inside:avoid; }
    body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>🧮 Estimativa de Demanda Vacinal</h1>
    <p>Vittalis Saúde — Projeção baseada em planos vacinais ativos</p>
  </div>
  <div class="header-right">
    <div class="mes-badge">${data.mes_extenso}</div>
    <div class="gen-date">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
  </div>
</div>

<div class="cards">
  <div class="card">
    <div class="card-val" style="color:#6366f1">${data.total_doses}</div>
    <div class="card-lbl">💉 Doses Previstas</div>
  </div>
  <div class="card">
    <div class="card-val" style="color:#0ea5e9">${data.total_pacientes}</div>
    <div class="card-lbl">👶 Pacientes</div>
  </div>
  <div class="card">
    <div class="card-val" style="color:#10b981">${data.total_vacinas}</div>
    <div class="card-lbl">🧪 Vacinas Diferentes</div>
  </div>
</div>

<div class="sec-title">📊 RESUMO POR VACINA</div>
<table class="res-table">
  <thead>
    <tr><th></th><th>Vacina</th><th>Fabricante</th><th style="text-align:right">Qtd.</th></tr>
  </thead>
  <tbody>
    ${resumoRows}
    <tr class="total-row">
      <td></td><td colspan="2">TOTAL</td>
      <td class="qtd" style="color:#6366f1">${data.total_doses}</td>
    </tr>
  </tbody>
</table>

<div class="sec-title" style="margin-top:28px">📋 DETALHAMENTO POR PACIENTE</div>
${detalheSecs}

<div class="footer">
  <span>VittaSys · Vittalis Saúde</span>
  <span>Estimativa gerada automaticamente com base nos planos vacinais ativos</span>
</div>

<script>window.onload=()=>window.print();<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); }
    else Toast.show('Permita pop-ups para gerar o PDF', 'error');
  }

  // Initial render
  await draw();
  return wrap;
}
