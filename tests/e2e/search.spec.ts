import { test, expect } from '@playwright/test'

test.describe('Smart Search', () => {
  async function getVisibleSearchInput(page: import('@playwright/test').Page) {
    let searchInput = page.locator('input[placeholder="Пошук товарів…"]:visible').first()
    if (!(await searchInput.isVisible())) {
      await page.locator('button[aria-label="Пошук"]').click()
      searchInput = page.locator('input[placeholder="Пошук товарів…"]:visible').first()
      await expect(searchInput).toBeVisible()
    }
    return searchInput
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('search bar is visible in header', async ({ page }) => {
    await getVisibleSearchInput(page)
  })

  test('shows results dropdown on input', async ({ page }) => {
    const searchInput = await getVisibleSearchInput(page)
    await searchInput.fill('Alpine')
    await page.waitForTimeout(400)
    await expect(page.getByText('Результати', { exact: true })).toBeVisible()
  })

  test('shows popular searches when focused empty', async ({ page }) => {
    const searchInput = await getVisibleSearchInput(page)
    await searchInput.click()
    await expect(page.getByText('Популярні', { exact: true })).toBeVisible()
  })

  test('clears search with X button', async ({ page }) => {
    const searchInput = await getVisibleSearchInput(page)
    await searchInput.fill('Pioneer')
    await page.waitForTimeout(200)
    await page.locator('button[aria-label="Очистити"]').first().click()
    await expect(searchInput).toHaveValue('')
  })

  test('navigates to shop on Enter', async ({ page }) => {
    const searchInput = await getVisibleSearchInput(page)
    await searchInput.fill('LED')
    await page.waitForTimeout(400)
    await searchInput.press('Enter')
    await expect(page).toHaveURL(/\/shop/)
  })
})
