const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const testdata = require('../config/testData.json');
const data = testdata.Ordersummary;
const { labels, formats } = data;
const LoginPage = require('./LoginPage');
const { getMobile } = require('../config/env');

// Order Summary step (Address > Order Summary > Payment) reached after Buy now + login

class CheckoutPage extends BasePage {
    constructor(page) {
        super(page);
        this.bindLocators(page);
    }

    bindLocators(page) {
        this.deliverTo = page.getByText(labels.deliverTo);
        this.cartPageTitle = this.page.locator("//div[@class='css-g5y9jx r-1awozwy r-1777fci r-1udh08x']//div//img");
        this.changeAddressButton = page.getByRole('button', { name: labels.change });
        this.quantityDropdown = page.getByText(/^Qty:\s*\d+/).first();
        this.moreOption = page.getByText('more', { exact: true });
        this.quantityDialogTitle = page.getByText('Enter Quantity');
        this.quantityInput = page.getByRole('spinbutton', { name: 'Quantity' }).or(page.getByRole('textbox', { name: 'Quantity' }));
        this.applyButton = page.getByRole('button', { name: /^apply$/i });
        this.cancelButton = page.getByRole('button', { name: /^cancel$/i });
        this.continueButton = page.getByRole('button', {name: new RegExp(`^${labels.continue}$`, 'i')}).or(page.getByText(new RegExp(`^${labels.continue}$`, 'i'))).first();
        this.deliveryMessage = this.page.getByText(/Delivery by/i).first();
    }

    escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    parseAmount(value) {
    if (!value) return 0;

    return Number(
        String(value).replace(/[₹,\s]/g, '')
    );
    }

    async waitForLoaded() {
        await this.deliverTo.waitFor({ state: 'visible' });
    }

    async getBodyText() {
        return await this.page.locator('body').innerText();
    }

    async isCartPageTitleVisible() {
        await expect(this.cartPageTitle).toBeVisible({timeout: 10000
    });

    return await this.cartPageTitle.isVisible();
    }

    async reachOrderSummary(productPage) {
    const mobile = getMobile();
    const login = new LoginPage(this.page);

    this.productTitleStart = await productPage.getTitleStart(
        data.product.titleWordCount
    );

    // STEP 1: Click Buy Now and wait for login panel
console.log('Step 1: Clicking Buy Now...');

await productPage.buyNowAndWaitForLogin(login);

// STEP 2: Enter mobile number and request OTP
console.log('Step 2: Entering mobile number...');

await login.requestOtp(
    mobile,
    data.login.otpPageTimeoutMs
);

// STEP 3: Complete OTP manually
console.log('Step 3: Waiting for manual OTP entry...');

await login.completeOtpManually(data.login.otpWaitMs);

console.log('Step 4: OTP verification submitted.');

// STEP 5: Click Buy Now again after login
await productPage.clickBuyNowAfterLogin();

// STEP 6: Wait for Order Summary
console.log('Step 5: Waiting for Order Summary...');

await this.waitForOrderSummaryPage(60000);

await this.waitForLoaded();

console.log('Step 6: Order Summary page loaded successfully.');
}

    // Looks through every open page in the browser context until one shows the
    // Order Summary ("Deliver to"), then points this page object at it.
    async waitForOrderSummaryPage(timeout) {
        const context = this.page.context();
        let found = null;

        await expect.poll(async () => {
            for (const candidate of context.pages()) {
                if (candidate.isClosed()) continue;
                const visible = await candidate
                    .getByText(labels.deliverTo)
                    .first()
                    .isVisible()
                    .catch(() => false);
                if (visible) {
                    found = candidate;
                    return true;
                }
            }
            return false;
        }, {
            message: 'Order Summary page should open after OTP entry',
            timeout,
            intervals: [1000]
        }).toBe(true);

        if (found !== this.page) {
            await found.bringToFront();
            this.page = found;
            this.bindLocators(found);
        }
    }

    // ---------- locators built from test data ----------

    stepLabel(step) {
        return this.page.getByText(step, { exact: true }).first();
    }

    priceRowLabel(label) {
        return this.page.getByText(label, { exact: true }).first();
    }

    itemWithText(text) {
        return this.page.getByText(text).first();
    }

