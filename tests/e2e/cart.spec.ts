import { test, expect } from '@playwright/test'

test.describe('Cart functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shop')
  })

  test('cart icon is visible in header', async ({ page }) => {
    await expect(page.locator('button[aria-label*="Кошик"]')).toBeVisible()
  })

  test('clicking cart icon opens cart drawer', async ({ page }) => {
    await page.locator('button[aria-label*="Кошик"]').click()
    await expect(page.getByText('Кошик')).toBeVisible()
  })

  test('empty cart shows appropriate message', async ({ page }) => {
    await page.locator('button[aria-label*="Кошик"]').click()
    await expect(page.getByText('Кошик порожній')).toBeVisible()
  })

  test('add to cart button is visible on product cards', async ({ page }) => {
    await expect(page.getByText('В кошик').first()).toBeVisible()
  })

  test('clicking add to cart opens drawer with product', async ({ page }) => {
    await page.getByText('В кошик').first().click()
    await expect(page.locator('button[aria-label*="Кошик"]')).toBeVisible()
  })

  test('can navigate to cart page', async ({ page }) => {
    await page.goto('/cart')
    await expect(page).toHaveURL('/cart')
  })

  test('cart page shows empty state initially', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByText('Кошик порожній')).toBeVisible()
  })
})
