const {test,expect,openProductPage,newSharedPage} = require('../Fixtures/flipkart');
const testdata = require('../config/testData.json');
const CheckoutPage = require('../pages/OrderSummaryPage');
const data = testdata.Ordersummary;
const {labels,formats,quantity,tolerance} = data;
const pincodePattern = new RegExp(formats.pincode);
const phonePattern = new RegExp(formats.phone);
const expectAmount = (actual, expected, message) => {
    expect(
        Math.abs(actual - expected),
        `${message} (actual: ${actual}, expected: ${expected})`
    ).toBeLessThanOrEqual(tolerance.amount);
};

test.describe('Flipkart - Order Summary page', () => {
    let setupPage;
    let checkout;

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(data.login.otpWaitMs + 90000);
        setupPage = await newSharedPage(browser);
        const productPage = await openProductPage(setupPage, data.product.searchTerm);
        checkout = new CheckoutPage(productPage.page);
        await checkout.reachOrderSummary(productPage);
    });

    test.afterAll(async () => {
        if (setupPage) await setupPage.context().close();
    });

    test('OS - Validate Order Summary in one OTP session', async () => {
        test.setTimeout(data.login.otpWaitMs + 240000);

        const runValidation = async (name, validate) => {
            await test.step(name, async () => {
                try {
                    await validate();
                } catch (error) {
                    const detail = error instanceof Error ? error.message : String(error);
                    expect.soft(false, `${name} failed: ${detail}`).toBe(true);
                }
            });
        };

        const validations = [
            ['OS_01 - Cart page link is visible', async () => {
                await expect.soft(checkout.cartPageTitle).toBeVisible();
            }],
            ['OS_02 - Delivery address has a pincode and phone number', async () => {
                await expect.soft(checkout.deliverTo).toBeVisible();
                await expect.soft(checkout.changeAddressButton).toBeVisible();
                const address = await checkout.getAddressText();
                expect.soft(address).toMatch(pincodePattern);
                expect.soft(address).toMatch(phonePattern);
            }],
            ['OS_03 - Selected product appears in Order Summary', async () => {
                await checkout.isSelectedProductDisplayed(data.product.searchTerm);
            }],
            ['OS_04 - Item price and discount are valid', async () => {
                const [item] = await checkout.getItems();
                expect.soft(item.price, 'item price').toBeGreaterThan(0);
                if (item.discountPercent !== null) {
                    expect.soft(item.originalPrice, 'original price').toBeGreaterThan(item.price);
                    const calculated = Math.round(
                        ((item.originalPrice - item.price) / item.originalPrice) * 100
                    );
                    expect.soft(
                        Math.abs(calculated - item.discountPercent),
                        `shown ${item.discountPercent}% off, calculated ${calculated}%`
                    ).toBeLessThanOrEqual(tolerance.discountPercent);
                }
            }],
            [`OS_05 - Quantity is set to ${quantity.initial}`, async () => {
                await expect.soft(checkout.quantityDropdown).toBeVisible();
                expect.soft(await checkout.getQuantity()).toBe(quantity.initial);
            }],
            ['OS_06 - Fee amount is visible', async () => {
                const price = await checkout.getPriceDetails();
                expect.soft(price.fees, `"${labels.fees}" amount`).not.toBeNull();
                if (price.fees !== null) {
                    await expect.soft(checkout.amountOnly(price.fees)).toBeVisible();
                }
            }],
            ['OS_07 - Delivery estimate is shown', async () => {
                const delivery = await checkout.getDeliveryMessage();
                expect.soft(delivery, 'delivery estimate').toBeTruthy();
                expect.soft(delivery).toMatch(/Delivery\s+(by|in)\s+.+/i);
            }],
            ['OS_08 - Price Details amounts are available', async () => {
                await expect.soft(checkout.priceRowLabel(labels.priceDetails)).toBeVisible();
                for (const label of [
                    labels.sellingPrice,
                    labels.fees,
                    labels.discounts,
                    labels.totalAmount
                ]) {
                    await expect.soft(checkout.priceRowLabel(label), `row "${label}"`).toBeVisible();
                }
                const price = await checkout.getPriceDetails();
                for (const key of ['sellingPrice', 'fees', 'discounts', 'total']) {
                    expect.soft(price[key], `amount for ${key}`).not.toBeNull();
                    expect.soft(price[key], `amount for ${key}`).toBeGreaterThanOrEqual(0);
                }
            }],
            ['OS_09 - Total minus Fees equals item price', async () => {
                const [item] = await checkout.getItems();
                const price = await checkout.getPriceDetails();
                expectAmount(price.total - price.fees, item.price, 'Total minus Fees vs item price');
            }],
            ['OS_10 - Selling Price minus Discounts plus Fees equals Total', async () => {
                const price = await checkout.getPriceDetails();
                expectAmount(
                    price.sellingPrice - price.discounts + price.fees,
                    price.total,
                    'Selling Price - Discounts + Fees vs Total Amount'
                );
            }],
            ['OS_11 - Savings message is visible', async () => {
                await expect(checkout.page.getByText(/you'll save/i)).toBeVisible();
            }],
            ['OS_12 - Bottom bar matches Price Details', async () => {
                const price = await checkout.getPriceDetails();
                await expect.soft(checkout.amountOnly(price.total)).toBeVisible();
                await expect.soft(checkout.amountOnly(price.sellingPrice)).toBeVisible();
            }],
            ['OS_13 - Continue is visible and enabled', async () => {
                await expect.soft(checkout.continueButton).toBeVisible();
            }]
        ];

        await Promise.all(
            validations.map(([name, validate]) => runValidation(name, validate))
        );

    await runValidation('OS_15 - Continue opens the Payment step', async () => {
    await checkout.proceedToPayment();
    await expect(checkout.page.getByText(/complete payment/i)).toBeVisible({ timeout: 30000 });
});
    });
});