    // The bottom bar shows plain numbers (no rupee sign), e.g. "71,296"
    amountOnly(amount) {
        return this.page.getByText(this.formatAmount(amount), { exact: true }).first();
    }

    quantityToast(quantity) {
        return this.page.getByText(new RegExp(`successfully updated quantity of.*\\bto ${quantity}\\b`, 'i'));
    }

    async getQuantity() {
        const text = await this.getText(this.quantityDropdown);
        return Number(text.match(/\d+/)[0]);
    }

    // Price Details panel: { sellingPrice, fees, discounts, total, savings }
    async getPriceDetails() {
        const bodyText = await this.page.locator('body').innerText();

const savingsMatch = bodyText.match(
    /You['’]ll\s+save\s*₹?\s*([\d,]+)/i
);

const savings = savingsMatch
    ? Number(savingsMatch[1].replace(/,/g, ''))
    : null;

        return {
    sellingPrice,
    total,
    savings
};
    }

    async getTotalAmount() {
        const body = await this.page.locator('body').innerText();
        const match = body.match(/Total Amount\s*₹\s*([\d,]+)/i);
        if (!match) throw new Error('Total Amount not found on the Order Summary page');
        return Number(match[1].replace(/,/g, ''));
    }

    // Every item in the order: { quantity, price, originalPrice, discountPercent, fee }
    // Each item is found by its "Qty: n" selector and ends at the next item-end marker.
    async getItems() {
        const text = await this.getBodyText();
        const regionStart = Math.max(text.indexOf(labels.deliverTo), 0);
        const endMarkers = new RegExp(labels.itemEndMarkers.map((m) => this.escapeRegExp(m)).join('|'), 'i');
        const feeRegex = new RegExp(`\\+\\s*₹\\s*([\\d,]+)\\s*${this.escapeRegExp(labels.protectPromiseFee)}`, 'i');

        const quantities = [...text.matchAll(/Qty:\s*(\d+)/g)].filter((m) => m.index >= regionStart);
        if (quantities.length === 0) {
            throw new Error('No items found (no "Qty: n" text) on the Order Summary page');
        }

        const items = [];
        let from = regionStart;
        for (const qty of quantities) {
            const rest = text.slice(qty.index);
            const markerAt = rest.search(endMarkers);
            const to = markerAt === -1 ? text.length : qty.index + markerAt;
            const region = text.slice(from, to);
            from = to;

            const feeMatch = region.match(feeRegex);
            const pricePart = feeMatch ? region.slice(0, feeMatch.index) : region;

            // "51% ₹1,45,525 ₹70,990" -> discount, original price, price
            const discounted = pricePart.match(/(\d+)\s*%\s*₹\s*([\d,]+)\s*₹\s*([\d,]+)/);
            let price, originalPrice = null, discountPercent = null;
            if (discounted) {
                discountPercent = Number(discounted[1]);
                originalPrice = this.parseAmount(discounted[2]);
                price = this.parseAmount(discounted[3]);
            } else {
                const amounts = [...pricePart.matchAll(/₹\s*([\d,]+)/g)].map((m) => this.parseAmount(m[1]));
                price = amounts.length ? amounts[amounts.length - 1] : null;
            }

            items.push({
                quantity: Number(qty[1]),
                price,
                originalPrice,
                discountPercent,
                fee: feeMatch ? this.parseAmount(feeMatch[1]) : 0
            });
        }
        return items;
    }

    // Text of the delivery address block (from "Deliver to:" until the product title)
    async getAddressText(untilText) {
    const text = await this.page.locator('body').innerText();

    const start = text.indexOf(labels.deliverTo);

    if (start === -1) {
        throw new Error(`"${labels.deliverTo}" was not found on the page`);
    }

    let end = untilText ? text.indexOf(untilText, start) : -1;

    if (end === -1) {
        end = text.search(/Qty:\s*\d+/);
    }

    return text.slice(start, end === -1 ? undefined : end).trim();
}

    // ---------- actions ----------

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

    async getDeliveryMessage() {
    const bodyText = await this.page.locator('body').innerText();

    return bodyText
        .split('\n')
        .map(text => text.trim())
        .find(text => /Delivery\s+(by|in)\s+.+/i.test(text));
}
}

module.exports = CheckoutPage;