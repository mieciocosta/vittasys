async function renderAgenda(){
const DN=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DF=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const SC={agendado:'#3b82f6',confirmado:'#2BBCB3',realizado:'#059669',faltou:'#dc2626',cancelado:'#94a3b8'};
const SL={agendado:'Agendado',confirmado:'Confirmado',realizado:'Realizado',faltou:'Faltou',cancelado:'Cancelado'};
const SI={agendado:'📋',confirmado:'✓',realizado:'✅',faltou:'✗',cancelado:'—'};
let sel=new Date();sel.setHours(0,0,0,0);
let view='mes'; // mes | semana | dia
let regF='',regioes=[];
const wrap=h('div',{className:'fade-in'});
const fI=d=>d.toISOString().slice(0,10);
const fB=d=>{const t=new Date(d);return`${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}`};
const isH=d=>fI(new Date(d))===fI(new Date());
const gWS=d=>{const t=new Date(d);const y=t.getDay();t.setDate(t.getDate()-y+(y===0?-6:1));t.setHours(0,0,0,0);return t};

async function draw(){
wrap.innerHTML='';regioes=await Api.regioes()||[];
// HEADER
const hdr=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px'});
const left=h('div');
const title=view==='mes'?`${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][sel.getMonth()]} ${sel.getFullYear()}`
  :view==='semana'?`Semana de ${fB(gWS(sel))}`:`${DF[sel.getDay()]}, ${fB(sel)}`;
left.appendChild(h('h1',{style:'font-size:22px;font-weight:800;color:var(--navy);margin:0'},title));
hdr.appendChild(left);
// Actions
const right=h('div',{style:'display:flex;gap:6px;align-items:center'});
if(AppState.isMaster()){
  right.appendChild(h('button',{className:'btn btn-primary btn-sm',style:'font-size:11px',onClick:()=>modalGerar(),title:'Gerar agenda automática'},'⚡ Gerar'));
  right.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:11px',onClick:()=>modalRegioes(),title:'Gerenciar regiões'},'📍'));
}
right.appendChild(h('button',{className:'btn btn-navy btn-sm',style:'font-size:11px',onClick:()=>exportarPDF(),title:'Exportar PDF'},'📄'));
hdr.appendChild(right);wrap.appendChild(hdr);

// NAV BAR
const nav=h('div',{style:'display:flex;gap:6px;align-items:center;margin-bottom:12px;flex-wrap:wrap'});
const step=view==='mes'?'m':view==='semana'?7:1;
nav.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'width:32px;font-size:14px',onClick:()=>{
  if(step==='m'){sel.setMonth(sel.getMonth()-1)}else{sel.setDate(sel.getDate()-step)};draw()}},'‹'));
nav.appendChild(h('button',{className:`btn btn-sm ${isH(sel)?'btn-primary':'btn-outline'}`,style:'font-size:11px',onClick:()=>{sel=new Date();sel.setHours(0,0,0,0);draw()}},'Hoje'));
nav.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'width:32px;font-size:14px',onClick:()=>{
  if(step==='m'){sel.setMonth(sel.getMonth()+1)}else{sel.setDate(sel.getDate()+step)};draw()}},'›'));
// View toggle — pill style
const pill=h('div',{style:'display:flex;background:var(--bg-subtle);border-radius:8px;padding:2px;margin-left:8px'});
['mes','semana','dia'].forEach(v=>{pill.appendChild(h('button',{className:`btn btn-sm ${view===v?'btn-primary':'btn-ghost'}`,
  style:'font-size:10px;padding:4px 10px',onClick:()=>{view=v;draw()}},v==='mes'?'Mês':v==='semana'?'Semana':'Dia'))});
