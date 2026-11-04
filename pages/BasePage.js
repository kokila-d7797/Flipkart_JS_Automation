class BasePage {

    constructor(page) {
        this.page = page;
    }

    async navigateToHome() {
        await this.page.goto('/');
    }

    async getPageTitle() {
        return await this.page.title();
    }

    async getCurrentURL() {
        return this.page.url();
    }

    async isVisible(locator) {
        return await locator.isVisible();
    }

    async getText(locator) {
        return (await locator.innerText()).trim();
    }
}

module.exports = BasePage;