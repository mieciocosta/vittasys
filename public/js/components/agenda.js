async function renderAgenda(){
const DN=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DF=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const SC={agendado:'#3b82f6',confirmado:'#2BBCB3',realizado:'#059669',faltou:'#dc2626',cancelado:'#94a3b8'};
const SL={agendado:'Agendado',confirmado:'Confirmado',realizado:'Realizado',faltou:'Faltou',cancelado:'Cancelado'};
const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let sel=new Date();sel.setHours(0,0,0,0);
let view='mes',regF='',regioes=[],vacinasCache=[];
const wrap=h('div',{className:'fade-in'});
const fI=d=>d.toISOString().slice(0,10);
const fB=d=>{const t=new Date(d);return`${String(t.getDate()).padStart(2,'0')}/${String(t.getMonth()+1).padStart(2,'0')}/${t.getFullYear()}`};
const isH=d=>fI(new Date(d))===fI(new Date());

// Auto-find region by bairro
function findRegByBairro(bairro){
  if(!bairro)return null;
  const bl=bairro.toLowerCase().trim();
  for(const r of regioes){if((r.bairros||[]).some(b=>b.toLowerCase().trim()===bl))return r}
  return null;
}

async function draw(){
wrap.innerHTML='';regioes=await Api.regioes()||[];
if(!vacinasCache.length)vacinasCache=await Api.agendaVacinas()||[];
const title=view==='mes'?`${MESES[sel.getMonth()]} ${sel.getFullYear()}`:view==='semana'?`Semana — ${fB(sel)}`:`${DF[sel.getDay()]}, ${fB(sel)}`;
// HEADER
const hdr=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:14px'});
const left=h('div',{style:'display:flex;align-items:center;gap:12px'});
if(view!=='mes')left.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:12px',onClick:()=>{view='mes';draw()},title:'Voltar ao calendário'},'← Calendário'));
left.appendChild(h('h1',{style:'font-size:22px;font-weight:800;color:var(--navy);margin:0'},title));
hdr.appendChild(left);
const ra=h('div',{style:'display:flex;gap:6px'});
if(AppState.isMaster()){ra.appendChild(h('button',{className:'btn btn-primary btn-sm',onClick:()=>modalGerar()},'⚡ Gerar'));
ra.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>modalRegioes()},'📍'))}
ra.appendChild(h('button',{className:'btn btn-navy btn-sm',onClick:()=>exportarPDF()},'📄 PDF'));
hdr.appendChild(ra);wrap.appendChild(hdr);
// NAV
const nav=h('div',{style:'display:flex;gap:6px;align-items:center;margin-bottom:12px;flex-wrap:wrap'});
const step=view==='mes'?'m':view==='semana'?7:1;
nav.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'width:30px',onClick:()=>{if(step==='m')sel.setMonth(sel.getMonth()-1);else sel.setDate(sel.getDate()-step);draw()}},'‹'));
nav.appendChild(h('button',{className:`btn btn-sm ${isH(sel)?'btn-primary':'btn-outline'}`,style:'font-size:11px',onClick:()=>{sel=new Date();sel.setHours(0,0,0,0);draw()}},'Hoje'));
nav.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'width:30px',onClick:()=>{if(step==='m')sel.setMonth(sel.getMonth()+1);else sel.setDate(sel.getDate()+step);draw()}},'›'));
const pill=h('div',{style:'display:flex;background:var(--bg-subtle);border-radius:8px;padding:2px;margin-left:6px'});
['mes','semana','dia'].forEach(v=>{pill.appendChild(h('button',{className:`btn btn-sm ${view===v?'btn-primary':'btn-ghost'}`,style:'font-size:10px;padding:4px 10px',onClick:()=>{view=v;draw()}},v==='mes'?'Mês':v==='semana'?'Semana':'Dia'))});
nav.appendChild(pill);
const rc=h('div',{style:'display:flex;gap:3px;margin-left:6px;flex-wrap:wrap'});
rc.appendChild(h('button',{className:`btn btn-sm ${!regF?'btn-primary':'btn-ghost'}`,style:'font-size:9px;padding:3px 7px',onClick:()=>{regF='';draw()}},'Todas'));
regioes.forEach(rg=>{rc.appendChild(h('button',{className:`btn btn-sm ${regF==rg.id?'btn-primary':'btn-ghost'}`,style:`font-size:9px;padding:3px 7px;border-left:3px solid ${rg.cor}`,onClick:()=>{regF=String(rg.id);draw()}},rg.nome))});
nav.appendChild(rc);wrap.appendChild(nav);
if(view==='mes')await drawMes();else if(view==='semana')await drawSemana();else await drawDia();
}

