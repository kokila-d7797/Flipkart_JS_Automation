const { test, expect } = require('@playwright/test');
const HomePage = require('../pages/HomePage');
const testData = require('../config/testData.json');

test.describe('Flipkart Home Page', () => {
    let homePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.navigateToHome();
    });

    test('HOME-01 - Home page title is correct @smoke @regression', async ({ page }) => {
        await expect(page).toHaveTitle(new RegExp(testData.home.titlePattern, 'i'));
    });

    test('HOME-02 - Home page header is visible @smoke @regression', async () => {
        await expect(homePage.logo).toBeVisible();
    });

    test('HOME-03 - Search field is visible and enabled @smoke @regression', async () => {
        await expect(homePage.searchBox).toBeVisible();
        await expect(homePage.searchBox).toBeEnabled();
        await expect(homePage.searchBox).toHaveAttribute(
            'placeholder',
            new RegExp(testData.home.search.placeholderPattern, 'i')
        );
    });

    test('HOME-04 - Search field accepts and clears a query @regression', async () => {
        await homePage.typeInSearch(testData.home.search.validQuery);
        await expect(homePage.searchBox).toHaveValue(testData.home.search.validQuery);
        await homePage.clearSearch();
        await expect(homePage.searchBox).toHaveValue(testData.home.search.emptyQuery);
    });

    test('HOME-05 - Valid search opens a results URL @smoke @regression', async ({ page }) => {
        await homePage.searchFor(testData.home.search.validQuery);
        await expect(page).toHaveURL(new RegExp(testData.home.search.resultsPathPattern, 'i'));
    });

    test('HOME-06 - Empty search does not open results @regression', async ({ page }) => {
        await homePage.searchFor(testData.home.search.emptyQuery);
        await expect(page).not.toHaveURL(new RegExp(testData.home.search.resultsPathPattern, 'i'));
    })

    test('HOME-07 - Login entry point is available @smoke @regression', async () => {
        await expect(homePage.loginLink).toBeVisible();
    });

    test('HOME-08 - Login entry point opens the login modal @smoke @regression', async ({ page }) => {
        await homePage.openLogin();
        await expect(page.getByRole('spinbutton', { name: /phone number/i })).toBeVisible();
    });

});