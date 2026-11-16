const BasePage = require('./BasePage');

class CartPage extends BasePage {
    constructor(page) {
        super(page);
        this.itemLinks = page.locator('a[href*="/p/"]').filter({ hasText: /\S/ });
        this.removeButton = page.getByText('Remove', { exact: true });
        this.emptyCartMessage = page.getByText(/your cart is empty|missing cart items/i).first();
    }

    async open(cartPath) {
        await this.page.goto(cartPath, { waitUntil: 'domcontentloaded' });
    }

    itemWithText(text) {
        return this.itemLinks.filter({ hasText: text }).first();
    }

    async removeFirstItem() {
        await this.removeButton.first().click();
        await this.removeButton.last().click(); // confirmation dialog also has a "Remove"
    }
}

module.exports = CartPage;
