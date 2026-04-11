async function renderAgenda(){
  const DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const STATUS_MAP={agendado:{label:'Agendado',cls:'badge-primary',bg:'#eff6ff'},confirmado:{label:'Confirmado',cls:'badge-green',bg:'#f0fdf4'},realizado:{label:'Realizado',cls:'badge-green',bg:'#ecfdf5'},faltou:{label:'Faltou',cls:'badge-red',bg:'#fef2f2'},cancelado:{label:'Cancelado',cls:'badge-gray',bg:'#f8fafc'}};
  let dataSel=new Date();dataSel.setHours(0,0,0,0);
  let visao='dia'; // dia | semana
  let regiaoFiltro='';
  let regioes=[];
  const wrap=h('div',{className:'fade-in'});

  function fmtDateISO(d){return d.toISOString().slice(0,10)}
  function fmtDateBR(d){const dt=new Date(d);return`${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`}
  function isHoje(d){const t=new Date();return fmtDateISO(new Date(d))===fmtDateISO(t)}

async function draw(){
  wrap.innerHTML='';
  regioes=await Api.regioes()||[];

  // ═══ HEADER ═══
  const hdr=h('div',{className:'page-header'});
  hdr.appendChild(h('div',{className:'page-header-left'},
    h('h1',{className:'page-title'},'Agenda Inteligente'),
    h('p',{className:'page-subtitle'},`Atendimentos ${visao==='dia'?fmtDateBR(dataSel):'da semana'} · ${regiaoFiltro?regioes.find(r=>r.id==regiaoFiltro)?.nome||'':'Todas as regiões'}`)
  ));
  const acts=h('div',{className:'page-header-actions'});
  if(AppState.isMaster()){
    acts.appendChild(iconBtn('btn btn-primary btn-sm',I.plus,'Gerar Agenda',()=>modalGerar()));
    acts.appendChild(iconBtn('btn btn-outline btn-sm',null,'📋 Regiões',()=>modalRegioes()));
  }
  acts.appendChild(iconBtn('btn btn-navy btn-sm',null,'📄 Exportar PDF',()=>exportarPDF()));
  hdr.appendChild(acts);wrap.appendChild(hdr);

  // ═══ CONTROLS ═══
  const ctrl=h('div',{style:'display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap'});
  // Date nav
  const nav=h('div',{style:'display:flex;align-items:center;gap:6px'});
  nav.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>{dataSel.setDate(dataSel.getDate()-1);draw()}},'←'));
  nav.appendChild(h('button',{className:`btn ${isHoje(dataSel)?'btn-primary':'btn-outline'} btn-sm`,onClick:()=>{dataSel=new Date();dataSel.setHours(0,0,0,0);draw()}},'Hoje'));
  nav.appendChild(h('button',{className:'btn btn-outline btn-sm',onClick:()=>{dataSel.setDate(dataSel.getDate()+1);draw()}},'→'));
  const dateInput=h('input',{type:'date',className:'input',style:'width:150px',value:fmtDateISO(dataSel)});
  dateInput.addEventListener('change',()=>{dataSel=new Date(dateInput.value+'T00:00:00');draw()});
  nav.appendChild(dateInput);
  ctrl.appendChild(nav);
  // View toggle
  const vt=h('div',{style:'display:flex;gap:4px'});
  vt.appendChild(h('button',{className:`btn btn-sm ${visao==='dia'?'btn-primary':'btn-outline'}`,onClick:()=>{visao='dia';draw()}},'Dia'));
  vt.appendChild(h('button',{className:`btn btn-sm ${visao==='semana'?'btn-primary':'btn-outline'}`,onClick:()=>{visao='semana';draw()}},'Semana'));
  ctrl.appendChild(vt);
  // Region filter
  const regSel=[['','Todas Regiões'],...regioes.map(r=>[String(r.id),r.nome])];
  ctrl.appendChild(buildSelect(regSel,regiaoFiltro,v=>{regiaoFiltro=v;draw()}));
  wrap.appendChild(ctrl);

  if(visao==='dia') await drawDia();
  else await drawSemana();
}

