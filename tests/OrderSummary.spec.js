const {test,expect,openProductPage,newSharedPage} = require('../Fixtures/flipkart');
const testdata = require('../config/testData.json');
const CheckoutPage = require('../pages/CheckoutPage');
const data = testdata.Ordersummary;
const {labels,formats,quantity,tolerance} = data;
const pincodePattern = new RegExp(formats.pincode);
const phonePattern = new RegExp(formats.phone);
const paymentPagePattern = new RegExp(data.paymentPageMarkers, 'i');

// Helper functions
const sum = (items, key) =>items.reduce((total, item) => total + (item[key] || 0), 0);

const expectAmount = (actual, expected, message) => {
    expect(
        Math.abs(actual - expected),
        `${message} (actual: ${actual}, expected: ${expected})`
    ).toBeLessThanOrEqual(tolerance.amount);
};

test.describe.configure({ mode: 'serial' });

test.describe('Flipkart - Order Summary page', () => {
    let setupPage;
    let checkout;
  
test.beforeAll(async ({ browser }) => {
    test.setTimeout(data.login.otpWaitMs + 25000);
    setupPage = await newSharedPage(browser);
    const productPage = await openProductPage(setupPage);
    checkout = new CheckoutPage(productPage.page);
    await checkout.reachOrderSummary(productPage);
});

    test.afterAll(async () => {
        if (setupPage) await setupPage.context().close();
    });
    test('OS_01 - Verify Cart Page Title is visible', async () => {

        await expect(checkout.cartPageTitle,'Cart page title image should be visible').toBeVisible();
    });

    test('OS_02 - Delivery address has a pincode, phone number and a Change button', async () => {
        await expect(checkout.deliverTo).toBeVisible();
        await expect(checkout.changeAddressButton).toBeVisible();
        const address = await checkout.getAddressText(checkout.productTitleStart);
        expect(address, 'pincode in the address').toMatch(pincodePattern);
        expect(address, 'phone number in the address').toMatch(phonePattern);
    });

    test('OS_03 - The product added is listed in the order', async () => {
        await expect(checkout.itemWithText(checkout.productTitleStart)).toBeVisible({ timeout: 15000 });
    });

    test('OS_04 - Item price is valid and the discount % matches the prices', async () => {
        const [item] = await checkout.getItems();
        expect(item.price, 'item price').toBeGreaterThan(0);
        test.skip(item.discountPercent === null, 'This item shows no discount');
        expect(item.originalPrice, 'original price').toBeGreaterThan(item.price);
        const calculated = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
        expect(
            Math.abs(calculated - item.discountPercent),
            `shown ${item.discountPercent}% off, calculated ${calculated}% from ${item.originalPrice} and ${item.price}`
        ).toBeLessThanOrEqual(tolerance.discountPercent);
    });

    test('OS_05 - Quantity starts at the expected value', async () => {
        await expect(checkout.quantityDropdown).toBeVisible();
        expect(await checkout.getQuantity()).toBe(quantity.initial);
    });

    test('OS_06 - Protect Promise Fee under the item equals Fees in Price Details', async () => {
        const items = await checkout.getItems();
        const price = await checkout.getPriceDetails();
        expect(price.fees, `"${labels.fees}" row in Price Details`).not.toBeNull();
        expectAmount(sum(items, 'fee'), price.fees, 'Fee under item vs Fees in Price Details');
    });

    test('OS_07 - Delivery date is shown for the item', async () => {
    const deliveryText = await checkout.getDeliveryMessage();
    expect(deliveryText,'Delivery estimate should be displayed on Order Summary').toBeTruthy();
    expect(deliveryText).toMatch(/Delivery\s+(by|in)\s+.+/i);
    });

    test('OS_08 - Price Details shows Selling Price, Fees, Discounts and Total Amount', async () => {
        await expect(checkout.priceRowLabel(labels.priceDetails)).toBeVisible();
        const rows = [labels.sellingPrice, labels.fees, labels.discounts, labels.totalAmount];
        for (const row of rows) {
            await expect(checkout.priceRowLabel(row), `row "${row}"`).toBeVisible();
        }
        const price = await checkout.getPriceDetails();
        for (const key of ['sellingPrice', 'fees', 'discounts', 'total']) {
            expect(price[key], `amount for ${key}`).not.toBeNull();
            expect(price[key], `amount for ${key}`).toBeGreaterThanOrEqual(0);
        }
    });

    test('OS_09 - Total Amount minus Fees equals the item price', async () => {
        const items = await checkout.getItems();
        const price = await checkout.getPriceDetails();
        const itemsTotal = sum(items, 'price');
        console.log(`Total ${price.total} - Fees ${price.fees} = ${price.total - price.fees} | item price ${itemsTotal}`);
        expectAmount(price.total - price.fees, itemsTotal, 'Total Amount - Fees vs item price');
    });

    test('OS_10 - Selling Price - Discounts + Fees equals Total Amount', async () => {
        const price = await checkout.getPriceDetails();
        const calculated = price.sellingPrice - price.discounts + price.fees;
        console.log(`${price.sellingPrice} - ${price.discounts} + ${price.fees} = ${calculated} | Total ${price.total}`);
        expectAmount(calculated, price.total, 'Selling Price - Discounts + Fees vs Total Amount');
    });

    test('OS_11 - Savings amount is displayed correctly', async () => {
    const price = await checkout.getPriceDetails();
    expect(price.savings, 'Savings message amount').not.toBeNull();
    expectAmount(price.savings,price.sellingPrice - price.total,'Savings should equal Selling Price - Total');
});

    test('OS_12 - Bottom bar shows the same total and original price as Price Details', async () => {
        const price = await checkout.getPriceDetails();
        await expect(checkout.amountOnly(price.total), 'bottom bar total').toBeVisible();
        await expect(checkout.amountOnly(price.sellingPrice), 'bottom bar struck-through price').toBeVisible();
    });

    test('OS_13 - Continue button is visible and enabled', async () => {
        await expect(checkout.continueButton).toBeVisible();
        await expect(checkout.continueButton).toBeEnabled();
    });

    test('OS_14 - Changing the quantity updates the total, and restoring brings it back', async () => {
        const before = await checkout.getPriceDetails();
        try {
            await checkout.setQuantity(quantity.updated);
            await expect(checkout.quantityToast(quantity.updated)).toBeVisible();
            await expect.poll(() => checkout.getQuantity()).toBe(quantity.updated);
            await expect.poll(async () => (await checkout.getPriceDetails()).total)
                .toBeGreaterThan(before.total);
        } finally {
            await checkout.restoreQuantity(quantity.initial);
        }
        await expect.poll(async () => (await checkout.getPriceDetails()).total).toBe(before.total);
    });

    test('OS_15 - Continue opens the Payment step', async () => {
        await checkout.proceedToPayment();
        await expect(checkout.page.getByText(paymentPagePattern).first()).toBeVisible();
    });
});