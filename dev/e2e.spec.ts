import { expect, test } from '@playwright/test'

test('can request a one-time password', async ({ page }) => {
  await page.goto('/admin')

  await page.waitForSelector('.after-login-otp a')

  await page.click('div.after-login-otp a')

  await page.fill('#field-value', 'dev@payloadcms.com')

  await page.click('.form-submit button')

  const emailInput = page.locator('.login-otp #field-value')

  await expect(emailInput).toHaveValue('dev@payloadcms.com')

  const { otp } = await fetch('http://localhost:3000/set-otp-insecure').then((res) => res.json())

  await page.fill('.login-otp #field-otp', otp)

  await page.click('.form-submit button')

  await expect(page).toHaveURL('/admin')
  await expect(page).toHaveTitle(/Dashboard/)
})

test('fails when logging in with bad OTP', async ({ page }) => {
  await page.goto('/admin')

  await page.waitForSelector('.after-login-otp a')

  await page.click('div.after-login-otp a')

  await page.fill('#field-value', 'dev@payloadcms.com')

  await page.click('.form-submit button')

  await page.fill('.login-otp #field-otp', '000000')

  await page.click('.form-submit button')

  const tooltip = page.locator('.field-error .tooltip-content')
  await expect(tooltip).toContainText('Failed logging in')
})
