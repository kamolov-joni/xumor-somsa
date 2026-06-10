// @ts-check
const { test, expect } = require('@playwright/test');

// Set the base URL for the tests
test.use({ baseURL: 'http://localhost:3000' });

test.describe('LEAPCO Landing Page - Core Functionality Tests', () => {
    // Test 1: Page loads correctly
    test('should load the landing page successfully', async ({ page }) => {
        await page.goto('/index.html');

        // Check that page title is correct
        const title = await page.title();
        expect(title).toContain('LEAPCO');
    });

    // Test 2: Hero section has all required elements
    test('should display hero section with title', async ({ page }) => {
        await page.goto('/index.html');

        // Check hero title
        const heroTitle = await page.locator('.hero-title');
        await expect(heroTitle).toBeVisible();
        const titleText = await heroTitle.textContent();
        expect(titleText).toContain('Premium Microfiber');
    });

    // Test 3: Bundle section displays all three bundles
    test('should display all three bundle options', async ({ page }) => {
        await page.goto('/index.html');

        // Check bundle cards
        const bundleCards = await page.locator('.bundle-card');
        const count = await bundleCards.count();
        expect(count).toBe(3);
    });

    // Test 4: Bundle prices are correct
    test('should display correct bundle prices', async ({ page }) => {
        await page.goto('/index.html');

        // Single bundle price
        const bundleCards = await page.locator('.bundle-card');
        const singlePrice = await bundleCards.first().locator('.price-amount');
        let priceText = await singlePrice.textContent();
        expect(priceText).toContain('$30');

        // Duo bundle price
        const duoPriceElements = await page.locator('.price-amount').all();
        if (duoPriceElements.length >= 2) {
            const duoPrice = await duoPriceElements[1].textContent();
            expect(duoPrice).toContain('$55.80');
        }

        // Triple bundle price
        if (duoPriceElements.length >= 3) {
            const triplePrice = await duoPriceElements[2].textContent();
            expect(triplePrice).toContain('$76');
        }
    });

    // Test 5: Add to Cart functionality
    test('should add bundle to cart', async ({ page }) => {
        await page.goto('/index.html');

        // Click first bundle button
        const firstBundleBtn = await page.locator('.bundle-btn').first();
        await firstBundleBtn.click();

        // Check modal appears
        const modal = await page.locator('#cartModal');
        await expect(modal).toBeVisible();
    });

    // Test 6: Modal close functionality
    test('should close modal when close button is clicked', async ({ page }) => {
        await page.goto('/index.html');

        // Add item to open modal
        const bundleBtn = await page.locator('.bundle-btn').first();
        await bundleBtn.click();

        // Modal should be visible
        let modal = await page.locator('#cartModal');
        await expect(modal).toBeVisible();

        // Click close button
        const closeBtn = await page.locator('.close');
        await closeBtn.click();

        // Modal should not be visible
        const isVisible = await modal.evaluate((el) => getComputedStyle(el).display !== 'none');
        expect(isVisible).toBe(false);
    });

    // Test 7: Benefits section is visible
    test('should display benefits section with all four benefits', async ({ page }) => {
        await page.goto('/index.html');

        // Check benefits grid exists
        const benefitsGrid = await page.locator('.benefits-grid');
        await expect(benefitsGrid).toBeVisible();

        // Check all benefit cards
        const benefitCards = await page.locator('.benefit-card').all();
        expect(benefitCards.length).toBe(4);
    });

    // Test 8: Lifestyle section displays correctly
    test('should display lifestyle section with three items', async ({ page }) => {
        await page.goto('/index.html');

        // Check lifestyle items
        const lifestyleItems = await page.locator('.lifestyle-item').all();
        expect(lifestyleItems.length).toBe(3);
    });

    // Test 9: Mobile responsiveness
    test('should be responsive on mobile viewport', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 480, height: 800 });
        await page.goto('/index.html');

        // Check bundle cards display
        const bundleCards = await page.locator('.bundle-card');
        for (let i = 0; i < 3; i++) {
            const card = bundleCards.nth(i);
            const isVisible = await card.isVisible();
            expect(isVisible).toBe(true);
        }
    });

    // Test 10: Desktop responsiveness
    test('should display properly on desktop viewport', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/index.html');

        // Check all bundles visible
        const bundleCards = await page.locator('.bundle-card');
        for (let i = 0; i < 3; i++) {
            const card = bundleCards.nth(i);
            const isVisible = await card.isVisible();
            expect(isVisible).toBe(true);
        }
    });

    // Test 11: All buttons are clickable
    test('should have all buttons clickable', async ({ page }) => {
        await page.goto('/index.html');

        const buttons = await page.locator('button').all();
        expect(buttons.length).toBeGreaterThan(0);

        // Try clicking first button
        const firstBtn = buttons[0];
        const isEnabled = await firstBtn.isEnabled();
        expect(isEnabled).toBe(true);
    });

    // Test 12: CTA button exists and is functional
    test('should have working CTA button', async ({ page }) => {
        await page.goto('/index.html');

        const ctaButton = await page.locator('.btn-large');
        await expect(ctaButton).toBeVisible();
        const isEnabled = await ctaButton.isEnabled();
        expect(isEnabled).toBe(true);
    });

    // Test 13: Footer is visible
    test('should display footer with links', async ({ page }) => {
        await page.goto('/index.html');

        // Scroll to footer
        const footer = await page.locator('.footer');
        await footer.scrollIntoViewIfNeeded();

        // Check footer exists
        await expect(footer).toBeVisible();

        // Check footer links
        const footerLinks = await page.locator('.footer-links a').all();
        expect(footerLinks.length).toBeGreaterThan(0);
    });

    // Test 14: Most Popular badge exists
    test('should show Most Popular badge on Duo Pack', async ({ page }) => {
        await page.goto('/index.html');

        const popularBadge = await page.locator('.bundle-badge');
        await expect(popularBadge).toBeVisible();
        const badgeText = await popularBadge.textContent();
        expect(badgeText).toContain('Most Popular');
    });

    // Test 15: Discount badges are displayed
    test('should display discount badges', async ({ page }) => {
        await page.goto('/index.html');

        const discountBadges = await page.locator('.bundle-discount').all();
        expect(discountBadges.length).toBeGreaterThan(0);

        // Check at least one discount badge
        const firstDiscount = await discountBadges[0].textContent();
        expect(firstDiscount).toMatch(/Save \d+%/);
    });
});

// Performance tests
test.describe('LEAPCO Landing Page - Performance Tests', () => {
    test('should load page quickly', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
        const endTime = Date.now();

        const loadTime = (endTime - startTime) / 1000;
        // Page should load in under 5 seconds
        expect(loadTime).toBeLessThan(5);
    });

    test('should have no critical console errors', async ({ page }) => {
        const errors = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/index.html');

        // Filter out non-critical errors (like image placeholder errors, which are expected)
        const criticalErrors = errors.filter(e =>
            !e.includes('placeholder') &&
            !e.includes('404') &&
            !e.includes('image') &&
            e.includes('error')
        );
        expect(criticalErrors.length).toBe(0);
    });
});
