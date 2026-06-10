# LEAPCO - Premium Car Drying Towels Landing Page

A high-converting, mobile-first Shopify landing page for LEAPCO premium microfiber car drying towels.

## Features

✨ **Premium Design**
- Dark theme with silver accents (automotive aesthetic)
- Mobile-first responsive design
- Smooth animations and transitions
- Clean, minimal interface

🚀 **High-Converting Layout**
- Hero section with immediate product image
- Bundle pricing visible without scrolling
- Clear product benefits section
- Lifestyle imagery
- Call-to-action optimized for conversion

🛒 **E-Commerce Functionality**
- Bundle selection (1, 2, 3 towel packs)
- Dynamic pricing ($30, $55.80, $76)
- Add to cart with instant feedback
- Cart modal with running total
- Local storage persistence
- Analytics event tracking ready

📱 **Responsive**
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (480px - 767px)
- Phone (< 480px)

## Project Structure

```
leapco/
├── index.html          # Main landing page
├── styles.css          # All styling (dark theme)
├── script.js           # Cart and interactions
├── tests.spec.ts       # Playwright automation tests
├── playwright.config.ts # Test configuration
├── package.json        # Dependencies
└── README.md          # This file
```

## Setup & Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Navigate to the project directory
cd /Users/jony/Desktop/order/leapco

# Install dependencies
npm install

# For Playwright, install browsers (required once)
npx playwright install chromium chrome
```

## Running the Landing Page

### Development Server

```bash
# Start local server on http://localhost:3000
npm run dev

# Or using http-server directly
npx http-server . -p 3000
```

Then open your browser to: `http://localhost:3000/leapco/`

## Testing with Playwright

### Run All Tests

```bash
# Run all tests
npm run test

# Run tests in Chrome only
npm run test:chrome

# Run tests on mobile viewport
npm run test:mobile

# Run tests in debug mode
npm run test:debug

# Run tests with UI (watch mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# View test report
npm run test:report
```

### Test Coverage

The test suite includes **20+ tests** covering:
- Page load and structure
- Hero section rendering
- Bundle display and pricing
- Add to cart functionality
- Modal interactions
- Mobile responsiveness
- Desktop layout
- CTA functionality
- Footer
- Color scheme verification
- Button functionality
- Console error checking
- Performance metrics

## Features Walkthrough

### 1. Hero Section
- Premium LEAPCO branding
- Main product title: "Premium Microfiber Drying Towels"
- Subtitle emphasizing quality
- Hero product image

### 2. Bundle Selection (Above Fold)
Users see **immediately** without scrolling:
- **Single Bundle**: $30 for 1 towel
  - Free carry bag
  
- **Duo Pack** (Most Popular): $55.80 for 2 towels
  - Save 7%
  - Perfect gift option
  
- **Triple Pack**: $76 for 3 towels
  - Save 15%
  - Best value

### 3. Benefits Section
Four key differentiators:
- 🧵 Premium Microfiber (400 GSM)
- 💧 Absorbent & Fast (7x water absorption)
- ✨ Streak-Free Finish
- 🔄 Durable & Long-lasting (500+ washes)

### 4. Lifestyle Section
Shows product in use with three lifestyle images:
- Professional Results
- Premium Quality
- Easy Maintenance

### 5. CTA Section
Call-to-action to encourage purchases

### 6. Footer
Copyright, policies, and contact links

## Customization

### Change Colors
Edit `:root` variables in `styles.css`:
```css
:root {
    --primary-dark: #0a0e27;
    --primary-black: #000000;
    --accent-silver: #c0c0c0;
    /* ... */
}
```

### Change Prices
Edit bundle prices in `index.html`:
```html
<span class="price-amount">$XX</span>
```

### Change Product Images
Replace placeholder URLs in `index.html`:
```html
<img src="https://your-image-url.com/image.jpg" alt="...">
```

### Add Analytics
The code is ready for Google Analytics integration:
```javascript
// In script.js, events are tracked:
cart.trackEvent('add_to_cart', { bundle, price, quantity });
```

## Shopify Integration

To integrate with Shopify:

1. **Option 1: Shopify Theme**
   - Copy HTML/CSS/JS into custom Shopify theme
   - Use Shopify Liquid templating for dynamic content
   - Replace checkout button with Shopify cart functionality

2. **Option 2: Shopify Sales Channel**
   - Host this landing page separately
   - Link to Shopify checkout via button
   - Use Shopify's REST API for cart management

3. **Option 3: Hydrogen (Recommended)**
   - Use as Shopify Hydrogen component
   - Built-in Shopify integration
   - Modern React-based approach

## Analytics & Tracking

The page tracks these events:
- `page_view` - User lands on page
- `add_to_cart` - User adds bundle to cart
- `checkout` - User proceeds to checkout

Ready to integrate with:
- Google Analytics 4 (GA4)
- Facebook Pixel
- Shopify Analytics
- Custom event tracking

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Mobile browsers:
- iOS Safari 14+
- Chrome Mobile (latest)
- Samsung Internet (latest)

## Performance

**Target Metrics:**
- Page Load Time: < 3 seconds
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

**Optimizations:**
- Minimal CSS/JS
- Lazy loading for images
- No external dependencies
- Static HTML + CSS + JS (no frameworks)

## SEO

The page includes:
- Semantic HTML structure
- Meta tags for social sharing
- Open Graph tags (ready to add)
- Structured data (ready to add)
- Mobile-friendly viewport
- Fast loading times

## API Reference

### LeapcoCart Class

```javascript
// Create cart instance
const cart = new LeapcoCart();

// Add item
cart.addToCart(event);

// Get total
cart.getCartTotal(); // Returns number

// Show modal
cart.showCartModal(item, bundleName);

// Close modal
cart.closeModal();

// Save to storage
cart.saveToStorage();

// Track event
cart.trackEvent('eventName', { data });
```

## Troubleshooting

### Tests Not Running
```bash
# Install Playwright browsers
npx playwright install chromium chrome

# Clear cache
rm -rf node_modules/.cache
npm install
```

### Server Won't Start
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Kill process on port 3000 if needed
kill -9 <PID>
```

### Images Not Loading
- Check placeholder URL is accessible
- Ensure image CDN is reachable
- Verify image paths in HTML

## License

MIT License - feel free to use and modify

## Support

For issues or questions about this landing page, check the test suite (`tests.spec.ts`) for expected behavior.

---

**Last Updated:** June 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
