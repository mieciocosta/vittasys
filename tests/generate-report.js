/**
 * Generates a real QA report HTML from vitest JSON output.
 * Usage: npx vitest run tests/unit --reporter=json --outputFile=tests/results.json && node tests/generate-report.js
 */
const fs=require('fs');const path=require('path');
const outDir=path.join(__dirname,'..','public','qa-report');
if(!fs.existsSync(outDir))fs.mkdirSync(outDir,{recursive:true});

let results;
try{results=JSON.parse(fs.readFileSync(path.join(__dirname,'results.json'),'utf8'))}
catch(e){
  // If no JSON results, generate from build output
  const now=new Date().toISOString();
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>VittaSys QA</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;padding:24px}
.container{max-width:900px;margin:0 auto}.header{background:linear-gradient(135deg,#1B4965,#2BBCB3);color:white;padding:32px;border-radius:16px;margin-bottom:24px}
h1{font-size:24px;margin-bottom:8px}.meta{opacity:.8;font-size:13px}.card{background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px #0001}
.pass{color:#059669}.fail{color:#dc2626}.warn{color:#d97706}.stat{display:inline-block;padding:8px 16px;border-radius:8px;margin:4px;font-weight:700;font-size:14px}
.stat-green{background:#dcfce7;color:#059669}.stat-red{background:#fef2f2;color:#dc2626}.stat-blue{background:#e0f2fe;color:#0369a1}
</style></head><body><div class="container">
<div class="header"><h1>🧪 VittaSys — QA Report</h1><div class="meta">Gerado em: ${now}</div><div class="meta">Ambiente: CI/CD Pipeline</div></div>
<div class="card"><h2>⚠️ Relatório pendente</h2><p style="margin-top:8px">Execute <code>npm run test:report</code> para gerar o relatório completo com resultados reais.</p></div>
</div></body></html>`;
  fs.writeFileSync(path.join(outDir,'index.html'),html);
  console.log('QA Report placeholder generated');
  process.exit(0);
}

// Parse real results
const now=new Date().toISOString();
const suites=results.testResults||[];
const totalTests=results.numTotalTests||0;
const passed=results.numPassedTests||0;
const failed=results.numFailedTests||0;
const duration=((results.testResults||[]).reduce((s,t)=>s+(t.endTime-t.startTime),0)/1000).toFixed(2);
const allPass=failed===0;

let testRows='';
for(const suite of suites){
  const suiteName=suite.name.replace(/.*tests\//,'tests/');
  const suitePass=suite.status==='passed';
  for(const t of(suite.assertionResults||[])){
    const icon=t.status==='passed'?'✅':'❌';
    const cls=t.status==='passed'?'pass':'fail';
    const dur=t.duration?`${t.duration}ms`:'—';
    const failMsg=t.failureMessages?.length?`<pre style="margin-top:4px;font-size:11px;max-height:120px;overflow:auto">${t.failureMessages.join('\n').replace(/</g,'&lt;').slice(0,500)}</pre>`:'';
    testRows+=`<tr><td>${icon}</td><td class="${cls}">${t.ancestorTitles?.join(' › ')||''}</td><td>${t.title}</td><td style="text-align:right">${dur}</td></tr>${failMsg?`<tr><td colspan="4">${failMsg}</td></tr>`:''}`;
  }
}

const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>VittaSys QA Report</title>
<meta http-equiv="refresh" content="300">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;padding:24px}
.container{max-width:960px;margin:0 auto}.header{background:linear-gradient(135deg,#1B4965,#2BBCB3);color:white;padding:32px;border-radius:16px;margin-bottom:24px}
h1{font-size:24px;margin-bottom:4px}h2{font-size:18px;margin-bottom:12px;color:#1B4965}.meta{opacity:.8;font-size:13px;margin-top:4px}
.card{background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px #0001}
.stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.stat{padding:16px 24px;border-radius:12px;text-align:center;flex:1;min-width:120px}
.stat-value{font-size:32px;font-weight:800}.stat-label{font-size:11px;text-transform:uppercase;font-weight:600;margin-top:4px;opacity:.7}
.stat-green{background:#dcfce7;color:#059669}.stat-red{background:#fef2f2;color:#dc2626}.stat-blue{background:#e0f2fe;color:#0369a1}.stat-gray{background:#f1f5f9;color:#64748b}
table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:8px 12px;border-bottom:2px solid #e2e8f0;font-size:11px;text-transform:uppercase;color:#64748b}
td{padding:6px 12px;border-bottom:1px solid #f1f5f9}.pass{color:#059669;font-weight:600}.fail{color:#dc2626;font-weight:600}
pre{background:#f1f5f9;padding:8px;border-radius:6px;overflow:auto;font-size:11px;color:#dc2626}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
.badge-green{background:#dcfce7;color:#059669}.badge-red{background:#fef2f2;color:#dc2626}
</style></head><body><div class="container">
<div class="header">
  <h1>🧪 VittaSys — QA Report</h1>
  <div class="meta">Gerado em: ${now}</div>
  <div class="meta">Pipeline: Railway CI/CD · Vitest ${results.config?.version||'3.x'}</div>
  <div style="margin-top:12px"><span class="badge ${allPass?'badge-green':'badge-red'}">${allPass?'✅ ALL PASS':'❌ FAILURES DETECTED'}</span></div>
</div>
<div class="stats">
  <div class="stat stat-blue"><div class="stat-value">${totalTests}</div><div class="stat-label">Total Testes</div></div>
  <div class="stat stat-green"><div class="stat-value">${passed}</div><div class="stat-label">Aprovados</div></div>
  <div class="stat ${failed>0?'stat-red':'stat-gray'}"><div class="stat-value">${failed}</div><div class="stat-label">Falhos</div></div>
  <div class="stat stat-gray"><div class="stat-value">${duration}s</div><div class="stat-label">Duração</div></div>
</div>
<div class="card"><h2>Resultados por Teste</h2>
<table><thead><tr><th></th><th>Suite</th><th>Teste</th><th style="text-align:right">Tempo</th></tr></thead>
<tbody>${testRows}</tbody></table></div>
<div class="card" style="font-size:12px;color:#64748b">
<strong>Arquivos:</strong> ${suites.length} suites · <strong>Ambiente:</strong> Node ${process.version} · <strong>Auto-refresh:</strong> 5min
</div></div></body></html>`;

fs.writeFileSync(path.join(outDir,'index.html'),html);
console.log(`✅ QA Report: ${totalTests} tests (${passed} pass, ${failed} fail) → public/qa-report/index.html`);
