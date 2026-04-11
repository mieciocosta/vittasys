async function renderAgenda(){
const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_F=['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const ST={agendado:{l:'Agendado',c:'badge-primary',i:'📋'},confirmado:{l:'Confirmado',c:'badge-green',i:'✓'},realizado:{l:'Realizado',c:'badge-green',i:'✅'},faltou:{l:'Faltou',c:'badge-red',i:'✗'},cancelado:{l:'Cancelado',c:'badge-gray',i:'—'}};
let dataSel=new Date();dataSel.setHours(0,0,0,0);
let visao='dia',regiaoFiltro='',regioes=[];
const wrap=h('div',{className:'fade-in'});
function fI(d){return d.toISOString().slice(0,10)}
function fB(d){const t=new Date(d);return`${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}`}
function isH(d){return fI(new Date(d))===fI(new Date())}
function gWS(d){const t=new Date(d);const y=t.getDay();t.setDate(t.getDate()-y+(y===0?-6:1));t.setHours(0,0,0,0);return t}

async function draw(){
wrap.innerHTML='';regioes=await Api.regioes()||[];
const hdr=h('div',{className:'page-header'});
hdr.appendChild(h('div',{className:'page-header-left'},h('h1',{className:'page-title'},'Agenda Inteligente'),
  h('p',{className:'page-subtitle'},visao==='dia'?`${DIAS_F[dataSel.getDay()]}, ${fB(dataSel)}`:`Semana de ${fB(gWS(dataSel))}`)));
const acts=h('div',{className:'page-header-actions'});
if(AppState.isMaster()){acts.appendChild(iconBtn('btn btn-primary btn-sm',I.plus,'Gerar Agenda',()=>modalGerar()));
acts.appendChild(iconBtn('btn btn-outline btn-sm',null,'📍 Regiões',()=>modalRegioes()))}
acts.appendChild(iconBtn('btn btn-navy btn-sm',null,'📄 PDF',()=>exportarPDF()));
hdr.appendChild(acts);wrap.appendChild(hdr);

const ctrl=h('div',{style:'display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap'});
const step=visao==='semana'?7:1;
ctrl.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>{dataSel.setDate(dataSel.getDate()-step);draw()}},'‹'));
ctrl.appendChild(h('button',{className:`btn ${isH(dataSel)?'btn-primary':'btn-outline'} btn-sm`,onClick:()=>{dataSel=new Date();dataSel.setHours(0,0,0,0);draw()}},'Hoje'));
ctrl.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>{dataSel.setDate(dataSel.getDate()+step);draw()}},'›'));
const dtI=h('input',{type:'date',className:'input',style:'width:140px;font-size:12px',value:fI(dataSel)});
dtI.addEventListener('change',()=>{dataSel=new Date(dtI.value+'T00:00:00');draw()});ctrl.appendChild(dtI);
ctrl.appendChild(h('div',{style:'display:flex;gap:2px;background:var(--bg-subtle);border-radius:8px;padding:2px'},
  h('button',{className:`btn btn-sm ${visao==='dia'?'btn-primary':'btn-ghost'}`,style:'font-size:11px',onClick:()=>{visao='dia';draw()}},'Dia'),
  h('button',{className:`btn btn-sm ${visao==='semana'?'btn-primary':'btn-ghost'}`,style:'font-size:11px',onClick:()=>{visao='semana';draw()}},'Semana')));
const rc=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap'});
rc.appendChild(h('button',{className:`btn btn-sm ${!regiaoFiltro?'btn-primary':'btn-outline'}`,style:'font-size:10px',onClick:()=>{regiaoFiltro='';draw()}},'Todas'));
regioes.forEach(r=>{rc.appendChild(h('button',{className:`btn btn-sm ${regiaoFiltro==r.id?'btn-primary':'btn-outline'}`,style:`font-size:10px;border-left:3px solid ${r.cor}`,onClick:()=>{regiaoFiltro=String(r.id);draw()}},r.nome))});
ctrl.appendChild(rc);wrap.appendChild(ctrl);
if(visao==='dia')await drawDia();else await drawSemana();
}

