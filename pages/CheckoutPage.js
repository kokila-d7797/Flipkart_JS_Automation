const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

// Order Summary step (Address > Order Summary > Payment) reached after Buy now + login
class CheckoutPage extends BasePage {
    constructor(page) {
        super(page);
        this.deliverTo = page.getByText('Deliver to:');
        this.quantityDropdown = page.getByText(/^Qty:\s*\d+/).first();
        this.moreOption = page.getByText('more', { exact: true });
        this.quantityDialogTitle = page.getByText('Enter Quantity');
        this.quantityInput = page.getByRole('spinbutton', { name: 'Quantity' })
            .or(page.getByRole('textbox', { name: 'Quantity' }));
        this.applyButton = page.getByRole('button', { name: /^apply$/i }).or(page.getByText(/^apply$/i)).first();
        this.cancelButton = page.getByRole('button', { name: /^cancel$/i }).or(page.getByText(/^cancel$/i)).first();
        this.continueButton = page.getByRole('button', { name: /^continue$/i }).or(page.getByText(/^continue$/i)).first();
    }

    async waitForLoaded() {
        await this.deliverTo.waitFor({ state: 'visible' });
    }

    itemWithText(text) {
        return this.page.getByText(text).first();
    }

    async getQuantity() {
        const text = await this.getText(this.quantityDropdown);
        return Number(text.match(/\d+/)[0]);
    }

    async getTotalAmount() {
        const body = await this.page.locator('body').innerText();
        const match = body.match(/Total Amount\s*₹\s*([\d,]+)/i);
        if (!match) throw new Error('Total Amount not found on the Order Summary page');
        return Number(match[1].replace(/,/g, ''));
    }

    quantityToast(quantity) {
        return this.page.getByText(new RegExp(`successfully updated quantity of.*\\bto ${quantity}\\b`, 'i'));
    }

    async openQuantityDialog() {
        await this.quantityDropdown.click();
        await this.moreOption.click();
        await expect(this.quantityDialogTitle).toBeVisible();
    }

    async setQuantity(quantity) {
        await this.openQuantityDialog();
        await this.quantityInput.fill(String(quantity));
        await this.applyButton.click();
    }

    async restoreQuantity(quantity) {
        if (await this.quantityDialogTitle.isVisible()) {
            await this.cancelButton.click();
        }
        if ((await this.getQuantity()) !== quantity) {
            await this.setQuantity(quantity);
            await expect.poll(() => this.getQuantity()).toBe(quantity);
        }
    }

    async proceedToPayment() {
        await this.continueButton.click();
    }
}

module.exports = CheckoutPage;
