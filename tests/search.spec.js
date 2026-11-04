const { test, expect } = require('@playwright/test');
const SearchPage = require('../pages/SearchPage');
const testData = require('../config/testData.json');

test.describe('Flipkart Search and Filters', () => {
    let searchPage;

    test.beforeEach(async ({ page }) => {
        searchPage = new SearchPage(page);
        await searchPage.openResults(testData.search.query);
    });

    test('SEARCH-01 - Search results match the query and contain products @smoke @regression', async ({ page }) => {
        const url = new URL(page.url());
        expect(url.pathname).toMatch(new RegExp(testData.search.resultsPathPattern, 'i'));
        expect(url.searchParams.get('q')).toBe(testData.search.query);
        await expect(searchPage.resultCards.first()).toBeVisible();
        expect(await searchPage.resultCards.count()).toBeGreaterThanOrEqual(testData.search.minimumResults);
    });

    test('SEARCH-02 - Search field contains the submitted query @smoke @regression', async () => {
        await expect(searchPage.searchBox).toHaveValue(testData.search.query);
    });

    test('SEARCH-03 - Price minimum filter updates the selected facet @regression', async ({ page }) => {
        await searchPage.setMinimumPrice(testData.search.filters.priceMinimum);
        await expect.poll(() => searchPage.getPriceFacets()).toContain(
            `facets.price_range.from=${testData.search.filters.priceMinimum.replace(/[^0-9]/g, '')}`
        );
        expect(new URL(page.url()).searchParams.get('q')).toBe(testData.search.query);
    });

    test('SEARCH-04 - Price range filter applies both bounds @regression', async ({ page }) => {
        await searchPage.setMinimumPrice(testData.search.filters.priceMinimum);
        await expect.poll(() => searchPage.getPriceFacets()).toContain(
            `facets.price_range.from=${testData.search.filters.priceMinimum.replace(/[^0-9]/g, '')}`
        );
        await searchPage.setMaximumPrice(testData.search.filters.priceMaximum);
        await expect.poll(() => searchPage.getPriceFacets()).toEqual([
            `facets.price_range.from=${testData.search.filters.priceMinimum.replace(/[^0-9]/g, '')}`,
            `facets.price_range.to=${testData.search.filters.priceMaximum.replace(/[^0-9]/g, '')}`
        ]);
        expect(new URL(page.url()).searchParams.get('q')).toBe(testData.search.query);
    });

    test('SEARCH-05 - Brand filter option is available @regression', async () => {
        await expect(searchPage.brandOption(testData.search.filters.brand)).toBeVisible();
    });

    test('SEARCH-06 - Price sort option is available @regression', async () => {
        await expect(searchPage.sortOption(testData.search.sortCondition)).toBeVisible();
    });
});
