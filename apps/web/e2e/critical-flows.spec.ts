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
  const openSessionButton = page.getByTestId('open-session-btn');
  const closeSessionButton = page.getByTestId('close-session-btn');

  if (await openSessionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await openSessionButton.click();
  }

  await expect(closeSessionButton).toBeVisible();
}

async function addFirstAvailableProductToCart(
  page: import('@playwright/test').Page,
) {
  await page.getByTestId('product-card-prod-test').click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'molls_categories',
      JSON.stringify([
        { id: 'cat-test', name: 'Burgers', color: 'bg-gray-500', ordre: 1 },
      ]),
    );
    window.localStorage.setItem(
      'molls_products',
      JSON.stringify([
        {
          id: 'prod-test',
          categoryId: 'cat-test',
          name: 'Burger Test',
          price: 9.9,
          vatRate: 10,
          recipe: [],
          isAvailable: true,
          variants: [],
        },
      ]),
    );
    window.localStorage.setItem('molls_ingredients', JSON.stringify([]));
    window.localStorage.setItem('molls_customers', JSON.stringify([]));
    window.localStorage.setItem('molls_orders', JSON.stringify([]));
    window.localStorage.setItem('molls_sessions_history', JSON.stringify([]));
    window.localStorage.setItem('molls_current_session', 'null');
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
  await addFirstAvailableProductToCart(page);
  await expect(page.getByTestId('checkout-card')).toBeEnabled();
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
  test.skip(
    (process.env.VITE_DATA_SOURCE ?? 'local').toLowerCase() !== 'api',
    'API degradation scenario only applies in api mode.',
  );

  await page.route('**/api/**', async (route) => {
    await route.abort();
  });

  await loginManager(page);
  await expect(page.getByText(/data:\s*fallback/i)).toBeVisible();
  await openSession(page);

  await page.getByTestId('nav-pos').click();
  await addFirstAvailableProductToCart(page);
  await page.getByTestId('checkout-card').click();

  await page.getByTestId('nav-kds').click();
  await expect(page.getByTestId('kds-order-card').first()).toBeVisible();
});
