async function renderRelatorios(){
const wrap=h('div',{className:'fade-in'});
const hdr=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px'});
hdr.appendChild(h('div',null,
  h('h1',{style:'font-size:22px;font-weight:800;color:var(--navy);margin:0'},'📊 Relatórios'),
  h('p',{style:'font-size:12px;color:var(--text-3);margin-top:4px'},'Análises gerenciais e exportação de dados')));
wrap.appendChild(hdr);

// Report cards
const grid=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:20px'});
const reports=[
  {key:'estoque',icon:'📦',title:'Estoque / Câmara Fria',desc:'Vacinas disponíveis, lotes, validades, custo do estoque',color:'#2BBCB3'},
];
reports.forEach(r=>{
  const card=h('div',{style:`padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;transition:all .2s;border-left:4px solid ${r.color}`,
    onClick:()=>loadReport(r.key)});
  card.addEventListener('mouseenter',()=>{card.style.transform='translateY(-2px)';card.style.boxShadow='var(--shadow-lg)'});
  card.addEventListener('mouseleave',()=>{card.style.transform='';card.style.boxShadow=''});
  card.innerHTML=`<div style="font-size:28px;margin-bottom:8px">${r.icon}</div>
    <div style="font-size:15px;font-weight:700;color:var(--navy)">${r.title}</div>
    <div style="font-size:11px;color:var(--text-3);margin-top:4px">${r.desc}</div>`;
  grid.appendChild(card)});
wrap.appendChild(grid);

const content=h('div');wrap.appendChild(content);

async function loadReport(key){
  if(key==='estoque')await reportEstoque();
}

async function reportEstoque(){
  content.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-3)">Carregando...</div>';
  const data=await Api.get('/relatorios/estoque');
  if(!data||!data.vacinas){content.innerHTML='<div style="color:#dc2626;padding:20px">Erro ao carregar relatório</div>';return}
  content.innerHTML='';
  const r=data.resumo;
  const fM=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
  const fD=d=>{if(!d)return'-';const t=new Date(d);return`${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}`};
  const diasAte=d=>{if(!d)return 0;return Math.ceil((new Date(d)-new Date())/(86400000))};

  // Header
  const rHdr=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'});
  rHdr.appendChild(h('div',null,
    h('h2',{style:'font-size:18px;font-weight:800;color:var(--navy);margin:0'},'📦 Relatório de Estoque — Câmara Fria'),
    h('p',{style:'font-size:11px;color:var(--text-3);margin-top:2px'},'Gerado em '+new Date().toLocaleString('pt-BR'))));
  rHdr.appendChild(h('button',{className:'btn btn-primary',onClick:()=>exportEstoquePDF(data)},'📄 Exportar PDF'));
  content.appendChild(rHdr);

  // KPIs
  const kpis=h('div',{style:'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px'});
  [
    ['💉',r.total_vacinas,'Vacinas','var(--navy)'],
    ['📦',r.total_doses,'Doses Disponíveis','#2BBCB3'],
    ['📋',r.total_lotes,'Lotes Ativos','#3b82f6'],
    ['💰',fM(r.valor_estoque),'Valor do Estoque','#059669'],
  ].forEach(([ic,val,label,color])=>{
    kpis.appendChild(h('div',{style:`padding:14px;border-radius:10px;background:${color}08;border-left:3px solid ${color};text-align:center`},
      h('div',{style:'font-size:10px;margin-bottom:4px'},ic),
      h('div',{style:`font-size:20px;font-weight:800;color:${color}`},String(val)),
      h('div',{style:'font-size:10px;color:var(--text-3);margin-top:2px'},label)));
  });
  if(r.lotes_vencidos>0)kpis.appendChild(h('div',{style:'padding:14px;border-radius:10px;background:#dc262608;border-left:3px solid #dc2626;text-align:center'},
    h('div',{style:'font-size:20px;font-weight:800;color:#dc2626'},String(r.lotes_vencidos)),
    h('div',{style:'font-size:10px;color:#dc2626'},`Lote(s) Vencido(s)`)));
  if(r.lotes_prox_vencer>0)kpis.appendChild(h('div',{style:'padding:14px;border-radius:10px;background:#f9731608;border-left:3px solid #f97316;text-align:center'},
    h('div',{style:'font-size:20px;font-weight:800;color:#f97316'},String(r.lotes_prox_vencer)),
    h('div',{style:'font-size:10px;color:#f97316'},'Próx. Vencimento (90d)')));
  content.appendChild(kpis);

  // Table
  const tbl=h('div',{style:'border:1px solid var(--border);border-radius:12px;overflow:hidden'});
  const thead=h('div',{style:'display:grid;grid-template-columns:40px 1fr 80px 80px 70px 80px 90px 70px;padding:10px 14px;background:var(--navy);color:white;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px'});
  ['#','VACINA','CÓDIGO','FABRICANTE','LOTES','CAIXAS','DOSES','CUSTO EST.'].forEach(t=>thead.appendChild(h('div',null,t)));
  tbl.appendChild(thead);

  data.vacinas.forEach((v,i)=>{
    // Vaccine summary row
    const row=h('div',{style:`display:grid;grid-template-columns:40px 1fr 80px 80px 70px 80px 90px 70px;padding:10px 14px;align-items:center;border-bottom:1px solid #e2e8f0;cursor:pointer;background:${i%2===0?'':'#f8fffe'}`,
      onClick:()=>{const det=row.nextElementSibling;if(det)det.style.display=det.style.display==='none'?'':'none'}});
    row.appendChild(h('div',{style:'font-size:11px;font-weight:700;color:var(--text-3)'},String(i+1)));
    const nameDiv=h('div');
    nameDiv.innerHTML=`<div style="font-weight:700;font-size:12px;color:var(--navy)">${esc(v.nome)}</div>
      ${v.categoria?`<span style="font-size:8px;padding:1px 6px;background:${v.categoria==='Premium'?'#8b5cf620':'#2BBCB320'};color:${v.categoria==='Premium'?'#7c3aed':'#0f766e'};border-radius:3px;font-weight:600">${v.categoria}</span>`:''}`;
    row.appendChild(nameDiv);
    row.appendChild(h('div',{style:'font-family:var(--mono);font-size:11px;color:var(--text-3)'},esc(v.codigo)));
    row.appendChild(h('div',{style:'font-size:11px'},esc(v.fabricante||'-')));
    row.appendChild(h('div',{style:'font-size:12px;font-weight:600;text-align:center'},String(v.lotes.length)));
    row.appendChild(h('div',{style:'font-size:12px;font-weight:600;text-align:center'},String(v.totalCaixas)));
    row.appendChild(h('div',{style:`font-size:13px;font-weight:800;text-align:center;color:${v.totalDoses<=5?'#dc2626':v.totalDoses<=15?'#f97316':'#059669'}`},String(v.totalDoses)));
    row.appendChild(h('div',{style:'font-size:10px;color:var(--text-3);text-align:right'},fM(v.totalCusto)));
    tbl.appendChild(row);

    // Lote detail rows (hidden by default)
    const detail=h('div',{style:'display:none;background:#f0fffe;padding:6px 14px 6px 54px;border-bottom:2px solid var(--primary)'});
    v.lotes.forEach(lt=>{
      const dias=diasAte(lt.validade);
      const dRow=h('div',{style:'display:grid;grid-template-columns:100px 60px 70px 80px 80px 70px 80px;padding:4px 0;font-size:10px;border-bottom:1px solid #d1fae5;align-items:center'});
      dRow.appendChild(h('div',{style:'font-family:var(--mono);font-weight:600'},esc(lt.numero_lote)));
      dRow.appendChild(h('div',{style:'text-align:center'},lt.quantidade_disponivel+' cx'));
      dRow.appendChild(h('div',{style:`text-align:center;font-weight:700;color:${lt.doses_disponiveis<=3?'#dc2626':'inherit'}`},lt.doses_disponiveis+' doses'));
      dRow.appendChild(h('div',{style:`color:${lt.vencido?'#dc2626':lt.prox_vencer?'#f97316':'var(--text-3)'};font-weight:${lt.vencido||lt.prox_vencer?'700':'400'}`},fD(lt.validade)));
      dRow.appendChild(h('div',{style:`font-size:9px;color:${dias<0?'#dc2626':dias<90?'#f97316':'#059669'}`},dias<0?`VENCIDO (${Math.abs(dias)}d)`:dias+'d restantes'));
      dRow.appendChild(h('div',{style:'text-align:center;font-size:9px'},esc(lt.local||'-')));
      const stBadge=lt.vencido?'background:#fee2e2;color:#dc2626':lt.prox_vencer?'background:#fff7ed;color:#f97316':'background:#d1fae5;color:#059669';
      dRow.appendChild(h('div',null,h('span',{style:`font-size:8px;padding:2px 6px;border-radius:4px;font-weight:700;${stBadge}`},lt.vencido?'VENCIDO':lt.prox_vencer?'VENCE EM BREVE':'OK')));
      detail.appendChild(dRow)});
    tbl.appendChild(detail);
  });
  content.appendChild(tbl);

  // Footer
  content.appendChild(h('div',{style:'margin-top:12px;padding:10px;background:var(--bg-subtle);border-radius:8px;font-size:10px;color:var(--text-3);display:flex;justify-content:space-between'},
    h('span',null,'💡 Clique em uma vacina para expandir os lotes'),
    h('span',null,`${data.vacinas.length} vacinas · ${r.total_lotes} lotes · ${r.total_doses} doses`)));
}

