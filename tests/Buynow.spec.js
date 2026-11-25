const { test, expect, openProductPage, newSharedPage, mobile } = require('../fixtures/flipkart');
const LoginPage = require('../pages/LoginPage');
const CheckoutPage = require('../pages/OrderSummaryPage');
const testData = require('../config/testData.json');

const buy = testData.BuyNow;
const otp = testData.loginotp;
const orderSummary = testData.Ordersummary;
const pincodePattern = new RegExp(orderSummary.formats.pincode);
const phonePattern = new RegExp(orderSummary.formats.phone);

test.describe('Buy now - guest (no OTP)', () => {
    test.describe.configure({ timeout: 120000 });

    test('BUY-01 - Buy now button is visible and enabled @smoke', async ({ productPage }) => {
        await expect(productPage.buyNowButton).toBeVisible();
        await expect(productPage.buyNowButton).toBeEnabled();
    });

    test('BUY-02 - Buy now opens the login panel @smoke', async ({ productPage, productLoginPage }) => {
        await productPage.buyNowAndWaitForLogin(productLoginPage);
        await expect(productLoginPage.mobileInput).toBeVisible();
    });
});

// One login for the whole block: BUY-03 is the OTP step (you type the OTP, the script clicks Verify).
// The block is serial, so if BUY-03 fails every later test is skipped instead of failing on a logged-out page.
test.describe('Buy now - after login (you type the OTP) @manual-otp', () => {
    test.skip(!mobile, 'Set FLIPKART_MOBILE in .env to run the OTP tests');
    test.describe.configure({ mode: 'serial' });

    let productPage;
    let loginPage;
    let checkoutPage;

    // Setup only goes as far as the OTP screen. The OTP itself is validated in BUY-03.
    test.beforeAll(async ({ browser }) => {
        test.setTimeout(120000);

        productPage = await openProductPage(
            await newSharedPage(browser),
            testData.productsearch.searchTerm
        );

        loginPage = new LoginPage(productPage.page);
        checkoutPage = new CheckoutPage(productPage.page);

        await productPage.buyNowAndWaitForLogin(loginPage);
        await loginPage.requestOtp(mobile);          // number -> Continue -> OTP screen
    });

    test.afterAll(async () => {
        if (productPage) await productPage.page.context().close();
    });

    test.afterEach(async () => {
        if (productPage.page.url().includes(buy.checkoutUrlPattern)) {
            await checkoutPage.restoreQuantity(buy.baselineQuantity);
        }
    });

    test('BUY-03 - Correct OTP is accepted and logs the user in @smoke', async () => {
        test.setTimeout(otp.manualOtpMs + 60000);

        // OTP screen is showing and Verify is locked until all digits are entered
        await expect(loginPage.otpPrompt).toBeVisible();
        await expect(loginPage.verifyButton).toBeDisabled();

        await loginPage.completeOtpManually(otp.manualOtpMs);   // <-- you type the OTP here

        // Accepted: the OTP screen goes away and checkout opens on the same tab
        await checkoutPage.waitForLoaded();
        await expect(loginPage.otpPrompt).toBeHidden();
    });

    test('BUY-04 - Verified OTP lands on the Order Summary step @smoke', async () => {
        await expect(productPage.page).toHaveURL(new RegExp(buy.checkoutUrlPattern, 'i'));
        await expect(checkoutPage.deliverTo).toBeVisible();
    });

    test('BUY-05 - Summary shows the chosen product, address and total @smoke', async () => {
        expect(await checkoutPage.getCartItemCount()).toBe(orderSummary.expectedItemCount);
        await expect(checkoutPage.deliverTo).toBeVisible();

        const address = await checkoutPage.getAddressText();
        expect(address).toMatch(pincodePattern);
        expect(address).toMatch(phonePattern);

        expect(await checkoutPage.getTotalAmount()).toBeGreaterThan(0);
    });

    test('BUY-06 - Changing the quantity updates quantity and total @regression', async () => {
        const totalBefore = await checkoutPage.getTotalAmount();
        await checkoutPage.setQuantity(buy.quantity);

        await expect(checkoutPage.quantityToast(buy.quantity)).toBeVisible();
        await expect.poll(() => checkoutPage.getQuantity()).toBe(buy.quantity);
        await expect.poll(() => checkoutPage.getTotalAmount()).toBeGreaterThan(totalBefore);
    });

    test('BUY-07 - Cancel in the quantity dialog keeps the quantity @regression', async () => {
        await checkoutPage.openQuantityDialog();
        await checkoutPage.quantityInput.fill(String(buy.cancelledQuantity));
        await checkoutPage.cancelButton.click();
        await expect(checkoutPage.quantityDialogTitle).toBeHidden();
        await expect.poll(() => checkoutPage.getQuantity()).toBe(buy.baselineQuantity);
    });

    for (const invalid of buy.invalidQuantities) {
        test(`BUY-08 - Invalid quantity (${invalid.name}) is rejected @regression`, async () => {
            await checkoutPage.setQuantity(invalid.value);
            await expect(checkoutPage.quantityToast(invalid.value)).toBeHidden();
            await expect.poll(() => checkoutPage.getQuantity()).toBe(buy.baselineQuantity);
        });
    }

    // Keep LAST: it leaves the Order Summary step. Nothing here completes a payment.
    test('BUY-09 - Continue moves on to the Payment step @smoke', async () => {
        await checkoutPage.proceedToPayment();
        await expect(productPage.page).toHaveURL(new RegExp(buy.paymentUrlPattern, 'i'));
    });
});