// ═══ VISÃO DIA ═══
async function drawDia(){
  const params={data:fmtDateISO(dataSel)};
  if(regiaoFiltro)params.regiao_id=regiaoFiltro;
  const items=await Api.agendaList(params)||[];

  // Stats bar
  const stats={agendado:0,confirmado:0,realizado:0,faltou:0};
  items.forEach(it=>{if(stats[it.status]!=null)stats[it.status]++});
  const sb=h('div',{style:'display:flex;gap:10px;margin-bottom:16px'});
  [['Agendados',stats.agendado,'#3b82f6'],['Confirmados',stats.confirmado,'#2BBCB3'],['Realizados',stats.realizado,'#059669'],['Faltas',stats.faltou,'#dc2626']].forEach(([l,v,c])=>{
    sb.appendChild(h('div',{style:`padding:10px 16px;background:${c}10;border-left:3px solid ${c};border-radius:8px;flex:1`},
      h('div',{style:`font-size:20px;font-weight:800;color:${c}`},String(v)),
      h('div',{style:'font-size:11px;color:var(--text-3);font-weight:600'},l)));
  });
  wrap.appendChild(sb);

  if(!items.length){
    wrap.appendChild(h('div',{className:'empty-state',style:'padding:60px 20px;text-align:center'},
      h('div',{style:'font-size:48px;margin-bottom:12px'},'📅'),
      h('div',{style:'font-size:16px;font-weight:700;color:var(--text-2)'},'Nenhum agendamento para este dia'),
      h('div',{style:'font-size:13px;color:var(--text-3);margin-top:6px'},'Use "Gerar Agenda" para criar agendamentos automáticos')));
    return;
  }

  // Group by region
  const groups={};
  items.forEach(it=>{const key=it.regiao_nome||'Sem região';if(!groups[key])groups[key]={cor:it.regiao_cor||'#94a3b8',items:[]};groups[key].items.push(it)});

  Object.entries(groups).forEach(([regNome,group])=>{
    const sec=h('div',{style:`margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid ${group.cor}30`});
    sec.appendChild(h('div',{style:`padding:10px 16px;background:${group.cor}15;border-bottom:1px solid ${group.cor}30;display:flex;justify-content:space-between;align-items:center`},
      h('span',{style:`font-weight:700;font-size:13px;color:${group.cor}`},`📍 ${regNome} (${group.items.length})`),
      h('span',{style:'font-size:11px;color:var(--text-3)'},`${group.items.filter(i=>i.status==='realizado').length} realizados`)
    ));
    group.items.forEach(it=>{
      const st=STATUS_MAP[it.status]||STATUS_MAP.agendado;
      const isChild=it.responsavel;
      const card=h('div',{style:`display:grid;grid-template-columns:60px 1fr auto;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f5f9;align-items:center;background:${it.status==='realizado'?'#f0fdf410':it.status==='faltou'?'#fef2f210':'transparent'}`});
      // Time
      const timeCol=h('div',{style:'text-align:center'});
      timeCol.innerHTML=`<div style="font-size:16px;font-weight:800;color:var(--navy)">${esc(it.horario||'--:--')}</div>`;
      card.appendChild(timeCol);
      // Info
      const info=h('div');
      info.innerHTML=`
        <div style="font-weight:700;font-size:14px">${isChild?'👶 ':''}${esc(it.paciente)}</div>
        ${isChild?`<div style="font-size:11px;color:var(--text-3)">👤 ${esc(it.responsavel)}</div>`:''}
        <div style="font-size:12px;color:var(--text-2);margin-top:2px">💉 <strong>${esc(it.vacina)}</strong>${it.dose_numero?` · Dose ${it.dose_numero}`:''}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px">${it.celular?'📱 '+esc(it.celular)+' · ':''} ${it.bairro?'📍 '+esc(it.bairro):''}</div>
        ${it.observacoes?`<div style="font-size:10px;color:#d97706;margin-top:2px">💬 ${esc(it.observacoes)}</div>`:''}`;
      card.appendChild(info);
      // Actions
      const actCol=h('div',{style:'display:flex;flex-direction:column;gap:4px;align-items:flex-end'});
      actCol.appendChild(h('span',{className:`badge ${st.cls}`,style:'font-size:10px'},st.label));
      if(it.status==='agendado'){
        actCol.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:10px;padding:2px 8px',onClick:async(e)=>{e.stopPropagation();await Api.agendaStatus(it.id,{status:'confirmado'});draw()}},'✓ Confirmar'));
      }
      if(it.status==='confirmado'){
        actCol.appendChild(h('button',{className:'btn btn-primary btn-sm',style:'font-size:10px;padding:2px 8px',onClick:async(e)=>{e.stopPropagation();await Api.agendaStatus(it.id,{status:'realizado'});draw()}},'✓ Realizado'));
        actCol.appendChild(h('button',{className:'btn btn-red btn-sm',style:'font-size:10px;padding:2px 8px',onClick:async(e)=>{e.stopPropagation();await Api.agendaStatus(it.id,{status:'faltou'});draw()}},'✗ Faltou'));
      }
      if(it.status==='agendado'||it.status==='confirmado'){
        actCol.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:10px;padding:2px 8px;color:var(--text-3)',onClick:(e)=>{e.stopPropagation();modalEditarAgendamento(it)}},'✏️ Editar'));
      }
      card.appendChild(actCol);
      card.style.cursor='pointer';
      card.addEventListener('click',()=>AppState.verCliente(it.cliente_id));
      sec.appendChild(card);
    });
    wrap.appendChild(sec);
  });
}

