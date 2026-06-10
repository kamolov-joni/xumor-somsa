// LEAPCO Cart Management and Interactions

class LeapcoCart {
    constructor() {
        this.items = [];
        this.initializeEventListeners();
        this.loadFromStorage();
    }

    initializeEventListeners() {
        // Bundle button listeners
        document.querySelectorAll('.bundle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.addToCart(e));
        });

        // Modal close button
        document.querySelector('.close').addEventListener('click', () => this.closeModal());

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('cartModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    addToCart(event) {
        const button = event.target;
        const bundle = button.getAttribute('data-bundle');
        const price = parseFloat(button.getAttribute('data-price'));
        const quantity = parseInt(button.getAttribute('data-quantity'));

        const item = {
            id: Date.now(),
            bundle: bundle,
            price: price,
            quantity: quantity,
            total: price * quantity,
        };

        this.items.push(item);
        this.saveToStorage();
        this.showCartModal(item, bundle);
        this.trackEvent('add_to_cart', { bundle, price, quantity });
    }

    showCartModal(item, bundleName) {
        const modal = document.getElementById('cartModal');
        const cartDetails = document.getElementById('cartDetails');

        const bundleLabel = {
            'single': '1x Premium Microfiber Towel',
            'duo': '2x Premium Microfiber Towels',
            'triple': '3x Premium Microfiber Towels'
        }[bundleName] || bundleName;

        cartDetails.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <p style="font-size: 1rem; color: var(--text-light); margin-bottom: 0.5rem;">
                    <strong>${bundleLabel}</strong>
                </p>
                <p style="color: var(--accent-silver); font-size: 1.3rem; font-weight: 700;">
                    $${item.price.toFixed(2)}
                </p>
            </div>
            <div style="padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <p style="color: var(--text-muted); font-size: 0.9rem;">
                    Items in cart: <strong style="color: var(--accent-silver);">${this.items.length}</strong>
                </p>
                <p style="color: var(--text-muted); font-size: 0.9rem;">
                    Total: <strong style="color: var(--accent-silver);">$${this.getCartTotal().toFixed(2)}</strong>
                </p>
            </div>
        `;

        modal.style.display = 'block';
    }

    getCartTotal() {
        return this.items.reduce((total, item) => total + item.total, 0);
    }

    closeModal() {
        document.getElementById('cartModal').style.display = 'none';
    }

    saveToStorage() {
        localStorage.setItem('leapcoCart', JSON.stringify(this.items));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('leapcoCart');
        if (stored) {
            this.items = JSON.parse(stored);
        }
    }

    trackEvent(eventName, data) {
        // For analytics integration (Google Analytics, Facebook Pixel, etc.)
        if (typeof window.gtag !== 'undefined') {
            window.gtag('event', eventName, data);
        }
        console.log(`Event: ${eventName}`, data);
    }
}

// Initialize cart on page load
let cart;
document.addEventListener('DOMContentLoaded', () => {
    cart = new LeapcoCart();

    // Log page view
    if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href
        });
    }
});

// Global functions for modal buttons
function checkout() {
    const total = cart.getCartTotal();
    // Redirect to Shopify checkout or payment processor
    // For now, just log and show confirmation
    alert(`Proceeding to checkout with total: $${total.toFixed(2)}`);
    // In production: window.location.href = 'https://your-shopify-store.com/checkout';
    cart.trackEvent('checkout', { total: total, items: cart.items.length });
}

function closeModal() {
    cart.closeModal();
}

// Smooth scroll enhancement
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src') || img.src;
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Button ripple effect on click
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Performance: Preload hero image
window.addEventListener('load', () => {
    const heroImg = document.getElementById('heroImage');
    if (heroImg && heroImg.src.includes('placeholder')) {
        // Image is loaded, log it
        console.log('Hero image loaded');
    }
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const menu = document.querySelector('.mobile-menu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LeapcoCart };
}
