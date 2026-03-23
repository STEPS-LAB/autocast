import { test, expect } from '@playwright/test'

test.describe('Checkout flow', () => {
  test('checkout page redirects to shop if cart is empty', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByText('Кошик порожній')).toBeVisible()
  })

  test('checkout page shows step indicator', async ({ page }) => {
    // First add an item to the cart
    await page.goto('/shop')
    await page.getByText('В кошик').first().click()
    await page.goto('/checkout')

    await expect(page.getByText('Кошик')).toBeVisible()
    await expect(page.getByText('Дані')).toBeVisible()
    await expect(page.getByText('Підтвердження')).toBeVisible()
  })

  test('checkout step 1 shows order summary', async ({ page }) => {
    await page.goto('/shop')
    await page.getByText('В кошик').first().click()
    await page.goto('/checkout')

    await expect(page.getByText('Підсумок')).toBeVisible()
    await expect(page.getByText('Оформити замовлення')).toBeVisible()
  })

  test('can proceed to step 2', async ({ page }) => {
    await page.goto('/shop')
    await page.getByText('В кошик').first().click()
    await page.goto('/checkout')

    await page.getByText('Далі').click()
    await expect(page.getByText('Особисті дані')).toBeVisible()
    await expect(page.getByText('Доставка')).toBeVisible()
    await expect(page.getByText('Оплата')).toBeVisible()
  })

  test('form validation in step 2', async ({ page }) => {
    await page.goto('/shop')
    await page.getByText('В кошик').first().click()
    await page.goto('/checkout')
    await page.getByText('Далі').click()

    // Submit without filling required fields
    await page.getByText('Підтвердити').click()

    // Should show validation errors
    await expect(page.getByText("Введіть імʼя")).toBeVisible()
  })

  test('successful checkout shows confirmation', async ({ page }) => {
    await page.goto('/shop')
    await page.getByText('В кошик').first().click()
    await page.goto('/checkout')
    await page.getByText('Далі').click()

    // Fill in the form
    await page.fill('input[id*="first_name"], input[placeholder="Іван"]', 'Іван')
    await page.fill('input[placeholder="Петренко"]', 'Петренко')
    await page.fill('input[type="email"]', 'ivan@test.com')
    await page.fill('input[type="tel"]', '+380671234567')
    await page.fill('input[placeholder="Київ"]', 'Київ')
    await page.fill('input[placeholder="Відділення №1"]', 'Відділення №5')

    await page.getByText('Підтвердити').click()

    await expect(page.getByText('Замовлення оформлено!')).toBeVisible()
  })
})
