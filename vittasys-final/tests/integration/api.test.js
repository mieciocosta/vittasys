const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const request = require('supertest');
const app = require('../helpers/app');
const { prisma, seedTestData, resetDB } = require('../helpers/prisma');

let testData;

beforeAll(async () => {
  testData = await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════
// INTEGRATION TESTS — API Endpoints
// ═══════════════════════════════════════════

describe('Health Check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth', () => {
  it('GET /api/auth/usuarios returns users', async () => {
    const res = await request(app).get('/api/auth/usuarios');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/auth/login with correct PIN succeeds', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ usuario_id: testData.user.id, pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.usuario.nome).toBe('Test User');
  });

  it('POST /api/auth/login with wrong PIN fails', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ usuario_id: testData.user.id, pin: '9999' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('PIN');
  });
});

describe('Vacinas', () => {
  it('GET /api/vacinas returns vaccines', async () => {
    const res = await request(app).get('/api/vacinas');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].nome).toBeDefined();
  });

  it('POST /api/vacinas creates vaccine', async () => {
    const res = await request(app).post('/api/vacinas')
      .send({ codigo: 'INT-TEST', nome: 'Integration Test Vac', fabricante: 'TestLab' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/vacinas rejects without name', async () => {
    const res = await request(app).post('/api/vacinas')
      .send({ codigo: 'FAIL', fabricante: 'X' });
    expect(res.status).toBe(400);
  });
});

describe('Lotes / Estoque', () => {
  it('GET /api/lotes returns lots with pagination', async () => {
    const res = await request(app).get('/api/lotes?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/lotes supports search', async () => {
    const res = await request(app).get('/api/lotes?search=Teste');
    expect(res.status).toBe(200);
  });

  it('GET /api/lotes supports sorting', async () => {
    const res = await request(app).get('/api/lotes?sort=id&order=DESC');
    expect(res.status).toBe(200);
  });
});

describe('Unidades / Busca por Barcode', () => {
  it('GET /api/unidades/busca finds by exact barcode', async () => {
    const res = await request(app).get('/api/unidades/busca?q=TEST-CB-001');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].codigo_barras).toBe('TEST-CB-001');
  });

  it('GET /api/unidades/busca finds by partial barcode', async () => {
    const res = await request(app).get('/api/unidades/busca?q=TEST-CB');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/unidades/busca returns empty for unknown code', async () => {
    const res = await request(app).get('/api/unidades/busca?q=NONEXISTENT99999');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('GET /api/unidades/busca rejects short queries', async () => {
    const res = await request(app).get('/api/unidades/busca?q=X');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('Retirada / Withdrawal', () => {
  it('POST /api/unidades/retirada requires all fields', async () => {
    const res = await request(app).post('/api/unidades/retirada').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('obrigatório');
  });

  it('POST /api/unidades/retirada requires local_aplicacao', async () => {
    const units = await prisma.unidade.findFirst({ where: { status: 'disponivel' } });
    const res = await request(app).post('/api/unidades/retirada').send({
      unidade_id: units.id, cliente_id: testData.cliente.id,
      usuario_id: testData.user.id, tipo_cliente: 'espontaneo',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Local');
  });

  it('POST /api/unidades/retirada succeeds and decrements stock', async () => {
    const unit = await prisma.unidade.findFirst({ where: { status: 'disponivel', loteId: testData.lote.id } });
    const loteBefore = await prisma.lote.findUnique({ where: { id: testData.lote.id } });

    const res = await request(app).post('/api/unidades/retirada').send({
      unidade_id: unit.id, cliente_id: testData.cliente.id,
      usuario_id: testData.user.id, tipo_cliente: 'espontaneo',
      local_aplicacao: 'Deltóide D',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.estoque.depois).toBe(loteBefore.quantidadeDisponivel - 1);

    // Verify unit status changed
    const unitAfter = await prisma.unidade.findUnique({ where: { id: unit.id } });
    expect(unitAfter.status).toBe('aplicada');
  });

  it('POST /api/unidades/retirada blocks already applied unit', async () => {
    const applied = await prisma.unidade.findFirst({ where: { status: 'aplicada' } });
    if (!applied) return; // skip if none
    const res = await request(app).post('/api/unidades/retirada').send({
      unidade_id: applied.id, cliente_id: testData.cliente.id,
      usuario_id: testData.user.id, tipo_cliente: 'espontaneo',
      local_aplicacao: 'Deltóide D',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('aplicada');
  });
});

describe('Clientes', () => {
  it('POST /api/clientes requires CPF', async () => {
    const res = await request(app).post('/api/clientes').send({ nome: 'Sem CPF' });
    expect(res.status).toBe(400);
    expect(res.body.campo).toBe('cpf');
  });

  it('POST /api/clientes rejects invalid CPF', async () => {
    const res = await request(app).post('/api/clientes').send({
      nome: 'Test', cpf: '11111111111', data_nascimento: '2000-01-01', telefone: '99999999999',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('CPF inválido');
  });

  it('POST /api/clientes rejects duplicate CPF', async () => {
    const res = await request(app).post('/api/clientes').send({
      nome: 'Duplicado', cpf: '12345678901', data_nascimento: '2000-01-01', telefone: '88888888888',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('já cadastrado');
  });

  it('GET /api/clientes returns paginated list', async () => {
    const res = await request(app).get('/api/clientes?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/clientes supports sorting by id', async () => {
    const res = await request(app).get('/api/clientes?sort=id&order=DESC');
    expect(res.status).toBe(200);
  });
});

describe('Movimentações', () => {
  it('GET /api/movimentacoes returns list', async () => {
    const res = await request(app).get('/api/movimentacoes?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/movimentacoes supports sort by id', async () => {
    const res = await request(app).get('/api/movimentacoes?sort=id&order=DESC');
    expect(res.status).toBe(200);
  });

  it('GET /api/unidades/movimentacao/:id returns detail', async () => {
    const mov = await prisma.movimentacao.findFirst({ orderBy: { id: 'desc' } });
    if (!mov) return;
    const res = await request(app).get(`/api/unidades/movimentacao/${mov.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mov.id);
    expect(res.body.nome_vacina).toBeDefined();
  });
});

describe('SPA Routing', () => {
  it('/ serves index.html', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('VittaSys');
  });

  it('/retirada serves index.html (SPA)', async () => {
    const res = await request(app).get('/retirada');
    expect(res.status).toBe(200);
    expect(res.text).toContain('VittaSys');
  });

  it('/movimentacoes/123 serves index.html (SPA)', async () => {
    const res = await request(app).get('/movimentacoes/123');
    expect(res.status).toBe(200);
    expect(res.text).toContain('VittaSys');
  });

  it('/api/nonexistent returns 404 JSON', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
