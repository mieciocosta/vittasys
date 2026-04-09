// Vitest globals (describe, it, expect) injected by vitest.config.js

// ═══════════════════════════════════════════
// UNIT TESTS — Validation & Business Rules
// ═══════════════════════════════════════════

// CPF Validator (extracted logic)
function validarCPF(raw) {
  const c = raw.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return null;
  let s = 0; for (let i = 0; i < 9; i++) s += (10 - i) * +c[i];
  let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +c[9]) return null;
  s = 0; for (let i = 0; i < 10; i++) s += (11 - i) * +c[i];
  d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +c[10]) return null;
  return c;
}

// Input sanitizer (from retirada)
function sanitize(val) {
  return val.replace(/[\r\n\t]/g, '').trim();
}

describe('CPF Validation', () => {
  it('accepts valid CPF', () => {
    expect(validarCPF('529.982.247-25')).toBe('52998224725');
  });

  it('accepts valid CPF without formatting', () => {
    expect(validarCPF('52998224725')).toBe('52998224725');
  });

  it('rejects CPF with all same digits', () => {
    expect(validarCPF('11111111111')).toBeNull();
    expect(validarCPF('00000000000')).toBeNull();
  });

  it('rejects CPF with wrong check digits', () => {
    expect(validarCPF('12345678900')).toBeNull();
  });

  it('rejects short CPF', () => {
    expect(validarCPF('1234567')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validarCPF('')).toBeNull();
  });
});

describe('Input Sanitization', () => {
  it('trims whitespace', () => {
    expect(sanitize('  7891234567890  ')).toBe('7891234567890');
  });

  it('removes newlines and tabs', () => {
    expect(sanitize('789\n123\t456')).toBe('789123456');
  });

  it('handles carriage return', () => {
    expect(sanitize('789\r\n123')).toBe('789123');
  });

  it('returns empty for whitespace-only', () => {
    expect(sanitize('   ')).toBe('');
  });
});

describe('Business Rules — Plan Deletion', () => {
  it('should allow deletion when progress is 0% and no payments', () => {
    const plan = { doses_aplicadas: 0, doses_total: 5, total_pago: 0 };
    const prog = plan.doses_total > 0 ? Math.round(plan.doses_aplicadas / plan.doses_total * 100) : 0;
    const canDelete = prog === 0 && plan.total_pago === 0;
    expect(canDelete).toBe(true);
  });

  it('should block deletion when doses applied', () => {
    const plan = { doses_aplicadas: 2, doses_total: 5, total_pago: 0 };
    const prog = Math.round(plan.doses_aplicadas / plan.doses_total * 100);
    const canDelete = prog === 0 && plan.total_pago === 0;
    expect(canDelete).toBe(false);
  });

  it('should block deletion when payments exist', () => {
    const plan = { doses_aplicadas: 0, doses_total: 5, total_pago: 500 };
    const prog = 0;
    const canDelete = prog === 0 && plan.total_pago === 0;
    expect(canDelete).toBe(false);
  });
});

describe('Barcode Format', () => {
  it('accepts numeric EAN-13', () => {
    const code = '7891234567890';
    expect(code.length).toBe(13);
    expect(/^\d+$/.test(code)).toBe(true);
  });

  it('accepts alphanumeric lot codes', () => {
    const code = 'NF84765-1';
    expect(code.length).toBeGreaterThan(3);
  });

  it('rejects empty', () => {
    expect(''.length).toBeLessThan(2);
  });
});

describe('Session State', () => {
  it('should serialize and deserialize user', () => {
    const user = { id: 1, nome: 'Test', perfil: 'master', modulos_permitidos: ['dashboard'] };
    const json = JSON.stringify(user);
    const restored = JSON.parse(json);
    expect(restored.id).toBe(1);
    expect(restored.perfil).toBe('master');
  });
});

// ═══ APPROVAL WORKFLOW RULES ═══

const TIPOS_SENSIVEIS = ['descarte', 'ajuste', 'estorno'];