nav.appendChild(pill);
// Region chips
const rDiv=h('div',{style:'display:flex;gap:3px;margin-left:8px;flex-wrap:wrap'});
rDiv.appendChild(h('button',{className:`btn btn-sm ${!regF?'btn-primary':'btn-ghost'}`,style:'font-size:9px;padding:3px 8px',onClick:()=>{regF='';draw()}},'Todas'));
regioes.forEach(r=>{rDiv.appendChild(h('button',{className:`btn btn-sm ${regF==r.id?'btn-primary':'btn-ghost'}`,
  style:`font-size:9px;padding:3px 8px;border-left:3px solid ${r.cor}`,onClick:()=>{regF=String(r.id);draw()}},r.nome))});
nav.appendChild(rDiv);
wrap.appendChild(nav);

if(view==='mes')await drawMes();
else if(view==='semana')await drawSemana();
else await drawDia();
}

// ═══ MONTH VIEW — Google Calendar Style ═══
async function drawMes(){
  const y=sel.getFullYear(),m=sel.getMonth();
  const first=new Date(y,m,1);const last=new Date(y,m+1,0);
  const startDow=first.getDay()||7; // 1=Mon
  const params={mes:`${y}-${String(m+1).padStart(2,'0')}`};
  if(regF)params.regiao_id=regF;
  const items=await Api.agendaList(params)||[];
  // Index by date
  const byDate={};items.forEach(it=>{const k=fI(new Date(it.data));if(!byDate[k])byDate[k]=[];byDate[k].push(it)});

  const grid=h('div',{style:'display:grid;grid-template-columns:repeat(7,1fr);border:1px solid var(--border);border-radius:10px;overflow:hidden'});
  // Day headers
  ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].forEach(d=>{
    grid.appendChild(h('div',{style:'padding:6px;text-align:center;font-size:11px;font-weight:700;color:var(--navy);background:var(--bg-subtle);border-bottom:1px solid var(--border)'},d))});
  // Blank cells before 1st
  const blanks=(startDow===7?0:startDow)-1;
  for(let i=0;i<blanks;i++)grid.appendChild(h('div',{style:'min-height:90px;border:1px solid #f1f5f9;background:#fafafa'}));
  // Day cells
  for(let d=1;d<=last.getDate();d++){
    const dt=new Date(y,m,d);const iso=fI(dt);const hoje=isH(dt);
    const dayItems=byDate[iso]||[];
    const cell=h('div',{style:`min-height:90px;border:1px solid #f1f5f9;padding:4px;cursor:pointer;${hoje?'background:#f0fffe;border-color:var(--primary)':''}`,
      onClick:()=>{sel=new Date(dt);view='dia';draw()}});
    // Day number
    const dn=h('div',{style:`text-align:right;font-size:${hoje?'13px':'11px'};font-weight:${hoje?'800':'600'};color:${hoje?'var(--primary)':'var(--text-2)'};margin-bottom:2px`},String(d));
    cell.appendChild(dn);
    // Region badge for the day
    const regSet=[...new Set(dayItems.map(i=>i.regiao_nome).filter(Boolean))];
    if(regSet.length){cell.appendChild(h('div',{style:'font-size:8px;color:var(--text-4);margin-bottom:2px'},regSet.join(' · ')))}
    // Item dots
    dayItems.slice(0,4).forEach(it=>{
      const dot=h('div',{style:`font-size:9px;padding:1px 4px;margin-bottom:1px;border-radius:3px;background:${SC[it.status]}15;color:${SC[it.status]};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`});
      dot.textContent=`${it.horario||''} ${it.paciente?.split(' ')[0]||''}`;
      cell.appendChild(dot);
    });
    if(dayItems.length>4)cell.appendChild(h('div',{style:'font-size:9px;color:var(--primary);font-weight:600'},`+${dayItems.length-4} mais`));
    // Total badge
    if(dayItems.length>0){
      const badge=h('div',{style:`position:relative;float:left;background:var(--primary);color:white;font-size:9px;font-weight:800;border-radius:4px;padding:1px 5px;margin-top:-2px`},String(dayItems.length));
      dn.prepend(badge);
    }
    grid.appendChild(cell);
  }
  // Fill remaining cells
  const totalCells=blanks+last.getDate();const remaining=7-(totalCells%7);
  if(remaining<7)for(let i=0;i<remaining;i++)grid.appendChild(h('div',{style:'min-height:90px;border:1px solid #f1f5f9;background:#fafafa'}));
  wrap.appendChild(grid);

  // Month summary
  const total=items.length;const real=items.filter(i=>i.status==='realizado').length;
  const conf=items.filter(i=>i.status==='confirmado').length;const falt=items.filter(i=>i.status==='faltou').length;
  const sm=h('div',{style:'display:flex;gap:8px;margin-top:12px'});
  [['📋',total-real-falt-conf,'Pendentes','#3b82f6'],['✓',conf,'Confirmados','#2BBCB3'],['✅',real,'Realizados','#059669'],['✗',falt,'Faltas','#dc2626'],['📊',total,'Total','var(--navy)']].forEach(([ic,v,l,c])=>{
    sm.appendChild(h('div',{style:`padding:8px 12px;text-align:center;flex:1;border-radius:8px;background:${c}08`},
      h('div',{style:`font-size:16px;font-weight:800;color:${c}`},String(v)),
      h('div',{style:'font-size:9px;color:var(--text-3)'},l)))});
  wrap.appendChild(sm);
}

