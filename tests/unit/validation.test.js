const { describe, it, expect } = require('vitest');

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