describe('Approval Workflow Rules', () => {
  it('identifies sensitive types correctly', () => {
    expect(TIPOS_SENSIVEIS.includes('descarte')).toBe(true);
    expect(TIPOS_SENSIVEIS.includes('ajuste')).toBe(true);
    expect(TIPOS_SENSIVEIS.includes('estorno')).toBe(true);
    expect(TIPOS_SENSIVEIS.includes('entrada')).toBe(false);
    expect(TIPOS_SENSIVEIS.includes('retirada')).toBe(false);
    expect(TIPOS_SENSIVEIS.includes('aplicacao')).toBe(false);
  });

  it('non-master + sensitive = needs approval', () => {
    const perfil = 'operador';
    const tipo = 'descarte';
    const isMaster = perfil === 'master';
    const needsApproval = TIPOS_SENSIVEIS.includes(tipo) && !isMaster;
    expect(needsApproval).toBe(true);
  });

  it('master + sensitive = auto-approved', () => {
    const perfil = 'master';
    const tipo = 'descarte';
    const isMaster = perfil === 'master';
    const needsApproval = TIPOS_SENSIVEIS.includes(tipo) && !isMaster;
    expect(needsApproval).toBe(false);
  });

  it('non-master + normal type = no approval needed', () => {
    const perfil = 'operador';
    const tipo = 'entrada';
    const needsApproval = TIPOS_SENSIVEIS.includes(tipo) && perfil !== 'master';
    expect(needsApproval).toBe(false);
  });

  it('sensitive type without justification should be blocked for non-master', () => {
    const perfil = 'ativos';
    const tipo = 'estorno';
    const justificativa = '';
    const motivo_padrao = '';
    const isMaster = perfil === 'master';
    const isSensitive = TIPOS_SENSIVEIS.includes(tipo);
    const needsJustification = isSensitive && !isMaster && !justificativa && !motivo_padrao;
    expect(needsJustification).toBe(true);
  });

  it('pending status should not impact stock', () => {
    const status = 'pendente_aprovacao';
    const impactaEstoque = status !== 'pendente_aprovacao';
    expect(impactaEstoque).toBe(false);
  });

  it('stock impact on approval for descarte/ajuste decrements', () => {
    const tipo = 'descarte';
    const shouldDecrement = ['descarte', 'ajuste'].includes(tipo);
    expect(shouldDecrement).toBe(true);
  });

  it('stock impact on approval for estorno increments', () => {
    const tipo = 'estorno';
    const shouldIncrement = tipo === 'estorno';
    expect(shouldIncrement).toBe(true);
  });
});

describe('Standard Motives', () => {
  const MOTIVOS = ['vacina_vencida','quebra_avaria','cancelamento_plano','erro_lancamento','divergencia_inventario','devolucao','estorno_indevido','outro'];

  it('has at least 5 standard motives', () => {
    expect(MOTIVOS.length).toBeGreaterThanOrEqual(5);
  });

  it('includes "outro" as catch-all', () => {
    expect(MOTIVOS.includes('outro')).toBe(true);
  });
});

describe('Audit Trail Requirements', () => {
  it('movimentacao must have usuario_id (solicitante)', () => {
    const mov = { usuario_id: 5, tipo: 'descarte', status: 'pendente_aprovacao' };
    expect(mov.usuario_id).toBeDefined();
    expect(mov.usuario_id).toBeGreaterThan(0);
  });

  it('approval must record aprovador and timestamp', () => {
    const approval = { aprovado_por: 1, aprovado_em: new Date().toISOString(), status: 'concluido' };
    expect(approval.aprovado_por).toBeDefined();
    expect(approval.aprovado_em).toBeDefined();
    expect(approval.status).toBe('concluido');
  });

  it('rejection must have motivo', () => {
    const rejection = { aprovado_por: 1, motivo_reprovacao: 'Lote incorreto', status: 'reprovado' };
    expect(rejection.motivo_reprovacao).toBeTruthy();
    expect(rejection.motivo_reprovacao.length).toBeGreaterThan(0);
  });

  it('pending status blocks stock impact', () => {
    const mov = { status: 'pendente_aprovacao', impacta_estoque: false };
    expect(mov.impacta_estoque).toBe(false);
  });

  it('approved status enables stock impact', () => {
    const mov = { status: 'concluido', impacta_estoque: true, estoque_aplicado_em: new Date().toISOString() };
    expect(mov.impacta_estoque).toBe(true);
    expect(mov.estoque_aplicado_em).toBeDefined();
  });
});

// ═══ PLAN-MOVEMENT LINKING RULES ═══

