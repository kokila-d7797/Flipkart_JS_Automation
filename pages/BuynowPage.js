const { expect } = require('@playwright/test');
const BasePage = require('./BasePage');

class BuynowPage extends BasePage {
    constructor(page) {
        super(page);

        // Mobile number login
        this.mobileNumberInput = page.getByRole('spinbutton', { name: 'Phone Number' });

        this.continueButton = page.getByRole('button', { name: 'Continue' });

        // OTP field - locator may need adjustment to match Flipkart DOM
        this.otpInput = page.locator('div.H6gpAI');

        // Order summary page
        this.orderSummaryHeading = page.getByText('Order Summary', {exact: true}).first();
    }

    async enterMobileNumber(mobileNumber) {
        await this.mobileNumberInput.waitFor({
            state: 'visible'
        });

        await this.mobileNumberInput.fill(mobileNumber);
    }

    async clickContinue() {
        await this.continueButton.click();
    }

    async isMobileNumberInputDisplayed() {
        return await this.mobileNumberInput.isVisible();
    }

    async isOtpInputDisplayed() {
        return await this.otpInput.isVisible();
    }

    async waitForOrderSummary() {
        // You manually enter OTP and complete verification.
        // Automation waits for the Order Summary page.
        await this.orderSummaryHeading.waitFor({
            state: 'visible',
            timeout: 180000
        });
    }
}

module.exports = BuynowPage;
