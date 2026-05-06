const { describe, it, expect } = require('vitest');
const request = require('supertest');
const app = require('../helpers/app');

// ═══════════════════════════════════════════
// SMOKE TESTS — Critical regression scenarios
// ═══════════════════════════════════════════

describe('Smoke Tests — System Health', () => {
  it('API responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('Login endpoint works', async () => {
    const res = await request(app).get('/api/auth/usuarios');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('Frontend loads', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
  });

  it('SPA routes serve index.html', async () => {
    for (const route of ['/retirada', '/estoque', '/clientes', '/planos', '/financeiro', '/metas']) {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(res.text).toContain('VittaSys');
    }
  });

  it('API 404 returns JSON', async () => {
    const res = await request(app).get('/api/xyz');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('json');
  });

  it('Static assets load (CSS)', async () => {
    const res = await request(app).get('/css/main.css');
    expect(res.status).toBe(200);
  });

  it('Static assets load (JS)', async () => {
    const res = await request(app).get('/js/app.js');
    expect(res.status).toBe(200);
  });
});

describe('Smoke Tests — Business Logic', () => {
  it('Dashboard endpoint works', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.estoque).toBeDefined();
  });

  it('Lotes endpoint works with pagination', async () => {
    const res = await request(app).get('/api/lotes?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });

  it('Clientes endpoint works', async () => {
    const res = await request(app).get('/api/clientes?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });

  it('Movimentacoes endpoint works', async () => {
    const res = await request(app).get('/api/movimentacoes?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
  });

  it('Planos stats endpoint works', async () => {
    const res = await request(app).get('/api/planos/stats/resumo');
    expect(res.status).toBe(200);
    expect(res.body.total_contratos).toBeDefined();
  });

  it('Financeiro resumo endpoint works', async () => {
    const res = await request(app).get('/api/financeiro/resumo');
    expect(res.status).toBe(200);
    expect(res.body.total_recebido).toBeDefined();
  });
});