// ═══ VISÃO SEMANA ═══
async function drawSemana(){
  const d=new Date(dataSel);const day=d.getDay();const diff=d.getDate()-day+(day===0?-6:1);
  const weekStart=new Date(d);weekStart.setDate(diff);weekStart.setHours(0,0,0,0);

  const params={semana:fmtDateISO(weekStart)};
  if(regiaoFiltro)params.regiao_id=regiaoFiltro;
  const items=await Api.agendaList(params)||[];

  // Group by day
  const days=[];
  for(let i=0;i<6;i++){// Seg-Sáb
    const dt=new Date(weekStart);dt.setDate(weekStart.getDate()+i);
    const iso=fmtDateISO(dt);
    const dayItems=items.filter(it=>fmtDateISO(new Date(it.data))===iso);
    days.push({date:dt,iso,items:dayItems});
  }

  const grid=h('div',{style:'display:grid;grid-template-columns:repeat(6,1fr);gap:8px'});
  days.forEach(day=>{
    const isToday=isHoje(day.date);
    const col=h('div',{style:`border-radius:10px;border:1px solid ${isToday?'var(--primary)':'var(--border)'};overflow:hidden;background:${isToday?'var(--primary-bg)':'var(--card-bg)'}`});
    // Day header
    col.appendChild(h('div',{style:`padding:8px 10px;background:${isToday?'var(--primary)':'var(--navy)'};color:white;text-align:center;font-size:12px;font-weight:700;cursor:pointer`,onClick:()=>{dataSel=new Date(day.date);visao='dia';draw()}},
      `${DIAS[day.date.getDay()]} ${day.date.getDate()}/${day.date.getMonth()+1}`));
    // Region badge for this day
    const regSet=new Set();day.items.forEach(it=>{if(it.regiao_nome)regSet.add(it.regiao_nome)});
    if(regSet.size){
      const rb=h('div',{style:'padding:4px 8px;text-align:center'});
      [...regSet].forEach(rn=>{rb.appendChild(h('span',{style:'font-size:9px;font-weight:600;color:var(--primary)'},rn))});
      col.appendChild(rb);
    }
    // Stats
    const sts={agendado:0,confirmado:0,realizado:0,faltou:0};
    day.items.forEach(it=>{if(sts[it.status]!=null)sts[it.status]++});
    col.appendChild(h('div',{style:'padding:4px 8px;text-align:center;font-size:20px;font-weight:800;color:var(--navy)'},String(day.items.length)));
    col.appendChild(h('div',{style:'padding:2px 8px;text-align:center;font-size:10px;color:var(--text-3)'},`${sts.realizado} feitos · ${sts.faltou} faltas`));
    // Mini list
    day.items.slice(0,5).forEach(it=>{
      const st=STATUS_MAP[it.status];
      const mi=h('div',{style:'padding:4px 8px;border-top:1px solid #f1f5f9;font-size:10px'});
      mi.innerHTML=`<span class="fw-600">${esc(it.horario||'')}</span> ${esc(it.paciente?.split(' ').slice(0,2).join(' '))} <span class="badge ${st.cls}" style="font-size:8px">${st.label.charAt(0)}</span>`;
      col.appendChild(mi);
    });
    if(day.items.length>5)col.appendChild(h('div',{style:'padding:4px 8px;font-size:9px;color:var(--primary);text-align:center;cursor:pointer',onClick:()=>{dataSel=new Date(day.date);visao='dia';draw()}},`+${day.items.length-5} mais`));
    grid.appendChild(col);
  });
  wrap.appendChild(grid);
}

