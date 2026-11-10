
const BasePage = require('./BasePage');

class HomePage extends BasePage {
    constructor(page) {
        super(page);
        this.logo = page.getByRole('banner').first();
        this.searchBox = page.getByRole('textbox', {name: /search for products, brands and more/i}).first();
        this.loginPopupField = page.getByRole('spinbutton', {name: /phone number/i}).first();
        this.loginPopupCloseButton = page.getByRole('button', {name: /✕|×|close/i}).first();
    }

    async navigateToHome() {
        await this.page.goto('/', {waitUntil: 'domcontentloaded'});
        await this.searchBox.waitFor({ state: 'visible' });
        await this.dismissLoginPopup();
    }

    
    async dismissLoginPopup() {
        const closeButton = this.page.getByRole('button', {name: '✕',exact: true});
        try {
        await closeButton.waitFor({state: 'visible',timeout: 3000});
        await closeButton.click();

        // Confirm that the popup has closed.
        await this.loginPopupField.waitFor({state: 'hidden',timeout: 5000});
    } 
    catch (error) {
        const popupStillVisible = await this.loginPopupField.isVisible().catch(() => false);
        if (popupStillVisible) {
            throw new Error('Login popup is visible but could not be closed. ' +error.message);
        }
    }
}
}

module.exports = HomePage;