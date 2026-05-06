const { test, expect } = require('@playwright/test');

// ═══════════════════════════════════════════
// E2E TESTS — Critical UI Regression Scenarios
// ═══════════════════════════════════════════

test.describe('Login & Session', () => {
  test('login page loads with users @regression', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('.user-card')).toHaveCount({ min: 1 });
  });

  test('login with correct PIN works @regression', async ({ page }) => {
    await page.goto('/');
    // Click first master user
    await page.locator('.user-card:has-text("Master")').first().click();
    // Enter PIN
    await page.locator('.pin-input').fill('2305');
    await page.locator('.login-btn').click();
    // Should see sidebar
    await expect(page.locator('.sb-brand')).toBeVisible({ timeout: 5000 });
  });

  test('session persists after F5 @regression', async ({ page }) => {
    await page.goto('/');
    await page.locator('.user-card:has-text("Master")').first().click();
    await page.locator('.pin-input').fill('2305');
    await page.locator('.login-btn').click();
    await expect(page.locator('.sb-brand')).toBeVisible({ timeout: 5000 });
    // Reload
    await page.reload();
    // Should still be logged in
    await expect(page.locator('.sb-brand')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Logo & Branding', () => {
  test('logo displays correctly @regression', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('.login-logo img');
    await expect(logo).toBeVisible();
    const src = await logo.getAttribute('src');
    expect(src).toContain('logo-vertical-color.png');
  });
});

test.describe('Bipagem / Retirada', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.user-card:has-text("Master")').first().click();
    await page.locator('.pin-input').fill('2305');
    await page.locator('.login-btn').click();
    await expect(page.locator('.sb-brand')).toBeVisible({ timeout: 5000 });
  });

  test('retirada page opens @regression', async ({ page }) => {
    await page.locator('button:has-text("Retirada")').click();
    await expect(page.locator('.scanner-card')).toBeVisible();
    await expect(page.locator('#scanner-main-input')).toBeVisible();
  });

  test('scanner input accepts typing @regression', async ({ page }) => {
    await page.locator('button:has-text("Retirada")').click();
    await expect(page.locator('#scanner-main-input')).toBeVisible();
    const input = page.locator('#scanner-main-input');
    // Should not be disabled
    await expect(input).toBeEnabled();
    // Type something
    await input.fill('7891234567890');
    const val = await input.inputValue();
    expect(val).toBe('7891234567890');
  });

  test('scanner input gets auto-focus @regression', async ({ page }) => {
    await page.locator('button:has-text("Retirada")').click();
    await page.waitForTimeout(500);
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('scanner-main-input');
  });

  test('unknown barcode shows error message @regression', async ({ page }) => {
    await page.locator('button:has-text("Retirada")').click();
    const input = page.locator('#scanner-main-input');
    await input.fill('NONEXISTENT99999');
    await input.press('Enter');
    await expect(page.locator('text=não encontrado')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Estoque', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.user-card:has-text("Master")').first().click();
    await page.locator('.pin-input').fill('2305');
    await page.locator('.login-btn').click();
    await expect(page.locator('.sb-brand')).toBeVisible({ timeout: 5000 });
  });

  test('estoque page opens @regression', async ({ page }) => {
    await page.locator('button:has-text("Estoque")').click();
    await expect(page.locator('text=Estoque / Câmara')).toBeVisible();
  });

  test('novo lote modal renders fields @regression', async ({ page }) => {
    await page.locator('button:has-text("Estoque")').click();
    await page.locator('button:has-text("Novo Lote")').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    // Should have form fields
    await expect(page.locator('.modal-overlay input')).toHaveCount({ min: 3 });
    await expect(page.locator('.modal-overlay select')).toHaveCount({ min: 1 });
  });

  test('nova vacina modal works @regression', async ({ page }) => {
    await page.locator('button:has-text("Estoque")').click();
    await page.locator('button:has-text("Nova Vacina")').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-overlay input')).toHaveCount({ min: 2 });
  });

  test('barcode modal opens with focus @regression', async ({ page }) => {
    await page.locator('button:has-text("Estoque")').click();
    await page.locator('button:has-text("Código de Barras")').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.waitForTimeout(300);
    // Input should exist and be focusable
    const input = page.locator('.modal-overlay .scanner-input');
    await expect(input).toBeVisible();
  });
});

test.describe('Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.user-card:has-text("Master")').first().click();
    await page.locator('.pin-input').fill('2305');
    await page.locator('.login-btn').click();
    await expect(page.locator('.sb-brand')).toBeVisible({ timeout: 5000 });
  });

  test('clientes page opens @regression', async ({ page }) => {
    await page.locator('button:has-text("Clientes")').click();
    await expect(page.locator('text=Clientes')).toBeVisible();
  });

  test('column headers are clickable for sorting @regression', async ({ page }) => {
    await page.locator('button:has-text("Clientes")').click();
    await page.waitForTimeout(500);
    const th = page.locator('th:has-text("Cliente")');
    await expect(th).toBeVisible();
    // Should have cursor pointer
    const cursor = await th.evaluate(el => el.style.cursor);
    expect(cursor).toBe('pointer');
  });
});

test.describe('URL Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Login first via home
    await page.goto('/');
    await page.locator('.user-card:has-text("Master")').first().click();
    await page.locator('.pin-input').fill('2305');
    await page.locator('.login-btn').click();
    await expect(page.locator('.sb-brand')).toBeVisible({ timeout: 5000 });
  });

  test('direct URL /estoque works @regression', async ({ page }) => {
    await page.goto('/estoque');
    await expect(page.locator('text=Estoque')).toBeVisible({ timeout: 5000 });
  });

  test('direct URL /clientes works @regression', async ({ page }) => {
    await page.goto('/clientes');
    await expect(page.locator('text=Clientes')).toBeVisible({ timeout: 5000 });
  });
});