async function drawDia(){
const p={data:fI(dataSel)};if(regiaoFiltro)p.regiao_id=regiaoFiltro;
const items=await Api.agendaList(p)||[];
const sts={agendado:0,confirmado:0,realizado:0,faltou:0};items.forEach(i=>{if(sts[i.status]!=null)sts[i.status]++});
const sb=h('div',{style:'display:flex;gap:8px;margin-bottom:16px'});
[['📋',sts.agendado,'Agendados','#3b82f6'],['✓',sts.confirmado,'Confirmados','#2BBCB3'],['✅',sts.realizado,'Realizados','#059669'],['✗',sts.faltou,'Faltas','#dc2626']].forEach(([ic,v,l,c])=>{
  sb.appendChild(h('div',{style:`padding:8px 14px;background:${c}10;border-left:3px solid ${c};border-radius:8px;flex:1`},
    h('div',{style:`font-size:18px;font-weight:800;color:${c}`},String(v)),
    h('div',{style:'font-size:10px;color:var(--text-3);font-weight:600'},l)))});
wrap.appendChild(sb);
if(!items.length){wrap.appendChild(h('div',{className:'empty-state',style:'padding:50px 20px;text-align:center'},h('div',{style:'font-size:40px;margin-bottom:10px'},'📅'),h('div',{style:'font-size:15px;font-weight:700;color:var(--text-2)'},'Nenhum agendamento'),h('div',{style:'font-size:12px;color:var(--text-3);margin-top:4px'},'Use "Gerar Agenda" para criar automaticamente')));return}
const tw=h('div',{className:'table-wrap'});const t=document.createElement('table');t.className='data-table';
t.innerHTML='<thead><tr><th style="width:55px">Hora</th><th>Paciente</th><th>Vacina</th><th>Endereço / Bairro</th><th style="width:100px">Celular</th><th>Região</th><th style="width:80px">Status</th><th style="width:110px">Ações</th></tr></thead>';
const tb=document.createElement('tbody');
const groups={};items.forEach(i=>{const k=i.regiao_nome||'Sem região';if(!groups[k])groups[k]={cor:i.regiao_cor||'#94a3b8',items:[]};groups[k].items.push(i)});
Object.entries(groups).forEach(([rn,gr])=>{
  const hr2=document.createElement('tr');hr2.innerHTML=`<td colspan="8" style="background:${gr.cor}15;font-weight:700;font-size:12px;color:${gr.cor};padding:8px 12px;border-left:4px solid ${gr.cor}">📍 ${esc(rn)} — ${gr.items.length} atendimento(s)</td>`;
  tb.appendChild(hr2);
  gr.items.forEach(it=>{
    const s=ST[it.status]||ST.agendado;const isC=it.responsavel;
    const endT=it.endereco||it.bairro||'';
    const mapL=endT?`<a href="https://www.google.com/maps/search/${encodeURIComponent(endT+', São Luís MA')}" target="_blank" style="color:var(--primary);font-size:10px;text-decoration:none">📍 Mapa</a>`:'';
    const waL=it.celular?`<a href="https://wa.me/55${(it.celular||'').replace(/\\D/g,'')}" target="_blank" style="color:#25d366;text-decoration:none">📱 ${esc(it.celular)}</a>`:'-';
    const tr=document.createElement('tr');tr.style.cursor='pointer';
    tr.innerHTML=`<td class="mono fw-600" style="font-size:14px;color:var(--navy)">${esc(it.horario||'--:--')}</td>
      <td><div class="fw-600" style="font-size:13px">${isC?'👶 ':''}${esc(it.paciente)}</div>${isC?`<div style="font-size:10px;color:var(--text-3)">👤 ${esc(it.responsavel)}</div>`:''}</td>
      <td><strong>${esc(it.vacina)}</strong>${it.dose_numero?` <span class="text-muted" style="font-size:10px">D${it.dose_numero}</span>`:''}</td>
      <td style="font-size:11px">${esc(endT||'-')}<br>${mapL}</td>
      <td class="mono" style="font-size:11px">${waL}</td>
      <td><span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${it.regiao_cor||'#94a3b8'}20;color:${it.regiao_cor||'#94a3b8'};font-weight:600">${esc(it.regiao_nome||'-')}</span></td>
      <td><span class="badge ${s.c}" style="font-size:10px">${s.i} ${s.l}</span></td><td style="white-space:nowrap"></td>`;
    const actTd=tr.querySelector('td:last-child');
    if(it.status==='agendado')actTd.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:9px;padding:2px 6px;margin:1px',onClick:async e=>{e.stopPropagation();await Api.agendaStatus(it.id,{status:'confirmado'});draw()}},'✓ Conf.'));
    if(it.status==='confirmado'){actTd.appendChild(h('button',{className:'btn btn-primary btn-sm',style:'font-size:9px;padding:2px 6px;margin:1px',onClick:async e=>{e.stopPropagation();await Api.agendaStatus(it.id,{status:'realizado'});draw()}},'✅'));
    actTd.appendChild(h('button',{className:'btn btn-red btn-sm',style:'font-size:9px;padding:2px 6px;margin:1px',onClick:async e=>{e.stopPropagation();await Api.agendaStatus(it.id,{status:'faltou'});draw()}},'✗'))}
    if(['agendado','confirmado'].includes(it.status))actTd.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:9px;padding:2px 6px;margin:1px;color:var(--text-3)',onClick:e=>{e.stopPropagation();modalEditarAg(it)}},'✏️'));
    tr.addEventListener('click',()=>AppState.verCliente(it.cliente_id));tb.appendChild(tr)})});
t.appendChild(tb);tw.appendChild(t);wrap.appendChild(tw)}

