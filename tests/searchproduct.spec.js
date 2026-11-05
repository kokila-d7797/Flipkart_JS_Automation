const { test, expect } = require('@playwright/test');
const HomePage = require('../pages/HomePage');
const SearchResultsPage = require('../pages/SearchResultsPage');
const testData = require('../config/testData.json');

const searchResultsUrl = new RegExp(testData.urlPatterns.searchResults);
const productPageUrl = new RegExp(testData.urlPatterns.productPage);

// One block of tests is generated per product listed in searchTestData.json
for (const product of testData.searchProducts) {
    const keyword = new RegExp(product.keyword, 'i');

    test.describe(`Flipkart - Search "${product.query}"`, () => {
        let searchResultsPage;

        test.beforeEach(async ({ page }) => {
            const homePage = new HomePage(page);
            searchResultsPage = new SearchResultsPage(page);

            await homePage.navigateToHome();
            await homePage.enableLoginPopupAutoDismiss();
            await searchResultsPage.search(product.query);
        });

        test('SRCH-01 - Search opens a results page for the searched term @smoke', async ({ page }) => {
            await expect(page).toHaveURL(searchResultsUrl);
            await expect(page).toHaveURL(keyword);
            await expect(searchResultsPage.resultCards.first()).toBeVisible();
        });

        test('SRCH-02 - Top results match the searched product @regression', async () => {
            const topResults = await searchResultsPage.getTopResults(testData.topResultsToCheck);
            expect(topResults.length).toBeGreaterThan(0);

            // Soft assertions report every non-matching card instead of stopping at the first
            for (const card of topResults) {
                await expect.soft(card).toContainText(keyword);
            }
        });

        test('SRCH-03 - Opened product page shows the searched product @smoke', async () => {
            const productPage = await searchResultsPage.openFirstProduct();
            await productPage.waitForLoaded();

            await expect(productPage.page).toHaveURL(productPageUrl);
            await expect(productPage.title).toContainText(keyword);
        });
    });
}