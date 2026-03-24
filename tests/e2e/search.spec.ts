import { test, expect } from '@playwright/test'

test.describe('Smart Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('search bar is visible in header', async ({ page }) => {
    await expect(page.locator('input[placeholder="Пошук товарів…"]').first()).toBeVisible()
  })

  test('shows results dropdown on input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Пошук товарів…"]').first()
    await searchInput.fill('Alpine')
    await page.waitForTimeout(400)
    await expect(page.getByText('Результати', { exact: true })).toBeVisible()
  })

  test('shows popular searches when focused empty', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Пошук товарів…"]').first()
    await searchInput.click()
    await expect(page.getByText('Популярні', { exact: true })).toBeVisible()
  })

  test('clears search with X button', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Пошук товарів…"]').first()
    await searchInput.fill('Pioneer')
    await page.waitForTimeout(200)
    await page.locator('button[aria-label="Очистити"]').first().click()
    await expect(searchInput).toHaveValue('')
  })

  test('navigates to shop on Enter', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Пошук товарів…"]').first()
    await searchInput.fill('LED')
    await page.waitForTimeout(400)
    await searchInput.press('Enter')
    await expect(page).toHaveURL(/\/shop/)
  })
})
