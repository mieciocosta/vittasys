async function renderEstimativas() {
  const wrap = h('div', { className: 'fade-in' });
  const today = new Date();
  let selMes  = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0');
  let data    = null;
  let loading = false;

  const addMes = (mes, n) => {
    const [a,m] = mes.split('-').map(Number);
    const d = new Date(a, m-1+n, 1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  };
  const fmtDate = s => {
    if (!s) return '—';
    try { return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}); }
    catch(_) { return s; }
  };
  const SC = {
    urgente: { label:'🔴 Comprar Urgente', bg:'#fef2f2', border:'#fca5a5', cor:'#dc2626' },
    atencao: { label:'🟡 Atenção',         bg:'#fffbeb', border:'#fcd34d', cor:'#d97706' },
    ok:      { label:'🟢 Suficiente',      bg:'#f0fdf4', border:'#86efac', cor:'#16a34a' }
  };

  async function calcular() {
    loading = true; await draw();
    try { data = await Api.get('/estimativas', { mes: selMes }); }
    catch(e) { data = null; Toast.show('Erro ao calcular','error'); }
    loading = false; await draw();
  }

  function abrirPacientes(v) {
    showModal(`💉 ${v.nome} — ${data.mes_extenso}`, (body, close) => {
      if (!v.pacientes.length) {
        body.appendChild(h('p', {style:'color:var(--text-3);text-align:center;padding:20px'}, 'Nenhum paciente encontrado.'));
        return;
      }

      // Summary
      const sum = h('div', {style:'display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap'});
      sum.appendChild(h('span',{style:'font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;background:#eff6ff;color:#1d4ed8'},`${v.pacientes.length} pacientes previstos`));
      body.appendChild(sum);

      // Table header
      const hdr = h('div',{style:'display:grid;grid-template-columns:1fr 140px 60px 120px;gap:0;padding:8px 14px;background:var(--bg-subtle);border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none'});
      ['Paciente','Plano','Dose','Data Prevista'].forEach(t =>
        hdr.appendChild(h('div',{style:'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3)'},t))
      );
      body.appendChild(hdr);

      const list = h('div',{style:'border:1px solid var(--border);border-radius:0 0 8px 8px;overflow:hidden;max-height:400px;overflow-y:auto'});
      v.pacientes.forEach((p, pi) => {
        const row = h('div',{style:`display:grid;grid-template-columns:1fr 140px 60px 120px;padding:10px 14px;align-items:center;background:${pi%2===0?'white':'var(--bg-subtle)'}`});

        const pnCell = h('div');
        pnCell.appendChild(h('div',{style:'font-size:13px;font-weight:600;color:var(--text-1)'},p.paciente_nome));
        if (p.paciente_nome !== p.responsavel)
          pnCell.appendChild(h('div',{style:'font-size:10px;color:var(--text-3)'},'↳ '+p.responsavel));
        row.appendChild(pnCell);

        row.appendChild(h('div',{style:'font-size:11px;color:var(--text-2)'},p.plano_nome));
        row.appendChild(h('span',{style:'font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;background:#e0e7ff;color:#4338ca;display:inline-block'},'D'+p.dose_numero));
        row.appendChild(h('div',{style:'font-size:12px;font-weight:600;color:var(--text-1)'},fmtDate(p.data_prevista)));
        list.appendChild(row);
      });
      body.appendChild(list);

      // PDF desta vacina
      body.appendChild(h('div',{style:'margin-top:14px'}));
      body.appendChild(h('button',{
        className:'btn btn-outline btn-sm btn-block',
        style:'display:flex;align-items:center;justify-content:center;gap:6px',
        onClick:()=>gerarPDFVacina(v)
      },'📄 Exportar lista desta vacina'));
    }, '600px');
  }

  function gerarPDF() {
    if (!data?.tabela?.length) return;
    const rows = data.tabela.map(v => {
      const sc = SC[v.status];
      return `<tr>
        <td class="n">${v.nome}${v.lotes_vencendo.length?` <span style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;padding:1px 5px;border-radius:5px;font-size:8px">⚠️ Lote vencendo</span>`:''}</td>
        <td class="c b" style="color:#6366f1">${v.quantidade}</td>
        <td class="c">${v.estoque_atual}</td>
        <td class="c">${v.doses_reservadas}</td>
        <td class="c ${v.estoque_disponivel<v.quantidade?'red':''}">${v.estoque_disponivel}</td>
        <td class="c b2 ${v.sugestao_compra>0?'red2':''}">${v.sugestao_compra||'—'}</td>
        <td><span style="background:${sc.bg};color:${sc.cor};border:1px solid ${sc.border};padding:2px 7px;border-radius:8px;font-size:8.5px;font-weight:700">${sc.label}</span></td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Estimativa — ${data.mes_extenso}</title><style>
@page{margin:13mm 11mm;size:A4 portrait}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#1e293b}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;border-bottom:3px solid #6366f1;margin-bottom:14px}
.hdr h1{font-size:18px;font-weight:800}.hdr p{font-size:9px;color:#64748b;margin-top:2px}
.mb{background:#6366f1;color:#fff;font-size:12px;font-weight:800;padding:6px 14px;border-radius:8px;display:inline-block}
.gen{font-size:8px;color:#94a3b8;margin-top:3px;text-align:right}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
.card{padding:10px 12px;border-radius:7px;border:1px solid #e2e8f0}
.cv{font-size:22px;font-weight:800;line-height:1;margin-bottom:2px}.cl{font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase}
.formula{padding:7px 10px;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:6px;font-size:8.5px;color:#1d4ed8;margin-bottom:12px}
table{width:100%;border-collapse:collapse}
th{background:#f1f5f9;font-size:8px;font-weight:700;text-transform:uppercase;color:#64748b;padding:6px 8px;border-bottom:2px solid #e2e8f0;text-align:left}
th.c,td.c{text-align:center}
td{padding:8px 8px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.n{font-weight:600;font-size:10.5px}.b{font-size:15px;font-weight:800}.b2{font-size:17px;font-weight:800}
.red{color:#dc2626;font-weight:700}.red2{color:#dc2626}
.foot{margin-top:12px;padding-top:7px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="hdr">
  <div><h1>💊 Estimativa de Compra de Vacinas</h1><p>Vittalis Saúde · Baseado nos planos vacinais ativos e cronograma de doses</p></div>
  <div><div class="mb">${data.mes_extenso}</div><div class="gen">${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
</div>
<div class="cards">
  <div class="card"><div class="cv" style="color:#6366f1">${data.totais.doses_previstas}</div><div class="cl">Doses Previstas</div></div>
  <div class="card"><div class="cv" style="color:#dc2626">${data.totais.urgentes}</div><div class="cl">🔴 Urgente</div></div>
  <div class="card"><div class="cv" style="color:#d97706">${data.totais.atencao}</div><div class="cl">🟡 Atenção</div></div>
  <div class="card"><div class="cv" style="color:#16a34a">${data.totais.ok}</div><div class="cl">🟢 Suficiente</div></div>
</div>
<div class="formula">📐 <b>Sugestão de Compra = Doses Previstas no Mês − Estoque Disponível</b> &nbsp;|&nbsp; Estoque Disponível = Estoque Atual − Doses Reservadas (todos os meses futuros)</div>
<table>
  <thead><tr><th>Vacina</th><th class="c">Previstas no Mês</th><th class="c">Estoque Atual</th><th class="c">Reservadas</th><th class="c">Disponível</th><th class="c">Sugestão Compra</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="foot"><span>VittaSys · Vittalis Saúde</span><span>Planos ativos no sistema: ${data.debug?.planos_ativos_total||0} · Doses pendentes: ${data.debug?.doses_pendentes_total||0}</span></div>
<script>window.onload=()=>window.print();<\/script></body></html>`;

    const w = window.open('','_blank','width=900,height=720');
    if(w){w.document.write(html);w.document.close();}
    else Toast.show('Permita pop-ups','error');
  }

  function gerarPDFVacina(v) {
    const rows = v.pacientes.map(p=>`<tr><td>${p.paciente_nome}${p.paciente_nome!==p.responsavel?`<br><small>${p.responsavel}</small>`:''}</td><td>${p.plano_nome}</td><td>D${p.dose_numero}</td><td>${fmtDate(p.data_prevista)}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${v.nome} — ${data.mes_extenso}</title><style>
@page{margin:15mm 12mm;size:A4}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#1e293b}
.hdr{padding-bottom:10px;border-bottom:3px solid #6366f1;margin-bottom:14px}
h1{font-size:16px;font-weight:800}p{font-size:10px;color:#64748b;margin-top:3px}
table{width:100%;border-collapse:collapse}
th{background:#f1f5f9;font-size:9px;font-weight:700;text-transform:uppercase;color:#64748b;padding:7px 10px;border-bottom:2px solid #e2e8f0;text-align:left}
td{padding:9px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top;font-size:11px}
td small{font-size:9px;color:#94a3b8;display:block;margin-top:1px}
</style></head><body>
<div class="hdr"><h1>💉 ${v.nome}</h1><p>Vittalis Saúde · ${data.mes_extenso} · ${v.pacientes.length} pacientes previstos</p></div>
<table><thead><tr><th>Paciente</th><th>Plano</th><th>Dose</th><th>Data Prevista</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=()=>window.print();<\/script></body></html>`;
    const w = window.open('','_blank','width=750,height=600');
    if(w){w.document.write(html);w.document.close();}
  }

  // ── DRAW ────────────────────────────────────────────────────────────
  async function draw() {
    wrap.innerHTML = '';

    // Header
    wrap.appendChild(h('div',{className:'page-header'},
      h('div',{className:'page-header-left'},
        h('h1',{className:'page-title'},'💊 Estimativa de Compra de Vacinas'),
        h('p',{className:'page-subtitle'},'Cálculo dinâmico: nascimento + calendário vacinal · ' + (data ? `${data.debug?.planos||0} planos ativos · ${data.debug?.calculados||0} calculados` : 'Selecione um mês'))
      )
    ));

    // Controls
    const ctrl = h('div',{style:'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding:16px 20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border)'});

    const navW = h('div',{style:'display:flex;align-items:center;gap:6px'});
    const nb = (l,fn) => h('button',{style:'width:34px;height:34px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:17px;color:var(--text-2)',onClick:fn},l);
    navW.appendChild(nb('‹',async()=>{selMes=addMes(selMes,-1);await calcular();}));
    const mInp = h('input',{type:'month',value:selMes,style:'padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;background:var(--bg-subtle);min-width:170px;cursor:pointer'});
    mInp.addEventListener('change',async e=>{selMes=e.target.value;await calcular();});
    navW.appendChild(mInp);
    navW.appendChild(nb('›',async()=>{selMes=addMes(selMes,1);await calcular();}));
    ctrl.appendChild(navW);
    ctrl.appendChild(h('div',{style:'flex:1'}));

    if (data?.tabela?.length) {
      const pdfB = h('button',{className:'btn btn-outline btn-sm',style:'display:flex;align-items:center;gap:6px;font-weight:600',onClick:gerarPDF});
      pdfB.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Exportar PDF`;
      ctrl.appendChild(pdfB);
    }
    wrap.appendChild(ctrl);

    if (loading) {
      wrap.appendChild(h('div',{style:'text-align:center;padding:80px'},h('div',{style:'font-size:48px;margin-bottom:16px'},'⏳'),h('div',{style:'color:var(--text-3)'},'Calculando estimativa…')));
      return;
    }

    if (!data) {
      const emp=h('div',{style:'text-align:center;padding:80px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'});
      emp.innerHTML=`<div style="font-size:52px;margin-bottom:16px">💊</div><h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Selecione o mês</h3><p style="color:var(--text-3)">Use as setas para ver a estimativa de compra.</p>`;
      wrap.appendChild(emp);await calcular();return;
    }

    // Debug panel (visível quando vazio, útil para diagnóstico)
    if (!data.tabela.length) {
      const emp=h('div',{style:'text-align:center;padding:60px 40px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'});
      const d=data.debug||{};
      emp.innerHTML=`<div style="font-size:48px;margin-bottom:14px">📭</div>
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px">Nenhuma dose prevista para ${data.mes_extenso}</h3>
        <div style="font-size:12px;color:var(--text-3);max-width:540px;margin:0 auto;line-height:2.1">
          <div>📋 Planos ativos: <strong>${d.planos||0}</strong></div>
          <div>📅 Calculados (têm nascimento): <strong>${d.calculados||0}</strong></div>
          <div>🗓️ Com template (calendário): <strong>${d.com_template||0}</strong></div>
          <div>📝 Sem template (doses programadas): <strong>${d.sem_template||0}</strong></div>
          <div>❓ Sem data de nascimento: <strong>${d.sem_nascimento||0}</strong></div>
          <div>🔢 Previsões geradas: <strong>${d.previsoes_brutas||0}</strong></div>
          <div>✅ Após deduplicação: <strong>${d.previsoes_dedup||0}</strong></div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-4)">
            Se "previsões geradas = 0", verifique se os pacientes têm data de nascimento cadastrada
            e se as doses do plano têm "mês previsto" configurado.
          </div>
        </div>`;
      wrap.appendChild(emp);return;
    }

    // Summary cards
    const cards=h('div',{style:'display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px'});
    [{val:data.totais.doses_previstas,lbl:'Doses Previstas',ico:'💉',cor:'#6366f1'},
     {val:data.totais.urgentes,lbl:'Compra Urgente',ico:'🔴',cor:'#dc2626'},
     {val:data.totais.atencao,lbl:'Atenção',ico:'🟡',cor:'#d97706'},
     {val:data.totais.ok,lbl:'Suficientes',ico:'🟢',cor:'#16a34a'}
    ].forEach(c=>{
      const card=h('div',{style:`padding:20px 16px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border);position:relative;overflow:hidden`});
      card.innerHTML=`<div style="position:absolute;top:-8px;right:-8px;font-size:50px;opacity:.07">${c.ico}</div>
        <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">${c.lbl}</div>
        <div style="font-size:32px;font-weight:800;color:${c.cor};line-height:1">${c.val}</div>`;
      cards.appendChild(card);
    });
    wrap.appendChild(cards);

    // Formula
    const form=h('div',{style:'margin-bottom:16px;padding:10px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;font-size:12px;color:#1d4ed8'});
    form.innerHTML=`📐 <strong>Sugestão de Compra</strong> = Doses Previstas no Mês − Estoque Disponível &nbsp;|&nbsp; <strong>Estoque Disponível</strong> = Estoque Atual − Doses Reservadas`;
    wrap.appendChild(form);

    // Table
    const tblWrap=h('div',{style:'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden'});
    const tbl=document.createElement('table');
    tbl.style.cssText='width:100%;border-collapse:collapse';

    // Header
    const thead=document.createElement('thead');
    const trh=document.createElement('tr');
    trh.style.background='var(--bg-subtle)';
    ['Vacina','Previstas no Mês','Estoque Atual','Reservadas','Disponível','Sugestão Compra','Status',''].forEach((l,i)=>{
      const th=document.createElement('th');
      th.style.cssText=`padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3);text-align:${i===0?'left':'center'};white-space:nowrap`;
      th.textContent=l;trh.appendChild(th);
    });
    thead.appendChild(trh);tbl.appendChild(thead);

    const tbody=document.createElement('tbody');
    data.tabela.forEach(v=>{
      const sc=SC[v.status];
      const tr=document.createElement('tr');
      tr.style.cssText='transition:background .1s';
      tr.addEventListener('mouseenter',()=>tr.style.background='var(--bg-subtle)');
      tr.addEventListener('mouseleave',()=>tr.style.background='');

      const mkTd=(html,align='center',extra='')=>{
        const td=document.createElement('td');
        td.style.cssText=`padding:12px 14px;border-bottom:1px solid var(--border);text-align:${align};vertical-align:middle;${extra}`;
        td.innerHTML=html;return td;
      };

      // Nome
      const alertV=v.lotes_vencendo.length?`<span style="font-size:9px;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:5px;padding:1px 5px;margin-left:6px">⚠️ Lote vencendo</span>`:'';
      tr.appendChild(mkTd(`<div style="font-size:13px;font-weight:700;color:var(--text-1)">${esc(v.nome)}${alertV}</div>`,'left'));

      // Quantidade prevista (destaque)
      tr.appendChild(mkTd(`<span style="font-size:24px;font-weight:800;color:#6366f1">${v.quantidade}</span>`));
      tr.appendChild(mkTd(`<span style="font-size:16px;font-weight:700;color:${v.estoque_atual<v.quantidade?'#d97706':'var(--text-1)'}">${v.estoque_atual}</span>`));
      tr.appendChild(mkTd(`<span style="font-size:14px;color:#94a3b8">${v.doses_reservadas}</span>`));
      tr.appendChild(mkTd(`<span style="font-size:16px;font-weight:700;color:${v.estoque_disponivel<v.quantidade?'#dc2626':'#16a34a'}">${v.estoque_disponivel}</span>`));

      // Sugestão
      const sug = v.sugestao_compra>0
        ? `<span style="font-size:26px;font-weight:800;color:#dc2626">${v.sugestao_compra}</span><div style="font-size:8px;color:#94a3b8">doses</div>`
        : `<span style="font-size:22px;color:#16a34a">✓</span>`;
      tr.appendChild(mkTd(sug));

      tr.appendChild(mkTd(`<span style="display:inline-block;padding:5px 10px;border-radius:16px;font-size:10px;font-weight:700;background:${sc.bg};color:${sc.cor};border:1px solid ${sc.border}">${sc.label}</span>`));

      // Ver pacientes button
      const tdBtn=document.createElement('td');
      tdBtn.style.cssText='padding:8px 14px;border-bottom:1px solid var(--border);text-align:center';
      tdBtn.appendChild(h('button',{
        className:'btn btn-outline btn-sm',
        style:'font-size:11px;white-space:nowrap',
        onClick:e=>{e.stopPropagation();abrirPacientes(v);}
      },'👥 Ver pacientes'));
      tr.appendChild(tdBtn);

      tbody.appendChild(tr);
    });

    tbl.appendChild(tbody);tblWrap.appendChild(tbl);
    wrap.appendChild(tblWrap);

    wrap.appendChild(h('div',{style:'margin-top:14px;padding:10px 16px;background:var(--bg-subtle);border-radius:8px;font-size:11px;color:var(--text-4);text-align:center'},
      `⚡ ${data.debug?.planos||0} planos · ${data.debug?.calculados||0} calculados · ${data.debug?.com_template||0} c/ template · ${data.debug?.sem_template||0} c/ doses programadas · ${data.totais?.doses_previstas||0} previstas em ${data.mes_extenso}`
    ));
  }

  await draw();
  return wrap;
}