// ═══ WEEK VIEW ═══
async function drawSemana(){
  const ws=gWS(sel);const p={semana:fI(ws)};if(regF)p.regiao_id=regF;
  const items=await Api.agendaList(p)||[];
  const days=[];for(let i=0;i<7;i++){const dt=new Date(ws);dt.setDate(ws.getDate()+i);days.push({date:dt,iso:fI(dt),items:items.filter(it=>fI(new Date(it.data))===fI(dt))})}
  const grid=h('div',{style:'display:grid;grid-template-columns:repeat(7,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden'});
  // Headers
  days.forEach(d=>{const hj=isH(d.date);const rs=[...new Set(d.items.map(i=>i.regiao_nome).filter(Boolean))];
    grid.appendChild(h('div',{style:`padding:8px;text-align:center;${hj?'background:var(--primary);color:white':'background:var(--navy);color:white'};cursor:pointer;border-right:1px solid rgba(255,255,255,0.1)`,
      onClick:()=>{sel=new Date(d.date);view='dia';draw()}},
      h('div',{style:'font-size:12px;font-weight:800'},`${DN[d.date.getDay()]} ${d.date.getDate()}`),
      h('div',{style:'font-size:9px;opacity:0.8'},rs.join(' · ')||'—'),
      h('div',{style:'font-size:20px;font-weight:900;margin-top:2px'},String(d.items.length))))});
  // Body
  const mx=Math.max(...days.map(d=>d.items.length),1);
  for(let row=0;row<mx;row++){
    days.forEach(d=>{const it=d.items[row];
      if(!it){grid.appendChild(h('div',{style:'padding:4px;min-height:50px;border:1px solid #f1f5f9'}));return}
      const bg=`${SC[it.status]}12`;
      const cell=h('div',{style:`padding:6px;border:1px solid #f1f5f9;background:${bg};cursor:pointer;min-height:50px`,
        onClick:()=>AppState.verCliente(it.cliente_id)});
      cell.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:11px;color:var(--navy)">${esc(it.horario||'')}</strong><span style="font-size:10px">${SI[it.status]||''}</span></div>
        <div style="font-size:10px;font-weight:600;margin-top:2px">${esc(it.paciente?.split(' ').slice(0,2).join(' '))}</div>
        <div style="font-size:9px;color:var(--text-3)">💉 ${esc(it.vacina?.split(' ').slice(0,2).join(' '))}</div>
        <div style="font-size:8px;color:var(--text-4)">${esc(it.bairro||'')}</div>`;
      grid.appendChild(cell)})}
  wrap.appendChild(grid);
}

// ═══ DAY VIEW ═══
async function drawDia(){
  const p={data:fI(sel)};if(regF)p.regiao_id=regF;
  const items=await Api.agendaList(p)||[];
  const sts={agendado:0,confirmado:0,realizado:0,faltou:0};items.forEach(i=>{if(sts[i.status]!=null)sts[i.status]++});
  // Stats
  const sb=h('div',{style:'display:flex;gap:6px;margin-bottom:14px'});
  [['📋',sts.agendado,'Agend.','#3b82f6'],['✓',sts.confirmado,'Conf.','#2BBCB3'],['✅',sts.realizado,'Feitos','#059669'],['✗',sts.faltou,'Faltas','#dc2626']].forEach(([ic,v,l,c])=>{
    sb.appendChild(h('div',{style:`padding:6px 12px;background:${c}10;border-left:3px solid ${c};border-radius:8px;flex:1;display:flex;align-items:center;gap:8px`},
      h('span',{style:`font-size:16px;font-weight:800;color:${c}`},String(v)),h('span',{style:'font-size:10px;color:var(--text-3)'},l)))});
  wrap.appendChild(sb);
  if(!items.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},h('div',{style:'font-size:36px;margin-bottom:8px'},'📅'),h('div',{style:'font-size:14px;font-weight:600'},'Nenhum agendamento')));return}
  // Group by region
  const groups={};items.forEach(i=>{const k=i.regiao_nome||'Sem região';if(!groups[k])groups[k]={cor:i.regiao_cor||'#94a3b8',items:[]};groups[k].items.push(i)});
  Object.entries(groups).forEach(([rn,gr])=>{
    const sec=h('div',{style:`margin-bottom:14px;border-radius:10px;overflow:hidden;border:1px solid ${gr.cor}30`});
    sec.appendChild(h('div',{style:`padding:8px 14px;background:${gr.cor}15;font-weight:700;font-size:12px;color:${gr.cor};display:flex;justify-content:space-between`},
      h('span',null,`📍 ${rn}`),h('span',null,`${gr.items.length} atendimentos`)));
    gr.items.forEach(it=>{
      const card=h('div',{style:`display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #f1f5f9;cursor:pointer`,
        onClick:()=>AppState.verCliente(it.cliente_id)});
      // Time
      card.appendChild(h('div',{style:'font-size:15px;font-weight:800;color:var(--navy);min-width:45px;text-align:center'},esc(it.horario||'--:--')));
      // Status dot
      card.appendChild(h('div',{style:`width:10px;height:10px;border-radius:50%;background:${SC[it.status]};flex-shrink:0`}));
      // Info
      const info=h('div',{style:'flex:1;min-width:0'});
      info.innerHTML=`<div style="font-weight:700;font-size:13px">${it.responsavel?'👶 ':''}${esc(it.paciente)}</div>
        ${it.responsavel?`<div style="font-size:10px;color:var(--text-3)">👤 ${esc(it.responsavel)}</div>`:''}
        <div style="font-size:11px;color:var(--text-2)">💉 <strong>${esc(it.vacina)}</strong>${it.dose_numero?' · D'+it.dose_numero:''}</div>`;
      card.appendChild(info);
      // Location
      const loc=h('div',{style:'text-align:right;min-width:80px'});
      if(it.bairro||it.endereco){
        const addr=it.endereco||it.bairro;
        loc.innerHTML=`<div style="font-size:10px;color:var(--text-3)">${esc(it.bairro||'')}</div>
          <a href="https://www.google.com/maps/search/${encodeURIComponent(addr+', São Luís MA')}" target="_blank" 
            onclick="event.stopPropagation()" style="font-size:9px;color:var(--primary);text-decoration:none">📍 Mapa</a>`;
      }
      if(it.celular){loc.innerHTML+=`<br><a href="https://wa.me/55${(it.celular||'').replace(/\\D/g,'')}" target="_blank" 
        onclick="event.stopPropagation()" style="font-size:9px;color:#25d366;text-decoration:none">📱 Zap</a>`}
      card.appendChild(loc);
      // Action buttons
      const acts=h('div',{style:'display:flex;flex-direction:column;gap:3px;min-width:36px'});
      if(it.status==='agendado'){
        acts.appendChild(h('button',{className:'btn btn-sm',style:'font-size:12px;padding:2px 6px;background:#2BBCB320;border:none;border-radius:6px',title:'Confirmar',
          onClick:e=>{e.stopPropagation();Api.agendaStatus(it.id,{status:'confirmado'}).then(()=>draw())}},'✓'));
      }
      if(it.status==='confirmado'){
        acts.appendChild(h('button',{className:'btn btn-sm',style:'font-size:12px;padding:2px 6px;background:#05966920;border:none;border-radius:6px',title:'Realizado',
          onClick:e=>{e.stopPropagation();Api.agendaStatus(it.id,{status:'realizado'}).then(()=>draw())}},'✅'));
        acts.appendChild(h('button',{className:'btn btn-sm',style:'font-size:12px;padding:2px 6px;background:#dc262620;border:none;border-radius:6px',title:'Faltou',
          onClick:e=>{e.stopPropagation();Api.agendaStatus(it.id,{status:'faltou'}).then(()=>draw())}},'✗'));
      }
      if(['agendado','confirmado'].includes(it.status)){
        acts.appendChild(h('button',{className:'btn btn-sm',style:'font-size:10px;padding:2px 6px;background:var(--bg-subtle);border:none;border-radius:6px',title:'Editar',
          onClick:e=>{e.stopPropagation();modalEdit(it)}},'✏️'));
      }
      card.appendChild(acts);
      sec.appendChild(card)});
    wrap.appendChild(sec)})}

