const express = require('express');
const r = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = multer({ dest: path.join(__dirname, '..', '..', 'uploads'), limits: { fileSize: 15 * 1024 * 1024 } });

// ═══════════════════════════════════════════════════════════════
// CPF VALIDATION
// ═══════════════════════════════════════════════════════════════
function validCPF(raw) {
  const c = raw.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s = 0; for (let i = 0; i < 9; i++) s += (10 - i) * +c[i];
  let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +c[9]) return false;
  s = 0; for (let i = 0; i < 10; i++) s += (11 - i) * +c[i];
  d = (s * 10) % 11; if (d === 10) d = 0; return d === +c[10];
}
function fmtCPF(d) { return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`; }
function cap(s) { return s.replace(/\b[a-zà-ü]/g, c => c.toUpperCase()).replace(/\b(Da|De|Do|Dos|Das|E|Em|No|Na)\b/g, w => w.toLowerCase()); }

// ═══════════════════════════════════════════════════════════════
// 1. WHATSAPP .TXT PARSER (SOLUÇÃO PRINCIPAL)
// ═══════════════════════════════════════════════════════════════
function parseWhatsAppTxt(raw) {
  // Remove BOM
  let text = raw.replace(/^\uFEFF/, '');

  // Detect WhatsApp format patterns
  // Format 1: [DD/MM/YYYY, HH:MM:SS] Name: msg
  // Format 2: DD/MM/YYYY HH:MM - Name: msg  
  // Format 3: DD/MM/YY HH:MM - Name: msg
  const tsPatterns = [
    /^\[?\d{2}\/\d{2}\/\d{2,4}[,\s]+\d{2}:\d{2}(?::\d{2})?\]?\s*[-–]\s*/,
    /^\d{2}\/\d{2}\/\d{2,4}\s+\d{2}:\d{2}\s*[-–]\s*/,
  ];

  const lines = text.split('\n');
  const messages = [];
  let isWhatsApp = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Try to strip timestamp
    let stripped = line;
    let senderFound = false;
    for (const pat of tsPatterns) {
      if (pat.test(line)) {
        isWhatsApp = true;
        stripped = line.replace(pat, '');
        // Now try to extract sender: "Name: message"
        const senderMatch = stripped.match(/^([^:]{2,30}):\s*(.*)/);
        if (senderMatch) {
          const sender = senderMatch[1].trim();
          const msg = senderMatch[2].trim();
          // Skip system messages
          if (/mensagen.*criptograf|as mensagens|foram exclu[ií]|mudou.*assunto|adicionou|removeu|saiu|entrou/i.test(msg)) continue;
          // Skip media omitted
          if (/media omitted|<mídia|<media|imagem ocult|figurinha omit|áudio omit|vídeo omit|documento omit/i.test(msg)) continue;
          // Skip empty/noise
          if (msg.length < 2 || /^[.\-·•!?]+$/.test(msg)) continue;
          messages.push({ sender, msg });
          senderFound = true;
        }
        break;
      }
    }

    if (!senderFound && !isWhatsApp) {
      // Not WhatsApp format - treat as plain text
      if (line.length > 1 && !/^[-=_*]+$/.test(line)) {
        messages.push({ sender: '_plain_', msg: line });
      }
    } else if (!senderFound && isWhatsApp && messages.length > 0) {
      // Continuation of previous message
      if (line.length > 1 && !/mensagen.*criptograf/i.test(line)) {
        messages[messages.length - 1].msg += ' ' + line;
      }
    }
  }

  // Combine all message content (stripping sender names from the content pool)
  const combinedText = messages.map(m => m.msg).join('\n');
  const senders = [...new Set(messages.filter(m => m.sender !== '_plain_').map(m => m.sender))];

  return { isWhatsApp, messages, senders, combinedText };
}

// ═══════════════════════════════════════════════════════════════
// 2. PÓS-PROCESSAMENTO INTELIGENTE
// ═══════════════════════════════════════════════════════════════
function extrairDadosEstruturados(texto, isWhatsApp) {
  const resultado = {
    cliente_nome: '',
    paciente_nome: '',
    responsavel_nome: '',
    cpf: '',
    telefone: '',
    endereco: '',
    cep: '',
    cidade: '',
    uf: '',
    data_nascimento: '',
    parentesco: '',
    email: '',
    tipo_paciente: '',
    paciente_e_o_proprio_cliente: false,
    confianca: 0,
    sugestoes: [],
    texto_bruto: texto.slice(0, 2000),
  };

  const t = texto;
  const lines = t.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // ══════ STEP 1: Collect all digit sequences with context ══════
  const digitBlocks = [];
  const dRx = /(\d[\d\s.()\-\/]{3,20}\d)/g;
  let dm;
  while ((dm = dRx.exec(t)) !== null) {
    const digits = dm[1].replace(/\D/g, '');
    if (digits.length >= 8) {
      const ctxStart = Math.max(0, dm.index - 50);
      const ctxEnd = Math.min(t.length, dm.index + dm[1].length + 50);
      const ctx = t.slice(ctxStart, ctxEnd).toLowerCase();
      // Check what's on the SAME LINE
      const lineStart = t.lastIndexOf('\n', dm.index) + 1;
      const lineEnd = t.indexOf('\n', dm.index + dm[1].length);
      const sameLine = t.slice(lineStart, lineEnd === -1 ? t.length : lineEnd).toLowerCase();
      digitBlocks.push({ raw: dm[1], digits, pos: dm.index, ctx, sameLine, used: null });
    }
  }

  // ══════ STEP 2: TELEFONE (11 digits, DDD 11-99, 3rd digit = 9) ══════
  for (const db of digitBlocks) {
    if (resultado.telefone) break;
    const d = db.digits;
    // Mobile: 11 digits, DDD valid, starts with 9 after DDD
    if (d.length === 11 && +d.slice(0, 2) >= 11 && +d.slice(0, 2) <= 99 && d[2] === '9') {
      resultado.telefone = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
      db.used = 'tel';
    }
    // Landline: 10 digits, context suggests phone
    else if (d.length === 10 && +d.slice(0, 2) >= 11 && /tel|fone|cel|whats|zap|liga|contato/.test(db.ctx)) {
      resultado.telefone = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      db.used = 'tel';
    }
  }

  // ══════ STEP 3: CPF (11 digits, valid checksum, not phone) ══════
  // First try formatted: 000.000.000-00
  const cpfFmt = t.match(/\d{3}[.\s]\d{3}[.\s]\d{3}[-.\s]\d{2}/);
  if (cpfFmt) {
    const d = cpfFmt[0].replace(/\D/g, '');
    if (validCPF(d)) { resultado.cpf = fmtCPF(d); }
  }
  // Then try unformatted digit blocks
  if (!resultado.cpf) {
    for (const db of digitBlocks) {
      if (db.used) continue;
      if (db.digits.length === 11 && validCPF(db.digits)) {
        resultado.cpf = fmtCPF(db.digits);
        db.used = 'cpf'; break;
      }
    }
  }

  // ══════ STEP 4: CEP (8 digits, near address context) ══════
  for (const db of digitBlocks) {
    if (db.used) continue;
    const d = db.digits;
    if (d.length === 8 && +d.slice(0, 2) >= 10 && +d.slice(0, 2) <= 99) {
      // CEP is 8 digits. Check if same line has city/state/address words
      const hasAddrCtx = /end|rua|bairro|cidade|cep|av|logr|munic|estado|sao|são|jose|josé|luis|luís|ma\b|sp\b|rj\b|mg\b|ba\b|ce\b|go\b|pr\b|rs\b|sc\b|pe\b|pa\b|am\b|pi\b|se\b|al\b|es\b|pb\b|rn\b|mt\b|ms\b|to\b|df\b|ro\b|ac\b|ap\b|rr\b/i.test(db.sameLine);
      // Or if it's NOT a phone (already used) and line also has non-digit text
      if (hasAddrCtx || (db.sameLine.replace(/\d/g, '').trim().length > 3 && !db.sameLine.match(/tel|fone|cel/))) {
        resultado.cep = `${d.slice(0, 5)}-${d.slice(5)}`;
        db.used = 'cep';
        // Try to extract city/UF from same line
        const afterCep = db.sameLine.replace(db.raw.toLowerCase(), '').trim();
        if (afterCep.length > 2) {
          // Try to find UF (2 letter state code)
          const ufMatch = afterCep.match(/\b(ma|sp|rj|mg|ba|ce|go|pr|rs|sc|pe|pa|am|pi|se|al|es|pb|rn|mt|ms|to|df|ro|ac|ap|rr)\b/i);
          if (ufMatch) {
            resultado.uf = ufMatch[1].toUpperCase();
            const cidadePart = afterCep.replace(ufMatch[0], '').replace(/[-,.\s]+$/, '').trim();
            if (cidadePart.length > 2) resultado.cidade = cap(cidadePart);
          } else {
            resultado.cidade = cap(afterCep.replace(/[-,.\s]+$/, '').trim());
          }
        }
        break;
      }
    }
  }

  // ══════ STEP 5: NOME ══════
  const nomePatterns = [
    // "meu nome é X" (case insensitive, handles lowercase names)
    /(?:meu\s+nome\s+[eé]\s+)([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+){1,5})/i,
    // "me chamo X" / "sou X" / "eu sou o/a X"
    /(?:me\s+chamo\s+|eu\s+sou\s+(?:o\s+|a\s+)?)([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+){1,5})/i,
    // "nome: X" / "nome completo: X"
    /(?:nome\s*(?:completo)?\s*[:\-–]\s*)([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+){1,5})/i,
    // "cliente: X" / "paciente: X"
    /(?:cliente|paciente)\s*[:\-–]\s*([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+){1,5})/i,
  ];
  for (const p of nomePatterns) {
    const m = t.match(p);
    if (m && m[1]) {
      let n = m[1].trim();
      // Remove trailing junk (address words, numbers)
      n = n.replace(/\s+(end|rua|av|cpf|tel|fone|cel|email|nasc|obs|cep|meu|65\d|98\d).*$/i, '').trim();
      if (n.length > 3 && n.length < 55 && n.split(/\s+/).length >= 2) {
        resultado.cliente_nome = cap(n);
        break;
      }
    }
  }

  // Fallback: first line with 2+ words, all letters, not a known keyword
  if (!resultado.cliente_nome) {
    const skipWords = /whatsapp|chat|grupo|mensag|conversa|export|media|omit|criptograf|figurinha|áudio|vídeo|documento|imagem|rua|end|bairro|cep|tel|cpf|email|data|nasc|sao|são|jose|josé|plano|vacina|dose/i;
    for (const line of lines) {
      const cl = line.replace(/[\[\]\(\)\d:\/\-.;!?,*_~]/g, '').trim();
      if (/^[a-zA-ZÀ-ü]+(\s+[a-zA-ZÀ-ü]+){1,5}$/.test(cl) && cl.length > 4 && cl.length < 50 && !skipWords.test(cl)) {
        resultado.cliente_nome = cap(cl);
        break;
      }
    }
  }

  // ══════ STEP 6: ENDEREÇO ══════
  const endPatterns = [
    /(?:end(?:ereço)?|rua|av(?:enida)?|alameda|travessa|estrada)\s*[:\-–,]?\s*([^\n]{5,80})/i,
  ];
  for (const p of endPatterns) {
    const m = t.match(p);
    if (m && m[1]) {
      let addr = m[1].trim();
      // Clean: remove CEP/city that we already extracted
      if (resultado.cep) addr = addr.replace(resultado.cep.replace('-', ''), '').trim();
      addr = addr.replace(/\s{2,}/g, ' ').replace(/[,.\s]+$/, '');
      if (addr.length > 3) resultado.endereco = addr;
      break;
    }
  }

  // ══════ STEP 7: E-MAIL ══════
  const emMatch = t.match(/[\w.+-]+@[\w.-]+\.\w{2,}/i);
  if (emMatch) resultado.email = emMatch[0];

  // ══════ STEP 8: DATA DE NASCIMENTO ══════
  const dnPatterns = [
    /(?:nasc(?:imento|eu|ido)?|dn|data\s*(?:de\s*)?nasc)\s*[:\-–]?\s*(\d{2}[\/.\-]\d{2}[\/.\-]\d{4})/i,
    /(?:nascid[oa]\s+(?:em|dia|no)\s+|nasceu\s+em?\s*)(\d{2}[\/.\-]\d{2}[\/.\-]\d{4})/i,
  ];
  for (const p of dnPatterns) {
    const m = t.match(p);
    if (m) {
      const pts = m[1].split(/[\/.\-]/);
      if (pts.length === 3 && +pts[0] <= 31 && +pts[1] <= 12) {
        resultado.data_nascimento = `${pts[2]}-${pts[1].padStart(2, '0')}-${pts[0].padStart(2, '0')}`;
        break;
      }
    }
  }

  // ══════ STEP 9: RESPONSÁVEL / PARENTESCO ══════
  const respPatterns = [
    [/(?:mãe|mae|mamãe|mamae)\s*[:\-–]?\s*([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+)+)/i, 'Mãe'],
    [/(?:pai|papai)\s*[:\-–]?\s*([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+)+)/i, 'Pai'],
    [/(?:avó|avo|avô)\s*[:\-–]?\s*([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+)+)/i, 'Avó/Avô'],
    [/(?:responsável|responsavel|resp)\s*[:\-–]?\s*([a-zA-ZÀ-ü]+(?:\s+[a-zA-ZÀ-ü]+)+)/i, 'Responsável'],
  ];
  for (const [p, par] of respPatterns) {
    const m = t.match(p);
    if (m && m[1] && m[1].trim().length > 3) {
      resultado.responsavel_nome = cap(m[1].trim().slice(0, 50));
      resultado.parentesco = par;
      break;
    }
  }

  // ══════ STEP 10: TIPO PACIENTE + PACIENTE É O PRÓPRIO ══════
  const hasBaby = /beb[eê]|rec[eé]m.?nascid|\brn\b|neonatal/i.test(t);
  const hasChild = /crian[cç]a|infant|pedi[aá]tr|filh[oa]\b|menor/i.test(t);
  const hasSelf = /(?:sou\s+eu|para\s+mim|eu\s+(?:que|mesm)|é\s+para\s+mim|próprio|proprio|pra\s+mim)/i.test(t);

  if (hasBaby) {
    resultado.tipo_paciente = 'bebe';
    resultado.sugestoes.push('Detectado: bebê/recém-nascido');
    // If we have a client name and mentions baby, client is likely the responsible
    if (resultado.cliente_nome && !resultado.responsavel_nome) {
      resultado.responsavel_nome = resultado.cliente_nome;
      resultado.sugestoes.push('Nome encontrado assumido como responsável (mãe/pai do bebê)');
    }
  } else if (hasChild) {
    resultado.tipo_paciente = 'crianca';
    resultado.sugestoes.push('Detectado: criança');
  } else {
    // No baby/child mentioned — patient is likely the client themselves
    resultado.paciente_e_o_proprio_cliente = true;
    resultado.tipo_paciente = 'adulto';
    if (!hasSelf) resultado.sugestoes.push('Sem menção a bebê/criança — assumido: paciente é o próprio cliente');
    else resultado.sugestoes.push('Confirmado: paciente é o próprio cliente');
  }

  // ══════ STEP 11: VALORES / PLANOS ══════
  const vals = t.match(/R\$\s*[\d.,]+/g);
  if (vals) resultado.sugestoes.push(`Valores: ${vals.join(', ')}`);
  const planMatch = t.match(/plano\s+[\w\s]+(?:meses?|m\b)/gi);
  if (planMatch) resultado.sugestoes.push(`Planos: ${planMatch.join(', ')}`);

  // Multiple patients?
  const filhosMatch = t.match(/filh[oa]s/gi);
  if (filhosMatch) resultado.sugestoes.push('⚠ Possível mais de um paciente mencionado');

  // ══════ STEP 12: CONFIANÇA (0-100) ══════
  const fieldsFilled = [
    resultado.cliente_nome, resultado.cpf, resultado.telefone,
    resultado.endereco, resultado.cep, resultado.cidade,
    resultado.data_nascimento, resultado.email,
    resultado.responsavel_nome,
  ].filter(v => v && v.length > 0).length;

  resultado.confianca = Math.min(100, Math.round(fieldsFilled * 15));
  if (resultado.cliente_nome && resultado.telefone) resultado.confianca = Math.max(resultado.confianca, 50);
  if (resultado.cliente_nome && resultado.cpf) resultado.confianca = Math.max(resultado.confianca, 60);

  return resultado;
}

// ═══════════════════════════════════════════════════════════════
// 3. OCR COM PRÉ-PROCESSAMENTO (sharp + Tesseract.js)
// ═══════════════════════════════════════════════════════════════
async function ocrComPreProcessamento(filePath) {
  let processedPath = filePath;

  // Pre-process image with sharp
  try {
    const sharp = require('sharp');
    const tmpPath = filePath + '_processed.png';

    await sharp(filePath)
      .resize({ width: 2400, withoutEnlargement: false })  // Upscale small images
      .grayscale()                                           // Remove color noise
      .normalize()                                           // Maximize contrast
      .sharpen({ sigma: 1.5 })                              // Sharpen text edges
      .threshold(140)                                        // Binarize for OCR
      .png()
      .toFile(tmpPath);

    processedPath = tmpPath;
    console.log('  Sharp: imagem pré-processada');
  } catch (e) {
    console.log('  Sharp não disponível, usando imagem original:', e.message);
  }

  // OCR with Tesseract.js
  try {
    const Tesseract = require('tesseract.js');
    console.log('🔍 Tesseract OCR: processando...');

    const result = await Tesseract.recognize(processedPath, 'por', {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r  OCR: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    console.log(`\n  OCR concluído: ${result.data.text.length} caracteres`);

    // Clean up temp file
    if (processedPath !== filePath) {
      try { fs.unlinkSync(processedPath); } catch (e) { }
    }

    return result.data.text || '';
  } catch (e) {
    console.error('  Tesseract error:', e.message);
    // Cleanup
    if (processedPath !== filePath) {
      try { fs.unlinkSync(processedPath); } catch (e2) { }
    }
    return '';
  }
}

// ═══════════════════════════════════════════════════════════════
// ENDPOINT: POST /api/ia/extrair-cliente
// ═══════════════════════════════════════════════════════════════
r.post('/extrair-cliente', upload.single('arquivo'), async (req, res) => {
  const { texto_direto } = req.body;
  let textoFinal = '';
  let metodo = 'texto';

  try {
    // ─── CASO 1: Texto direto (colado na UI) ───
    if (texto_direto) {
      const wp = parseWhatsAppTxt(texto_direto);
      textoFinal = wp.combinedText;
      metodo = wp.isWhatsApp ? 'whatsapp_texto' : 'texto_direto';
      if (wp.isWhatsApp && wp.senders.length > 0) {
        textoFinal = wp.combinedText; // Already cleaned
      }
    }

    // ─── CASO 2: Arquivo enviado ───
    else if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();

      // ─── 2A: Arquivo .txt (PRIORIDADE MÁXIMA — WhatsApp export) ───
      if (['.txt', '.csv', '.text'].includes(ext)) {
        const raw = fs.readFileSync(req.file.path, 'utf-8');
        const wp = parseWhatsAppTxt(raw);
        textoFinal = wp.combinedText;
        metodo = wp.isWhatsApp ? 'whatsapp_arquivo' : 'arquivo_texto';
        if (wp.isWhatsApp) {
          console.log(`💬 WhatsApp detectado: ${wp.messages.length} msgs, ${wp.senders.length} participantes`);
        }
      }

      // ─── 2B: Imagem (OCR com pré-processamento) ───
      else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'].includes(ext)) {
        metodo = 'ocr_imagem';
        const ocrText = await ocrComPreProcessamento(req.file.path);
        if (ocrText && ocrText.trim().length > 5) {
          textoFinal = ocrText;
        } else {
          return res.json({
            success: true,
            metodo: 'ocr_falhou',
            confianca: 0,
            campos: {},
            sugestoes: [
              '📸 OCR não extraiu texto legível da imagem.',
              '💡 Dica: exporte a conversa do WhatsApp como arquivo .txt (toque ⋮ > Mais > Exportar conversa > Sem mídia) — é muito mais preciso!',
              '💡 Ou transcreva os dados da imagem no campo de texto acima.',
            ],
            texto_bruto: '',
            arquivo: req.file.originalname,
          });
        }
      }

      // ─── 2C: PDF ───
      else if (ext === '.pdf') {
        metodo = 'pdf';
        try {
          const raw = fs.readFileSync(req.file.path, 'utf-8');
          if (raw.length > 10 && !raw.startsWith('%PDF')) textoFinal = raw;
        } catch (e) { }
        if (!textoFinal) {
          return res.json({
            success: true, metodo: 'pdf_sem_texto', confianca: 0, campos: {},
            sugestoes: ['📄 PDF sem texto extraível. Exporte como imagem (.png) ou copie o texto.'],
            arquivo: req.file.originalname,
          });
        }
      }

      // ─── 2D: Outros ───
      else {
        try { textoFinal = fs.readFileSync(req.file.path, 'utf-8'); metodo = 'arquivo_generico'; }
        catch (e) { return res.status(400).json({ error: 'Formato não suportado. Use .txt, .png, .jpg ou .pdf' }); }
      }
    }

    // ─── SEM DADOS ───
    else {
      return res.status(400).json({ error: 'Envie um texto ou arquivo para análise' });
    }

    // ═══ EXTRAIR DADOS ESTRUTURADOS ═══
    const dados = extrairDadosEstruturados(textoFinal, metodo.startsWith('whatsapp'));
    dados.success = true;
    dados.metodo = metodo;

    // Add method-specific suggestions
    if (metodo.startsWith('whatsapp')) {
      dados.sugestoes.unshift('💬 Conversa WhatsApp processada com sucesso');
    } else if (metodo === 'ocr_imagem') {
      dados.sugestoes.unshift('📸 Texto extraído por OCR (imagem pré-processada). Revise os campos.');
      dados.sugestoes.push('💡 Para maior precisão, exporte a conversa do WhatsApp como .txt');
    }

    // Map to campos format for frontend compatibility
    dados.campos = {
      nome: dados.cliente_nome,
      cpf: dados.cpf,
      telefone: dados.telefone,
      email: dados.email,
      data_nascimento: dados.data_nascimento,
      responsavel_nome: dados.responsavel_nome,
      parentesco: dados.parentesco,
      tipo_paciente: dados.tipo_paciente,
      endereco: dados.endereco,
      cep: dados.cep,
      cidade: dados.cidade,
      uf: dados.uf,
      paciente_e_proprio: dados.paciente_e_o_proprio_cliente,
    };
    // Remove empty strings
    Object.keys(dados.campos).forEach(k => { if (!dados.campos[k]) delete dados.campos[k]; });

    dados.confianca_label = dados.confianca >= 75 ? 'alta' : dados.confianca >= 40 ? 'media' : dados.confianca >= 15 ? 'baixa' : 'nenhuma';

    res.json(dados);

  } catch (err) {
    console.error('IA extraction error:', err);
    res.status(500).json({ error: `Erro: ${err.message}` });
  }
});

module.exports = r;