async function drawSemana(){
const ws=gWS(dataSel);const p={semana:fI(ws)};if(regiaoFiltro)p.regiao_id=regiaoFiltro;
const items=await Api.agendaList(p)||[];
const days=[];for(let i=0;i<6;i++){const dt=new Date(ws);dt.setDate(ws.getDate()+i);days.push({date:dt,iso:fI(dt),items:items.filter(it=>fI(new Date(it.data))===fI(dt))})}
const tw=h('div',{className:'table-wrap',style:'overflow-x:auto'});const t=document.createElement('table');t.className='data-table';t.style.fontSize='11px';
let th='<tr>';days.forEach(d=>{const hj=isH(d.date);const rs=[...new Set(d.items.map(i=>i.regiao_nome).filter(Boolean))];
th+=`<th style="text-align:center;min-width:130px;${hj?'background:var(--primary)':'background:var(--navy)'};color:white;padding:8px;cursor:pointer" onclick="document.dispatchEvent(new CustomEvent('ag-go',{detail:'${d.iso}'}))"><div style="font-size:13px;font-weight:800">${DIAS[d.date.getDay()]} ${d.date.getDate()}/${d.date.getMonth()+1}</div><div style="font-size:9px;opacity:0.8">${rs.join(' · ')||'—'}</div><div style="font-size:18px;font-weight:800;margin-top:2px">${d.items.length}</div></th>`});
th+='</tr>';t.innerHTML=`<thead>${th}</thead>`;
document.addEventListener('ag-go',function fn(e){document.removeEventListener('ag-go',fn);dataSel=new Date(e.detail+'T00:00:00');visao='dia';draw()});
const mx=Math.max(...days.map(d=>d.items.length),1);const tb=document.createElement('tbody');
for(let row=0;row<mx;row++){const tr=document.createElement('tr');
days.forEach(d=>{const it=d.items[row];if(!it){tr.innerHTML+='<td style="padding:6px;border:1px solid #f1f5f9"></td>';return}
const s=ST[it.status];const bg=it.status==='realizado'?'#dcfce7':it.status==='faltou'?'#fef2f2':it.status==='confirmado'?'#f0fdf4':'#eff6ff';
tr.innerHTML+=`<td style="padding:6px;border:1px solid #f1f5f9;background:${bg};vertical-align:top;cursor:pointer" onclick="AppState.verCliente(${it.cliente_id})"><div style="display:flex;justify-content:space-between"><span style="font-weight:800;color:var(--navy)">${esc(it.horario||'')}</span><span class="badge ${s.c}" style="font-size:8px">${s.i}</span></div><div style="font-weight:600;font-size:11px;margin-top:2px">${esc(it.paciente?.split(' ').slice(0,2).join(' '))}</div><div style="font-size:9px;color:var(--text-3)">💉 ${esc(it.vacina?.split(' ').slice(0,2).join(' '))}</div><div style="font-size:9px;color:var(--text-4)">${esc(it.bairro||'')}</div></td>`});
tb.appendChild(tr)}
t.appendChild(tb);tw.appendChild(t);wrap.appendChild(tw);
const sm=h('div',{style:'display:flex;gap:8px;margin-top:12px'});const tot=items.length,re=items.filter(i=>i.status==='realizado').length,fa=items.filter(i=>i.status==='faltou').length;
[['Total',tot,'var(--navy)'],['Realizados',re,'#059669'],['Faltas',fa,'#dc2626'],['Pendentes',tot-re-fa,'#3b82f6']].forEach(([l,v,c])=>{sm.appendChild(h('div',{style:`padding:8px 14px;background:${c}10;border-radius:8px;flex:1;text-align:center`},h('div',{style:`font-size:18px;font-weight:800;color:${c}`},String(v)),h('div',{style:'font-size:10px;color:var(--text-3)'},l)))});
wrap.appendChild(sm)}