function modalGerar(){showModal('⚡ Gerar Agenda',async(body,close)=>{
  const now=new Date();const nm=now.getMonth()+2>12?1:now.getMonth()+2;const na=now.getMonth()+2>12?now.getFullYear()+1:now.getFullYear();
  const fd={mes:nm,ano:na,max_por_dia:12,usuario_id:AppState.usuario?.id};
  body.innerHTML=`<div style="margin-bottom:16px;padding:12px;background:var(--bg-subtle);border-radius:10px;font-size:12px;color:var(--text-3)">
    Busca doses pendentes dos clientes ativos, agrupa por região e distribui nos dias da semana configurados para cada região.</div>`;
  const gr=h('div',{style:'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px'});
  const mk=(l,v,fn)=>{const d=h('div');d.appendChild(h('label',{className:'label'},l));const i=h('input',{className:'input',type:'number',value:v,style:'font-size:14px;text-align:center'});
    i.addEventListener('input',e=>fn(+e.target.value));d.appendChild(i);return d};
  gr.appendChild(mk('Mês',fd.mes,v=>{fd.mes=v}));gr.appendChild(mk('Ano',fd.ano,v=>{fd.ano=v}));gr.appendChild(mk('Máx/dia',fd.max_por_dia,v=>{fd.max_por_dia=v}));
  body.appendChild(gr);
  body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'margin-top:16px;font-size:14px;padding:12px',onClick:async()=>{
    const r2=await Api.agendaGerar(fd);if(r2?.success){Toast.show(r2.message);close();draw()}else Toast.show(r2?.error||'Erro','error')}},'⚡ Gerar Agenda'));
},'400px')}

