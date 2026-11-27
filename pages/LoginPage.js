const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    constructor(page) {
        super(page);
        this.mobileInput = page.getByRole('textbox', {name: 'Phone Number'});
        this.continueButton = page.getByRole('button', { name: /continue/i }).first();
        this.otpPrompt = page.getByText(/verification code/i).first();
        this.otpLimitMessage = page.getByText(/maximum attempts reached/i).first();
        this.verifyButton = page.getByRole('button', { name: /^verify$/i }).first();
    }

    async waitForMobileInput(timeout = 20000) {
        await expect(this.mobileInput,'Mobile number input should appear after clicking Buy Now').toBeVisible({ timeout });
    }

    // Enter mobile number
    async enterMobileNumber(mobile) {
        await this.waitForMobileInput();
        await this.mobileInput.fill(mobile);
    }

    // Click Continue
    async clickContinue() {
        await expect(this.continueButton).toBeVisible();
        await expect(this.continueButton).toBeEnabled();
        await this.continueButton.click();
    }

    // Wait for OTP screen
    async waitForOtpScreen(timeout = 30000) {
        let screen;
        await expect.poll(async () => {
            if (await this.otpLimitMessage.isVisible()) {
                screen = 'rate-limited';
            } else if (await this.otpPrompt.isVisible()) {
                screen = 'otp';
            } else {
                screen = undefined;
            }
            return screen;
        }, {
            message: 'OTP screen or a login rate-limit message should appear',
            timeout
        }).toBeTruthy();

        if (screen === 'rate-limited') {
            const message = await this.otpLimitMessage.innerText();
            throw new Error(`Cannot request an OTP: ${message}`);
        }
    }

    // Mobile number -> Continue -> OTP screen
    async requestOtp(mobile, timeout = 30000) {
        await this.enterMobileNumber(mobile);
        await this.clickContinue();
        await this.waitForOtpScreen(timeout);
    }

    // Wait for you to enter OTP manually.
    // Click Verify automatically when it becomes enabled.
    async completeOtpManually(timeoutMs = 120000) {
    console.log('Enter OTP manually in the browser.');

    await expect(this.verifyButton).toBeVisible({
        timeout: 30000
    });

    await expect(this.verifyButton).toBeEnabled({
        timeout: timeoutMs
    });

    await this.verifyButton.scrollIntoViewIfNeeded();

    console.log('Clicking Verify - first attempt...');
    await this.verifyButton.click();

    // Check whether OTP screen closes or authentication succeeds.
    const firstClickSucceeded = await this.otpPrompt
        .waitFor({ state: 'hidden', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

    if (!firstClickSucceeded) {
        console.log('OTP screen is still visible. Checking Verify again.');

        await expect(this.verifyButton).toBeVisible({
            timeout: 10000
        });

        await expect(this.verifyButton).toBeEnabled();

        console.log('Clicking Verify - second attempt...');
        await this.verifyButton.click();
    }

    console.log('Verify click attempts completed.');
}
}

module.exports = LoginPage;