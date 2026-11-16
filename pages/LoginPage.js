const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    constructor(page) {
        super(page);
        this.mobileInput = page.getByRole('spinbutton', { name: /phone number/i }).first();
        this.continueButton = page.getByRole('button', { name: /continue/i }).first();
        this.closeButton = page.getByRole('button', { name: '✕' }).first();

        // NEW - OTP step (the OTP is six single-digit boxes, so there is no single "otpInput")
        this.panelHeading = page.getByText(/log in (to complete your shopping|for the best experience)/i).first();
        this.useEmailLink = page.getByText('Use Email-ID');
        this.otpPrompt = page.getByText(/verification code/i).first();
        this.editLink = page.getByText('Edit', { exact: true });
        this.verifyButton = page.getByRole('button', { name: /^verify$/i });
    }

    async open() {
    await this.mobileInput.waitFor({ state: 'visible', timeout: 15000 });
    }

    async enterMobileNumber(mobile) {
        await this.mobileInput.clear();
        await this.mobileInput.pressSequentially(mobile);
    }

    async clearMobileNumber() {
        await this.mobileInput.fill('');
    }

    async clickContinue() {
        await this.continueButton.click(); // auto-waits until enabled
    }

    // CHANGED: works for the popup AND the side panel opened by Buy now (Escape instead of leaving the page)
    async closeModal() {
        if (!(await this.mobileInput.isVisible().catch(() => false))) return;

        if (await this.closeButton.isVisible().catch(() => false)) {
            await this.closeButton.click();
        } else {
            await this.page.keyboard.press('Escape');
        }

        try {
            await this.mobileInput.waitFor({ state: 'hidden', timeout: 3000 });
        } catch {
            await this.page.goto('/', { waitUntil: 'domcontentloaded' });
            await this.mobileInput.waitFor({ state: 'hidden' });
        }
    }

    // NEW
    async waitForOtpScreen() {
        await this.otpPrompt.waitFor({ state: 'visible' });
    }

    // NEW: number -> Continue -> OTP screen. Used by the buy-now AND login tests.
    async requestOtp(mobile) {
        await this.enterMobileNumber(mobile);
        await this.clickContinue();
        await this.waitForOtpScreen();
    }

    // CHANGED: the first OTP box is auto-focused, so typing the digits fills all six boxes
    async enterOTP(otp) {
        await this.page.keyboard.type(otp, { delay: 100 });
    }

    // NEW
    async verifyOtp() {
        await this.verifyButton.click();
    }

    // NEW: YOU type the OTP in the browser; Verify is clicked as soon as it becomes enabled
    async completeOtpManually(timeoutMs) {
        console.log('>>> Type the OTP in the browser window now. Verify is clicked automatically when all digits are entered.');
        await expect(this.verifyButton).toBeEnabled({ timeout: timeoutMs });
        await this.verifyOtp();
    }

    // NEW
    otpError(pattern) {
        return this.page.getByText(new RegExp(pattern, 'i')).first();
    }
}

module.exports = LoginPage;