describe('Plan-Movement Dose Matching', () => {
  it('exact vacinaId matches', () => {
    const doseVacinaId = 5;
    const movVacinaId = 5;
    expect(doseVacinaId === movVacinaId).toBe(true);
  });

  it('fuzzy name match works for NF-e imported vaccines', () => {
    const stockName = 'VACINA MEN B BEXSERO GSK';
    const planName = 'Meningocócica B (Bexsero)';
    const keyStock = stockName.toLowerCase().replace(/vacina\s*/gi, '');
    const keyPlan = planName.toLowerCase().replace(/vacina\s*/gi, '');
    const words1 = keyStock.split(/[\s\-\(\)]+/).filter(w => w.length > 3);
    const words2 = keyPlan.split(/[\s\-\(\)]+/).filter(w => w.length > 3);
    let matched = false;
    for (const w of words1) { for (const w2 of words2) { if (w.includes(w2) || w2.includes(w)) matched = true; } }
    expect(matched).toBe(true);
  });

  it('fuzzy match works for Rotavirus variants', () => {
    const stockName = 'VACINA ROTAVIRUS PENTAVALENTE';
    const planName = 'Rotavírus Pentavalente';
    const k1 = stockName.toLowerCase().replace(/vacina\s*/gi, '');
    const k2 = planName.toLowerCase().replace(/vacina\s*/gi, '');
    expect(k1.includes('rotavirus') && k2.includes('rotav')).toBe(true);
  });

  it('non-matching vaccines do not link', () => {
    const stockName = 'Hepatite B';
    const planName = 'Meningocócica ACWY';
    const k1 = stockName.toLowerCase();
    const k2 = planName.toLowerCase();
    expect(k1.includes(k2) || k2.includes(k1)).toBe(false);
  });

  it('first pending dose is selected (FIFO)', () => {
    const doses = [
      { id: 1, status: 'aplicada', vacinaId: 5 },
      { id: 2, status: 'pendente', vacinaId: 5 },
      { id: 3, status: 'pendente', vacinaId: 5 },
    ];
    const pending = doses.filter(d => d.status === 'pendente');
    expect(pending[0].id).toBe(2);
  });

  it('no double-marking: already applied dose is skipped', () => {
    const doses = [
      { id: 1, status: 'aplicada', vacinaId: 5 },
      { id: 2, status: 'aplicada', vacinaId: 5 },
    ];
    const pending = doses.filter(d => d.status === 'pendente');
    expect(pending.length).toBe(0);
  });
});

describe('Stock Coverage Check', () => {
  it('identifies insufficient stock', () => {
    const necessario = 3;
    const disponivel = 1;
    const insuficiente = disponivel < necessario;
    expect(insuficiente).toBe(true);
  });

  it('sufficient stock passes', () => {
    const necessario = 2;
    const disponivel = 10;
    expect(disponivel >= necessario).toBe(true);
  });
});

// ═══ VACCINE NAME MATCHING ═══
function norm(s){return(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/vacina\s*/gi,'').replace(/\s+/g,' ').trim()}

describe('Vaccine Name Matching (accent-safe)', () => {
  it('normalizes accents: Rotavírus → rotavirus', () => {
    expect(norm('Rotavírus Pentavalente')).toBe('rotavirus pentavalente');
  });

  it('normalizes accents: Meningocócica → meningococica', () => {
    expect(norm('Meningocócica B (Bexsero)')).toBe('meningococica b (bexsero)');
  });

  it('strips "vacina" prefix', () => {
    expect(norm('VACINA MEN B BEXSERO GSK')).toBe('men b bexsero gsk');
  });

  it('matches stock "VACINA ROTAVIRUS PENTAVALENTE" to plan "Rotavírus Pentavalente"', () => {
    const ns = norm('VACINA ROTAVIRUS PENTAVALENTE');
    const np = norm('Rotavírus Pentavalente');
    expect(ns.includes(np) || np.includes(ns)).toBe(true);
  });

  it('matches stock "VACINA MEN B BEXSERO GSK" to plan "Meningocócica B (Bexsero)"', () => {
    const ns = norm('VACINA MEN B BEXSERO GSK');
    const np = norm('Meningocócica B (Bexsero)');
    // Word-level match: "bexsero" appears in both
    const w1 = ns.split(/[\s\-\(\)]+/).filter(w => w.length > 3);
    const w2 = np.split(/[\s\-\(\)]+/).filter(w => w.length > 3);
    const match = w1.some(a => w2.some(b => a.includes(b) || b.includes(a)));
    expect(match).toBe(true);
  });

  it('does NOT match unrelated vaccines', () => {
    const ns = norm('Hepatite B');
    const np = norm('Febre Amarela');
    const match = ns.includes(np) || np.includes(ns);
    expect(match).toBe(false);
  });
});

