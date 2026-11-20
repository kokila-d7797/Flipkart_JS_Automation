const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');

class ProductPage extends BasePage {
    constructor(page) {
        super(page);
        this.title = page.getByRole('heading', { level: 1 }).first();
        this.buyNowButton = page.getByText('Buy now', { exact: true }).first();
    }

    async waitForLoaded() {
        await this.title.waitFor({ state: 'visible' });
    }

    async getTitleStart(wordCount) {
        await this.waitForLoaded();
        const title = await this.getText(this.title);
        return title.split(/\s+/).slice(0, wordCount).join(' ');
    }

    loginForm(loginPage) {
        let locator = this.page.getByRole('textbox', { name: /mobile|phone|email/i });
        if (loginPage && loginPage.mobileInput) {
            locator = locator.or(loginPage.mobileInput);
        }
        return locator.first();
    }

    async buyNowAndWaitForLogin(loginPage) {
        await this.waitForLoaded();
        await expect(this.buyNowButton, 'Buy now should be visible').toBeVisible({ timeout: 20000 });
        await this.page.waitForLoadState('load');
        const loginForm = this.loginForm(loginPage);
        await expect(async () => {
            await this.buyNowButton.scrollIntoViewIfNeeded();
            await this.buyNowButton.click({ timeout: 5000 });
            await expect(loginForm).toBeVisible({ timeout: 4000 });
        }, 'Login form should appear after clicking Buy now').toPass({
            timeout: 40000,
            intervals: [500, 1500, 3000]
        });
    }

    async clickBuyNowAfterLogin() {
    console.log('Clicking Buy Now again after successful login...');

    await expect(this.buyNowButton,'Buy Now button should be visible after login').toBeVisible({ timeout: 20000 });
    await expect(this.buyNowButton).toBeEnabled();
    await this.buyNowButton.click();
}
}

module.exports = ProductPage;