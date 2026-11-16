const { test, expect, mobile } = require('../fixtures/flipkart');
const CheckoutPage = require('../pages/CheckoutPage');
const testData = require('../config/testData.json');

// Works whether the OTP values sit under "otp" in testData.json or at the top level
const otp = testData.loginotp;

// The format-only checks (empty / short / letters / special characters) stay in your existing login.spec.js.
// These tests go one step further and need a REAL number in .env (FLIPKART_MOBILE).
test.describe('Login with mobile OTP', () => {
    test.skip(!mobile, 'Set FLIPKART_MOBILE in .env to run the OTP login tests');

    // The beforeEach hook (home -> search -> product -> Buy now) counts toward this timeout
    test.describe.configure({ timeout: 120000 });

    // Buy now on the product tab opens the login panel
    test.beforeEach(async ({ productPage, productLoginPage }) => {
        await productPage.buyNowAndWaitForLogin(productLoginPage);
    });

    test('LOGIN-01 - A valid mobile number moves to the OTP screen @sms', async ({ productLoginPage }) => {
        await productLoginPage.requestOtp(mobile);
        await expect(productLoginPage.otpPrompt).toBeVisible();
        await expect(productLoginPage.verifyButton).toBeDisabled();
    });

    test('LOGIN-02 - Verify stays disabled until every OTP digit is entered @sms', async ({ productLoginPage }) => {
        await productLoginPage.requestOtp(mobile);
        await productLoginPage.enterOTP(otp.partialOtp);
        await expect(productLoginPage.verifyButton).toBeDisabled();
    });

    test('LOGIN-03 - A wrong OTP is rejected and the OTP screen stays @sms', async ({ productLoginPage }) => {
        await productLoginPage.requestOtp(mobile);
        await productLoginPage.enterOTP(otp.wrongOtp);
        await productLoginPage.verifyOtp();

        await expect(productLoginPage.otpError(otp.wrongOtpErrorPattern)).toBeVisible();
        await expect(productLoginPage.otpPrompt).toBeVisible();
    });

    test('LOGIN-04 - Edit returns to the mobile number step @sms', async ({ productLoginPage }) => {
        await productLoginPage.requestOtp(mobile);
        await productLoginPage.editLink.click();

        await expect(productLoginPage.mobileInput).toBeVisible();
        await expect(productLoginPage.otpPrompt).toBeHidden();
    });

    test('LOGIN-05 - Typing the correct OTP logs the user in @manual-otp', async ({ productPage, productLoginPage }) => {
        test.setTimeout(otp.manualOtpMs + 120000);

        await productLoginPage.requestOtp(mobile);
        await productLoginPage.completeOtpManually(otp.manualOtpMs);   // <-- you type the OTP here

        // A login through Buy now continues to checkout on the same (product) tab
        const checkoutPage = new CheckoutPage(productPage.page);
        await checkoutPage.waitForLoaded();
        await expect(productLoginPage.mobileInput).toBeHidden();
    });
});