// ═══ MODAL: GERAR AGENDA ═══
function modalGerar(){showModal('Gerar Agenda Automática',async(body,close)=>{
  const now=new Date();
  const fd={mes:now.getMonth()+1,ano:now.getFullYear(),max_por_dia:12,usuario_id:AppState.usuario?.id};
  const gr=h('div',{className:'form-grid'});

  const dMes=h('div');dMes.appendChild(h('label',{className:'label'},'Mês'));
  dMes.appendChild(buildSelect([[1,'Janeiro'],[2,'Fevereiro'],[3,'Março'],[4,'Abril'],[5,'Maio'],[6,'Junho'],[7,'Julho'],[8,'Agosto'],[9,'Setembro'],[10,'Outubro'],[11,'Novembro'],[12,'Dezembro']].map(([v,l])=>[String(v),l]),String(fd.mes),v=>{fd.mes=+v}));
  gr.appendChild(dMes);

  const dAno=h('div');dAno.appendChild(h('label',{className:'label'},'Ano'));
  const anoInp=h('input',{className:'input',type:'number',value:fd.ano});
  anoInp.addEventListener('input',e=>{fd.ano=+e.target.value});
  dAno.appendChild(anoInp);gr.appendChild(dAno);

  const dMax=h('div');dMax.appendChild(h('label',{className:'label'},'Máx. por dia'));
  const maxInp=h('input',{className:'input',type:'number',value:fd.max_por_dia});
  maxInp.addEventListener('input',e=>{fd.max_por_dia=+e.target.value});
  dMax.appendChild(maxInp);gr.appendChild(dMax);

  body.appendChild(gr);
  body.appendChild(h('div',{style:'font-size:12px;color:var(--text-3);margin:12px 0'},'O sistema vai buscar todas as doses pendentes dos clientes ativos para o mês selecionado e distribuir por região/dia.'));
  body.appendChild(iconBtn('btn btn-primary btn-block',null,'⚡ Gerar Agenda',async()=>{
    const r=await Api.agendaGerar(fd);
    if(r?.success){Toast.show(r.message);close();draw()}else Toast.show(r?.error||'Erro','error');
  },{style:{marginTop:'12px'}}));
},'440px')}

