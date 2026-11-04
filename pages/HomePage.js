const BasePage = require('./BasePage');

class HomePage extends BasePage {
    constructor(page) {
        super(page);
        this.logo = page.getByRole('banner').first();
        this.searchBox = page.getByRole('textbox', { name: /search for products, brands and more/i }).first();
        this.loginLink = page.getByRole('link', { name: /login/i }).first();
        this.loginPopupField = page.getByRole('spinbutton', { name: /phone number/i }).first();
        this.loginPopupCloseButton = page.getByRole('button', { name: '✕' }).first();
        this.navigation = page.getByRole('navigation').first();
    }

    async navigateToHome() {
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });
        await this.searchBox.waitFor({ state: 'visible' });
        await this.dismissLoginPopup();
    }

    async dismissLoginPopup() {
        if (await this.loginPopupField.isVisible().catch(() => false)) {
            if (await this.loginPopupCloseButton.isVisible().catch(() => false)) {
                await this.loginPopupCloseButton.click();
            } else if (new URL(this.page.url()).pathname === '/login') {
                await this.page.goto('/', { waitUntil: 'domcontentloaded' });
            } else {
                await this.page.keyboard.press('Escape');
            }
            await this.loginPopupField.waitFor({ state: 'hidden' });
        }
    }

    async typeInSearch(searchText) {
        await this.dismissLoginPopup();
        await this.searchBox.waitFor({ state: 'visible' });
        await this.searchBox.fill(searchText);
    }

    async clearSearch() {
        await this.dismissLoginPopup();
        await this.searchBox.fill('');
    }

    async searchFor(term) {
        await this.typeInSearch(term);
        await this.searchBox.press('Enter');
    }

    async clickLogo() {
        await this.logo.click();
    }

    async openLogin() {
        await this.dismissLoginPopup();

        try {
            await this.loginLink.waitFor({ state: 'visible', timeout: 8000 });
        } catch {
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await this.loginLink.waitFor({ state: 'visible', timeout: 12000 });
        }

        await this.loginLink.click({ force: true });
        await this.loginPopupField.waitFor({ state: 'visible' });
    }
}

module.exports = HomePage;