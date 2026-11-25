const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');
const testdata = require('../config/testData.json');
const data = testdata.Ordersummary;
const { labels, formats } = data;
const LoginPage = require('./LoginPage');
const { getMobile } = require('../config/env');

// Order Summary step (Address > Order Summary > Payment) reached after Buy now + login

class OrderSummaryPage extends BasePage {
    constructor(page) {
        super(page);
        this.bindLocators(page);
    }

    bindLocators(page) {
        this.deliverTo = page.getByText(labels.deliverTo, { exact: true });
        this.cartPageTitle = page.getByRole('link', { name: /\bCart\b/i }).first();
        this.changeAddressButton = page.getByText('Change', { exact: true });
        this.quantityDropdown = page.getByText(/^Qty:\s*\d+/).first();
        this.moreOption = page.getByText(/^more$/i);
        this.quantityDialogTitle = page.getByText('Enter Quantity');
        this.quantityInput = page.getByRole('spinbutton', { name: 'Quantity' }).or(page.getByRole('textbox', { name: 'Quantity' }));
        this.applyButton = page.getByRole('button', { name: /^apply$/i });
        this.cancelButton = page.getByRole('button', { name: /^cancel$/i });
        this.continueButton = page.getByText(new RegExp(labels.continue, 'i')).last();
        this.deliveryMessage = page.getByText(/Delivery\s+(by|in)/i).first();
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

    async getCartItemCount() {
        const orderItems = this.page.getByText(/^Qty:\s*\d+/);
        const orderItemCount = await orderItems.count();
        if (orderItemCount > 0) return orderItemCount;

        const bodyText = await this.getBodyText();
        const match = bodyText.match(/Cart\s*\((\d+)\s*items?\)/i);

        if (!match) {
            throw new Error('Cart item count was not found on the Order Summary page');
        }

        return Number(match[1]);
    }

    async isSelectedProductDisplayed(productName) {
        expect(productName, 'Selected product title should be available').toBeTruthy();
        await expect(this.itemWithText(productName)).toBeVisible();
    }

    async isCartPageTitleVisible() {
        await expect(this.cartPageTitle).toBeVisible({timeout: 10000
    });

    return await this.cartPageTitle.isVisible();
    }

    async reachOrderSummary(productPage) {
    const mobile = getMobile();
    const login = new LoginPage(this.page);

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

// STEP 5: Wait for Order Summary directly after OTP
console.log('Step 5: Waiting for Order Summary page after OTP verification...');

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
        return this.page.getByText(this.formatAmount(amount), { exact: false }).last();
    }

    formatAmount(amount) {
        return Number(amount).toLocaleString('en-IN');
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
        const getAmountAfterLabel = (label) => {
            const match = bodyText.match(
                new RegExp(`${this.escapeRegExp(label)}\\s*₹\\s*([\\d,]+)`, 'i')
            );
            return match ? this.parseAmount(match[1]) : null;
        };
        const savingsMatch = bodyText.match(new RegExp(formats.savings, 'i'));
        return {
            sellingPrice: getAmountAfterLabel(labels.sellingPrice),
            fees: getAmountAfterLabel(labels.fees),
            discounts: getAmountAfterLabel(labels.discounts),
            total: getAmountAfterLabel(labels.totalAmount),
            savings: savingsMatch ? this.parseAmount(savingsMatch[1]) : null
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
            const cartStart = text.search(/Cart\s*\(\d+\s*items?\)/i);
            if (cartStart === -1) {
                throw new Error('No cart item summary was found on the Order Summary page');
            }

            const itemText = text.slice(cartStart);
            const end = itemText.search(/Use GST Invoice|Price Details/i);
            const region = end === -1 ? itemText : itemText.slice(0, end);
            const amounts = [...region.matchAll(/₹\s*([\d,]+)/g)]
                .map((match) => this.parseAmount(match[1]));
            if (amounts.length === 0) {
                throw new Error('No item prices were found in the Order Summary');
            }

            const discountMatch = region.match(/(\d+)\s*%\s*off/i);
            const feeMatch = region.match(feeRegex);
            return [{
                quantity: data.quantity.initial,
                price: amounts.length > 1 ? amounts[1] : amounts[0],
                originalPrice: amounts.length > 1 ? amounts[0] : null,
                discountPercent: discountMatch ? Number(discountMatch[1]) : null,
                fee: feeMatch ? this.parseAmount(feeMatch[1]) : 0
            }];
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

    // Text of the delivery address block, ending before the cart item summary.
    async getAddressText() {
    const text = await this.page.locator('body').innerText();

    const start = text.indexOf(labels.deliverTo);

    if (start === -1) {
        throw new Error(`"${labels.deliverTo}" was not found on the page`);
    }

    let end = text.search(/Cart\s*\(\d+\s*items?\)/i);

    if (end === -1) end = text.search(/Qty:\s*\d+/);

    return text.slice(start, end === -1 ? undefined : end).trim();
}

    // ---------- actions ----------

    async openQuantityDialog() {
        await this.quantityDropdown.click({ timeout: 10000 });
        await this.moreOption.click({ timeout: 10000 });
        await expect(this.quantityDialogTitle).toBeVisible({ timeout: 10000 });
    }

    async setQuantity(quantity) {
        await this.openQuantityDialog();
        await this.quantityInput.fill(String(quantity), { timeout: 10000 });
        await this.applyButton.click({ timeout: 10000 });
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
        await this.continueButton.click({ timeout: 10000 });
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