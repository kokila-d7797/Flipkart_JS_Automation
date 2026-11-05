const BasePage = require('./BasePage');

class ProductPage extends BasePage {
    constructor(page) {
        super(page);

        // Role/text based locators instead of auto-generated CSS classes
        this.title = page.getByRole('heading', { level: 1 }).first();
        this.price = page.getByText(/₹\s?[\d,]+/).first();
        this.addToCartButton = page.getByRole('button', { name: /add to cart/i }).first();
    }

    async waitForLoaded() {
        await this.title.waitFor({ state: 'visible' });
    }
}

module.exports = ProductPage;