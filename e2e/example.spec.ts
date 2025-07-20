import { test, expect } from '@playwright/test'

test.describe('TalkTime Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: /welcome to talktime/i })).toBeVisible()
    
    // Check if the start button exists
    await expect(page.getByRole('button', { name: /let's talk!/i })).toBeVisible()
  })

  test('should have correct meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Check title
    await expect(page).toHaveTitle(/talktime/i)
  })
})