// ═══ MODAL: EDITAR AGENDAMENTO ═══
function modalEditarAgendamento(ag){showModal(`Editar — ${ag.paciente}`,async(body,close)=>{
  const fd={data:fmtDateISO(new Date(ag.data)),horario:ag.horario||'',regiao_id:ag.regiao_id||'',observacoes:ag.observacoes||''};
  const gr=h('div',{className:'form-grid'});

  const dData=h('div');dData.appendChild(h('label',{className:'label'},'Data'));
  const dtInp=h('input',{className:'input',type:'date',value:fd.data});
  dtInp.addEventListener('change',e=>{fd.data=e.target.value});
  dData.appendChild(dtInp);gr.appendChild(dData);

  const dHora=h('div');dHora.appendChild(h('label',{className:'label'},'Horário'));
  const hrInp=h('input',{className:'input',type:'time',value:fd.horario});
  hrInp.addEventListener('change',e=>{fd.horario=e.target.value});
  dHora.appendChild(hrInp);gr.appendChild(dHora);

  const dReg=h('div');dReg.appendChild(h('label',{className:'label'},'Região'));
  dReg.appendChild(buildSelect([['','Selecione'],...regioes.map(r=>[String(r.id),r.nome])],String(fd.regiao_id),v=>{fd.regiao_id=v}));
  gr.appendChild(dReg);

  const dObs=h('div',{style:'grid-column:1/-1'});dObs.appendChild(h('label',{className:'label'},'Observações'));
  const obsInp=h('textarea',{className:'input',style:'min-height:60px',value:fd.observacoes});
  obsInp.addEventListener('input',e=>{fd.observacoes=e.target.value});
  obsInp.textContent=fd.observacoes;
  dObs.appendChild(obsInp);gr.appendChild(dObs);

  body.appendChild(gr);
  const btns=h('div',{style:'display:flex;gap:10px;margin-top:16px'});
  btns.appendChild(iconBtn('btn btn-primary',null,'Salvar',async()=>{
    const r=await Api.agendaEditar(ag.id,fd);
    if(r?.success){Toast.show('Agendamento atualizado');close();draw()}else Toast.show(r?.error||'Erro','error');
  },{style:{flex:'1'}}));
  btns.appendChild(iconBtn('btn btn-red',null,'Cancelar Agendamento',async()=>{
    if(!confirm('Cancelar este agendamento?'))return;
    const r=await Api.agendaExcluir(ag.id);
    if(r?.success){Toast.show('Agendamento cancelado');close();draw()}else Toast.show(r?.error||'Erro','error');
  },{style:{flex:'1'}}));
  body.appendChild(btns);
},'480px')}

// ═══ MODAL: REGIÕES ═══
function modalRegioes(){showModal('Regiões de Atendimento',async(body,close)=>{
  async function drawRegioes(){
    body.innerHTML='';
    const regs=await Api.regioes()||[];
    regs.forEach(r=>{
      const row=h('div',{style:`display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid #f1f5f9`});
      row.innerHTML=`<div style="width:12px;height:12px;border-radius:50%;background:${esc(r.cor)}"></div>
        <div style="flex:1"><div class="fw-600">${esc(r.nome)}</div><div class="text-sm text-muted">${DIAS[r.diaSemana]||'Flex'} · ${(r.bairros||[]).slice(0,4).join(', ')}${(r.bairros||[]).length>4?'...':''}</div></div>`;
      row.appendChild(h('button',{className:'btn btn-outline btn-sm',style:'font-size:10px',onClick:()=>editRegiao(r)},
        '✏️'));
      body.appendChild(row);
    });
    // Add new
    body.appendChild(h('div',{style:'margin-top:12px'}));
    body.appendChild(iconBtn('btn btn-outline btn-block btn-sm',I.plus,'Nova Região',()=>editRegiao(null)));
  }
  function editRegiao(r){
    body.innerHTML='';
    const fd={nome:r?.nome||'',cor:r?.cor||'#2BBCB3',dia_semana:r?.diaSemana!=null?String(r.diaSemana):'',bairros:(r?.bairros||[]).join(', ')};
    const gr=h('div',{className:'form-grid'});
    [['nome','Nome da Região'],['cor','Cor (hex)'],['bairros','Bairros (separados por vírgula)']].forEach(([k,lab])=>{
      const d=h('div',{style:k==='bairros'?'grid-column:1/-1':''});d.appendChild(h('label',{className:'label'},lab));
      const inp=h(k==='bairros'?'textarea':'input',{className:'input',value:fd[k]});
      inp.addEventListener('input',e=>{fd[k]=e.target.value});
      if(k==='bairros')inp.textContent=fd[k];
      d.appendChild(inp);gr.appendChild(d);
    });
    const dDia=h('div');dDia.appendChild(h('label',{className:'label'},'Dia da Semana'));
    dDia.appendChild(buildSelect([['','Flex'],['1','Segunda'],['2','Terça'],['3','Quarta'],['4','Quinta'],['5','Sexta'],['6','Sábado']],fd.dia_semana,v=>{fd.dia_semana=v}));
    gr.appendChild(dDia);
    body.appendChild(gr);
    body.appendChild(iconBtn('btn btn-primary btn-block',null,'Salvar',async()=>{
      const data={nome:fd.nome,cor:fd.cor,dia_semana:fd.dia_semana?+fd.dia_semana:null,bairros:fd.bairros.split(',').map(s=>s.trim()).filter(Boolean)};
      const res2=r?await Api.editarRegiao(r.id,data):await Api.criarRegiao(data);
      if(res2?.success){Toast.show('Região salva');drawRegioes()}else Toast.show(res2?.error||'Erro','error');
    },{style:{marginTop:'12px'}}));
    body.appendChild(h('button',{className:'btn btn-outline btn-block btn-sm',style:'margin-top:8px',onClick:()=>drawRegioes()},'← Voltar'));
  }
  await drawRegioes();
},'520px')}