// ═══ MÊS ═══
async function drawMes(){
const y=sel.getFullYear(),m=sel.getMonth();const first=new Date(y,m,1);const last=new Date(y,m+1,0);
const startDow=(first.getDay()||7);
const p={mes:`${y}-${String(m+1).padStart(2,'0')}`};if(regF)p.regiao_id=regF;
const items=await Api.agendaList(p)||[];
const byD={};items.forEach(it=>{const k=fI(new Date(it.data));if(!byD[k])byD[k]=[];byD[k].push(it)});
const grid=h('div',{style:'display:grid;grid-template-columns:repeat(7,1fr);border:1px solid var(--border);border-radius:10px;overflow:hidden'});
['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].forEach(d=>{grid.appendChild(h('div',{style:'padding:6px;text-align:center;font-size:11px;font-weight:700;color:var(--navy);background:var(--bg-subtle);border-bottom:1px solid var(--border)'},d))});
for(let i=0;i<startDow-1;i++)grid.appendChild(h('div',{style:'min-height:80px;border:1px solid #f1f5f9;background:#fafafa'}));
for(let d=1;d<=last.getDate();d++){
  const dt=new Date(y,m,d);const iso=fI(dt);const hoje=isH(dt);const dayIt=byD[iso]||[];
  const cell=h('div',{style:`min-height:80px;border:1px solid ${hoje?'var(--primary)':'#f1f5f9'};padding:3px;cursor:pointer;${hoje?'background:#f0fffe':''}`,
    onClick:()=>{sel=new Date(dt);view='dia';draw()}});
  const top=h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:2px'});
  if(dayIt.length)top.appendChild(h('span',{style:'background:var(--primary);color:white;font-size:8px;font-weight:800;border-radius:4px;padding:1px 4px'},String(dayIt.length)));
  else top.appendChild(h('span',null,''));
  top.appendChild(h('span',{style:`font-size:${hoje?'13px':'11px'};font-weight:${hoje?'800':'600'};color:${hoje?'var(--primary)':'var(--text-2)'}`},String(d)));
  cell.appendChild(top);
  const rs=[...new Set(dayIt.map(i=>i.regiao_nome).filter(Boolean))];
  if(rs.length)cell.appendChild(h('div',{style:'font-size:7px;color:var(--text-4);margin-bottom:1px'},rs.join(' · ')));
  dayIt.slice(0,3).forEach(it=>{cell.appendChild(h('div',{style:`font-size:8px;padding:1px 3px;margin-bottom:1px;border-radius:2px;background:${SC[it.status]}15;color:${SC[it.status]};overflow:hidden;white-space:nowrap;text-overflow:ellipsis`},`${it.horario||''} ${it.paciente?.split(' ')[0]||''}`))});
  if(dayIt.length>3)cell.appendChild(h('div',{style:'font-size:8px;color:var(--primary);font-weight:600'},`+${dayIt.length-3}`));
  grid.appendChild(cell)}
const totalCells=startDow-1+last.getDate();const rem=7-(totalCells%7);
if(rem<7)for(let i=0;i<rem;i++)grid.appendChild(h('div',{style:'min-height:80px;border:1px solid #f1f5f9;background:#fafafa'}));
wrap.appendChild(grid);
// Summary
const tot=items.length,re=items.filter(i=>i.status==='realizado').length,co=items.filter(i=>i.status==='confirmado').length,fa=items.filter(i=>i.status==='faltou').length;
const sm=h('div',{style:'display:flex;gap:6px;margin-top:10px'});
[['📋',tot-re-fa-co,'Pendentes','#3b82f6'],['✓',co,'Confirm.','#2BBCB3'],['✅',re,'Feitos','#059669'],['✗',fa,'Faltas','#dc2626'],['📊',tot,'Total','var(--navy)']].forEach(([ic,v,l,c])=>{
  sm.appendChild(h('div',{style:`padding:6px 10px;text-align:center;flex:1;border-radius:8px;background:${c}08`},
    h('span',{style:`font-size:15px;font-weight:800;color:${c}`},String(v)),h('span',{style:'font-size:9px;color:var(--text-3);margin-left:4px'},l)))});
wrap.appendChild(sm)}

// ═══ SEMANA ═══
async function drawSemana(){
const ws=new Date(sel);const day=ws.getDay();ws.setDate(ws.getDate()-day+(day===0?-6:1));ws.setHours(0,0,0,0);
const p={semana:fI(ws)};if(regF)p.regiao_id=regF;
const items=await Api.agendaList(p)||[];
const days=[];for(let i=0;i<7;i++){const dt=new Date(ws);dt.setDate(ws.getDate()+i);days.push({date:dt,iso:fI(dt),items:items.filter(it=>fI(new Date(it.data))===fI(dt))})}
const grid=h('div',{style:'display:grid;grid-template-columns:repeat(7,1fr);gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden'});
days.forEach(d=>{const hj=isH(d.date);const rs=[...new Set(d.items.map(i=>i.regiao_nome).filter(Boolean))];
  grid.appendChild(h('div',{style:`padding:6px;text-align:center;${hj?'background:var(--primary);color:white':'background:var(--navy);color:white'};cursor:pointer;border-right:1px solid rgba(255,255,255,.1)`,
    onClick:()=>{sel=new Date(d.date);view='dia';draw()}},
    h('div',{style:'font-size:11px;font-weight:700'},`${DN[d.date.getDay()]} ${d.date.getDate()}`),
    h('div',{style:'font-size:8px;opacity:.8'},rs.join(' · ')||'—'),
    h('div',{style:'font-size:18px;font-weight:900;margin-top:2px'},String(d.items.length))))});
const mx=Math.max(...days.map(d=>d.items.length),1);
for(let row=0;row<mx;row++){days.forEach(d=>{const it=d.items[row];
  if(!it){grid.appendChild(h('div',{style:'padding:4px;min-height:48px;border:1px solid #f1f5f9'}));return}
  const cell=h('div',{style:`padding:5px;border:1px solid #f1f5f9;background:${SC[it.status]}12;cursor:pointer;min-height:48px`,
    onClick:()=>{sel=new Date(d.date);view='dia';draw()}});
  cell.innerHTML=`<div style="display:flex;justify-content:space-between"><strong style="font-size:10px;color:var(--navy)">${esc(it.horario||'')}</strong><span style="font-size:9px;color:${SC[it.status]}">${SL[it.status]?.charAt(0)||''}</span></div>
    <div style="font-size:10px;font-weight:600;margin-top:1px">${esc(it.paciente?.split(' ').slice(0,2).join(' '))}</div>
    <div style="font-size:8px;color:var(--text-3)">💉 ${esc(it.vacina?.split(' ').slice(0,2).join(' '))}</div>`;
  grid.appendChild(cell)})}
wrap.appendChild(grid)}

// ═══ DIA ═══
async function drawDia(){
const p={data:fI(sel)};if(regF)p.regiao_id=regF;
const items=await Api.agendaList(p)||[];
const sts={agendado:0,confirmado:0,realizado:0,faltou:0};items.forEach(i=>{if(sts[i.status]!=null)sts[i.status]++});
const sb=h('div',{style:'display:flex;gap:6px;margin-bottom:12px;align-items:center'});
[['📋',sts.agendado,'Agend.','#3b82f6'],['✓',sts.confirmado,'Conf.','#2BBCB3'],['✅',sts.realizado,'Feitos','#059669'],['✗',sts.faltou,'Faltas','#dc2626']].forEach(([ic,v,l,c])=>{
  sb.appendChild(h('div',{style:`padding:6px 10px;background:${c}10;border-left:3px solid ${c};border-radius:8px;flex:1;display:flex;align-items:center;gap:6px`},
    h('span',{style:`font-size:15px;font-weight:800;color:${c}`},String(v)),h('span',{style:'font-size:9px;color:var(--text-3)'},l)))});
sb.appendChild(h('button',{className:'btn btn-primary btn-sm',style:'height:auto;white-space:nowrap',onClick:()=>modalCriarAg(fI(sel))},'+ Novo'));
wrap.appendChild(sb);
if(!items.length){wrap.appendChild(h('div',{style:'text-align:center;padding:40px;color:var(--text-3)'},h('div',{style:'font-size:36px'},'📅'),h('div',{style:'font-size:14px;font-weight:600;margin-top:8px'},'Nenhum agendamento'),h('div',{style:'font-size:11px;margin-top:4px'},'Clique "+ Novo" para agendar')));return}
const groups={};items.forEach(i=>{const k=i.regiao_nome||'Sem região';if(!groups[k])groups[k]={cor:i.regiao_cor||'#94a3b8',items:[]};groups[k].items.push(i)});
Object.entries(groups).forEach(([rn,gr])=>{
  const sec=h('div',{style:`margin-bottom:12px;border-radius:10px;overflow:hidden;border:1px solid ${gr.cor}30`});
  sec.appendChild(h('div',{style:`padding:7px 12px;background:${gr.cor}15;font-weight:700;font-size:12px;color:${gr.cor};display:flex;justify-content:space-between`},
    h('span',null,'📍 '+rn),h('span',null,gr.items.length+' atend.')));
  gr.items.forEach(it=>{
    const card=h('div',{style:'display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #f1f5f9;cursor:pointer',
      onClick:()=>{AppState._returnTo='agenda';AppState.verCliente(it.cliente_id)}});
    card.appendChild(h('div',{style:'font-size:14px;font-weight:800;color:var(--navy);min-width:42px;text-align:center'},esc(it.horario||'--:--')));
    card.appendChild(h('div',{style:`width:8px;height:8px;border-radius:50%;background:${SC[it.status]};flex-shrink:0`}));
    const info=h('div',{style:'flex:1;min-width:0'});
    info.innerHTML=`<div style="font-weight:700;font-size:12px">${it.responsavel?'👶 ':''}${esc(it.paciente)} <span class="mono" style="font-size:9px;color:var(--text-4)">${esc(it.codigo_cliente||'')}</span></div>
      ${it.responsavel?`<div style="font-size:9px;color:var(--text-3)">👤 ${esc(it.responsavel)}</div>`:''}
      <div style="font-size:10px;color:var(--text-2)">💉 <strong>${esc(it.vacina)}</strong>${it.dose_numero?' D'+it.dose_numero:''}</div>
      <div style="font-size:9px;color:var(--text-4)">${it.bairro?'📍 '+esc(it.bairro):''}</div>`;
    card.appendChild(info);
    const links=h('div',{style:'display:flex;flex-direction:column;gap:2px;min-width:28px;align-items:center'});
    if(it.endereco||it.bairro)links.appendChild(h('a',{href:`https://www.google.com/maps/search/${encodeURIComponent((it.endereco||it.bairro)+', São Luís MA')}`,target:'_blank',style:'font-size:12px;text-decoration:none',onClick:e=>e.stopPropagation()},'📍'));
    if(it.celular)links.appendChild(h('a',{href:`https://wa.me/55${(it.celular||'').replace(/\D/g,'')}`,target:'_blank',style:'font-size:12px;text-decoration:none',onClick:e=>e.stopPropagation()},'📱'));
    card.appendChild(links);
    const acts=h('div',{style:'display:flex;gap:3px'});
    if(it.status==='agendado')acts.appendChild(h('button',{style:'border:none;background:#2BBCB320;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer',title:'Confirmar',onClick:e=>{e.stopPropagation();Api.agendaStatus(it.id,{status:'confirmado'}).then(()=>draw())}},'✓'));
    if(it.status==='confirmado'){
      acts.appendChild(h('button',{style:'border:none;background:#05966920;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer',title:'Realizado',onClick:e=>{e.stopPropagation();Api.agendaStatus(it.id,{status:'realizado'}).then(()=>draw())}},'✅'));
      acts.appendChild(h('button',{style:'border:none;background:#dc262620;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer',title:'Faltou',onClick:e=>{e.stopPropagation();Api.agendaStatus(it.id,{status:'faltou'}).then(()=>draw())}},'✗'))}
    if(['agendado','confirmado'].includes(it.status))acts.appendChild(h('button',{style:'border:none;background:var(--bg-subtle);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer',title:'Editar',onClick:e=>{e.stopPropagation();modalEditAg(it)}},'✏️'));
    card.appendChild(acts);sec.appendChild(card)});
  wrap.appendChild(sec)})}

// ═══ MODAL CRIAR ═══
function modalCriarAg(dateISO){showModal('+ Novo Agendamento',async(body,close)=>{
  const fd={data:dateISO,horario:'09:00',cliente_id:'',vacina_id:'',regiao_id:'',observacoes:'',usuario_id:AppState.usuario?.id};
  let selCliente=null;
  body.style.maxWidth='560px';

  // Patient search
  const cs=h('div',{style:'margin-bottom:16px'});
  cs.appendChild(h('label',{className:'label',style:'font-size:13px'},'👤 PACIENTE'));
  const ci=h('input',{className:'input',style:'font-size:14px;padding:12px',placeholder:'Buscar por nome, código, CPF...'});
  const cl=h('div',{style:'max-height:150px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;display:none;margin-top:4px'});
  let st;ci.addEventListener('input',()=>{clearTimeout(st);st=setTimeout(async()=>{
    if(ci.value.length<2){cl.style.display='none';return}
    const results=await Api.buscarClientes(ci.value)||[];
    cl.innerHTML='';cl.style.display='block';
    if(!results.length){cl.innerHTML='<div style="padding:10px;color:var(--text-3);font-size:12px">Nenhum resultado</div>';return}
    results.forEach(c=>{const opt=h('div',{style:'padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center',
      onClick:()=>{
        fd.cliente_id=c.id;selCliente=c;ci.value=c.nome;cl.style.display='none';
        // Auto-detect region from bairro
        if(c.bairro){const autoReg=findRegByBairro(c.bairro);if(autoReg){fd.regiao_id=autoReg.id;regBtns.querySelectorAll('.btn').forEach(b=>b.className='btn btn-sm btn-outline');
          const match=regBtns.querySelector(`[data-rid="${autoReg.id}"]`);if(match)match.className='btn btn-sm btn-primary'}}
        // Show selected info
        selInfo.style.display='block';
        selInfo.innerHTML=`<div style="font-weight:600">${c.responsavel_nome?'👶 ':'👤 '}${esc(c.nome)} <span class="mono" style="color:var(--text-4);font-size:10px">${esc(c.codigo_cliente||'')}</span></div>
          ${c.responsavel_nome?`<div style="font-size:11px;color:var(--text-3)">Resp: ${esc(c.responsavel_nome)}</div>`:''}
          ${c.bairro?`<div style="font-size:11px;color:var(--text-3)">📍 ${esc(c.bairro)}</div>`:''}`}});
      opt.innerHTML=`<div><strong>${esc(c.nome)}</strong> ${c.responsavel_nome?'<span style="font-size:10px;color:var(--text-3)">('+esc(c.responsavel_nome)+')</span>':''}</div>
        <span class="mono" style="font-size:10px;color:var(--text-4)">${esc(c.codigo_cliente||'')}</span>`;
      cl.appendChild(opt)})},300)});
  cs.appendChild(ci);cs.appendChild(cl);
  const selInfo=h('div',{style:'display:none;padding:8px 10px;background:var(--primary-bg);border-radius:8px;margin-top:6px;font-size:12px'});
  cs.appendChild(selInfo);body.appendChild(cs);

  // Date + Time row
  const row=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px'});
  const d1=h('div');d1.appendChild(h('label',{className:'label',style:'font-size:13px'},'📅 DATA'));
  const di=h('input',{className:'input',type:'date',value:fd.data,style:'font-size:14px;padding:10px'});di.addEventListener('change',e=>{fd.data=e.target.value});d1.appendChild(di);row.appendChild(d1);
  const d2=h('div');d2.appendChild(h('label',{className:'label',style:'font-size:13px'},'🕐 HORÁRIO'));
  const hi=h('input',{className:'input',type:'time',value:fd.horario,style:'font-size:14px;padding:10px'});hi.addEventListener('change',e=>{fd.horario=e.target.value});d2.appendChild(hi);row.appendChild(d2);
  body.appendChild(row);

  // Vaccine as BUTTONS
  const vd=h('div',{style:'margin-bottom:16px'});vd.appendChild(h('label',{className:'label',style:'font-size:13px'},'💉 VACINA'));
  const vGrid=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap'});
  vacinasCache.forEach(v=>{vGrid.appendChild(h('button',{type:'button','data-vid':v.id,
    className:`btn btn-sm ${fd.vacina_id==v.id?'btn-primary':'btn-outline'}`,style:'font-size:10px;padding:4px 8px',
    onClick:()=>{fd.vacina_id=v.id;vGrid.querySelectorAll('.btn').forEach(b=>b.className='btn btn-sm btn-outline');
      vGrid.querySelector(`[data-vid="${v.id}"]`).className='btn btn-sm btn-primary'}},v.nome))});
  vd.appendChild(vGrid);body.appendChild(vd);

  // Region
  const rd=h('div',{style:'margin-bottom:16px'});rd.appendChild(h('label',{className:'label',style:'font-size:13px'},'📍 REGIÃO'));
  const regBtns=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap'});
  regioes.forEach(r=>{regBtns.appendChild(h('button',{type:'button','data-rid':r.id,
    className:`btn btn-sm ${fd.regiao_id==r.id?'btn-primary':'btn-outline'}`,style:`font-size:10px;padding:4px 8px;border-left:3px solid ${r.cor}`,
    onClick:()=>{fd.regiao_id=r.id;regBtns.querySelectorAll('.btn').forEach(b=>b.className='btn btn-sm btn-outline');
      regBtns.querySelector(`[data-rid="${r.id}"]`).className='btn btn-sm btn-primary'}},r.nome))});
  rd.appendChild(regBtns);body.appendChild(rd);

  // Obs
  const od=h('div',{style:'margin-bottom:16px'});od.appendChild(h('label',{className:'label',style:'font-size:13px'},'💬 OBS'));
  const oi=h('input',{className:'input',style:'font-size:13px;padding:10px',placeholder:'Observações...'});oi.addEventListener('input',e=>{fd.observacoes=e.target.value});od.appendChild(oi);body.appendChild(od);

  body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'font-size:14px;padding:12px',onClick:async()=>{
    if(!fd.cliente_id)return Toast.show('Selecione um paciente','error');
    const r=await Api.agendaCriar(fd);if(r?.success){Toast.show('Agendamento criado!');close();draw()}else Toast.show(r?.error||'Erro','error')
  }},'✓ Agendar'));
},'560px')}

