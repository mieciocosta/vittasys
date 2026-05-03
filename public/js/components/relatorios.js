async function renderRelatorios(){
const wrap=h('div',{className:'fade-in'});
wrap.appendChild(h('div',{style:'margin-bottom:20px'},
  h('h1',{style:'font-size:22px;font-weight:800;color:var(--navy);margin:0'},'📊 Relatórios'),
  h('p',{style:'font-size:12px;color:var(--text-3);margin-top:4px'},'Análises gerenciais — somente master')));
const grid=h('div',{style:'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:20px'});
const card=h('div',{style:'padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;border-left:4px solid #2BBCB3',
  onClick:()=>reportEstoque()});
card.addEventListener('mouseenter',()=>{card.style.transform='translateY(-2px)';card.style.boxShadow='var(--shadow-lg)'});
card.addEventListener('mouseleave',()=>{card.style.transform='';card.style.boxShadow=''});
card.innerHTML='<div style="font-size:28px;margin-bottom:8px">📦</div><div style="font-size:15px;font-weight:700;color:var(--navy)">Estoque / Câmara Fria</div><div style="font-size:11px;color:var(--text-3);margin-top:4px">Vacinas, doses, lotes e validades</div>';
grid.appendChild(card);wrap.appendChild(grid);
const content=h('div');wrap.appendChild(content);

async function reportEstoque(){
  content.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-3)">Carregando...</div>';
  const data=await Api.get('/relatorios/estoque');
  if(!data||!data.vacinas){content.innerHTML='<div style="color:#dc2626;padding:20px">Erro ao carregar</div>';return}
  content.innerHTML='';const r=data.resumo;
  const fD=d=>{if(!d)return'-';const t=new Date(d);return String(t.getDate()).padStart(2,'0')+'/'+String(t.getMonth()+1).padStart(2,'0')+'/'+t.getFullYear()};
  // Header
  const hdr=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'});
  hdr.appendChild(h('div',null,h('h2',{style:'font-size:18px;font-weight:800;color:var(--navy);margin:0'},'📦 Estoque — Câmara Fria'),
    h('p',{style:'font-size:11px;color:var(--text-3);margin-top:2px'},new Date().toLocaleString('pt-BR'))));
  hdr.appendChild(h('button',{className:'btn btn-primary',onClick:()=>exportPDF(data)},'📄 Gerar PDF'));
  content.appendChild(hdr);
  // KPIs
  const kpis=h('div',{style:'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px'});
  [['💉',r.total_vacinas,'Vacinas','var(--navy)'],['📦',r.total_doses,'Doses','#2BBCB3'],['📋',r.total_lotes,'Lotes','#3b82f6'],['⚠',r.lotes_prox_vencer||0,'Próx. Vencer','#f97316']].forEach(function(x){
    kpis.appendChild(h('div',{style:'padding:12px;border-radius:10px;background:'+x[3]+'08;border-left:3px solid '+x[3]+';text-align:center'},
      h('div',{style:'font-size:20px;font-weight:800;color:'+x[3]},String(x[1])),h('div',{style:'font-size:10px;color:var(--text-3)'},x[2])))});
  content.appendChild(kpis);
  // Simple grid — vaccine name + qty
  const tbl=h('div',{style:'border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:18px'});
  data.vacinas.forEach(function(v,i){
    var clr=v.totalDoses<=0?'#dc2626':v.totalDoses<=5?'#f97316':'var(--navy)';
    var row=h('div',{style:'display:flex;justify-content:space-between;align-items:center;padding:8px 14px;max-width:500px;border-bottom:1px solid #f1f5f9;'+(i%2?'background:#f8fffe':'')});
    row.appendChild(h('span',{style:'font-weight:600;font-size:13px'},esc(v.nome)));
    row.appendChild(h('span',{style:'font-size:18px;font-weight:800;color:'+clr+';min-width:40px;text-align:right'},String(v.totalDoses).padStart(2,'0')));
    tbl.appendChild(row)});
  content.appendChild(tbl);
  // Detail
  content.appendChild(h('h3',{style:'font-size:14px;font-weight:700;color:var(--navy);margin-bottom:8px'},'Detalhamento por Lote'));
  var dt=h('div',{style:'border:1px solid var(--border);border-radius:12px;overflow:hidden'});
  var th=h('div',{style:'display:grid;grid-template-columns:1fr 90px 80px 70px 80px 80px;padding:8px 14px;background:var(--navy);color:white;font-size:9px;font-weight:700;text-transform:uppercase'});
  ['Vacina','Lote','Fabricante','Caixas','Doses','Validade'].forEach(function(t){th.appendChild(h('div',{style:['Caixas','Doses'].indexOf(t)>=0?'text-align:center':''},t))});
  dt.appendChild(th);
  data.vacinas.forEach(function(v,vi){v.lotes.forEach(function(lt,li){
    var dias=Math.ceil((new Date(lt.validade)-new Date())/86400000);
    var row=h('div',{style:'display:grid;grid-template-columns:1fr 90px 80px 70px 80px 80px;padding:7px 14px;border-bottom:1px solid #f1f5f9;font-size:11px;align-items:center;'+(vi%2?'background:#f8fffe':'')});
    row.appendChild(h('div',{style:'font-weight:'+(li===0?'700':'400')},li===0?esc(v.nome):''));
    row.appendChild(h('div',{style:'font-family:var(--mono);font-size:10px'},esc(lt.numero_lote)));
    row.appendChild(h('div',null,esc(v.fabricante||'-')));
    row.appendChild(h('div',{style:'text-align:center;font-weight:600'},String(lt.quantidade_disponivel)));
    row.appendChild(h('div',{style:'text-align:center;font-weight:800;color:'+(lt.doses_disponiveis<=5?'#dc2626':'#059669')},String(lt.doses_disponiveis)));
    row.appendChild(h('div',{style:'font-size:10px;color:'+(dias<0?'#dc2626':dias<90?'#f97316':'var(--text-3)')},fD(lt.validade)+(dias<0?' ✗':'')));
    dt.appendChild(row)})});
  content.appendChild(dt);
}

