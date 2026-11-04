const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    constructor(page) {
        super(page);
        this.mobileInput = page.getByRole('spinbutton', { name: /phone number/i }).first();
        this.continueButton = page.getByRole('button', { name: /continue/i }).first();
        this.closeButton = page.getByRole('button', { name: '✕' }).first();
        this.otpInput = page.getByRole('textbox', { name: /otp/i }).first();
    }

    async open() {
        await this.mobileInput.waitFor({ state: 'visible' });
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

    async closeModal() {
        if (await this.mobileInput.isVisible().catch(() => false)) {
            if (await this.closeButton.isVisible().catch(() => false)) {
                await this.closeButton.click();
            } else {
                await this.page.goto('/', { waitUntil: 'domcontentloaded' });
            }
            await this.mobileInput.waitFor({ state: 'hidden' });
        }
    }

    async enterOTP(otp) {
        await this.otpInput.fill(otp);
    }
}

module.exports = LoginPage;