function modalGerar(){showModal('Gerar Agenda Automática',async(body,close)=>{
const now=new Date();const nm=now.getMonth()+2>12?1:now.getMonth()+2;const na=now.getMonth()+2>12?now.getFullYear()+1:now.getFullYear();
const fd={mes:nm,ano:na,max_por_dia:12,usuario_id:AppState.usuario?.id};const gr=h('div',{className:'form-grid'});
const dM=h('div');dM.appendChild(h('label',{className:'label'},'Mês'));dM.appendChild(buildSelect([[1,'Janeiro'],[2,'Fevereiro'],[3,'Março'],[4,'Abril'],[5,'Maio'],[6,'Junho'],[7,'Julho'],[8,'Agosto'],[9,'Setembro'],[10,'Outubro'],[11,'Novembro'],[12,'Dezembro']].map(([v,l])=>[String(v),l]),String(fd.mes),v=>{fd.mes=+v}));gr.appendChild(dM);
const dA=h('div');dA.appendChild(h('label',{className:'label'},'Ano'));const aI=h('input',{className:'input',type:'number',value:fd.ano});aI.addEventListener('input',e=>{fd.ano=+e.target.value});dA.appendChild(aI);gr.appendChild(dA);
const dX=h('div');dX.appendChild(h('label',{className:'label'},'Máx./dia'));const mI=h('input',{className:'input',type:'number',value:fd.max_por_dia});mI.addEventListener('input',e=>{fd.max_por_dia=+e.target.value});dX.appendChild(mI);gr.appendChild(dX);
body.appendChild(gr);body.appendChild(h('div',{style:'font-size:12px;color:var(--text-3);margin:12px 0;padding:10px;background:var(--bg-subtle);border-radius:8px'},'Busca doses pendentes dos clientes ativos, agrupa por região e distribui nos dias da semana configurados.'));
body.appendChild(iconBtn('btn btn-primary btn-block',null,'⚡ Gerar Agenda',async()=>{const r=await Api.agendaGerar(fd);if(r?.success){Toast.show(r.message);close();draw()}else Toast.show(r?.error||'Erro','error')},{style:{marginTop:'12px'}}));
},'440px')}

function modalEditarAg(ag){showModal('Editar — '+ag.paciente,async(body,close)=>{
const fd={data:fI(new Date(ag.data)),horario:ag.horario||'',regiao_id:ag.regiao_id||'',observacoes:ag.observacoes||'',endereco:ag.endereco||''};const gr=h('div',{className:'form-grid'});
const d1=h('div');d1.appendChild(h('label',{className:'label'},'Data'));const di=h('input',{className:'input',type:'date',value:fd.data});di.addEventListener('change',e=>{fd.data=e.target.value});d1.appendChild(di);gr.appendChild(d1);
const d2=h('div');d2.appendChild(h('label',{className:'label'},'Horário'));const hi=h('input',{className:'input',type:'time',value:fd.horario});hi.addEventListener('change',e=>{fd.horario=e.target.value});d2.appendChild(hi);gr.appendChild(d2);
const d3=h('div');d3.appendChild(h('label',{className:'label'},'Região'));const rb=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap'});
regioes.forEach(r=>{rb.appendChild(h('button',{type:'button',className:`btn btn-sm ${fd.regiao_id==r.id?'btn-primary':'btn-outline'}`,style:`font-size:10px;border-left:3px solid ${r.cor}`,onClick:()=>{fd.regiao_id=r.id;d3.querySelectorAll('.btn').forEach(b=>{b.className=b.className.replace('btn-primary','btn-outline')});rb.childNodes.forEach((b,i)=>{if(regioes[i]?.id===r.id)b.className=b.className.replace('btn-outline','btn-primary')})}},r.nome))});
d3.appendChild(rb);gr.appendChild(d3);
const d4=h('div',{style:'grid-column:1/-1'});d4.appendChild(h('label',{className:'label'},'Endereço'));const ei=h('input',{className:'input',value:fd.endereco});ei.addEventListener('input',e=>{fd.endereco=e.target.value});d4.appendChild(ei);gr.appendChild(d4);
const d5=h('div',{style:'grid-column:1/-1'});d5.appendChild(h('label',{className:'label'},'Observações'));const oi=h('textarea',{className:'input',style:'min-height:50px'});oi.textContent=fd.observacoes;oi.addEventListener('input',e=>{fd.observacoes=e.target.value});d5.appendChild(oi);gr.appendChild(d5);
body.appendChild(gr);const bt=h('div',{style:'display:flex;gap:8px;margin-top:14px'});
bt.appendChild(iconBtn('btn btn-primary',null,'Salvar',async()=>{const r=await Api.agendaEditar(ag.id,fd);if(r?.success){Toast.show('Salvo');close();draw()}else Toast.show(r?.error||'Erro','error')},{style:{flex:'1'}}));
bt.appendChild(iconBtn('btn btn-red',null,'Cancelar',async()=>{if(!confirm('Cancelar?'))return;await Api.agendaExcluir(ag.id);Toast.show('Cancelado');close();draw()},{style:{flex:'1'}}));body.appendChild(bt)},'480px')}

