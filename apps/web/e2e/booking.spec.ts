import { test, expect } from '@playwright/test';

test.describe('Appointment Booking', () => {
  test('should complete booking flow steps', async ({ page }) => {
    await page.goto('/book');

    // Step 1: Select department
    await expect(page.getByText('Select Department')).toBeVisible();
    await page.click('text=Cardiology');

    // Step 2: Select doctor
    await expect(page.getByText('Choose Doctor')).toBeVisible({ timeout: 10000 });

    // Verify doctors are listed
    const doctorCards = page.locator('text=Dr.');
    await expect(doctorCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show progress bar', async ({ page }) => {
    await page.goto('/book');

    // Verify progress steps
    await expect(page.getByText('Department')).toBeVisible();
    await expect(page.getByText('Doctor')).toBeVisible();
    await expect(page.getByText('Time Slot')).toBeVisible();
    await expect(page.getByText('Confirm')).toBeVisible();
  });
});