function exportPDF(data){
  var r=data.resumo;
  var fD=function(d){if(!d)return'-';var t=new Date(d);return String(t.getDate()).padStart(2,'0')+'/'+String(t.getMonth()+1).padStart(2,'0')+'/'+t.getFullYear()};
  var logoUrl=window.location.origin+'/assets/logos/logo-vertical-color.png';
  var hoje=new Date().toLocaleDateString('pt-BR');
  var s='';
  s+='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Estoque '+hoje+'</title>';
  s+='<style>';
  s+='*{margin:0;padding:0;box-sizing:border-box}';
  s+='body{font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#1B4965;font-size:10px}';
  s+='.header{text-align:center;padding:12px 20px;border-bottom:4px solid #2BBCB3;position:relative}';
  s+='.header::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#1B4965,#2BBCB3,#1B4965)}';
  s+='.header img{height:45px;display:block;margin:0 auto 4px}';
  s+='.header .title{font-size:15px;font-weight:800;color:#1B4965;letter-spacing:2px;text-transform:uppercase}';
  s+='.header .date{font-size:10px;color:#64748b;margin-top:2px}';
  s+='.kpis{display:flex;justify-content:center;gap:40px;padding:10px 20px;background:#f8fffe;border-bottom:1px solid #d1d5db}';
  s+='.kpi{text-align:center}.kpi .val{font-size:22px;font-weight:800}.kpi .lbl{font-size:8px;color:#64748b;text-transform:uppercase}';
  s+='.body{padding:10px 20px}';
  s+='.stitle{font-size:11px;font-weight:800;color:#1B4965;margin:10px 0 4px;padding-bottom:3px;border-bottom:2px solid #2BBCB3}';
  s+='.vrow{display:flex;justify-content:space-between;align-items:center;padding:5px 10px;max-width:420px;margin:0 auto;border-bottom:1px solid #e2e8f0;font-size:12px}';
  s+='.vrow:nth-child(even){background:#f8fffe}';
  s+='.vrow .nm{font-weight:600}.vrow .qt{font-size:16px;font-weight:800;min-width:35px;text-align:right}';
  s+='.zero{color:#dc2626}.low{color:#f97316}.ok{color:#1B4965}';
  s+='table{width:100%;border-collapse:collapse;margin-top:6px}';
  s+='th{background:#1B4965;color:white;padding:5px;font-size:8px;text-align:center;font-weight:700;text-transform:uppercase}';
  s+='td{padding:4px 5px;border-bottom:1px solid #e2e8f0;font-size:9px}';
  s+='tr:nth-child(even){background:#f8fffe}';
  s+='.mono{font-family:Courier New,monospace}.center{text-align:center}.bold{font-weight:700}';
  s+='.tr{color:#dc2626}.to{color:#f97316}.tg{color:#059669}';
  s+='.footer{margin-top:10px;padding:6px 20px;border-top:3px solid #2BBCB3;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}';
  s+='.footer .brand{color:#1B4965;font-weight:700}';
  s+='@media print{@page{margin:8mm;size:A4 landscape}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
  s+='</style></head><body>';
  s+='<div class="header">';
  s+='<img src="'+logoUrl+'" onerror="this.outerHTML=\'<div style=font-size:18px;font-weight:800;color:#1B4965>Vittalis Saude</div>\'">';
  s+='<div class="title">Controle de Estoque — Câmara Fria</div>';
  s+='<div class="date">'+hoje+' — '+r.total_vacinas+' vacinas — '+r.total_doses+' doses</div></div>';
  s+='<div class="kpis">';
  s+='<div class="kpi"><div class="val" style="color:#2BBCB3">'+r.total_doses+'</div><div class="lbl">Doses</div></div>';
  s+='<div class="kpi"><div class="val">'+r.total_caixas+'</div><div class="lbl">Caixas</div></div>';
  s+='<div class="kpi"><div class="val">'+r.total_vacinas+'</div><div class="lbl">Vacinas</div></div>';
  s+='<div class="kpi"><div class="val">'+r.total_lotes+'</div><div class="lbl">Lotes</div></div></div>';
  s+='<div class="body">';
  s+='<div class="stitle">RESUMO POR VACINA</div>';
  s+='<div style="border:2px solid #1B4965;border-radius:6px;overflow:hidden">';
  data.vacinas.forEach(function(v){
    var cls=v.totalDoses<=0?'zero':v.totalDoses<=5?'low':'ok';
    s+='<div class="vrow"><span class="nm">'+v.nome+'</span><span class="qt '+cls+'">'+String(v.totalDoses).padStart(2,'0')+'</span></div>';
  });
  s+='</div>';
  s+='<div class="stitle">DETALHAMENTO POR LOTE</div>';
  s+='<table><tr><th style="text-align:left">Vacina</th><th>Lote</th><th>Fabricante</th><th>Caixas</th><th>Doses</th><th>Validade</th><th>Status</th></tr>';
  data.vacinas.forEach(function(v){v.lotes.forEach(function(lt,i){
    var dias=Math.ceil((new Date(lt.validade)-new Date())/86400000);
    var stCls=dias<0?'tr':dias<90?'to':'tg';
    var stTxt=dias<0?'VENCIDO':dias<90?'VENCE '+dias+'d':'OK '+dias+'d';
    s+='<tr><td style="text-align:left" class="bold">'+(i===0?v.nome:'')+'</td>';
    s+='<td class="center mono">'+lt.numero_lote+'</td>';
    s+='<td class="center">'+(v.fabricante||'-')+'</td>';
    s+='<td class="center bold">'+lt.quantidade_disponivel+'</td>';
    s+='<td class="center bold '+(lt.doses_disponiveis<=5?'tr':'tg')+'">'+lt.doses_disponiveis+'</td>';
    s+='<td class="center">'+fD(lt.validade)+'</td>';
    s+='<td class="center bold '+stCls+'">'+stTxt+'</td></tr>';
  })});
  s+='<tr style="background:#1B4965;color:white;font-weight:700">';
  s+='<td colspan="3" style="text-align:right;color:white;padding:6px">TOTAL</td>';
  s+='<td class="center" style="color:white;font-size:11px">'+r.total_caixas+'</td>';
  s+='<td class="center" style="color:white;font-size:11px">'+r.total_doses+'</td>';
  s+='<td colspan="2"></td></tr></table></div>';
  s+='<div class="footer"><span class="brand">VittaSys — Vittalis Saúde</span><span>São Luís / MA</span><span>'+new Date().toLocaleString('pt-BR')+'</span></div>';
  s+='</body></html>';
  var pw=window.open('','_blank');pw.document.write(s);pw.document.close();setTimeout(function(){pw.print()},600);
}

return wrap;}