function modalEdit(ag){showModal(ag.paciente,async(body,close)=>{
  const fd={data:fI(new Date(ag.data)),horario:ag.horario||'',observacoes:ag.observacoes||''};
  const gr=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:10px'});
  const d1=h('div');d1.appendChild(h('label',{className:'label'},'📅 Data'));const di=h('input',{className:'input',type:'date',value:fd.data});di.addEventListener('change',e=>{fd.data=e.target.value});d1.appendChild(di);gr.appendChild(d1);
  const d2=h('div');d2.appendChild(h('label',{className:'label'},'🕐 Horário'));const hi=h('input',{className:'input',type:'time',value:fd.horario});hi.addEventListener('change',e=>{fd.horario=e.target.value});d2.appendChild(hi);gr.appendChild(d2);
  body.appendChild(gr);
  const d3=h('div',{style:'margin-top:10px'});d3.appendChild(h('label',{className:'label'},'💬 Obs'));const oi=h('input',{className:'input',value:fd.observacoes});oi.addEventListener('input',e=>{fd.observacoes=e.target.value});d3.appendChild(oi);body.appendChild(d3);
  const bt=h('div',{style:'display:flex;gap:8px;margin-top:14px'});
  bt.appendChild(h('button',{className:'btn btn-primary',style:'flex:1',onClick:async()=>{await Api.agendaEditar(ag.id,fd);Toast.show('Salvo');close();draw()}},'💾 Salvar'));
  bt.appendChild(h('button',{className:'btn btn-red',style:'flex:1',onClick:async()=>{if(!confirm('Cancelar?'))return;await Api.agendaExcluir(ag.id);close();draw()}},'🗑 Excluir'));
  body.appendChild(bt)},'400px')}

