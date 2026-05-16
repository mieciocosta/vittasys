// ══════════════════════════════════════════════════════════════
// VITTASYS MOBILE — Hamburger, Segurança e Responsividade
// ══════════════════════════════════════════════════════════════
(function() {
  'use strict';

  const isMobile = () => window.innerWidth <= 768;

  // ── 1. Hamburger + Sidebar Drawer ───────────────────────────
  function initSidebar() {
    if (!isMobile()) return;

    const ham = document.createElement('button');
    ham.id = 'mobile-hamburger';
    ham.setAttribute('aria-label', 'Menu');
    ham.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(ham);

    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    document.body.appendChild(overlay);

    function openSidebar() {
      const sb = document.querySelector('.sidebar');
      if (sb) sb.classList.add('open');
      overlay.classList.add('show');
    }
    function closeSidebar() {
      const sb = document.querySelector('.sidebar');
      if (sb) sb.classList.remove('open');
      overlay.classList.remove('show');
    }

    ham.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Fechar ao navegar
    document.addEventListener('click', function(e) {
      const sb = document.querySelector('.sidebar');
      if (sb && sb.classList.contains('open')) {
        const item = e.target.closest('.sb-item, .sb-brand');
        if (item) closeSidebar();
      }
    });
  }

  // ── 2. Segurança — Bloquear Print + Screenshot attempt ──────
  function initSecurity() {
    if (!isMobile()) return;

    // Criar overlay de segurança
    const overlay = document.createElement('div');
    overlay.id = 'security-overlay';
    overlay.innerHTML = `
      <div class="sec-icon">🔒</div>
      <div class="sec-title">Conteúdo Protegido</div>
      <div class="sec-sub">Capturas de tela são bloqueadas neste sistema por segurança das informações.</div>
    `;
    document.body.appendChild(overlay);

    function showOverlay() { overlay.style.display = 'flex'; }
    function hideOverlay() { overlay.style.display = 'none'; }

    // Bloquear print
    window.addEventListener('beforeprint', function(e) {
      showOverlay();
      e.stopImmediatePropagation();
      setTimeout(hideOverlay, 3000);
    });

    // Detectar quando app perde foco (tentativa de screenshot ou troca de app)
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        showOverlay();
      } else {
        // Pequeno delay para cobrir o retorno da screenshot
        setTimeout(hideOverlay, 800);
      }
    });

    // Detectar blur da janela (iOS screenshot gesture)
    window.addEventListener('blur', function() {
      if (isMobile()) {
        showOverlay();
        setTimeout(hideOverlay, 1000);
      }
    });

    // CSS anti-screenshot (obscurece em background)
    const style = document.createElement('style');
    style.textContent = `
      @media print { body { display: none !important; } }
      @media (prefers-color-scheme: no-preference) {}
    `;
    document.head.appendChild(style);
  }

  // ── 3. Watermark com nome do usuário ────────────────────────
  function initWatermark() {
    if (!isMobile()) return;

    const wm = document.createElement('div');
    wm.id = 'watermark';
    const canvas = document.createElement('canvas');
    wm.appendChild(canvas);
    document.body.appendChild(wm);

    function drawWatermark() {
      const user = window.AppState?.usuario?.nome || 'VittaSys';
      const W = window.innerWidth, H = window.innerHeight;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      ctx.font = '14px Arial';
      ctx.fillStyle = '#1e40af';
      ctx.save();
      ctx.translate(W/2, H/2);
      ctx.rotate(-35 * Math.PI / 180);
      const text = `${user} • VittaSys`;
      const step = 180;
      for (let x = -W; x < W; x += step) {
        for (let y = -H; y < H; y += step) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
    }

    // Atualizar watermark quando usuário logar
    setInterval(() => {
      if (window.AppState?.usuario) drawWatermark();
    }, 3000);

    window.addEventListener('resize', drawWatermark);
    drawWatermark();
  }

  // ── 4. Agenda mobile — Navegação por dia fácil ─────────────
  // A agenda já tem navegação por dia; no mobile vamos garantir
  // que o botão "Hoje" fica sempre visível no topo


  // ── 6. Solicitar permissões de câmera e localização ──────────
  function requestPermissions() {
    if (!isMobile()) return;
    // Geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {}, // success
        () => {}  // denied — ok, não bloquear
      );
    }
    // Camera — só solicitar quando precisar (não forçar na abertura)
    // Mas registrar a disponibilidade
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      window._cameraAvailable = true;
    }
  }

  // ── 5. Inicialização ────────────────────────────────────────
  function init() {
    initSidebar();
    initSecurity();
    initWatermark();
    requestPermissions();
  }

  // Aguardar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500); // aguardar app renderizar
  }

  // Re-init ao redimensionar (tablet → mobile)
  let lastMobile = isMobile();
  window.addEventListener('resize', function() {
    const nowMobile = isMobile();
    if (nowMobile !== lastMobile) {
      lastMobile = nowMobile;
      if (nowMobile) init();
    }
  });

})();
