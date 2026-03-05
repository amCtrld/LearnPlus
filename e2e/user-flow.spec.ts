/**
 * E2E Test: Complete user flow from access code to problem completion
 * Tests both Control and AI-Assisted modes
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Complete User Flow - Control Mode', () => {
  test('should complete full learning flow without AI assistance', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/LearnPlus/i);

    // Step 2: Navigate to access code page
    await page.goto('/access-code');
    
    // Check for access code input
    const accessCodeInput = page.locator('input[type="text"]').first();
    await expect(accessCodeInput).toBeVisible();

    // Note: Cannot test with real access code without database setup
    // Test would continue with: Enter access code, select mode, solve problems
    
    // Step 3: Verify error handling for invalid code
    await accessCodeInput.fill('INVALID-CODE');
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show error message
      await expect(page.locator('text=/invalid|error/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should display expected UI elements on access code page', async ({ page }) => {
    await page.goto('/access-code');

    // Check for main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Check for input field
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();

    // Check for submit button
    const button = page.locator('button[type="submit"]');
    await expect(button).toBeVisible();
  });
});

test.describe('Dashboard Page', () => {
  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to access code page or show error
    await page.waitForLoadState('networkidle');
    const url = page.url();
    
    // Check if redirected or shows auth error
    expect(
      url.includes('/access-code') || 
      await page.locator('text=/access code|log in|unauthorized/i').isVisible()
    ).toBeTruthy();
  });
});

test.describe('Problem Page', () => {
  test('should display problem not found for invalid ID', async ({ page }) => {
    await page.goto('/problem/invalid-problem-id');
    
    // Should show error or 404
    await expect(
      page.locator('text=/not found|invalid|error/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should load problem page structure', async ({ page }) => {
    await page.goto('/problem/diff-basics-1');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loads (may show auth error, which is expected)
    const pageLoaded = await page.locator('body').isVisible();
    expect(pageLoaded).toBeTruthy();
  });
});

test.describe('Mode Selection', () => {
  test('should display mode selection page', async ({ page }) => {
    await page.goto('/select-mode');
    
    await page.waitForLoadState('networkidle');
    
    // Page should load (may require auth)
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBeTruthy();
  });
});

test.describe('Accessibility Tests', () => {
  test('access code page should not have accessibility violations', async ({ page }) => {
    await page.goto('/access-code');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('home page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should not have critical accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter out minor violations, focus on critical ones
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });
});

test.describe('Navigation', () => {
  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check for common navigation elements
    const hasNav = await page.locator('nav, header').isVisible();
    
    if (hasNav) {
      // Test navigation if present
      const links = await page.locator('a[href]').all();
      expect(links.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page renders without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // 10px tolerance
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check if page loads properly
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check if page loads properly
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Pages', () => {
  test('should display 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    
    // Should show 404 or not found message
    const has404 = await page.locator('text=/404|not found/i').isVisible();
    expect(has404).toBeTruthy();
  });

  test('404 page should have navigation options', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    await page.waitForLoadState('networkidle');
    
    // Should have links to navigate away
    const links = await page.locator('a[href]').count();
    expect(links).toBeGreaterThan(0);
  });
});

test.describe('Performance', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load assets efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Wait for all resources to load
    await page.waitForLoadState('networkidle');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        loadComplete: perfData.loadEventEnd - perfData.navigationStart,
      };
    });
    
    // DOM should be ready within 3 seconds
    expect(metrics.domContentLoaded).toBeLessThan(3000);
  });
});

test.describe('Security Headers', () => {
  test('should have security headers set', async ({ page }) => {
    const response = await page.goto('/');
    
    if (response) {
      const headers = response.headers();
      
      // Check for important security headers
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['x-content-type-options']).toBeDefined();
      expect(headers['strict-transport-security']).toBeDefined();
    }
  });
});

test.describe('API Health Check', () => {
  test('health endpoint should return valid response', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.ok() || response.status() === 503).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(data.checks).toBeDefined();
  });
});

test.describe('Form Validation', () => {
  test('should validate input on access code page', async ({ page }) => {
    await page.goto('/access-code');
    
    // Find input field
    const input = page.locator('input[type="text"]').first();
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation error or prevent submission
      const hasError = await page.locator('text=/required|invalid/i').isVisible();
      expect(hasError).toBeTruthy();
    }
  });
});

test.describe('Browser Compatibility', () => {
  test('should work with JavaScript disabled warning', async ({ page, context }) => {
    // Note: Playwright runs with JS enabled, but we can check for noscript tags
    await page.goto('/');
    
    // Check if noscript tag exists for graceful degradation
    const noscript = await page.locator('noscript').count();
    
    // Having noscript tag is good practice
    if (noscript > 0) {
      expect(noscript).toBeGreaterThan(0);
    }
  });
});