// ═══ MODAL EDITAR ═══
function modalEditAg(ag){showModal('✏️ Editar Agendamento',async(body,close)=>{
  const fd={data:fI(new Date(ag.data)),horario:ag.horario||'',observacoes:ag.observacoes||'',vacina_id:''};
  // Patient info
  body.appendChild(h('div',{style:'padding:12px;background:var(--bg-subtle);border-radius:10px;margin-bottom:16px;font-size:13px'},
    h('div',{style:'font-weight:700;font-size:14px;margin-bottom:4px'},`${ag.responsavel?'👶 ':'👤 '}${ag.paciente}`),
    h('div',null,h('strong',null,'Código: '),ag.codigo_cliente||'—'),
    h('div',null,h('strong',null,'Vacina atual: '),ag.vacina+(ag.dose_numero?' Dose '+ag.dose_numero:'')),
    ag.responsavel?h('div',null,h('strong',null,'Responsável: '),ag.responsavel):null,
    ag.bairro?h('div',null,h('strong',null,'Bairro: '),ag.bairro):null));
  // Date + Time
  const row=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px'});
  const d1=h('div');d1.appendChild(h('label',{className:'label',style:'font-size:13px'},'📅 DATA'));
  const di=h('input',{className:'input',type:'date',value:fd.data,style:'font-size:14px;padding:10px'});di.addEventListener('change',e=>{fd.data=e.target.value});d1.appendChild(di);row.appendChild(d1);
  const d2=h('div');d2.appendChild(h('label',{className:'label',style:'font-size:13px'},'🕐 HORÁRIO'));
  const hi=h('input',{className:'input',type:'time',value:fd.horario,style:'font-size:14px;padding:10px'});hi.addEventListener('change',e=>{fd.horario=e.target.value});d2.appendChild(hi);row.appendChild(d2);
  body.appendChild(row);
  // Vaccine change as buttons
  const vd=h('div',{style:'margin-bottom:16px'});vd.appendChild(h('label',{className:'label',style:'font-size:13px'},'💉 ALTERAR VACINA'));
  const vGrid=h('div',{style:'display:flex;gap:4px;flex-wrap:wrap'});
  vGrid.appendChild(h('button',{type:'button',className:'btn btn-sm btn-primary','data-vid':'',
    onClick:()=>{fd.vacina_id='';vGrid.querySelectorAll('.btn').forEach(b=>b.className='btn btn-sm btn-outline');event.target.className='btn btn-sm btn-primary'}},`Manter: ${ag.vacina}`));
  vacinasCache.forEach(v=>{vGrid.appendChild(h('button',{type:'button','data-vid':v.id,
    className:'btn btn-sm btn-outline',style:'font-size:10px;padding:4px 8px',
    onClick:()=>{fd.vacina_id=v.id;vGrid.querySelectorAll('.btn').forEach(b=>b.className='btn btn-sm btn-outline');
      vGrid.querySelector(`[data-vid="${v.id}"]`).className='btn btn-sm btn-primary'}},v.nome))});
  vd.appendChild(vGrid);body.appendChild(vd);
  // Reason (REQUIRED when changing vaccine)
  const rd=h('div',{style:'margin-bottom:16px'});rd.appendChild(h('label',{className:'label',style:'font-size:13px'},'📝 MOTIVO DA ALTERAÇÃO'));
  const ri=h('input',{className:'input',style:'font-size:13px;padding:10px',placeholder:'Obrigatório ao alterar vacina...'});
  ri.addEventListener('input',e=>{fd.observacoes=e.target.value});rd.appendChild(ri);body.appendChild(rd);

  const bt=h('div',{style:'display:flex;gap:10px'});
  bt.appendChild(h('button',{className:'btn btn-primary',style:'flex:1;padding:12px;font-size:13px',onClick:async()=>{
    // Validate motivo when changing vaccine
    if(fd.vacina_id&&!fd.observacoes?.trim())return Toast.show('Preencha o motivo da alteração da vacina','error');
    const r=await Api.agendaEditar(ag.id,fd);if(r?.success){Toast.show('Salvo!');close();draw()}else Toast.show(r?.error||'Erro','error')
  }},'💾 Salvar'));
  bt.appendChild(h('button',{className:'btn btn-red',style:'flex:1;padding:12px;font-size:13px',onClick:async()=>{
    if(!confirm('Cancelar este agendamento?'))return;await Api.agendaExcluir(ag.id);close();draw()
  }},'🗑 Excluir'));
  body.appendChild(bt)},'560px')}