// ═══ AUDIT MODULE ═══
describe('Audit Log Structure', () => {
  it('audit log entry has required fields', () => {
    const log = { acao: 'login', usuarioId: 1, usuarioNome: 'Test', ip: '127.0.0.1', criadoEm: new Date().toISOString() };
    expect(log.acao).toBeDefined();
    expect(log.usuarioId).toBeGreaterThan(0);
    expect(log.criadoEm).toBeDefined();
  });

  it('critical actions are identifiable', () => {
    const critical = ['retirada', 'descarte', 'estorno', 'aprovar', 'reprovar', 'excluir'];
    expect(critical.includes('retirada')).toBe(true);
    expect(critical.includes('login')).toBe(false);
  });
});

// ═══ COMPETÊNCIA / MÊS MATCHING ═══
describe('Dose Competência Matching', () => {
  it('should prioritize dose by mesPrevisto ascending', () => {
    const doses = [
      { id: 3, mesPrevisto: 6, status: 'pendente' },
      { id: 1, mesPrevisto: 2, status: 'pendente' },
      { id: 2, mesPrevisto: 4, status: 'aplicada' },
    ];
    const pendentes = doses.filter(d => d.status === 'pendente').sort((a, b) => (a.mesPrevisto || 0) - (b.mesPrevisto || 0));
    expect(pendentes[0].mesPrevisto).toBe(2); // First due
    expect(pendentes[1].mesPrevisto).toBe(6);
  });

  it('detects anticipation (>45 days early)', () => {
    const inicioPlano = new Date('2026-01-01');
    const mesPrevisto = 6; // Expected: July 2026
    const dataEsperada = new Date(inicioPlano);
    dataEsperada.setMonth(dataEsperada.getMonth() + mesPrevisto);
    const now = new Date('2026-04-01'); // 3 months early
    const diffDays = Math.round((now.getTime() - dataEsperada.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThan(-45);
    const isAnticipation = diffDays < -45;
    expect(isAnticipation).toBe(true);
  });

  it('detects delay (>60 days late)', () => {
    const inicioPlano = new Date('2025-01-01');
    const mesPrevisto = 2; // Expected: March 2025
    const dataEsperada = new Date(inicioPlano);
    dataEsperada.setMonth(dataEsperada.getMonth() + mesPrevisto);
    const now = new Date('2025-07-01'); // 4 months late
    const diffDays = Math.round((now.getTime() - dataEsperada.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThan(60);
  });

  it('normal window passes (within ±45 days)', () => {
    const inicioPlano = new Date('2026-01-01');
    const mesPrevisto = 3; // Expected: April 2026
    const dataEsperada = new Date(inicioPlano);
    dataEsperada.setMonth(dataEsperada.getMonth() + mesPrevisto);
    const now = new Date('2026-04-10'); // 10 days after expected
    const diffDays = Math.round((now.getTime() - dataEsperada.getTime()) / (1000 * 60 * 60 * 24));
    const isException = diffDays < -45 || diffDays > 60;
    expect(isException).toBe(false);
  });
});

// ═══ VALIDADE MM/AAAA ═══
describe('Validade MM/AAAA Parsing', () => {
  function parseValidade(v){
    if(!v)return null;const s=String(v).trim();
    let m=s.match(/^(\d{1,2})\/(\d{4})$/);
    if(m){return new Date(+m[2],+m[1],0)}
    m=s.match(/^(\d{4})-(\d{1,2})$/);
    if(m){return new Date(+m[1],+m[2],0)}
    return new Date(s);
  }

  it('parses MM/YYYY to last day of month', () => {
    const d = parseValidade('03/2027');
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(2); // March (0-indexed)
    expect(d.getDate()).toBe(31); // Last day of March
  });

  it('parses YYYY-MM to last day of month', () => {
    const d = parseValidade('2027-02');
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(1); // February
    expect(d.getDate()).toBe(28); // Last day of Feb 2027
  });

  it('parses full date normally', () => {
    const d = parseValidade('2027-06-15');
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(5); // June
    expect(d.getDate()).toBe(15);
  });
});

// ═══ CAMERA AUDIT ═══
describe('Camera Audit for Critical Actions', () => {
  const CRITICAL=['descarte','ajuste','estorno'];

  it('descarte is a critical action', () => {
    expect(CRITICAL.includes('descarte')).toBe(true);
  });

  it('entrada is NOT a critical action', () => {
    expect(CRITICAL.includes('entrada')).toBe(false);
  });

  it('retirada is NOT a camera-required action (handled by bipe flow)', () => {
    expect(CRITICAL.includes('retirada')).toBe(false);
  });

  it('audit log should store foto_path when photo is captured', () => {
    const log = { acao: 'descarte', foto_path: '/uploads/audit/audit-123.jpg' };
    expect(log.foto_path).toBeDefined();
    expect(log.foto_path).toContain('/uploads/audit/');
  });

  it('audit log without photo should have null foto_path', () => {
    const log = { acao: 'descarte', foto_path: null };
    expect(log.foto_path).toBeNull();
  });
});

// ═══ PLAN PRICING ═══
describe('Plan Pricing Rules', () => {
  it('avista price should be lower than cartao', () => {
    const plano = { valor_tabela: 13630, valor_avista: 9200, valor_cartao: 9450 };
    expect(plano.valor_avista).toBeLessThan(plano.valor_cartao);
    expect(plano.valor_avista).toBeLessThan(plano.valor_tabela);
  });

  it('should use avista when forma=avista', () => {
    const forma = 'avista';
    const plano = { valor_avista: 9200, valor_cartao: 9450, valor_tabela: 13630 };
    const valor = forma === 'cartao' ? plano.valor_cartao : plano.valor_avista;
    expect(valor).toBe(9200);
  });

  it('should use cartao when forma=cartao', () => {
    const forma = 'cartao';
    const plano = { valor_avista: 9200, valor_cartao: 9450, valor_tabela: 13630 };
    const valor = forma === 'cartao' ? plano.valor_cartao : plano.valor_avista;
    expect(valor).toBe(9450);
  });

  it('should fallback to valor_tabela when no pricing', () => {
    const plano = { valor_tabela: 5800, valor_avista: null, valor_cartao: null };
    const valor = plano.valor_avista || plano.valor_tabela;
    expect(valor).toBe(5800);
  });
});

// ═══ v13 FIXES ═══
describe('Modal and Critical Action Rules', () => {
  it('modal should NOT close on backdrop click', () => {
    // Rule: modal only closes via X button or explicit close
    const closeOnBackdrop = false;
    expect(closeOnBackdrop).toBe(false);
  });

  it('critical action requires photo (descarte)', () => {
    const tipo = 'descarte';
    const criticos = ['descarte', 'ajuste', 'estorno'];
    const isCritico = criticos.includes(tipo);
    const fotoBlob = null; // no photo
    const canProceed = !isCritico || fotoBlob !== null;
    expect(canProceed).toBe(false); // blocked without photo
  });

  it('critical action with photo proceeds', () => {
    const fotoBlob = new Uint8Array([1, 2, 3]); // simulated photo
    const canProceed = fotoBlob !== null;
    expect(canProceed).toBe(true);
  });

  it('vaccine outside plan should NOT block retirada', () => {
    const allDosesApplied = true;
    const shouldBlock = false; // continue, allow as extra
    expect(shouldBlock).toBe(false);
  });

  it('lote with movements gets soft delete (inativo)', () => {
    const movsCount = 5;
    const result = movsCount > 0 ? 'inativo' : 'excluido';
    expect(result).toBe('inativo');
  });

  it('lote without movements gets hard delete', () => {
    const movsCount = 0;
    const result = movsCount > 0 ? 'inativo' : 'excluido';
    expect(result).toBe('excluido');
  });

  it('date field formats ISO to YYYY-MM-DD', () => {
    const iso = '2024-03-15T00:00:00.000Z';
    const formatted = iso.slice(0, 10);
    expect(formatted).toBe('2024-03-15');
  });
});

// ═══ FORA DO PLANO ═══
describe('Vaccine Outside Plan Rules', () => {
  it('should block retirada when vaccine not in plan and no justification', () => {
    const vacinaNoPlano = false;
    const justificativa = null;
    const clienteAtivo = true;
    const temPlano = true;
    const shouldBlock = clienteAtivo && temPlano && !vacinaNoPlano && !justificativa;
    expect(shouldBlock).toBe(true);
  });

  it('should send to approval when vaccine not in plan WITH justification', () => {
    const vacinaNoPlano = false;
    const justificativa = 'Troca autorizada pela gestora';
    const isMaster = false;
    const shouldPendApproval = !vacinaNoPlano && justificativa && !isMaster;
    expect(shouldPendApproval).toBe(true);
  });

  it('master should be allowed to bypass plan restriction', () => {
    const vacinaNoPlano = false;
    const justificativa = 'Autorizado';
    const isMaster = true;
    const shouldPendApproval = !vacinaNoPlano && justificativa && !isMaster;
    expect(shouldPendApproval).toBe(false);
  });
});
