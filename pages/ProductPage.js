const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');
class ProductPage extends BasePage {
    constructor(page) {
        super(page);

        // Role/text based locators instead of auto-generated CSS classes
        this.title = page.getByRole('heading', { level: 1 }).first();
        this.price = page.getByText(/₹\s?[\d,]+/).first();
        this.addToCartButton = page.getByRole('button', { name: /add to cart/i }).first();
        this.buyNowButton = page.getByRole('button', { name: /buy now/i })
            .or(page.getByText(/^buy now/i))
            .first();                                                      
    }

    async waitForLoaded() {
        await this.title.waitFor({ state: 'visible' });
    }

    // NEW: first N words of the title - used by the cart and order-summary checks
    async getTitleStart(wordCount) {
        await this.waitForLoaded();
        const title = await this.getText(this.title);   // BasePage.getText
        return title.split(/\s+/).slice(0, wordCount).join(' ');
    }

    // NEW
    async addToCart() {
        await this.addToCartButton.click();
    }

    // NEW
    async buyNow() {
        await this.buyNowButton.waitFor({ state: 'visible' });
        await this.buyNowButton.click();
    }

    async buyNowAndWaitForLogin(loginPage) {
    // Clear failure if this product has no Buy now button, or the locator is wrong
    await this.buyNowButton.waitFor({ state: 'visible', timeout: 15000 });

    await expect(async () => {
        if (!(await loginPage.mobileInput.isVisible())) {
            await this.buyNowButton.scrollIntoViewIfNeeded();
            await this.buyNowButton.click({ timeout: 5000 });
        }
        await expect(loginPage.mobileInput).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 30000 });
}
}

module.exports = ProductPage;