// ═══ GERAR ═══
function modalGerar(){showModal('⚡ Gerar Agenda Automática',async(body,close)=>{
  const now=new Date();const fd={mes:now.getMonth()+1,ano:now.getFullYear(),max_por_dia:12,usuario_id:AppState.usuario?.id};
  body.appendChild(h('div',{style:'padding:12px;background:#eff6ff;border-radius:10px;margin-bottom:16px;font-size:12px;color:#1e40af;line-height:1.6'},
    `📋 <strong>Como funciona:</strong><br>
    1. Busca TODAS as doses pendentes de clientes ativos<br>
    2. Identifica a região de cada cliente pelo bairro<br>
    3. Distribui nos dias configurados: ${regioes.map(r=>`<strong>${r.nome}</strong>=${DN[r.diaSemana]||'Flex'}`).join(', ')}<br>
    4. Máximo de atendimentos por dia configurável<br>
    5. Horários automáticos: 09:00, 09:30, 10:00...`));
  body.appendChild(h('label',{className:'label',style:'font-size:13px'},'📅 MÊS'));
  const mGrid=h('div',{style:'display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:16px'});
  MESES.forEach((m,i)=>{mGrid.appendChild(h('button',{type:'button',className:`btn btn-sm ${fd.mes===i+1?'btn-primary':'btn-outline'}`,style:'font-size:11px;padding:6px',
    onClick:()=>{fd.mes=i+1;mGrid.querySelectorAll('.btn').forEach(b=>b.className='btn btn-sm btn-outline');event.target.className='btn btn-sm btn-primary'}},m.slice(0,3)))});
  body.appendChild(mGrid);
  const row=h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px'});
  const d1=h('div');d1.appendChild(h('label',{className:'label',style:'font-size:13px'},'Ano'));const ai=h('input',{className:'input',type:'number',value:fd.ano,style:'text-align:center;font-size:14px;padding:10px'});ai.addEventListener('input',e=>{fd.ano=+e.target.value});d1.appendChild(ai);row.appendChild(d1);
  const d2=h('div');d2.appendChild(h('label',{className:'label',style:'font-size:13px'},'Máx. atendimentos/dia'));const mi=h('input',{className:'input',type:'number',value:fd.max_por_dia,style:'text-align:center;font-size:14px;padding:10px'});mi.addEventListener('input',e=>{fd.max_por_dia=+e.target.value});d2.appendChild(mi);row.appendChild(d2);
  body.appendChild(row);
  body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'font-size:14px;padding:12px;margin-bottom:8px',onClick:async()=>{
    const r=await Api.agendaGerar(fd);if(r?.success){Toast.show(r.message);close();sel.setMonth(fd.mes-1);sel.setFullYear(fd.ano);draw()}else Toast.show(r?.error||'Erro','error')}},'⚡ Gerar Agenda'));
  body.appendChild(h('button',{className:'btn btn-outline btn-block btn-sm',style:'color:#dc2626;font-size:11px',onClick:async()=>{
    if(!confirm(`Limpar agendamentos PENDENTES de ${MESES[fd.mes-1]}/${fd.ano}?`))return;
    const r=await Api.agendaLimpar({mes:fd.mes,ano:fd.ano});Toast.show(r?.message||'Limpo')}},'🗑 Limpar mês (só pendentes)'));
},'500px')}

