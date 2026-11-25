
const { test, expect } = require('@playwright/test');

const HomePage = require('../pages/HomePage');
const SearchSuggestionPage = require('../pages/SearchsuggestionPage');
const SearchfunctionPage = require('../pages/Searchfunctionpage');
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

        await expect(page).toHaveURL(new RegExp(testData.home.search.resultsPathPattern, 'i'));
        await expect.poll(() => new URL(page.url()).searchParams.get('q'))
            .toBe(testData.searchSuggestions.expectedSuggestion);

        const resultsPage = new SearchfunctionPage(page);
        await expect(resultsPage.resultCards.first()).toBeVisible();

        const resultCount = await resultsPage.resultCards.count();
        expect(resultCount).toBeGreaterThan(0);

        const expectedKeyword = new RegExp(
            testData.searchSuggestions.expectedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i'
        );
        for (let index = 0; index < resultCount; index++) {
            await expect.soft(resultsPage.resultCards.nth(index)).toContainText(expectedKeyword);
        }
    });
});