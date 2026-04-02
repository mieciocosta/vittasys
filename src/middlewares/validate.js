class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'ValidationError'; }
}

function required(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || obj[f] === '') {
      throw new ValidationError(`Campo obrigatório: ${f}`);
    }
  }
}

function validateCPF(cpf) {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) throw new ValidationError('CPF inválido');
  let s = 0; for (let i = 0; i < 9; i++) s += (10 - i) * +c[i];
  let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +c[9]) throw new ValidationError('CPF inválido');
  s = 0; for (let i = 0; i < 10; i++) s += (11 - i) * +c[i];
  d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +c[10]) throw new ValidationError('CPF inválido');
  return c;
}

function positiveInt(val, field) {
  const n = parseInt(val);
  if (isNaN(n) || n < 1) throw new ValidationError(`${field} deve ser um número positivo`);
  return n;
}

module.exports = { ValidationError, required, validateCPF, positiveInt };
