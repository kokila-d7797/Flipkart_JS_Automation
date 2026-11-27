require('dotenv').config();
const { test, expect } = require('@playwright/test');
const MyAccountPage = require('../pages/MyAccountPage');
const LoginPage = require('../pages/LoginPage');
const { getMobile } = require('../config/env');
const testData = require('../testdata/MyAccountTestData');

test.describe.configure({ mode: 'serial' });

test.describe('Flipkart - My Account Module', () => {
    test.setTimeout(10 * 60 * 1000);

    let context;
    let page;
    let accountPage;
    let loginPage;

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(10 * 60 * 1000);
        console.log('Creating one browser session for all My Account tests.');
        context = await browser.newContext();
        page = await context.newPage();
        loginPage = new LoginPage(page);
        accountPage = new MyAccountPage(page);

        console.log('Opening Flipkart and requesting a login OTP.');
        await page.goto(process.env.FLIPKART_ACCOUNT_URL, {
            waitUntil: 'domcontentloaded'
        });
        await loginPage.requestOtp(getMobile());

        console.log('Enter the OTP manually in the browser to continue.');
        await loginPage.completeOtpManually();

        console.log('Waiting for successful login and My Account sidebar.');
        await expect(accountPage.myOrdersSection).toBeVisible({ timeout: 60000 });
        console.log('Login successful. Running all account checks in this session.');
    });

    test.beforeEach(async () => {
        await accountPage.openAccountPage(process.env.FLIPKART_ACCOUNT_URL);
        await accountPage.verifySidebarSections();
    });

    test('MA_01 - Validate Profile Information fields', async () => {
        console.log('MA_01: Open Profile Information.');
        await accountPage.navigateToMenuItem(
            accountPage.menuItems.profileInformation,
            testData.urlPatterns.profileInformation
        );

        console.log('MA_01: Verify Name, Mobile Number, and Email ID are populated.');
        await accountPage.verifyProfileFieldsPopulated(testData.profileFieldLabels);
    });

    test('MA_02 - Add and validate a Manage Addresses entry', async () => {
        console.log('MA_02: Open Manage Addresses.');
        await accountPage.navigateToMenuItem(
            accountPage.menuItems.manageAddresses,
            testData.urlPatterns.manageAddresses
        );
        await accountPage.verifyContentHeading(testData.pageHeadings.manageAddresses);

        console.log('MA_02: Open the new address form and enter test data.');
        await accountPage.openNewAddressForm();
        await accountPage.fillAddressForm(testData.address);

        console.log('MA_02: Verify the uniquely generated address appears in the list.');
        await accountPage.verifyAddressDisplayed(testData.address.uniqueAddressText);
    });

    test('MA_03 - Validate PAN Card Information page', async () => {
        console.log('MA_03: Open PAN Card Information.');
        await accountPage.navigateToMenuItem(
            accountPage.menuItems.panCardInformation,
            testData.urlPatterns.panCardInformation
        );
        await accountPage.verifyContentHeading(testData.pageHeadings.panCardInformation);
        await expect(page).toHaveURL(testData.urlPatterns.panCardInformation);
    });

    test('MA_04 - Validate Gift Cards page', async () => {
        console.log('MA_04: Open Gift Cards.');
        await accountPage.navigateToMenuItem(
            accountPage.menuItems.giftCards,
            testData.urlPatterns.giftCards
        );
        await accountPage.verifyContentHeading(testData.pageHeadings.giftCards);
        await expect(page).toHaveURL(testData.urlPatterns.giftCards);
    });

    test('MA_05 - Validate Saved UPI page', async () => {
        console.log('MA_05: Open Saved UPI.');
        await accountPage.navigateToMenuItem(
            accountPage.menuItems.savedUPI,
            testData.urlPatterns.savedUPI
        );
        await expect(page.getByText(testData.pageContent.noSavedUPI, { exact: true })).toBeVisible();
        await expect(page).toHaveURL(testData.urlPatterns.savedUPI);
    });

    test('MA_06 - Validate Saved Cards page', async () => {
        console.log('MA_06: Open Saved Cards.');
        await accountPage.navigateToMenuItem(
            accountPage.menuItems.savedCards,
            testData.urlPatterns.savedCards
        );
        await accountPage.verifyContentHeading(
            testData.pageHeadings.savedCards,
            'Saved Cards'
        );
        await expect(page).toHaveURL(testData.urlPatterns.savedCards);
    });

    test.afterAll(async () => {
        if (context) {
            await context.close();
        }
        console.log('My Account test execution completed.');
    });
});