function exportEstoquePDF(data){
  const r=data.resumo;
  const fM=v=>'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
  const fD=d=>{if(!d)return'-';const t=new Date(d);return`${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}`};
  const diasAte=d=>{if(!d)return 0;return Math.ceil((new Date(d)-new Date())/(86400000))};
  const logoUrl=window.location.origin+'/assets/logos/logo-vertical-color.png';

  let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório de Estoque</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1B4965;font-size:9px}
.header{text-align:center;padding:15px 20px;border-bottom:4px solid #2BBCB3;position:relative}
.header::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#1B4965,#2BBCB3,#1B4965)}
.header img{height:50px;display:block;margin:0 auto 6px}
.header .title{font-size:16px;font-weight:800;color:#1B4965;letter-spacing:2px;text-transform:uppercase}
.header .date{font-size:10px;color:#64748b;margin-top:3px}
.kpis{display:flex;justify-content:space-around;padding:12px 20px;background:#f8fffe;border-bottom:1px solid #d1d5db}
.kpi{text-align:center;padding:6px 12px}
.kpi .val{font-size:18px;font-weight:800;color:#1B4965}
.kpi .lbl{font-size:8px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
.kpi.green .val{color:#059669}.kpi.teal .val{color:#2BBCB3}
.body{padding:8px 15px}
table{width:100%;border-collapse:collapse;margin-top:6px}
th{background:#1B4965;color:white;padding:6px 5px;font-size:8px;text-align:center;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
td{padding:5px;border-bottom:1px solid #e2e8f0;font-size:9px;vertical-align:top}
tr:nth-child(even){background:#f8fffe}
.vac-name{font-weight:700;font-size:10px;color:#1B4965}
.badge{display:inline-block;padding:1px 5px;border-radius:3px;font-size:7px;font-weight:700}
.badge-ok{background:#d1fae5;color:#059669}.badge-warn{background:#fff7ed;color:#f97316}.badge-danger{background:#fee2e2;color:#dc2626}
.badge-premium{background:#f3e8ff;color:#7c3aed}.badge-calendario{background:#e6f7f5;color:#0f766e}
.mono{font-family:'Courier New',monospace;font-size:9px}
.right{text-align:right}.center{text-align:center}
.bold{font-weight:700}
.text-danger{color:#dc2626}.text-warn{color:#f97316}.text-ok{color:#059669}
.footer{margin-top:10px;padding:8px 15px;border-top:3px solid #2BBCB3;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}
.footer .brand{color:#1B4965;font-weight:700}
.sub-row{background:#f0fffe !important}
.sub-row td{font-size:8px;color:#374151;padding:3px 5px;border-bottom:1px solid #d1fae5}
@media print{@page{margin:6mm;size:landscape}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <img src="${logoUrl}" onerror="this.outerHTML='<div style=font-size:20px;font-weight:800;color:#1B4965>Vittalis Saúde</div>'">
  <div class="title">Relatório de Estoque — Câmara Fria</div>
  <div class="date">Gerado em ${new Date().toLocaleString('pt-BR')} · ${r.total_vacinas} vacinas · ${r.total_lotes} lotes</div>
</div>
<div class="kpis">
  <div class="kpi teal"><div class="val">${r.total_doses}</div><div class="lbl">Doses Disponíveis</div></div>
  <div class="kpi"><div class="val">${r.total_caixas}</div><div class="lbl">Caixas</div></div>
  <div class="kpi"><div class="val">${r.total_lotes}</div><div class="lbl">Lotes Ativos</div></div>
  <div class="kpi green"><div class="val">${fM(r.valor_estoque)}</div><div class="lbl">Valor do Estoque</div></div>
  ${r.lotes_vencidos>0?`<div class="kpi"><div class="val text-danger">${r.lotes_vencidos}</div><div class="lbl">Vencidos</div></div>`:''}
  ${r.lotes_prox_vencer>0?`<div class="kpi"><div class="val text-warn">${r.lotes_prox_vencer}</div><div class="lbl">Próx. Vencimento</div></div>`:''}
</div>
<div class="body">
<table>
<tr><th style="width:25px">#</th><th style="text-align:left">Vacina</th><th>Código</th><th>Fabricante</th><th>Lote</th><th>Caixas</th><th>Doses</th><th>Validade</th><th>Dias</th><th>Status</th><th>Custo Unit.</th><th>Custo Total</th></tr>`;

  let idx=1;
  data.vacinas.forEach(v=>{
    const hasMulti=v.lotes.length>1;
    v.lotes.forEach((lt,li)=>{
      const dias=diasAte(lt.validade);
      const stCls=lt.vencido?'badge-danger':lt.prox_vencer?'badge-warn':'badge-ok';
      const stTxt=lt.vencido?'VENCIDO':lt.prox_vencer?'VENCE BREVE':'OK';
      const diasCls=dias<0?'text-danger':dias<90?'text-warn':'text-ok';
      const catBadge=v.categoria?`<span class="badge ${v.categoria==='Premium'?'badge-premium':'badge-calendario'}">${v.categoria}</span>`:'';
      
      html+=`<tr${li>0?' class="sub-row"':''}>
        <td class="center bold">${li===0?idx:''}</td>
        <td style="text-align:left">${li===0?`<span class="vac-name">${v.nome}</span> ${catBadge}`:''}</td>
        <td class="center mono">${li===0?v.codigo:''}</td>
        <td class="center">${li===0?v.fabricante||'-':''}</td>
        <td class="mono center">${lt.numero_lote}</td>
        <td class="center bold">${lt.quantidade_disponivel}</td>
        <td class="center bold" style="color:${lt.doses_disponiveis<=5?'#dc2626':lt.doses_disponiveis<=15?'#f97316':'#059669'}">${lt.doses_disponiveis}</td>
        <td class="center">${fD(lt.validade)}</td>
        <td class="center ${diasCls} bold">${dias<0?Math.abs(dias)+'d atrás':dias+'d'}</td>
        <td class="center"><span class="badge ${stCls}">${stTxt}</span></td>
        <td class="right">${fM(lt.custo_unitario)}</td>
        <td class="right bold">${fM(lt.custo_total)}</td>
      </tr>`;
    });
    if(hasMulti){
      html+=`<tr style="background:#e6f7f5"><td></td><td colspan="4" style="text-align:right;font-weight:700;font-size:8px;color:#0f766e">SUBTOTAL ${v.nome}:</td>
        <td class="center bold" style="color:#0f766e">${v.totalCaixas}</td>
        <td class="center bold" style="color:#0f766e">${v.totalDoses}</td>
        <td colspan="3"></td>
        <td class="right bold" style="color:#0f766e">${fM(v.totalCusto)}</td></tr>`;
    }
    idx++;
  });

  html+=`<tr style="background:#1B4965;color:white;font-weight:700">
    <td colspan="5" style="text-align:right;color:white;font-size:10px;padding:8px">TOTAL GERAL</td>
    <td class="center" style="color:white;font-size:11px">${r.total_caixas}</td>
    <td class="center" style="color:white;font-size:11px">${r.total_doses}</td>
    <td colspan="3"></td>
    <td class="right" style="color:white;font-size:10px">${fM(r.valor_estoque)}</td>
  </tr></table></div>
<div class="footer">
  <span class="brand">VittaSys — Vittalis Saúde</span>
  <span>São Luís / MA</span>
  <span>Gerado: ${new Date().toLocaleString('pt-BR')}</span>
</div></body></html>`;

  const pw=window.open('','_blank');pw.document.write(html);pw.document.close();setTimeout(()=>pw.print(),600);
}

return wrap;}