// ═══ EXPORTAR PDF ═══
async function exportarPDF(){
  const params={data:fmtDateISO(dataSel)};
  if(regiaoFiltro)params.regiao_id=regiaoFiltro;
  const items=await Api.agendaList(params)||[];
  if(!items.length){Toast.show('Nenhum agendamento para exportar','warning');return}

  // Build HTML for print
  const regNomes=[...new Set(items.map(i=>i.regiao_nome||'Sem região'))];
  let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Agenda ${fmtDateBR(dataSel)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;color:#1B4965}
    .header{text-align:center;margin-bottom:20px;padding-bottom:10px;border-bottom:3px solid #2BBCB3}
    .header h1{font-size:20px;color:#1B4965}.header p{font-size:12px;color:#64748b}
    .region{margin-bottom:16px}.region-title{background:#2BBCB3;color:white;padding:6px 12px;font-size:13px;font-weight:bold;border-radius:4px 4px 0 0}
    table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1B4965;color:white;padding:6px;text-align:left}
    td{padding:6px;border-bottom:1px solid #e2e8f0}tr:nth-child(even){background:#f0fffe}
    .status-ag{color:#3b82f6}.status-conf{color:#2BBCB3}.status-real{color:#059669;font-weight:bold}.status-falta{color:#dc2626}
    @media print{body{padding:10px}@page{margin:10mm}}
  </style></head><body>
  <div class="header"><h1>📅 Agenda de Vacinação — Vittalis Saúde</h1>
  <p>${DIAS[dataSel.getDay()]}, ${fmtDateBR(dataSel)} · ${items.length} atendimentos</p></div>`;

  regNomes.forEach(rn=>{
    const regItems=items.filter(i=>(i.regiao_nome||'Sem região')===rn);
    html+=`<div class="region"><div class="region-title">📍 ${rn} (${regItems.length})</div>
    <table><tr><th>Horário</th><th>Paciente</th><th>Responsável</th><th>Vacina</th><th>Bairro</th><th>Celular</th><th>Status</th></tr>`;
    regItems.forEach(it=>{
      const stCls=it.status==='realizado'?'status-real':it.status==='confirmado'?'status-conf':it.status==='faltou'?'status-falta':'status-ag';
      html+=`<tr><td><strong>${it.horario||'--:--'}</strong></td><td>${it.paciente}</td><td>${it.responsavel||'-'}</td><td>${it.vacina}${it.dose_numero?' D'+it.dose_numero:''}</td><td>${it.bairro||'-'}</td><td>${it.celular||'-'}</td><td class="${stCls}">${it.status}</td></tr>`;
    });
    html+=`</table></div>`;
  });
  html+=`<div style="margin-top:20px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px">VittaSys — Gerado em ${new Date().toLocaleString('pt-BR')}</div></body></html>`;

  const printWin=window.open('','_blank');
  printWin.document.write(html);
  printWin.document.close();
  setTimeout(()=>printWin.print(),500);
}

await draw();return wrap;}
