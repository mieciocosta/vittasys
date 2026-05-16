// ═══════════════════════════════════════════════════════════════
// VITTASYS MOBILE — Responsivo, Segurança, Câmera, Localização
// ═══════════════════════════════════════════════════════════════
(function(){
  'use strict';

  function isMob(){ return window.innerWidth <= 768; }

  // ── 1. Hamburger + Sidebar Drawer ─────────────────────────────
  function initSidebar(){
    if(!isMob()) return;
    if(document.getElementById('mob-ham')) return; // já existe

    const ham = document.createElement('button');
    ham.id = 'mob-ham'; ham.setAttribute('aria-label','Menu');
    ham.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(ham);

    const ov = document.createElement('div');
    ov.id = 'mob-ov'; document.body.appendChild(ov);

    function open(){
      const sb = document.querySelector('.sidebar');
      if(sb){ sb.classList.add('aberta'); ov.classList.add('on'); }
    }
    function close(){
      const sb = document.querySelector('.sidebar');
      if(sb){ sb.classList.remove('aberta'); ov.classList.remove('on'); }
    }

    ham.addEventListener('click', open);
    ov.addEventListener('click', close);

    // Fechar ao clicar num item do menu
    document.addEventListener('click', function(e){
      if(document.querySelector('.sidebar.aberta') && e.target.closest('.sb-item, .sb-brand')){
        setTimeout(close, 120);
      }
    });
  }

  // ── 2. Segurança — Overlay ao sair do app ─────────────────────
  function initSecurity(){
    if(!isMob()) return;
    if(document.getElementById('sec-ov')) return;

    const ov = document.createElement('div');
    ov.id = 'sec-ov';
    ov.innerHTML = '<div class="ic">🔒</div><div class="tt">Conteúdo Protegido</div><div class="sb">Capturas de tela são bloqueadas por segurança.</div>';
    document.body.appendChild(ov);

    const show = () => ov.classList.add('on');
    const hide = () => setTimeout(()=>ov.classList.remove('on'), 700);

    document.addEventListener('visibilitychange', () => document.hidden ? show() : hide());
    window.addEventListener('blur', () => { if(isMob()) show(); });
    window.addEventListener('focus', hide);
    window.addEventListener('beforeprint', show);
  }

  // ── 3. Watermark com nome do usuário ──────────────────────────
  function initWatermark(){
    if(!isMob()) return;
    if(document.getElementById('wm')) return;

    const wm = document.createElement('div'); wm.id = 'wm';
    const canvas = document.createElement('canvas');
    wm.appendChild(canvas); document.body.appendChild(wm);

    function draw(){
      const user = window.AppState?.usuario?.nome || 'VittaSys';
      const W = window.innerWidth, H = window.innerHeight;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,W,H);
      ctx.font = '13px Arial';
      ctx.fillStyle = '#1e40af';
      ctx.save();
      ctx.translate(W/2, H/2);
      ctx.rotate(-30 * Math.PI / 180);
      const t = `${user} • VittaSys`;
      for(let x=-W; x<W; x+=180) for(let y=-H; y<H; y+=120) ctx.fillText(t,x,y);
      ctx.restore();
    }

    setInterval(()=>{ if(window.AppState?.usuario) draw(); }, 4000);
    window.addEventListener('resize', draw);
    draw();
  }

  // ── 4. Câmera e Geolocalização ────────────────────────────────
  function initPermissions(){
    // Geolocation — solicitar suavemente
    if('geolocation' in navigator){
      navigator.geolocation.getCurrentPosition(()=>{}, ()=>{}, {timeout:5000});
    }
    // Camera API — disponível para uso quando necessário
    window._cameraAvailable = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // ── 5. Inicialização ──────────────────────────────────────────
  function init(){
    initSidebar();
    initSecurity();
    initWatermark();
    initPermissions();
  }

  // Aguardar app renderizar
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>setTimeout(init, 600));
  } else {
    setTimeout(init, 600);
  }

  // Re-init se virar mobile
  let wasM = isMob();
  window.addEventListener('resize', ()=>{
    const m = isMob();
    if(m && !wasM){ init(); }
    wasM = m;
  });

})();
