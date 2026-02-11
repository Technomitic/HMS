import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
  });

  test('should login as admin and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@medix.hospital');
    await page.fill('input[type="password"]', 'Demo@2024!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
  });

  test('should login as patient and redirect to patient dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'jane.doe@demo.com');
    await page.fill('input[type="password"]', 'Demo@2024!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/patient', { timeout: 10000 });
    await expect(page.getByText('Welcome Back!')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Sign Up');
    await expect(page).toHaveURL('/register');
    await expect(page.getByText('Create Account')).toBeVisible();
  });
});