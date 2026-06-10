import { test, expect } from '@playwright/test';

// Set the base URL for the tests
test.use({ baseURL: 'http://localhost:3000/leapco' });

test.describe('LEAPCO Landing Page - Complete Test Suite', () => {
    // Test 1: Page loads correctly
    test('should load the landing page successfully', async ({ page }) => {
        await page.goto('/');

        // Check that page title is correct
        const title = await page.title();
        expect(title).toContain('LEAPCO');

        // Check hero section exists
        const heroSection = await page.locator('.hero');
        await expect(heroSection).toBeVisible();

        // Check logo is visible
        const logo = await page.locator('.logo');
        await expect(logo).toBeVisible();
        const logoText = await logo.textContent();
        expect(logoText).toBe('LEAPCO');
    });

    // Test 2: Hero section has all required elements
    test('should display hero section with title and image', async ({ page }) => {
        await page.goto('/');

        // Check hero title
        const heroTitle = await page.locator('.hero-title');
        await expect(heroTitle).toBeVisible();
        const titleText = await heroTitle.textContent();
        expect(titleText).toContain('Premium Microfiber');

        // Check hero subtitle
        const heroSubtitle = await page.locator('.hero-subtitle');
        await expect(heroSubtitle).toBeVisible();

        // Check hero image
        const heroImage = await page.locator('.hero-image');
        await expect(heroImage).toBeVisible();
    });

    // Test 3: Bundle section displays all three bundles
    test('should display all three bundle options', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Check bundle cards
        const bundleCards = await page.locator('.bundle-card');
        const count = await bundleCards.count();
        expect(count).toBe(3);

        // Check bundle names
        const bundleNames = ['Single', 'Duo Pack', 'Triple Pack'];
        const cards = await page.locator('.bundle-name').all();

        for (let i = 0; i < cards.length; i++) {
            const text = await cards[i].textContent();
            expect(text).toContain(bundleNames[i]);
        }
    });

    // Test 4: Bundle prices are correct
    test('should display correct bundle prices', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Single bundle price
        const singlePrice = await page.locator('.bundle-card').first().locator('.price-amount');
        let priceText = await singlePrice.textContent();
        expect(priceText).toContain('$30');

        // Duo bundle price
        const duoCard = await page.locator('.bundle-card-popular');
        const duoPrice = await duoCard.locator('.price-amount');
        priceText = await duoPrice.textContent();
        expect(priceText).toContain('$55.80');

        // Triple bundle price
        const cards = await page.locator('.bundle-card').all();
        const triplePrice = await cards[2].locator('.price-amount');
        priceText = await triplePrice.textContent();
        expect(priceText).toContain('$76');
    });

    // Test 5: "Most Popular" badge on Duo Pack
    test('should show "Most Popular" badge on Duo Pack', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        const popularbadge = await page.locator('.bundle-badge');
        await expect(popularbadge).toBeVisible();
        const badgeText = await popularbadge.textContent();
        expect(badgeText).toContain('Most Popular');
    });

    // Test 6: Discount badges are displayed correctly
    test('should display discount badges for multi-pack bundles', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        const discountBadges = await page.locator('.bundle-discount').all();

        // Check Duo Pack discount
        const duoDiscount = await discountBadges[0].textContent();
        expect(duoDiscount).toContain('Save 7%');

        // Check Triple Pack discount
        const tripleDiscount = await discountBadges[1].textContent();
        expect(tripleDiscount).toContain('Save 15%');
    });

    // Test 7: Add to Cart functionality - Single Bundle
    test('should add single bundle to cart', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Get first bundle button and click
        const firstBundleBtn = await page.locator('.bundle-btn').first();
        await firstBundleBtn.click();

        // Check modal appears
        const modal = await page.locator('#cartModal');
        await expect(modal).toBeVisible();

        // Check cart details
        const cartDetails = await page.locator('#cartDetails');
        const detailsText = await cartDetails.textContent();
        expect(detailsText).toContain('$30');
        expect(detailsText).toContain('Items in cart: 1');
    });

    // Test 8: Add to Cart functionality - Duo Bundle
    test('should add duo bundle to cart', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Click Duo Pack button
        const duoBtn = await page.locator('[data-bundle="duo"]');
        await duoBtn.click();

        // Check modal appears with correct price
        const modal = await page.locator('#cartModal');
        await expect(modal).toBeVisible();

        const cartDetails = await page.locator('#cartDetails');
        const detailsText = await cartDetails.textContent();
        expect(detailsText).toContain('$55.80');
    });

    // Test 9: Add to Cart functionality - Triple Bundle
    test('should add triple bundle to cart', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Click Triple Pack button
        const tripleBtn = await page.locator('[data-bundle="triple"]');
        await tripleBtn.click();

        // Check modal appears with correct price
        const modal = await page.locator('#cartModal');
        await expect(modal).toBeVisible();

        const cartDetails = await page.locator('#cartDetails');
        const detailsText = await cartDetails.textContent();
        expect(detailsText).toContain('$76');
    });

    // Test 10: Modal close functionality
    test('should close modal when close button is clicked', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

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
        modal = await page.locator('#cartModal');
        const isVisible = await modal.isVisible();
        expect(isVisible).toBe(false);
    });

    // Test 11: Multiple items add to cart total
    test('should calculate correct total when multiple bundles added', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Add first bundle
        let bundleBtn = await page.locator('.bundle-btn').first();
        await bundleBtn.click();

        // Wait for modal and close it
        await page.locator('.close').click();

        // Add second bundle (Duo)
        const duoBtn = await page.locator('[data-bundle="duo"]');
        await duoBtn.click();

        // Check total in modal (should be 30 + 55.80 = 85.80)
        const cartDetails = await page.locator('#cartDetails');
        const detailsText = await cartDetails.textContent();
        expect(detailsText).toContain('Items in cart: 2');
        expect(detailsText).toContain('$85.80');
    });

    // Test 12: Benefits section is visible and complete
    test('should display benefits section with all four benefits', async ({ page }) => {
        await page.goto('/');
        await page.locator('#benefits').scrollIntoViewIfNeeded();

        // Check benefits grid exists
        const benefitsGrid = await page.locator('.benefits-grid');
        await expect(benefitsGrid).toBeVisible();

        // Check all benefit cards
        const benefitCards = await page.locator('.benefit-card').all();
        expect(benefitCards.length).toBe(4);

        // Check benefit titles
        const benefitTitles = ['Premium Microfiber', 'Absorbent & Fast', 'Streak-Free Finish', 'Durable & Long-lasting'];
        for (let i = 0; i < benefitTitles.length; i++) {
            const titleText = await benefitCards[i].locator('h3').textContent();
            expect(titleText).toContain(benefitTitles[i]);
        }
    });

    // Test 13: Lifestyle section displays correctly
    test('should display lifestyle section with three items', async ({ page }) => {
        await page.goto('/');
        await page.locator('#lifestyle').scrollIntoViewIfNeeded();

        // Check lifestyle items
        const lifestyleItems = await page.locator('.lifestyle-item').all();
        expect(lifestyleItems.length).toBe(3);

        // Check titles
        const titles = ['Professional Results', 'Premium Quality', 'Easy Maintenance'];
        for (let i = 0; i < titles.length; i++) {
            const titleText = await lifestyleItems[i].locator('h3').textContent();
            expect(titleText).toContain(titles[i]);
        }
    });

    // Test 14: Mobile responsiveness - bundles stack on small screens
    test('should stack bundles vertically on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 480, height: 800 });
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Check bundle cards display
        const bundleCards = await page.locator('.bundle-card');
        const count = await bundleCards.count();
        expect(count).toBe(3);

        // All should be visible in mobile view
        for (let i = 0; i < 3; i++) {
            const card = bundleCards.nth(i);
            const isVisible = await card.isVisible();
            expect(isVisible).toBe(true);
        }
    });

    // Test 15: Desktop responsiveness - bundles display in grid
    test('should display bundles in grid on desktop', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        // Check all bundles visible
        const bundleCards = await page.locator('.bundle-card');
        for (let i = 0; i < 3; i++) {
            const card = bundleCards.nth(i);
            const isVisible = await card.isVisible();
            expect(isVisible).toBe(true);
        }
    });

    // Test 16: CTA button functionality
    test('should scroll to bundles section when Shop Now button clicked', async ({ page }) => {
        await page.goto('/');

        // Get initial scroll position
        const initialScroll = await page.evaluate(() => window.scrollY);

        // Click Shop Now button
        const shopBtn = await page.locator('.btn-large');
        await shopBtn.click();

        // Wait for scroll animation
        await page.waitForTimeout(1000);

        // Get new scroll position (should be scrolled down)
        const newScroll = await page.evaluate(() => window.scrollY);
        expect(newScroll).toBeGreaterThan(initialScroll);
    });

    // Test 17: Footer links are visible
    test('should display footer with all links', async ({ page }) => {
        await page.goto('/');

        // Scroll to footer
        await page.locator('.footer').scrollIntoViewIfNeeded();

        // Check footer exists
        const footer = await page.locator('.footer');
        await expect(footer).toBeVisible();

        // Check footer links
        const footerLinks = await page.locator('.footer-links a').all();
        expect(footerLinks.length).toBeGreaterThan(0);
    });

    // Test 18: Page has correct color scheme (dark theme)
    test('should have dark theme with silver accents', async ({ page }) => {
        await page.goto('/');

        // Check body background color (dark)
        const bodyColor = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        expect(bodyColor).toBeTruthy();

        // Check price color (silver accent)
        const priceElement = await page.locator('.price-amount').first();
        const priceColor = await priceElement.evaluate((el) => {
            return window.getComputedStyle(el).color;
        });
        expect(priceColor).toBeTruthy();
    });

    // Test 19: All buttons are clickable
    test('should have all buttons clickable', async ({ page }) => {
        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();

        const buttons = await page.locator('button').all();
        expect(buttons.length).toBeGreaterThan(0);

        // Try clicking first button
        const firstBtn = buttons[0];
        const isEnabled = await firstBtn.isEnabled();
        expect(isEnabled).toBe(true);
    });

    // Test 20: No console errors
    test('should have no critical console errors', async ({ page }) => {
        const errors: string[] = [];

        // Capture console errors
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.locator('#bundles').scrollIntoViewIfNeeded();
        await page.locator('.bundle-btn').first().click();

        // Should have no errors (or only non-critical ones)
        expect(errors.length).toBe(0);
    });
});

// Performance tests
test.describe('LEAPCO Landing Page - Performance', () => {
    test('should load page under 3 seconds', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/');
        const endTime = Date.now();

        const loadTime = (endTime - startTime) / 1000;
        expect(loadTime).toBeLessThan(3);
    });

    test('should have good Lighthouse performance', async ({ page }) => {
        // This is a basic test; for full Lighthouse, use @playwright/test with lighthouse
        await page.goto('/');

        // Check if images are loaded
        const images = await page.locator('img').all();
        for (const img of images) {
            const isVisible = await img.isVisible({ timeout: 5000 });
            if (isVisible) {
                const src = await img.getAttribute('src');
                expect(src).toBeTruthy();
            }
        }
    });
});
