function diasParaVencer(d){if(!d)return 999;const x=new Date();x.setHours(0,0,0,0);return Math.ceil((new Date(d)-x)/864e5)}
function fmtData(s){if(!s)return'-';const d=new Date(s);return isNaN(d)?s:d.toLocaleDateString('pt-BR')}
function fmtDataHora(s){if(!s)return'-';const d=new Date(s);return isNaN(d)?s:d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function fmtIdade(n){if(!n)return'-';const x=new Date(),b=new Date(n);let a=x.getFullYear()-b.getFullYear(),m=x.getMonth()-b.getMonth();if(m<0){a--;m+=12}return a<1?`${m}m`:a<3?`${a}a ${m}m`:`${a} anos`}
function fmtMoeda(v){return'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function statusVenc(d){if(d<0)return{label:'VENCIDA',cls:'badge-red'};if(d<=30)return{label:`${d}d`,cls:'badge-orange'};if(d<=90)return{label:`${d}d`,cls:'badge-orange'};return{label:`${d}d`,cls:'badge-green'}}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function $(s,p){return(p||document).querySelector(s)}

function h(t,a,...c){
  const el=document.createElement(t);
  if(a)Object.entries(a).forEach(([k,v])=>{
    if(v==null)return;
    if(k==='className')el.className=v;
    else if(k==='style'&&typeof v==='object')Object.assign(el.style,v);
    else if(k.startsWith('on')&&typeof v==='function')el.addEventListener(k.slice(2).toLowerCase(),v);
    else if(k==='innerHTML')el.innerHTML=v;
    else el.setAttribute(k,v);
  });
  c.flat(Infinity).forEach(ch=>{
    if(ch==null||ch===false)return;
    el.appendChild(typeof ch==='string'||typeof ch==='number'?document.createTextNode(ch):ch);
  });
  return el;
}

// ═══ ICON BUTTON — fixes SVG rendering ═══
function iconBtn(cls, iconSvg, label, onClick, extraAttrs) {
  const btn = document.createElement('button');
  btn.className = cls;
  btn.innerHTML = (iconSvg || '') + (label ? ' ' + esc(label) : '');
  if (onClick) btn.addEventListener('click', onClick);
  if (extraAttrs) Object.entries(extraAttrs).forEach(([k,v]) => {
    if (k === 'style' && typeof v === 'object') Object.assign(btn.style, v);
    else btn.setAttribute(k, v);
  });
  return btn;
}

function debounce(fn,ms=300){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
function tipoClienteBadge(t){return t==='ativo'?'<span class="badge badge-green">⭐ Ativo</span>':'<span class="badge badge-gray">Espontâneo</span>'}
function tipoPacienteBadge(t){const m={bebe:['Bebê','badge-purple'],crianca:['Criança','badge-teal'],adulto:['Adulto','badge-navy']};const[l,c]=m[t]||['—','badge-gray'];return`<span class="badge ${c}">${l}</span>`}

// ═══ MASKS ═══
function maskCPF(v){return v.replace(/\D/g,'').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2').slice(0,14)}
function maskTel(v){const d=v.replace(/\D/g,'');if(d.length<=10)return d.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{4})(\d)/,'$1-$2');return d.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2').slice(0,15)}
function maskDate(v){return v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{2})(\d)/,'$1/$2').slice(0,10)}

// ═══ VALIDATIONS ═══
function validarCPF(cpf){const c=cpf.replace(/\D/g,'');if(c.length!==11||/^(\d)\1+$/.test(c))return false;
let s=0;for(let i=0;i<9;i++)s+=(10-i)*parseInt(c[i]);let r=(s*10)%11;if(r===10)r=0;if(r!==parseInt(c[9]))return false;
s=0;for(let i=0;i<10;i++)s+=(11-i)*parseInt(c[i]);r=(s*10)%11;if(r===10)r=0;return r===parseInt(c[10])}

function validarNascimento(dt){if(!dt)return true;const d=new Date(dt);const hoje=new Date();return d<=hoje&&d>new Date('1900-01-01')}

function inputComMascara(className, placeholder, maskFn, onChange, value) {
  const inp = document.createElement('input');
  inp.className = className || 'input';
  inp.placeholder = placeholder || '';
  inp.value = value || '';
  inp.addEventListener('input', (e) => {
    const masked = maskFn(e.target.value);
    e.target.value = masked;
    if (onChange) onChange(masked);
  });
  return inp;
}

// ═══ SHARED CONSTANTS ═══
const FABRICANTES=['GSK','Pfizer','Sanofi','MSD','Butantan','Bio-Manguinhos','Ataulpho de Paiva','AstraZeneca','Johnson & Johnson','Moderna','Sinovac','Outro'];
const VACINAS_PADRAO=[
  'BCG','Hepatite B',
  'Hexaacelular (DTPa-VIP-Hib-HB) (Infanrix Hexa)',
  'Pentaacelular (DTPa-VIP-Hib) (Pentaxim)',
  'Rotavírus Pentavalente (RotaTeq)',
  'Pneumocócica 13-valente (Prevenar 13)',
  'Pneumocócica 15-valente (Vaxneuvance)',
  'Pneumocócica 20-valente (Prevenar 20)',
  'Meningocócica B (Bexsero)',
  'Meningocócica ACWY (Nimenrix) - GSK',
  'Meningocócica ACWY (MenQuadfi) - Sanofi',
  'Meningocócica ACWY (Menveo) - GSK',
  'Influenza Quadrivalente (Fluarix Tetra)',
  'Influenza Quadrivalente (FluQuadri)',
  'Febre Amarela (Stamaril)',
  'Tríplice Viral SCR (Priorix)',
  'Varicela (Varilrix)',
  'Hepatite A (Havrix)',
  'Hepatite A (Vaqta)',
  'HPV Quadrivalente (Gardasil 4)',
  'HPV 9-valente (Gardasil 9)',
  'DTPa - Tríplice Acelular (Infanrix)',
  'dTpa Adulto (Boostrix)',
  'dTpa Adulto (Adacel)',
  'Poliomielite VIP (Imovax Polio)',
  'Raiva (Verorab)',
  'Dengue (Qdenga)',
  'Herpes Zóster (Shingrix)',
  'COVID-19 (Comirnaty) - Pfizer',
  'COVID-19 (Spikevax) - Moderna',
];

// ═══ CAMERA CAPTURE FOR CRITICAL AUDIT ACTIONS ═══
// Shows camera feed in modal, captures photo, sends to backend
// Usage: const result = await capturaFotoAuditoria({acao:'descarte', ...});
async function capturaFotoAuditoria(auditData){
  return new Promise((resolve)=>{
    let stream=null;
    showModal('📸 Registro de Evidência',async(body,close)=>{
      body.appendChild(h('div',{style:{textAlign:'center',marginBottom:'12px',padding:'10px',background:'#fffbeb',borderRadius:'8px',border:'1px solid #fcd34d',fontSize:'13px',color:'#92400e'}},
        '⚠ Ação crítica — foto do operador será registrada como evidência'));

      // Video feed
      const video=h('video',{style:'width:100%;max-width:320px;border-radius:12px;background:#000;display:block;margin:0 auto',autoplay:true,playsinline:true});
      const canvas=h('canvas',{style:'display:none'});
      const statusEl=h('div',{style:{textAlign:'center',marginTop:'8px',fontSize:'12px',color:'var(--text-3)'}});
      body.appendChild(video);
      body.appendChild(canvas);
      body.appendChild(statusEl);

      // Request camera
      try{
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
        video.srcObject=stream;
        statusEl.innerHTML='<span style="color:#059669">✓ Câmera ativa — clique em Registrar</span>';
      }catch(err){
        statusEl.innerHTML=`<span style="color:#dc2626">❌ Câmera não disponível: ${err.message}</span><br><span style="font-size:11px">A ação será registrada sem foto.</span>`;
        // Log that camera was denied
        if(auditData){
          auditData.detalhes=JSON.stringify({...(auditData.detalhes?JSON.parse(auditData.detalhes):{}),camera:'negada',motivo:err.message});
        }
      }

      const acts=h('div',{style:{display:'flex',gap:'10px',marginTop:'16px'}});

      // Skip button (proceed without photo)
      acts.appendChild(iconBtn('btn btn-outline btn-lg',null,'Pular (sem foto)',async()=>{
        stopCam();
        // Log without photo
        if(auditData){
          const r=await Api.auditoriaLog({...auditData,detalhes:JSON.stringify({...(auditData.detalhes?JSON.parse(auditData.detalhes):{}),foto:'recusada'})});
          resolve({success:true,foto:null,audit_id:r?.id});
        }else resolve({success:true,foto:null});
        close();
      },{style:{flex:'1'}}));

      // Capture button
      acts.appendChild(iconBtn('btn btn-primary btn-lg',null,'📸 Registrar Evidência',async()=>{
        let fotoBlob=null;
        if(stream){
          canvas.width=video.videoWidth||640;
          canvas.height=video.videoHeight||480;
          canvas.getContext('2d').drawImage(video,0,0);
          fotoBlob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.8));
        }
        stopCam();
        statusEl.innerHTML='<span style="color:var(--primary)">Enviando...</span>';

        const r=await Api.auditoriaLogComFoto(auditData||{},fotoBlob);
        if(r?.success){
          statusEl.innerHTML='<span style="color:#059669">✅ Evidência registrada</span>';
          setTimeout(()=>{resolve({success:true,foto:r.foto,audit_id:r.id});close()},600);
        }else{
          statusEl.innerHTML=`<span style="color:#dc2626">Erro: ${r?.error||'falha no envio'}</span>`;
          resolve({success:false,foto:null});
          setTimeout(close,2000);
        }
      },{style:{flex:'2'}}));

      body.appendChild(acts);
    },'420px');

    function stopCam(){
      if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
    }
  });
}
