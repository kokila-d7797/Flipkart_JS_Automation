
const { test, expect } = require('@playwright/test');

const HomePage = require('../pages/HomePage');
const SearchSuggestionPage = require('../pages/SearchsuggestionPage');
const testData = require('../config/testData.json');

test.describe('Flipkart Search Suggestions', () => {

    let homePage;
    let searchSuggestionPage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        searchSuggestionPage = new SearchSuggestionPage(page);
        await homePage.navigateToHome();
        await homePage.dismissLoginPopup();
    });

    test('SS-01 - Verify search suggestions', async ({ page }) => {

        await searchSuggestionPage.enterSearchTerm(
            testData.searchSuggestions.searchTerm
        );

        const suggestion = await searchSuggestionPage.waitForSuggestion(
            testData.searchSuggestions.expectedSuggestion
        );

        await expect(suggestion).toBeVisible();
        await searchSuggestionPage.selectSuggestion(
            testData.searchSuggestions.expectedSuggestion
        );
    });
});