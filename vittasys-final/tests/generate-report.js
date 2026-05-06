#!/usr/bin/env node
/**
 * VittaSys QA Report Generator
 * Reads vitest JSON results OR generates from test execution metadata.
 * Always produces a valid HTML report at public/qa-report/index.html
 */
const fs=require('fs');const path=require('path');const{execSync}=require('child_process');

const outDir=path.join(__dirname,'..','public','qa-report');
if(!fs.existsSync(outDir))fs.mkdirSync(outDir,{recursive:true});

const now=new Date();
const timestamp=now.toISOString().replace('T',' ').slice(0,19)+' UTC';

// Try to read JSON results from vitest
let results=null;
const jsonPath=path.join(__dirname,'results.json');
try{
  if(fs.existsSync(jsonPath)){
    results=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
    console.log('📊 Found vitest JSON results');
  }
}catch(e){console.log('⚠ Could not parse results.json:',e.message)}

// If no JSON, try running tests directly to capture output
if(!results){
  console.log('📊 Running tests to generate report...');
  try{
    execSync('npx vitest run tests/unit --reporter=json --outputFile='+jsonPath,{cwd:path.join(__dirname,'..'),timeout:30000,stdio:'pipe'});
    if(fs.existsSync(jsonPath))results=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
  }catch(e){
    // Tests might have failed but still produced output
    try{if(fs.existsSync(jsonPath))results=JSON.parse(fs.readFileSync(jsonPath,'utf8'))}catch(e2){}
  }
}

// Build report data
let totalTests=0,passed=0,failed=0,duration='0',testRows='',suiteCount=0;

if(results){
  totalTests=results.numTotalTests||0;
  passed=results.numPassedTests||0;
  failed=results.numFailedTests||0;
  duration=((results.testResults||[]).reduce((s,t)=>s+(t.endTime-t.startTime),0)/1000).toFixed(2);
  suiteCount=(results.testResults||[]).length;
  
  for(const suite of(results.testResults||[])){
    const sName=suite.name.replace(/^.*tests\//,'tests/');
    for(const t of(suite.assertionResults||[])){
      const icon=t.status==='passed'?'✅':'❌';
      const cls=t.status==='passed'?'pass':'fail';
      const dur=t.duration!=null?`${t.duration}ms`:'—';
      const ancestor=t.ancestorTitles?.join(' › ')||'';
      const failHtml=t.failureMessages?.length?`<tr><td colspan="4"><pre>${t.failureMessages.join('\n').replace(/</g,'&lt;').slice(0,600)}</pre></td></tr>`:'';
      testRows+=`<tr><td>${icon}</td><td class="${cls}">${esc(ancestor)}</td><td>${esc(t.title)}</td><td style="text-align:right">${dur}</td></tr>${failHtml}`;
    }
  }
}else{
  // Fallback: just show timestamp and status
  testRows='<tr><td colspan="4" style="text-align:center;padding:20px;color:#64748b">Resultados detalhados não disponíveis. Execute <code>npm run test:report</code> localmente.</td></tr>';
}

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
const allPass=failed===0&&totalTests>0;
const statusBadge=totalTests===0?'⚠️ NO TESTS':allPass?'✅ ALL PASS':'❌ FAILURES';
const statusCls=totalTests===0?'badge-warn':allPass?'badge-green':'badge-red';

const html=`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VittaSys QA Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;padding:24px;line-height:1.5}
.container{max-width:960px;margin:0 auto}
.header{background:linear-gradient(135deg,#1B4965 0%,#2BBCB3 100%);color:white;padding:32px;border-radius:16px;margin-bottom:24px}
h1{font-size:24px;margin-bottom:4px}h2{font-size:18px;margin-bottom:12px;color:#1B4965}
.meta{opacity:.8;font-size:13px;margin-top:4px}
.badge{display:inline-block;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700;margin-top:12px}
.badge-green{background:#dcfce7;color:#059669}.badge-red{background:#fef2f2;color:#dc2626}.badge-warn{background:#fffbeb;color:#d97706}
.stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.stat{padding:20px;border-radius:12px;text-align:center;flex:1;min-width:120px;background:white;box-shadow:0 1px 3px #0001}
.stat-value{font-size:36px;font-weight:800}.stat-label{font-size:11px;text-transform:uppercase;font-weight:600;margin-top:4px;color:#64748b}
.stat-green .stat-value{color:#059669}.stat-red .stat-value{color:#dc2626}.stat-blue .stat-value{color:#0369a1}.stat-gray .stat-value{color:#64748b}
.card{background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px #0001}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 12px;border-bottom:2px solid #e2e8f0;font-size:11px;text-transform:uppercase;color:#64748b}
td{padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}
.pass{color:#059669;font-weight:600}.fail{color:#dc2626;font-weight:600}
pre{background:#fef2f2;padding:8px 12px;border-radius:6px;overflow-x:auto;font-size:11px;color:#dc2626;margin:4px 0;max-height:150px;overflow-y:auto}
footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:24px}
</style></head><body>
<div class="container">
<div class="header">
  <h1>🧪 VittaSys — QA Report</h1>
  <div class="meta">Gerado em: ${timestamp}</div>
  <div class="meta">Pipeline: Railway CI/CD · Vitest · Node ${process.version}</div>
  <div><span class="badge ${statusCls}">${statusBadge}</span></div>
</div>
<div class="stats">
  <div class="stat stat-blue"><div class="stat-value">${totalTests}</div><div class="stat-label">Total Testes</div></div>
  <div class="stat stat-green"><div class="stat-value">${passed}</div><div class="stat-label">Aprovados</div></div>
  <div class="stat ${failed>0?'stat-red':'stat-gray'}"><div class="stat-value">${failed}</div><div class="stat-label">Falhos</div></div>
  <div class="stat stat-gray"><div class="stat-value">${duration}s</div><div class="stat-label">Duração</div></div>
</div>
<div class="card">
  <h2>Resultados por Teste</h2>
  <table><thead><tr><th style="width:30px"></th><th>Suite</th><th>Teste</th><th style="text-align:right;width:80px">Tempo</th></tr></thead>
  <tbody>${testRows}</tbody></table>
</div>
<footer>
  VittaSys QA · ${suiteCount} suite(s) · ${timestamp} · Auto-gerado pelo CI/CD
</footer>
</div></body></html>`;

fs.writeFileSync(path.join(outDir,'index.html'),html);
console.log(`✅ QA Report: ${totalTests} tests (${passed}✓ ${failed}✗) → /qa-report/`);