function modalRegioes(){showModal('📍 Regiões',async(body,close)=>{
  async function dR(){body.innerHTML='';const rgs=await Api.regioes()||[];
    rgs.forEach(r=>{const rw=h('div',{style:'display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #f1f5f9'});
      rw.innerHTML=`<div style="width:14px;height:14px;border-radius:50%;background:${esc(r.cor)}"></div><div style="flex:1"><strong>${esc(r.nome)}</strong><div style="font-size:10px;color:var(--text-3)">${DN[r.diaSemana]||'Flex'} · ${(r.bairros||[]).slice(0,4).join(', ')}</div></div>`;
      rw.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:10px',onClick:()=>eR(r)},'✏️'));body.appendChild(rw)});
    body.appendChild(h('button',{className:'btn btn-outline btn-block btn-sm',style:'margin-top:12px',onClick:()=>eR(null)},'+ Nova Região'))}
  function eR(r){body.innerHTML='';const fd={nome:r?.nome||'',cor:r?.cor||'#2BBCB3',dia_semana:r?.diaSemana!=null?String(r.diaSemana):'',bairros:(r?.bairros||[]).join(', ')};
    const gr=h('div',{className:'form-grid'});
    [['nome','Nome'],['cor','Cor']].forEach(([k,l])=>{const d=h('div');d.appendChild(h('label',{className:'label'},l));const i=h('input',{className:'input',value:fd[k]});i.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(i);gr.appendChild(d)});
    const dd=h('div');dd.appendChild(h('label',{className:'label'},'Dia'));dd.appendChild(buildSelect([['','Flex'],['1','Seg'],['2','Ter'],['3','Qua'],['4','Qui'],['5','Sex'],['6','Sáb']],fd.dia_semana,v=>{fd.dia_semana=v}));gr.appendChild(dd);
    const db=h('div',{style:'grid-column:1/-1'});db.appendChild(h('label',{className:'label'},'Bairros (vírgula)'));const bi=h('textarea',{className:'input',style:'min-height:40px'});bi.textContent=fd.bairros;bi.addEventListener('input',e=>{fd.bairros=e.target.value});db.appendChild(bi);gr.appendChild(db);
    body.appendChild(gr);
    body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'margin-top:12px',onClick:async()=>{const d={nome:fd.nome,cor:fd.cor,dia_semana:fd.dia_semana?+fd.dia_semana:null,bairros:fd.bairros.split(',').map(s=>s.trim()).filter(Boolean)};
      const rs=r?await Api.editarRegiao(r.id,d):await Api.criarRegiao(d);if(rs?.success){Toast.show('Salva');window._vittaRegioes=null;dR()}else Toast.show(rs?.error||'Erro','error')}},'💾 Salvar'));
    body.appendChild(h('button',{className:'btn btn-outline btn-block btn-sm',style:'margin-top:6px',onClick:()=>dR()},'← Voltar'))}
  await dR()},'480px')}

