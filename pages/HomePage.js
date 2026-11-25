const BasePage = require('./BasePage');

class HomePage extends BasePage {
    constructor(page) {
        super(page);
        this.logo = page.getByRole('banner').first();
        this.searchBox = page.getByRole('textbox', {name: /search for products, brands and more/i}).first();
        this.loginPopupField = page.getByRole('textbox', {name: /phone number/i}).first();
        this.loginPopupCloseButton = page.getByRole('button', {name: /✕|×|close/i}).first();
        this.loginLink = page.getByRole('link', {name: /^login$/i}).first();
    }

    async navigateToHome() {
        await this.page.goto('/', {waitUntil: 'domcontentloaded'});
        await this.dismissLoginPopup();
        await this.searchBox.or(this.loginPopupField).waitFor({state: 'visible'});

        if (await this.loginPopupField.isVisible()) {
            await this.dismissLoginPopup();
        }

        await this.searchBox.waitFor({ state: 'visible' });
    }
    
    async dismissLoginPopup() {
        const closeButton = this.page.getByRole('button', {name: '✕',exact: true});
        try {
            await closeButton.waitFor({state: 'visible',timeout: 3000});
            await closeButton.click();
            await this.loginPopupField.waitFor({state: 'hidden',timeout: 5000});
        } catch (error) {
            const popupStillVisible = await this.loginPopupField.isVisible().catch(() => false);
            if (popupStillVisible) {
                throw new Error(`Login popup is visible but could not be closed: ${error.message}`);
            }
        }
    }

    async typeInSearch(query) {
        await this.searchBox.fill(query);
    }

    async clearSearch() {
        await this.searchBox.clear();
    }

    async searchFor(query) {
        await this.typeInSearch(query);
        if (!query.trim()) return;

        await this.searchBox.press('Enter');
        await this.page.waitForURL(/\/search(?:\?|$)/i);
    }

    async openLogin() {
        await this.dismissLoginPopup();
        await this.loginLink.click();
        await this.page.waitForURL(/\/login/i);
    }
}

module.exports = HomePage;