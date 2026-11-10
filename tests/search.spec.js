const { test, expect } = require('@playwright/test');
const SearchfunctionPage = require('../pages/Searchfunctionpage');
const testData = require('../config/testData.json');

test.describe('Flipkart Search and Filters', () => {

    let searchPage;

    test.beforeEach(async ({ page }) => {
        searchPage = new SearchfunctionPage(page);
        await searchPage.openResults(testData.search.query);
    });

    test('SEARCH-01 - Verify search results', async ({ page }) => {

        const url = new URL(page.url());
        // Verify search results URL
        expect(url.pathname).toMatch(new RegExp(testData.search.resultsPathPattern, 'i'));

        // Verify submitted search query
        expect(url.searchParams.get('q')).toBe(testData.search.query);

        // Verify search box contains the query
        await expect(searchPage.searchBox).toHaveValue(testData.search.query);

        // Verify product results are displayed
        await expect(searchPage.resultCards.first()).toBeVisible();

        // Verify minimum number of results
        expect(await searchPage.resultCards.count()).toBeGreaterThanOrEqual(testData.search.minimumResults);
    });

    test('SEARCH-02 - Verify search results match the expected product', async () => {

        const topResults = await searchPage.getTopResults(testData.topResultsToCheck);

        // Verify that results are available
        expect(topResults.length).toBeGreaterThan(0);

        // Verify product names contain the expected keyword
        const keyword = new RegExp(testData.search.expectedKeyword,'i');

        for (const productCard of topResults) {
            await expect.soft(productCard).toContainText(keyword);
        }
    });

    test('FILTER-01 - Verify minimum price filter', async ({ page }) => {

        const minimumPrice = testData.search.filters.priceMinimum;
        await searchPage.setMinimumPrice(minimumPrice);
        const minimumValue = minimumPrice.replace(/[^0-9]/g, '');

        // Verify minimum price is selected
        await expect.poll(() => searchPage.getSelectedPrice(0)).toBe(minimumPrice.replace(/[^0-9]/g, ''));

        // Verify minimum price filter is applied in URL
        await expect.poll(
            () => searchPage.getPriceFacets()).toContain(`facets.price_range.from=${minimumValue}`);

        // Verify original search query is retained
        expect(new URL(page.url()).searchParams.get('q')).toBe(testData.search.query);

        // Verify products are still displayed
        await expect(searchPage.resultCards.first()).toBeVisible();
    });


    test('FILTER-02 - Verify minimum and maximum price filters', async ({ page }) => {

        const minimumPrice = testData.search.filters.priceMinimum;
        const maximumPrice = testData.search.filters.priceMaximum;

        await searchPage.setMinimumPrice(minimumPrice);
        await searchPage.setMaximumPrice(maximumPrice);

        const minimumValue = minimumPrice.replace(/[^0-9]/g, '');
        const maximumValue = maximumPrice.replace(/[^0-9]/g, '');

        // Verify minimum price selection
        await expect.poll(() => searchPage.getSelectedPrice(0)).toBe(minimumPrice.replace(/[^0-9]/g, ''));

        // Verify maximum price selection
        await expect.poll(() => searchPage.getSelectedPrice(1)).toBe(maximumPrice.replace(/[^0-9]/g, ''));

        // Verify both filters are applied
        await expect.poll(
            () => searchPage.getPriceFacets()).toContain(`facets.price_range.from=${minimumValue}`);

        await expect.poll(
            () => searchPage.getPriceFacets()
        ).toContain(
            `facets.price_range.to=${maximumValue}`
        );

        // Verify search query is retained
        expect(
            new URL(page.url()).searchParams.get('q')
        ).toBe(testData.search.query);

        // Verify filtered products are displayed
        await expect(
            searchPage.resultCards.first()
        ).toBeVisible();
    });

    test('FILTER-04 - Verify sort option is available', async () => {
        await expect(searchPage.sortOption(testData.search.sortCondition)).toBeVisible();
    });

    test('FILTER-05 - Filter panel is displayed @smoke', async () => {
        await expect(searchPage.filterHeading).toBeVisible();
    });

    test('FILTER-06 - Price filter is displayed @regression', async () => {
        await expect(searchPage.priceFilterHeading).toBeVisible();
        await expect(await searchPage.getPriceDropdownCount()).toBe(2);
    });

    test('FILTER-07 - Brand filter is displayed @regression', async () => {
        await expect(searchPage.brandFilterHeading).toBeVisible();
        await expect(searchPage.brandOption(testData.search.filters.brand)).toBeVisible();
});
});