// ═══ REGIÕES ═══
function modalRegioes(){showModal('📍 Regiões',async(body,close)=>{
  async function dR(){body.innerHTML='';const rgs=await Api.regioes()||[];
    rgs.forEach(r=>{const rw=h('div',{style:'display:flex;align-items:center;gap:8px;padding:10px;border-bottom:1px solid #f1f5f9'});
      rw.innerHTML=`<div style="width:14px;height:14px;border-radius:50%;background:${esc(r.cor)}"></div><div style="flex:1"><strong>${esc(r.nome)}</strong> <span style="font-size:10px;color:var(--text-3)">${DN[r.diaSemana]||'Flex'}</span><div style="font-size:9px;color:var(--text-4)">${(r.bairros||[]).join(', ')}</div></div>`;
      rw.appendChild(h('button',{style:'border:none;background:var(--bg-subtle);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:10px',onClick:()=>eR(r)},'✏️'));body.appendChild(rw)});
    body.appendChild(h('button',{className:'btn btn-outline btn-block btn-sm',style:'margin-top:10px',onClick:()=>eR(null)},'+ Nova Região'))}
  function eR(r){body.innerHTML='';const fd={nome:r?.nome||'',cor:r?.cor||'#2BBCB3',dia_semana:r?.diaSemana!=null?String(r.diaSemana):'',bairros:(r?.bairros||[]).join(', ')};
    const gr=h('div',{className:'form-grid'});
    [['nome','Nome'],['cor','Cor hex']].forEach(([k,l])=>{const d=h('div');d.appendChild(h('label',{className:'label'},l));const i=h('input',{className:'input',value:fd[k]});i.addEventListener('input',e=>{fd[k]=e.target.value});d.appendChild(i);gr.appendChild(d)});
    const dd=h('div');dd.appendChild(h('label',{className:'label'},'Dia'));dd.appendChild(buildSelect([['','Flex'],['1','Seg'],['2','Ter'],['3','Qua'],['4','Qui'],['5','Sex'],['6','Sáb']],fd.dia_semana,v=>{fd.dia_semana=v}));gr.appendChild(dd);
    const db=h('div',{style:'grid-column:1/-1'});db.appendChild(h('label',{className:'label'},'Bairros (vírgula)'));const bi=h('textarea',{className:'input',style:'min-height:50px'});bi.textContent=fd.bairros;bi.addEventListener('input',e=>{fd.bairros=e.target.value});db.appendChild(bi);gr.appendChild(db);
    body.appendChild(gr);
    body.appendChild(h('button',{className:'btn btn-primary btn-block',style:'margin-top:10px',onClick:async()=>{const d={nome:fd.nome,cor:fd.cor,dia_semana:fd.dia_semana?+fd.dia_semana:null,bairros:fd.bairros.split(',').map(s=>s.trim()).filter(Boolean)};
      const rs=r?await Api.editarRegiao(r.id,d):await Api.criarRegiao(d);if(rs?.success){Toast.show('Salva');window._vittaRegioes=null;dR()}else Toast.show(rs?.error||'Erro','error')}},'💾 Salvar'));
    body.appendChild(h('button',{className:'btn btn-outline btn-block btn-sm',style:'margin-top:6px',onClick:()=>dR()},'← Voltar'))}
  await dR()},'500px')}

