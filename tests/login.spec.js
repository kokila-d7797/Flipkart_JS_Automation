const { test, expect } = require('@playwright/test');
const HomePage = require('../pages/HomePage');
const LoginPage = require('../pages/LoginPage');
const testData = require('../config/testData.json');

test.describe('Flipkart Login Tests', () => {
    let homePage;
    let loginPage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        loginPage = new LoginPage(page);

        await homePage.navigateToHome();
        await homePage.openLogin();

        await expect(loginPage.mobileInput).toBeVisible();
    });

    test.afterEach(async () => {
        await loginPage.closeModal();
    });

    test('LOGIN-01 - Verify login form opens from the home page @smoke @regression', async () => {
        await expect(loginPage.mobileInput).toBeVisible();
        await expect(loginPage.continueButton).toBeVisible();
    });

    test('LOGIN-02 - Verify valid mobile number is accepted @smoke @regression', async () => {
        await loginPage.enterMobileNumber(testData.login.validMobile);

        await expect(loginPage.mobileInput).toHaveValue(testData.login.validMobile);
        await expect(loginPage.continueButton).toBeEnabled();
    });

    test('LOGIN-03 - Verify empty mobile number is not accepted @regression', async () => {
        await loginPage.clearMobileNumber();

        await expect(loginPage.mobileInput).toHaveValue('');
        await expect(loginPage.continueButton).toBeDisabled();
    });

    test('LOGIN-04 - Verify mobile number with alphabets is not accepted @regression', async () => {
        await loginPage.enterMobileNumber(testData.login.alphabets);
        await expect(loginPage.mobileInput).toHaveValue('');
        await expect(loginPage.continueButton).toBeDisabled();
    });

    test('LOGIN-05 - Verify mobile number with special characters is not accepted @regression', async () => {
        await loginPage.enterMobileNumber(testData.login.specialCharacters);
        await expect(loginPage.mobileInput).toHaveValue('');
        await expect(loginPage.continueButton).toBeDisabled();
    });

    test('LOGIN-06 - Verify mobile number with fewer than 10 digits is not accepted @regression', async () => {
        await loginPage.enterMobileNumber(testData.login.shortMobile);

        await expect(loginPage.mobileInput).toBeVisible();
        await expect(loginPage.continueButton).toBeDisabled();
        await expect(loginPage.otpInput).toBeHidden();
    });

    test('LOGIN-07 - Verify mobile number with more than 10 digits is not accepted @regression', async () => {
        await loginPage.enterMobileNumber(testData.login.longMobile);

        await expect(loginPage.mobileInput).toBeVisible();
        await expect(loginPage.continueButton).toBeDisabled();
        await expect(loginPage.otpInput).toBeHidden();
    });
});