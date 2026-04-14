async function renderLogin() {
  let selId = null;
  let pin = '';
  const usuarios = await Api.usuarios() || [];
  const wrap = h('div', { className: 'login-screen' });

  function draw() {
    wrap.innerHTML = '';

    const card = h('div', { className: 'login-card' });

    const logo = h('div', {
      className: 'login-logo',
      style: {
        textAlign: 'center',
        marginBottom: '12px'
      }
    });

    const img = h('img', {
      src: '/assets/logos/logo-vertical-color.png',
      alt: 'Vittalis Saúde',
      style: {
        height: '110px',
        objectFit: 'contain',
        display: 'block',
        margin: '0 auto'
      }
    });

    img.onerror = function () {
      this.remove();
      logo.appendChild(
        h(
          'div',
          {
            style: {
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--navy)',
              textAlign: 'center'
            }
          },
          '💎 VittaSys'
        )
      );
    };

    logo.appendChild(img);
    card.appendChild(logo);

    card.appendChild(
      h('div', { className: 'login-sub' }, 'Sistema de Gestão de Vacinação')
    );

    const grid = h('div', { className: 'user-grid' });

    const pLabels = {
      master: '👑 Master',
      ativos: '⭐ Ativos',
      espontaneos: '📋 Espontâneos',
      operador: '🔧 Operador'
    };

    const pColors = {
      master: '#059669',
      ativos: '#2BBCB3',
      espontaneos: '#1B4965',
      operador: '#64748b'
    };

    usuarios.forEach((u) => {
      const btn = h('button', {
        className: `user-card ${selId === u.id ? 'sel' : ''}`,
        onClick: () => {
          selId = u.id;
          draw();
        }
      });

      const perfilTag = pLabels[u.perfil] || '🔧 Operador';

      btn.innerHTML = `
        <div class="u-name">${esc((u.nome || '').split(' ').slice(0, 2).join(' '))}</div>
        <div class="u-role">${esc(u.cargo || '')}</div>
        <div style="margin-top:4px;font-size:10px;font-weight:700;color:${pColors[u.perfil] || '#64748b'}">
          ${perfilTag}
        </div>
      `;

      grid.appendChild(btn);
    });

    card.appendChild(grid);

    const ps = h('div', {
      style: { marginBottom: '8px' }
    });

    ps.innerHTML = '<label class="label">PIN de Acesso</label>';

    const pi = h('input', {
      className: 'pin-input',
      type: 'password',
      maxLength: '4',
      placeholder: '• • • •'
    });

    pi.addEventListener('input', (e) => {
      pin = e.target.value.replace(/\D/g, '');
      e.target.value = pin;
    });

    pi.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });

    ps.appendChild(pi);

    ps.appendChild(
      h(
        'div',
        {
          style: {
            fontSize: '10px',
            color: '#94a3b8',
            marginTop: '6px',
            textAlign: 'center'
          }
        },
        'Masters: 2305 | Demais: 1234'
      )
    );

    card.appendChild(ps);

    card.appendChild(
      h(
        'button',
        {
          className: 'login-btn',
          onClick: doLogin
        },
        'Entrar no VittaSys'
      )
    );

    wrap.appendChild(card);

    setTimeout(() => pi.focus(), 60);
  }

  async function doLogin() {
    if (!selId) {
      return Toast.show('Selecione um operador', 'error');
    }

    const r = await Api.login(selId, pin);

    if (r?.success) {
      AppState.login(r.usuario);
    } else {
      Toast.show('PIN incorreto', 'error');
      pin = '';
      draw();
    }
  }

  draw();
  return wrap;
}