// ═══════════════════════════════════════════════════════════════════════════
// ESTIMATIVA DE COMPRA DE VACINAS
// ═══════════════════════════════════════════════════════════════════════════
async function renderEstimativas() {
  const wrap = h('div', { className: 'fade-in' });
  const today = new Date();
  let selMes    = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0');
  let margemPct = 20;
  let data      = null;
  let loading   = false;
  let filtro    = 'todos';
  let detalheVid = null; // ID da vacina com detalhe aberto

  const addMes = (mes, n) => {
    const [a,m] = mes.split('-').map(Number);
    const d = new Date(a, m-1+n, 1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  };

  const SC = {
    urgente: { label:'🔴 Compra Urgente', bg:'#fef2f2', border:'#fca5a5', cor:'#dc2626' },
    atencao: { label:'🟡 Atenção',        bg:'#fffbeb', border:'#fcd34d', cor:'#d97706' },
    ok:      { label:'🟢 Suficiente',     bg:'#f0fdf4', border:'#86efac', cor:'#16a34a' }
  };
  const FONTE_CFG = {
    plano:          { label:'📋 Plano ativo',       bg:'#eff6ff', cor:'#1d4ed8' },
    plano_e_agendado:{ label:'📋✅ Plano + Agendado', bg:'#ecfdf5', cor:'#065f46' },
    agendamento:    { label:'📅 Agendamento',       bg:'#faf5ff', cor:'#7e22ce' },
    historico:      { label:'📊 Histórico',         bg:'#fff7ed', cor:'#c2410c' }
  };

  async function calcular() {
    loading = true; await draw();
    try { data = await Api.get('/estimativas', { mes: selMes, margem_pct: margemPct }); }
    catch(e) { data = null; Toast.show('Erro ao calcular','error'); }
    loading = false; detalheVid = null; await draw();
  }

  function filtrados() {
    if (!data) return [];
    if (filtro === 'todos') return data.tabela;
    return data.tabela.filter(v => v.status === filtro);
  }

  // ── PDF ───────────────────────────────────────────────────────────────
  function gerarPDF() {
    if (!data?.tabela?.length) return;
    const rows = filtrados().map(v => {
      const sc = SC[v.status];
      const demStr = `${v.demanda_total}<br><span style="font-size:8px;color:#64748b">📋${v.demanda_planos} 📅${v.demanda_agendas} 📊${v.media_historica}</span>`;
      return `<tr>
        <td class="n">${v.nome}</td>
        <td class="c">${v.demanda_planos}</td>
        <td class="c">${v.demanda_agendas}</td>
        <td class="c">${v.media_historica}</td>
        <td class="c b">${v.demanda_total}</td>
        <td class="c">${v.estoque_atual}</td>
        <td class="c">${v.doses_reservadas}</td>
        <td class="c">${v.estoque_disponivel}</td>
        <td class="c">${v.margem_seguranca}</td>
        <td class="c b" style="color:${v.sugestao_compra>0?'#dc2626':'#16a34a'}">${v.sugestao_compra||'—'}</td>
        <td><span style="background:${sc.bg};color:${sc.cor};border:1px solid ${sc.border};padding:2px 7px;border-radius:8px;font-size:8.5px;font-weight:700">${sc.label}</span></td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Estimativa — ${data.mes_extenso}</title><style>
@page{margin:13mm 11mm;size:A4 landscape}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:9.5px;color:#1e293b}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;border-bottom:3px solid #6366f1;margin-bottom:14px}
.hdr h1{font-size:17px;font-weight:800}.hdr p{font-size:9px;color:#64748b;margin-top:2px}
.mb{background:#6366f1;color:#fff;font-size:12px;font-weight:800;padding:6px 14px;border-radius:8px;display:inline-block}
.gen{font-size:8px;color:#94a3b8;margin-top:3px;text-align:right}
.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px}
.card{padding:10px;border-radius:7px;border:1px solid #e2e8f0}
.cv{font-size:20px;font-weight:800;line-height:1;margin-bottom:2px}
.cl{font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
.formula{padding:7px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;font-size:8.5px;color:#1d4ed8;margin-bottom:12px}
table{width:100%;border-collapse:collapse}
th{background:#f1f5f9;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;padding:6px 8px;border-bottom:2px solid #e2e8f0;text-align:left}
th.c,td.c{text-align:center}
td{padding:8px 8px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.n{font-weight:600;font-size:10px}.b{font-size:13px;font-weight:800}
.foot{margin-top:14px;padding-top:7px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="hdr">
  <div><h1>💊 Estimativa de Compra de Vacinas</h1><p>Vittalis Saúde · Margem: ${data.margem_pct}% · Demanda = Planos Ativos + Agendamentos + Média Histórica</p></div>
  <div><div class="mb">${data.mes_extenso}</div><div class="gen">${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
</div>
<div class="cards">
  <div class="card"><div class="cv" style="color:#6366f1">${data.tabela.length}</div><div class="cl">Vacinas</div></div>
  <div class="card"><div class="cv" style="color:#dc2626">${data.totais.urgentes}</div><div class="cl">🔴 Urgente</div></div>
  <div class="card"><div class="cv" style="color:#d97706">${data.totais.atencao}</div><div class="cl">🟡 Atenção</div></div>
  <div class="card"><div class="cv" style="color:#16a34a">${data.totais.ok}</div><div class="cl">🟢 Suficiente</div></div>
  <div class="card"><div class="cv" style="color:#6366f1">${data.totais.total_sugestao}</div><div class="cl">💊 Total Compra</div></div>
</div>
<div class="formula">📐 <b>Sugestão = Demanda Prevista + Margem (${data.margem_pct}%) − Estoque Disponível</b> &nbsp;|&nbsp; Estoque Disponível = Estoque Atual − Doses Reservadas</div>
<table>
  <thead><tr>
    <th>Vacina</th><th class="c">📋 Planos</th><th class="c">📅 Agendadas</th><th class="c">📊 Histórico</th>
    <th class="c">Demanda Total</th><th class="c">Estoque</th><th class="c">Reservadas</th>
    <th class="c">Disponível</th><th class="c">Margem</th><th class="c">Sugestão</th><th>Status</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="foot">
  <span>VittaSys · Vittalis Saúde</span>
  <span>Gerado automaticamente · Planos ativos no sistema: ${data._debug?.total_doses_planos_sistema||0} doses cadastradas</span>
</div>
<script>window.onload=()=>window.print();<\/script>
</body></html>`;
    const w = window.open('','_blank','width=1100,height=750');
    if(w){w.document.write(html);w.document.close();}
    else Toast.show('Permita pop-ups','error');
  }

  // ── DRAW ──────────────────────────────────────────────────────────────
  async function draw() {
    wrap.innerHTML = '';

    // Header
    const hdr = h('div',{className:'page-header'});
    hdr.appendChild(h('div',{className:'page-header-left'},
      h('h1',{className:'page-title'},'💊 Estimativa de Compra de Vacinas'),
      h('p',{className:'page-subtitle'},'Doses de planos ativos + agendamentos + histórico · Planejamento de compras')
    ));
    wrap.appendChild(hdr);

    // Controls
    const ctrl = h('div',{style:'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding:16px 20px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border)'});

    const navW = h('div',{style:'display:flex;align-items:center;gap:6px'});
    const nb = (lbl,fn) => h('button',{style:'width:34px;height:34px;border:1px solid var(--border);background:var(--bg-subtle);border-radius:8px;cursor:pointer;font-size:17px;color:var(--text-2)',onClick:fn},lbl);
    navW.appendChild(nb('‹',async()=>{selMes=addMes(selMes,-1);await calcular();}));
    const mInp = h('input',{type:'month',value:selMes,style:'padding:8px 14px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;background:var(--bg-subtle);min-width:170px;cursor:pointer'});
    mInp.addEventListener('change',async e=>{selMes=e.target.value;await calcular();});
    navW.appendChild(mInp);
    navW.appendChild(nb('›',async()=>{selMes=addMes(selMes,1);await calcular();}));
    ctrl.appendChild(navW);

    ctrl.appendChild(h('div',{style:'width:1px;height:28px;background:var(--border)'}));

    // Margem
    const mW = h('div',{style:'display:flex;align-items:center;gap:8px'});
    mW.appendChild(h('span',{style:'font-size:12px;font-weight:600;color:var(--text-2)'},'🛡️ Margem:'));
    const mI = h('input',{type:'number',min:'0',max:'200',value:margemPct,style:'width:60px;padding:6px 8px;border:1px solid var(--border);border-radius:8px;font-size:14px;font-weight:700;text-align:center;background:var(--bg-subtle)'});
    mI.addEventListener('change',async e=>{margemPct=parseInt(e.target.value)||20;await calcular();});
    mW.appendChild(mI);
    mW.appendChild(h('span',{style:'font-size:12px;color:var(--text-3)'},'%'));
    ctrl.appendChild(mW);

    ctrl.appendChild(h('div',{style:'flex:1'}));

    if (data?.tabela?.length) {
      // Filter chips
      const chips = h('div',{style:'display:flex;gap:6px'});
      [['todos','Todas','#6366f1'],['urgente','🔴 Urgente','#dc2626'],['atencao','🟡 Atenção','#d97706'],['ok','🟢 OK','#16a34a']].forEach(([v,lbl,cor])=>{
        chips.appendChild(h('button',{
          style:`padding:5px 11px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid;cursor:pointer;${filtro===v?`background:${cor};color:white;border-color:${cor}`:`background:transparent;color:${cor};border-color:${cor}40`}`,
          onClick:async()=>{filtro=v;detalheVid=null;await draw();}
        },lbl));
      });
      ctrl.appendChild(chips);

      const pdfB = h('button',{className:'btn btn-outline btn-sm',style:'display:flex;align-items:center;gap:6px;font-weight:600',onClick:gerarPDF});
      pdfB.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> PDF`;
      ctrl.appendChild(pdfB);
    }
    wrap.appendChild(ctrl);

    if (loading) {
      wrap.appendChild(h('div',{style:'text-align:center;padding:80px'},h('div',{style:'font-size:48px;margin-bottom:16px'},'⏳'),h('div',{style:'color:var(--text-3)'},'Calculando…')));
      return;
    }

    if (!data) {
      const emp=h('div',{style:'text-align:center;padding:80px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'});
      emp.innerHTML=`<div style="font-size:52px;margin-bottom:16px">💊</div><h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Selecione o mês</h3><p style="color:var(--text-3)">Use as setas para ver a estimativa de compra.</p>`;
      wrap.appendChild(emp);await calcular();return;
    }

    if (!data.tabela.length) {
      const emp=h('div',{style:'text-align:center;padding:80px;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)'});
      emp.innerHTML=`<div style="font-size:52px;margin-bottom:16px">📭</div><h3 style="font-size:18px;font-weight:700;margin-bottom:8px">Sem dados</h3>
        <p style="color:var(--text-3);margin-bottom:8px">Nenhum dado para <strong>${data.mes_extenso}</strong>.</p>
        <p style="font-size:12px;color:var(--text-4)">Total de doses no sistema: ${data._debug?.total_doses_planos_sistema||0} · Previstas para este mês: ${data._debug?.doses_previstas_mes||0}</p>`;
      wrap.appendChild(emp);return;
    }

    // Summary cards
    const cards=h('div',{style:'display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px'});
    [{val:data.tabela.length,lbl:'Vacinas',ico:'🧪',cor:'#6366f1'},
     {val:data.totais.urgentes,lbl:'Compra Urgente',ico:'🔴',cor:'#dc2626'},
     {val:data.totais.atencao,lbl:'Atenção',ico:'🟡',cor:'#d97706'},
     {val:data.totais.ok,lbl:'Suficientes',ico:'🟢',cor:'#16a34a'},
     {val:data.totais.total_sugestao,lbl:'Total p/ Comprar',ico:'💊',cor:'#6366f1'}
    ].forEach(c=>{
      const card=h('div',{style:`padding:18px 14px;background:var(--bg-card);border-radius:14px;border:1px solid var(--border);position:relative;overflow:hidden`});
      card.innerHTML=`<div style="position:absolute;top:-8px;right:-8px;font-size:48px;opacity:.07">${c.ico}</div>
        <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">${c.lbl}</div>
        <div style="font-size:32px;font-weight:800;color:${c.cor};line-height:1">${c.val}</div>`;
      cards.appendChild(card);
    });
    wrap.appendChild(cards);

    // Formula info
    const form=h('div',{style:'margin-bottom:16px;padding:10px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;font-size:12px;color:#1d4ed8;display:flex;align-items:center;gap:8px'});
    form.innerHTML=`<span style="font-size:16px">📐</span><div><strong>Sugestão de Compra</strong> = Demanda Prevista (📋 Planos + 📅 Agendados + 📊 Histórico) + Margem ${data.margem_pct}% − Estoque Disponível &nbsp;·&nbsp; <span style="opacity:.75">Total de doses nos planos: ${data._debug?.total_doses_planos_sistema||0} | Previstas para ${data.mes_extenso}: ${data._debug?.doses_previstas_mes||0}</span></div>`;
    wrap.appendChild(form);

    // ── TABLE HEADER ────────────────────────────────────────────────────
    const tblWrap=h('div',{style:'background:var(--bg-card);border-radius:14px;border:1px solid var(--border);overflow:hidden'});
    const tbl=document.createElement('table');
    tbl.style.cssText='width:100%;border-collapse:collapse';
    const thead=document.createElement('thead');
    const trh=document.createElement('tr');
    trh.style.background='var(--bg-subtle)';
    const cols=[
      ['Vacina','left'],['📋 Planos','center'],['📅 Agendadas','center'],
      ['📊 Histórico','center'],['Demanda Total','center'],['Estoque Atual','center'],
      ['Reservadas','center'],['Disponível','center'],['Margem','center'],
      ['Sugestão Compra','center'],['Status','center'],['','center']
    ];
    cols.forEach(([l,ta])=>{
      const th=document.createElement('th');
      th.style.cssText=`padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3);text-align:${ta};white-space:nowrap`;
      th.textContent=l;thead.appendChild(th);
    });
    trh.appendChild(...Array.from(thead.children));
    // fix: just append cols as th to trh
    thead.innerHTML='';
    cols.forEach(([l,ta])=>{
      const th=document.createElement('th');
      th.style.cssText=`padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3);text-align:${ta};white-space:nowrap`;
      th.textContent=l;thead.appendChild(th);
    });
    tbl.appendChild(thead);

    const tbody=document.createElement('tbody');
    const rows=filtrados();

    rows.forEach(v=>{
      const sc=SC[v.status];
      // ── Vaccine row ────────────────────────────────────────────────
      const tr=document.createElement('tr');
      tr.style.cssText='transition:background .1s;cursor:pointer';
      tr.addEventListener('mouseenter',()=>tr.style.background='var(--bg-subtle)');
      tr.addEventListener('mouseleave',()=>tr.style.background=detalheVid===v.vacina_id?'var(--bg-subtle)':'');

      const td=(content,align='center',extra='')=>{
        const td=document.createElement('td');
        td.style.cssText=`padding:12px;border-bottom:1px solid var(--border);text-align:${align};vertical-align:middle;${extra}`;
        if(typeof content==='string')td.innerHTML=content;
        else td.appendChild(content);
        return td;
      };

      // Nome
      const tdNome=document.createElement('td');
      tdNome.style.cssText='padding:12px;border-bottom:1px solid var(--border);vertical-align:middle';
      const alertaVenc=v.lotes_vencendo.length?`<span style="font-size:9px;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:6px;padding:1px 5px;margin-left:6px">⚠️ Lote vencendo</span>`:'';
      tdNome.innerHTML=`<div style="font-size:13px;font-weight:700;color:var(--text-1)">${esc(v.nome)}${alertaVenc}</div>
        <div style="font-size:10px;color:var(--text-4);margin-top:2px">${v.detalhes.length} pacientes previstos</div>`;
      tr.appendChild(tdNome);

      tr.appendChild(td(`<span style="font-size:18px;font-weight:800;color:${v.demanda_planos>0?'#4338ca':'var(--text-4)'}">${v.demanda_planos}</span>`));
      tr.appendChild(td(`<span style="font-size:18px;font-weight:800;color:${v.demanda_agendas>0?'#7e22ce':'var(--text-4)'}">${v.demanda_agendas}</span>`));
      tr.appendChild(td(`<span style="font-size:15px;font-weight:700;color:${v.media_historica>0?'#c2410c':'var(--text-4)'}">${v.media_historica}</span>`));
      tr.appendChild(td(`<span style="font-size:20px;font-weight:800;color:#6366f1">${v.demanda_total}</span>`));
      tr.appendChild(td(`<span style="font-size:16px;font-weight:700;color:${v.estoque_atual<v.demanda_total?'#d97706':'var(--text-1)'}">${v.estoque_atual}</span>`));
      tr.appendChild(td(`<span style="font-size:14px;color:#94a3b8">${v.doses_reservadas}</span>`));
      tr.appendChild(td(`<span style="font-size:16px;font-weight:700;color:${v.estoque_disponivel<v.demanda_total?'#dc2626':'#16a34a'}">${v.estoque_disponivel}</span>`));
      tr.appendChild(td(`<span style="font-size:14px;color:#64748b">${v.margem_seguranca}</span>`));

      // Sugestão
      const tdSug=document.createElement('td');
      tdSug.style.cssText='padding:12px;border-bottom:1px solid var(--border);text-align:center;vertical-align:middle';
      if(v.sugestao_compra>0){
        tdSug.innerHTML=`<span style="font-size:24px;font-weight:800;color:#dc2626">${v.sugestao_compra}</span><div style="font-size:8px;color:#94a3b8">doses</div>`;
      }else{
        tdSug.innerHTML=`<span style="font-size:20px;color:#16a34a">✓</span>`;
      }
      tr.appendChild(tdSug);

      // Status badge
      const tdSt=document.createElement('td');
      tdSt.style.cssText='padding:12px;border-bottom:1px solid var(--border);text-align:center;vertical-align:middle';
      tdSt.innerHTML=`<span style="display:inline-block;padding:5px 10px;border-radius:16px;font-size:10px;font-weight:700;background:${sc.bg};color:${sc.cor};border:1px solid ${sc.border}">${sc.label}</span>`;
      tr.appendChild(tdSt);

      // Toggle detalhe
      const tdToggle=document.createElement('td');
      tdToggle.style.cssText='padding:12px;border-bottom:1px solid var(--border);text-align:center;vertical-align:middle';
      const isOpen=detalheVid===v.vacina_id;
      tdToggle.innerHTML=`<button style="border:none;background:none;cursor:pointer;font-size:16px;color:var(--text-3)">${isOpen?'▲':'▼'}</button>`;
      tr.appendChild(tdToggle);

      tr.addEventListener('click',async()=>{
        detalheVid=isOpen?null:v.vacina_id;
        await draw();
      });
      tbody.appendChild(tr);

      // ── Detalhe expandido ─────────────────────────────────────────
      if (isOpen && v.detalhes.length) {
        const trDet=document.createElement('tr');
        const tdDet=document.createElement('td');
        tdDet.colSpan=12;
        tdDet.style.cssText='padding:0;border-bottom:2px solid var(--border)';

        const detBox=h('div',{style:'background:#f8fafc;padding:16px 20px'});

        // Legend
        const legRow=h('div',{style:'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap'});
        Object.entries(FONTE_CFG).forEach(([k,cfg])=>{
          legRow.appendChild(h('span',{style:`font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;background:${cfg.bg};color:${cfg.cor}`},cfg.label));
        });
        detBox.appendChild(legRow);

        // Detail header
        const detHdr=h('div',{style:'display:grid;grid-template-columns:1fr 160px 70px 80px 100px 1fr;gap:0;padding:7px 12px;background:#e2e8f0;border-radius:8px 8px 0 0'});
        ['Paciente','Plano','Dose','Idade Prev.','Status','Observação'].forEach(t=>{
          detHdr.appendChild(h('div',{style:'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b'},t));
        });
        detBox.appendChild(detHdr);

        v.detalhes.forEach((p,pi)=>{
          const fc=FONTE_CFG[p.fonte]||FONTE_CFG.plano;
          const prow=h('div',{style:`display:grid;grid-template-columns:1fr 160px 70px 80px 100px 1fr;gap:0;padding:10px 12px;background:white;${pi<v.detalhes.length-1?'border-bottom:1px solid #f1f5f9':''};align-items:center`});
          prow.addEventListener('mouseenter',()=>prow.style.background='#f8fafc');
          prow.addEventListener('mouseleave',()=>prow.style.background='white');

          const pnCell=h('div');
          pnCell.appendChild(h('div',{style:'font-size:12px;font-weight:600;color:#1e293b'},p.paciente_nome));
          if(p.paciente_nome!==p.responsavel_nome)pnCell.appendChild(h('div',{style:'font-size:10px;color:#94a3b8'},'↳ '+p.responsavel_nome));
          prow.appendChild(pnCell);
          prow.appendChild(h('div',{style:'font-size:11px;color:#64748b'},p.plano_nome));
          prow.appendChild(h('div',{style:`font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px;background:#e0e7ff;color:#4338ca;display:inline-block`},'D'+p.dose_numero));
          prow.appendChild(h('div',{style:'font-size:11px;color:#64748b'},p.idade_prevista));
          prow.appendChild(h('span',{style:`font-size:10px;font-weight:700;padding:3px 7px;border-radius:10px;background:${fc.bg};color:${fc.cor}`},p.status_dose));
          prow.appendChild(h('div',{style:'font-size:10px;color:#94a3b8'},p.observacao||'—'));
          detBox.appendChild(prow);
        });

        // Totals
        const detFoot=h('div',{style:'display:grid;grid-template-columns:1fr 160px 70px 80px 100px 1fr;padding:8px 12px;background:#e2e8f0;border-radius:0 0 8px 8px;margin-top:0'});
        detFoot.appendChild(h('div',{style:'font-size:10px;font-weight:700;color:#475569'},`${v.detalhes.length} paciente${v.detalhes.length!==1?'s':''} total`));
        [1,2,3,4,5].forEach(()=>detFoot.appendChild(h('div')));
        detBox.appendChild(detFoot);

        tdDet.appendChild(detBox);
        trDet.appendChild(tdDet);
        tbody.appendChild(trDet);
      }
    });

    tbl.appendChild(tbody);
    tblWrap.appendChild(tbl);
    wrap.appendChild(tblWrap);

    wrap.appendChild(h('div',{style:'margin-top:14px;padding:10px 16px;background:var(--bg-subtle);border-radius:8px;font-size:11px;color:var(--text-4);text-align:center'},
      `⚡ ${data.tabela.length} vacinas · ${data.mes_extenso} · ${data._debug?.total_doses_planos_sistema||0} doses totais nos planos · ${data._debug?.doses_previstas_mes||0} previstas para este mês · Clique na linha para ver detalhes por paciente`
    ));
  }

  await draw();
  return wrap;
}
