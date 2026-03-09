import { expect, test } from '@playwright/test';

async function loginManager(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByTestId('pin-1').click();
  await page.getByTestId('pin-2').click();
  await page.getByTestId('pin-3').click();
  await page.getByTestId('pin-4').click();
  await expect(page.getByText('Performance')).toBeVisible();
}

async function openSession(page: import('@playwright/test').Page) {
  await page.getByTestId('nav-session').click();
  await expect(page.getByText(/ouvrir la caisse/i)).toBeVisible();
  await page.getByTestId('open-session-btn').click();
  await expect(page.getByText(/session en cours/i)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    // Disable print popups during automated checkout and reports.
    window.print = () => {};
  });
});

test('manager can open a session', async ({ page }) => {
  await loginManager(page);
  await openSession(page);
});

test('order created from POS appears in KDS', async ({ page }) => {
  await loginManager(page);
  await openSession(page);

  await page.getByTestId('nav-pos').click();
  await page.getByTestId('product-card-prod2').click();
  await expect(page.getByText(/burger fromager/i).first()).toBeVisible();
  await page.getByTestId('checkout-card').click();

  await page.getByTestId('nav-kds').click();
  await expect(page.getByRole('heading', { name: /cuisine \(kds\)/i })).toBeVisible();
  await expect(page.getByTestId('kds-order-card').first()).toBeVisible();
});

test('manager can close session and returns to dashboard', async ({ page }) => {
  await loginManager(page);
  await openSession(page);

  await page.getByTestId('close-session-btn').click();
  await expect(page.getByText('Performance')).toBeVisible();
});

test('app degrades gracefully when API is unavailable', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    await route.abort();
  });

  await loginManager(page);
  await expect(page.getByText(/data:\s*fallback/i)).toBeVisible();
  await openSession(page);

  await page.getByTestId('nav-pos').click();
  await page.getByTestId('product-card-prod2').click();
  await page.getByTestId('checkout-card').click();

  await page.getByTestId('nav-kds').click();
  await expect(page.getByTestId('kds-order-card').first()).toBeVisible();
});