// ═══ PDF ═══
async function exportarPDF(){
const p={data:fI(sel)};if(regF)p.regiao_id=regF;const items=await Api.agendaList(p)||[];
if(!items.length){Toast.show('Sem dados','warning');return}
const rg={};items.forEach(i=>{const k=i.regiao_nome||'Sem região';if(!rg[k])rg[k]={cor:i.regiao_cor||'#94a3b8',items:[]};rg[k].items.push(i)});
const logoUrl = `${window.location.origin}/assets/logos/logo-vertical-color.png`;
let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Agenda ${fB(sel)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1B4965;font-size:9px}
.hd{padding:8px 15px;background:#f0fffe;border-bottom:3px solid #2BBCB3;display:flex;align-items:center;justify-content:space-between}
.hd-r{text-align:right}.hd-r .tit{font-size:14px;font-weight:800;color:#1B4965}.hd-r .sub{font-size:10px;color:#64748b}
.pg{padding:6px 15px}
.rh{padding:4px 8px;font-size:10px;font-weight:bold;border-left:4px solid #2BBCB3;margin:6px 0 2px;background:#f0fffe;color:#1B4965}
table{width:100%;border-collapse:collapse}
th{background:#1B4965;color:white;padding:4px 5px;font-size:8px;text-align:left;text-transform:uppercase}
td{padding:4px 5px;border:1px solid #e2e8f0;font-size:9px;vertical-align:top}
tr:nth-child(even){background:#f8fffe}
.ok{color:#059669;font-weight:800;text-align:center}
.link{color:#2BBCB3;font-size:7px;text-decoration:underline}
.ft{padding:4px 15px;border-top:2px solid #2BBCB3;display:flex;justify-content:space-between;font-size:7px;color:#94a3b8;margin-top:4px}
@media print{@page{margin:5mm;size:landscape}}</style></head><body>
<div class="hd">
  <div style="text-align:center;">
    <img
      src="${logoUrl}"
      style="height:55px;object-fit:contain;display:block;margin:0 auto;"
      onerror="this.outerHTML='<div style=&quot;font-size:22px;font-weight:800;color:#1B4965&quot;>💎 Vittalis Saúde</div>'"
    >
  </div>
  <div class="hd-r">
    <div class="tit">AGENDA DE VACINAÇÃO</div>
    <div class="sub">${DF[sel.getDay()]}, ${fB(sel)} — ${items.length} atendimentos</div>
  </div>
</div><div class="pg">`;
Object.entries(rg).forEach(([rn,g])=>{
  html+=`<div class="rh" style="border-left-color:${g.cor}">📍 ${rn} (${g.items.length})</div>
  <table><tr><th>HORÁRIO</th><th>CLIENTE</th><th>CÓDIGO</th><th>RESPONSÁVEL</th><th>VACINAS</th><th>ENDEREÇO</th><th>CELULAR</th><th>STATUS</th><th>CONTRATO</th></tr>`;
  g.items.forEach(it=>{
    const addr=it.endereco||it.bairro||'-';
    const mapUrl=addr!=='-'?`https://www.google.com/maps/search/${encodeURIComponent(addr+', São Luís MA')}`:'';
    html+=`<tr><td style="font-weight:800;font-size:11px;white-space:nowrap">${it.horario||'--:--'}</td>
      <td><strong>${it.paciente||'-'}</strong></td>
      <td style="font-family:monospace">${it.codigo_cliente||'-'}</td>
      <td>${it.responsavel||'-'}</td>
      <td><strong>${it.vacina||'-'}</strong>${it.dose_numero?' D'+it.dose_numero:''}</td>
      <td>${addr}${mapUrl?` <a href="${mapUrl}" class="link">📍mapa</a>`:''}</td>
      <td>${it.celular||'-'}</td>
      <td style="color:${SC[it.status]};font-weight:700">${(it.status||'').toUpperCase()}</td>
      <td class="ok">✓ OK</td></tr>`});
  html+='</table>'});
html+=`</div><div class="ft"><strong style="color:#1B4965">VittaSys — Vittalis Saúde</strong><span>Gerado: ${new Date().toLocaleString('pt-BR')}</span><span>São Luís/MA</span></div></body></html>`;
const pw=window.open('','_blank');pw.document.write(html);pw.document.close();setTimeout(()=>pw.print(),500)}

await draw();return wrap;}
