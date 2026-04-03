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
