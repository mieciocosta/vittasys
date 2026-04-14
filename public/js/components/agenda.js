async function exportPDF() {
  const p = { data: fI(sel) };
  if (regF) p.regiao_id = regF;

  const items = await Api.agendaList(p) || [];

  if (!items.length) {
    Toast.show('Sem dados', 'warning');
    return;
  }

  const rg = {};
  items.forEach(i => {
    const k = i.regiao_nome || 'Sem região';
    if (!rg[k]) rg[k] = { cor: i.regiao_cor || '#94a3b8', items: [] };
    rg[k].items.push(i);
  });

  Object.values(rg).forEach(g => {
    const merged = [];
    const seen = {};

    g.items.forEach(it => {
      const key = it.cliente_id + '-' + it.horario;

      if (seen[key]) {
        seen[key].vacinas.push(
          (it.vacina || '') + (it.dose_numero ? ' D' + it.dose_numero : '')
        );
      } else {
        seen[key] = {
          ...it,
          vacinas: [
            (it.vacina || '') + (it.dose_numero ? ' D' + it.dose_numero : '')
          ]
        };
        merged.push(seen[key]);
      }
    });

    g.merged = merged;
  });

  const logoUrl = `${window.location.origin}/assets/logos/logo-vertical-color.png`;
  const dtStr = `${fB(sel)}`;
  const diaSem = DF[sel.getDay()].toLowerCase();
  const totalItems = items.length;

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Agenda ${dtStr}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI', Tahoma, Arial, sans-serif; color:#1B4965; font-size:10px; }
    .header { text-align:center; padding:15px 20px 12px; border-bottom:4px solid #2BBCB3; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#1B4965,#2BBCB3,#1B4965); }
    .header .title { font-size:16px; font-weight:800; color:#1B4965; letter-spacing:2px; text-transform:uppercase; margin-top:4px; }
    .header .date { font-size:13px; font-weight:700; color:#2BBCB3; margin-top:3px; }
    .header .meta { font-size:10px; color:#64748b; margin-top:2px; }
    .body { padding:8px 15px; }
    .region-bar { padding:6px 12px; margin:10px 0 4px; font-size:11px; font-weight:800; color:white; border-radius:4px; display:flex; justify-content:space-between; align-items:center; }
    table { width:100%; border-collapse:collapse; }
    th { background:#1B4965; color:white; padding:6px 5px; font-size:8px; text-align:center; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
    th:first-child { border-radius:4px 0 0 0; }
    th:last-child { border-radius:0 4px 0 0; }
    td { padding:5px; border-bottom:1px solid #d1d5db; font-size:9px; vertical-align:top; }
    tr:nth-child(even) { background:#f8fffe; }
    tr:hover { background:#e6f7f5; }
    .time { font-size:13px; font-weight:800; color:#1B4965; text-align:center; white-space:nowrap; }
    .client { text-align:left; }
    .client strong { font-size:10px; display:block; }
    .client .resp { font-size:8px; color:#64748b; font-style:italic; }
    .vaccines { text-align:left; font-weight:600; }
    .vaccines span { display:inline-block; background:#e6f7f5; color:#1B4965; padding:1px 6px; border-radius:3px; margin:1px; font-size:8px; }
    .addr { text-align:left; font-size:8px; color:#374151; max-width:140px; }
    .map-link { display:block; color:#2BBCB3; font-size:7px; text-decoration:none; margin-top:2px; }
    .map-link:hover { text-decoration:underline; }
    .phone { text-align:center; font-family:monospace; font-size:9px; }
    .status { text-align:center; font-size:8px; font-weight:700; }
    .status-ok { color:#059669; }
    .status-done { color:#059669; background:#d1fae5; }
    .status-missed { color:#dc2626; background:#fee2e2; }
    .footer { margin-top:12px; padding:8px 15px; border-top:3px solid #2BBCB3; display:flex; justify-content:space-between; align-items:center; font-size:8px; color:#94a3b8; }
    .footer .brand { color:#1B4965; font-weight:700; font-size:9px; }

    @media print {
      @page { margin:8mm; size:landscape; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="text-align:center;margin-bottom:6px;">
      <img
        src="${logoUrl}"
        style="height:55px;object-fit:contain;display:block;margin:0 auto;"
        onerror="this.outerHTML='<div style=&quot;font-size:22px;font-weight:800;color:#1B4965&quot;>💎 Vittalis Saúde</div>'"
      >
    </div>
    <div class="title">Agendamento Vacinal</div>
    <div class="date">(${dtStr}) ${diaSem}</div>
    <div class="meta">${totalItems} atendimento(s) programado(s)</div>
  </div>
  <div class="body">`;

  Object.entries(rg).forEach(([rn, g]) => {
    html += `
      <div class="region-bar" style="background:${g.cor}">
        📍 ${rn}
        <span style="font-size:9px;font-weight:400">${g.merged.length} paciente(s)</span>
      </div>

      <table>
        <tr>
          <th style="width:55px">Horário</th>
          <th>Cliente</th>
          <th style="width:60px">Código</th>
          <th>Vacinas</th>
          <th style="width:130px">Endereço</th>
          <th style="width:40px">Mapa</th>
          <th style="width:85px">Celular</th>
          <th style="width:70px">Controle</th>
        </tr>
    `;

    g.merged.forEach(it => {
      const addr = [it.endereco, it.bairro].filter(Boolean).join(', ') || '-';
      const mapUrl = addr
        ? `https://www.google.com/maps/search/${encodeURIComponent(addr + ', São Luís MA')}`
        : '';

      const stCls =
        it.status === 'realizado'
          ? 'status-done'
          : it.status === 'faltou'
            ? 'status-missed'
            : '';

      const stTxt =
        it.status === 'realizado'
          ? '✅ REALIZADO'
          : it.status === 'confirmado'
            ? '✓ CONFIRMADO'
            : it.status === 'faltou'
              ? '✗ REMARCOU'
              : '<span class="status-ok">STATUS DO<br>CONTRATO:<br>✓ OK</span>';

      const vacsHtml = it.vacinas.map(v => `<span>${v}</span>`).join(' ');

      html += `
        <tr class="${stCls}">
          <td class="time">${it.horario || '--:--'}</td>
          <td class="client">
            <strong>${it.paciente || '-'}</strong>
            ${it.responsavel ? `<div class="resp">(${it.responsavel})</div>` : ''}
          </td>
          <td style="text-align:center;font-family:monospace;font-size:8px">${it.codigo_cliente || '-'}</td>
          <td class="vaccines">${vacsHtml}</td>
          <td class="addr">${addr}</td>
          <td style="text-align:center">
            ${mapUrl ? `<a href="${mapUrl}" target="_blank" class="map-link">📍 ver<br>mapa</a>` : '-'}
          </td>
          <td class="phone">${it.celular || '-'}</td>
          <td class="status">${stTxt}</td>
        </tr>
      `;
    });

    html += `</table>`;
  });

  html += `
  </div>
  <div class="footer">
    <span class="brand">VittaSys — Vittalis Saúde</span>
    <span>São Luís / MA</span>
    <span>Gerado: ${new Date().toLocaleString('pt-BR')}</span>
  </div>
</body>
</html>`;

  const pw = window.open('', '_blank');
  pw.document.write(html);
  pw.document.close();
  setTimeout(() => pw.print(), 600);
}