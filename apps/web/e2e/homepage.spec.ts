import { test, expect } from '@playwright/test';

test.describe('Public Homepage', () => {
  test('should display homepage with all sections', async ({ page }) => {
    await page.goto('/');

    // Navigation
    await expect(page.getByText('Medix')).toBeVisible();
    await expect(page.getByText('Book Appointment').first()).toBeVisible();

    // Hero
    await expect(page.getByText('Your Health,')).toBeVisible();
    await expect(page.getByText('Digitally')).toBeVisible();

    // Services
    await expect(page.getByText('Our Specialties')).toBeVisible();
    await expect(page.getByText('Cardiology')).toBeVisible();

    // Why Choose Us
    await expect(page.getByText('Why Choose')).toBeVisible();

    // CTA
    await expect(page.getByText('Ready to Get Started?')).toBeVisible();

    // Footer
    await expect(page.getByText('Privacy Policy')).toBeVisible();
  });

  test('should navigate to booking page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Book Appointment >> nth=0');
    await expect(page).toHaveURL('/book');
    await expect(page.getByText('Select Department')).toBeVisible();
  });

  test('should navigate to login from homepage', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/login');
  });
});