async function exportarPDF(){
  const p={data:fI(sel)};if(regF)p.regiao_id=regF;const items=await Api.agendaList(p)||[];
  if(!items.length){Toast.show('Sem dados','warning');return}
  const rg={};items.forEach(i=>{const k=i.regiao_nome||'Sem região';if(!rg[k])rg[k]={cor:i.regiao_cor||'#94a3b8',items:[]};rg[k].items.push(i)});
  let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Agenda ${fB(sel)}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1B4965;font-size:10px}
  .hd{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:linear-gradient(135deg,#1B4965,#2BBCB3);color:white}
  .hd h1{font-size:14px}.hd p{font-size:9px;opacity:.9}.hd-r{text-align:right;font-size:10px}
  .hd-ic{width:36px;height:36px;background:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#1B4965;font-weight:900;margin-right:8px}
  .pg{padding:10px 20px}.rh{background:#f0fffe;padding:5px 10px;font-size:11px;font-weight:bold;color:#1B4965;border-left:4px solid #2BBCB3;margin:8px 0 3px}
  table{width:100%;border-collapse:collapse}th{background:#1B4965;color:white;padding:4px 5px;font-size:9px;text-align:left}
  td{padding:4px 5px;border-bottom:1px solid #e2e8f0;font-size:9px}tr:nth-child(even){background:#f8fffe}
  .ft{margin-top:10px;padding:6px 20px;border-top:2px solid #2BBCB3;display:flex;justify-content:space-between;font-size:8px;color:#94a3b8}
  @media print{@page{margin:6mm;size:landscape}}</style></head><body>
  <div class="hd"><div style="display:flex;align-items:center"><div class="hd-ic">V</div><div><h1>Vittalis Saúde</h1><p>Sistema de Gestão de Vacinação</p></div></div>
  <div class="hd-r"><div style="font-size:13px;font-weight:800">AGENDA DE VACINAÇÃO</div><div>${DF[sel.getDay()]}, ${fB(sel)}</div><div>${items.length} atendimentos</div></div></div><div class="pg">`;
  Object.entries(rg).forEach(([rn,g])=>{html+=`<div class="rh" style="border-left-color:${g.cor}">📍 ${rn} (${g.items.length})</div>
    <table><tr><th>Hora</th><th>Paciente</th><th>Responsável</th><th>Vacinas</th><th>Endereço</th><th>Celular</th><th>Status</th><th>Controle</th></tr>`;
    g.items.forEach(it=>{html+=`<tr><td style="font-weight:800;font-size:11px">${it.horario||'--:--'}</td><td><strong>${it.paciente||'-'}</strong></td><td>${it.responsavel||'-'}</td>
      <td><strong>${it.vacina||'-'}</strong>${it.dose_numero?' D'+it.dose_numero:''}</td><td>${it.endereco||it.bairro||'-'}</td><td>${it.celular||'-'}</td>
      <td style="color:${SC[it.status]};font-weight:700">${(it.status||'').toUpperCase()}</td><td style="font-size:8px;color:#059669;font-weight:800">✓ OK</td></tr>`});
    html+='</table>'});
  html+=`</div><div class="ft"><span style="color:#1B4965;font-weight:700">VittaSys — Vittalis Saúde</span><span>Gerado: ${new Date().toLocaleString('pt-BR')}</span><span>São Luís/MA</span></div></body></html>`;
  const pw=window.open('','_blank');pw.document.write(html);pw.document.close();setTimeout(()=>pw.print(),500)}

await draw();return wrap;}