function modalRegioes(){showModal('Regiões',async(body,close)=>{
async function dR(){body.innerHTML='';const rgs=await Api.regioes()||[];
rgs.forEach(r=>{const rw=h('div',{style:'display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #f1f5f9'});
rw.innerHTML=`<div style="width:14px;height:14px;border-radius:50%;background:${esc(r.cor)};flex-shrink:0"></div><div style="flex:1"><div class="fw-600">${esc(r.nome)}</div><div class="text-sm text-muted">${DIAS[r.diaSemana]||'Flex'} · ${(r.bairros||[]).slice(0,5).join(', ')}</div></div>`;
rw.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:10px',onClick:()=>eR(r)},'✏️'));body.appendChild(rw)});
body.appendChild(iconBtn('btn btn-outline btn-block btn-sm',I.plus,'Nova Região',()=>eR(null),{style:{marginTop:'12px'}}))}
function eR(r){body.innerHTML='';const fd={nome:r?.nome||'',cor:r?.cor||'#2BBCB3',dia_semana:r?.diaSemana!=null?String(r.diaSemana):'',bairros:(r?.bairros||[]).join(', ')};
const gr=h('div',{className:'form-grid'});[['nome','Nome'],['cor','Cor (hex)']].forEach(([k,l])=>{const d=h('div');d.appendChild(h('label',{className:'label'},l));const i=h('input',{className:'input',value:fd[k]});i.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(i);gr.appendChild(d)});
const dd=h('div');dd.appendChild(h('label',{className:'label'},'Dia'));dd.appendChild(buildSelect([['','Flex'],['1','Seg'],['2','Ter'],['3','Qua'],['4','Qui'],['5','Sex'],['6','Sáb']],fd.dia_semana,v=>{fd.dia_semana=v}));gr.appendChild(dd);
const db=h('div',{style:'grid-column:1/-1'});db.appendChild(h('label',{className:'label'},'Bairros (vírgula)'));const bi=h('textarea',{className:'input',style:'min-height:50px'});bi.textContent=fd.bairros;bi.addEventListener('input',e=>{fd.bairros=e.target.value});db.appendChild(bi);gr.appendChild(db);
body.appendChild(gr);body.appendChild(iconBtn('btn btn-primary btn-block',null,'Salvar',async()=>{const d={nome:fd.nome,cor:fd.cor,dia_semana:fd.dia_semana?+fd.dia_semana:null,bairros:fd.bairros.split(',').map(s=>s.trim()).filter(Boolean)};
const rs=r?await Api.editarRegiao(r.id,d):await Api.criarRegiao(d);if(rs?.success){Toast.show('Salva');window._vittaRegioes=null;dR()}else Toast.show(rs?.error||'Erro','error')},{style:{marginTop:'12px'}}));
body.appendChild(h('button',{className:'btn btn-outline btn-block btn-sm',style:'margin-top:8px',onClick:()=>dR()},'← Voltar'))}
await dR()},'520px')}

async function exportarPDF(){
const p={data:fI(dataSel)};if(regiaoFiltro)p.regiao_id=regiaoFiltro;
const items=await Api.agendaList(p)||[];if(!items.length){Toast.show('Sem agendamentos','warning');return}
const rg={};items.forEach(i=>{const k=i.regiao_nome||'Sem região';if(!rg[k])rg[k]={cor:i.regiao_cor||'#94a3b8',items:[]};rg[k].items.push(i)});
let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Agenda ${fB(dataSel)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:0;color:#1B4965;font-size:10px}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:linear-gradient(135deg,#1B4965,#2BBCB3);color:white}
.hdr-logo{display:flex;align-items:center;gap:8px}.hdr-logo .ic{width:36px;height:36px;background:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#1B4965;font-weight:900}
.hdr h1{font-size:14px}.hdr p{font-size:9px;opacity:0.9}.hdr-r{text-align:right;font-size:10px}
.pg{padding:10px 20px}.rh{background:#f0fffe;padding:5px 10px;font-size:11px;font-weight:bold;color:#1B4965;border-left:4px solid #2BBCB3;margin:8px 0 3px}
table{width:100%;border-collapse:collapse}th{background:#1B4965;color:white;padding:4px 5px;text-align:left;font-size:9px}
td{padding:4px 5px;border-bottom:1px solid #e2e8f0;font-size:9px;vertical-align:top}tr:nth-child(even){background:#f8fffe}
.sa{color:#3b82f6;font-weight:600}.sc{color:#2BBCB3;font-weight:600}.sr{color:#059669;font-weight:800}.sf{color:#dc2626;font-weight:800}
.ft{margin-top:10px;padding:6px 20px;border-top:2px solid #2BBCB3;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}
.ft .br{color:#1B4965;font-weight:700}.sm{display:flex;gap:12px;margin:6px 0;font-size:9px}.sm span{font-weight:700}
@media print{body{padding:0}@page{margin:6mm;size:landscape}}</style></head><body>
<div class="hdr"><div class="hdr-logo"><div class="ic">V</div><div><h1>Vittalis Saúde</h1><p>Sistema de Gestão de Vacinação</p></div></div>
<div class="hdr-r"><div style="font-size:13px;font-weight:800">AGENDA DE VACINAÇÃO</div><div>${DIAS_F[dataSel.getDay()]}, ${fB(dataSel)}</div><div>${items.length} atendimento(s)</div></div></div>
<div class="pg"><div class="sm"><span style="color:#3b82f6">Agendados: ${items.filter(i=>i.status==='agendado').length}</span>
<span style="color:#2BBCB3">Confirmados: ${items.filter(i=>i.status==='confirmado').length}</span>
<span style="color:#059669">Realizados: ${items.filter(i=>i.status==='realizado').length}</span>
<span style="color:#dc2626">Faltas: ${items.filter(i=>i.status==='faltou').length}</span></div>`;
Object.entries(rg).forEach(([rn,g])=>{html+=`<div class="rh" style="border-left-color:${g.cor}">📍 ${rn} (${g.items.length})</div>
<table><tr><th>Horário</th><th>Cliente</th><th>Responsável</th><th>Vacinas</th><th>Endereço</th><th>Celular</th><th>Status</th><th>Controle</th></tr>`;
g.items.forEach(it=>{const sc2=it.status==='realizado'?'sr':it.status==='confirmado'?'sc':it.status==='faltou'?'sf':'sa';
html+=`<tr><td style="font-weight:800;font-size:11px">${it.horario||'--:--'}</td><td><strong>${it.paciente||'-'}</strong></td><td>${it.responsavel||'-'}</td><td><strong>${it.vacina||'-'}</strong>${it.dose_numero?' D'+it.dose_numero:''}</td><td>${it.endereco||it.bairro||'-'}</td><td>${it.celular||'-'}</td><td class="${sc2}">${(it.status||'').toUpperCase()}</td><td style="font-size:8px">STATUS DO CONTRATO:<br><span style="color:#059669;font-weight:800">OK</span></td></tr>`});
html+='</table>'});
html+=`</div><div class="ft"><span class="br">VittaSys — Vittalis Saúde</span><span>Gerado em ${new Date().toLocaleString('pt-BR')}</span><span>São Luís / MA</span></div></body></html>`;
const pw=window.open('','_blank');pw.document.write(html);pw.document.close();setTimeout(()=>pw.print(),500)}

await draw();return wrap;}
