const BasePage = require('./BasePage');
const ProductPage = require('./ProductPage');

class SearchPage extends BasePage {
    constructor(page) {
        super(page);
        this.searchBox = page.getByRole('textbox', {name: /search for products, brands and more/i}).first();
        this.resultCards = page.locator('a[href*="/p/"]').filter({ hasText: /add to compare|₹/i });
        this.noResultsMessage = page.getByText(/sorry, no results found|no results found/i).first();
        this.priceSelects = page.getByRole('combobox');
        this.filterHeading = page.getByText('Filters', { exact: true }).first();
        this.priceFilterHeading = page.getByText('Price', { exact: true }).first();
        this.brandFilterHeading = page.getByText('Brand', { exact: true }).first();
    }

    // Open search results directly using the search URL
    async openResults(query) {
        await this.page.goto(
            `/search?q=${encodeURIComponent(query)}`,
            { waitUntil: 'domcontentloaded' }
        );
    }

    // Search using the search box
    async search(query) {
        await this.searchBox.fill(query);
        await this.searchBox.press('Enter');
        await this.page.waitForURL(/\/search\?q=/, {
            waitUntil: 'domcontentloaded'
        });
        await this.waitForResults();
    }

    // Wait until products or the no-results message appears
    async waitForResults() {
        await this.resultCards.first()
            .or(this.noResultsMessage)
            .waitFor({ state: 'visible' });
    }

    // Return the first few product cards
    async getTopResults(limit = 5) {
        await this.resultCards.first().waitFor({state: 'visible'});

        const count = await this.resultCards.count();
        const numberOfResults = Math.min(count, limit);
        return Array.from(
            { length: numberOfResults },
            (_, index) => this.resultCards.nth(index)
        );
    }

    // Open the first product
    async openFirstProduct() {
        const firstProduct = this.resultCards.first();
        await firstProduct.waitFor({ state: 'visible' });
        const target = await firstProduct.getAttribute('target');
        let productPage = this.page;
        if (target === '_blank') {
            [productPage] = await Promise.all([
                this.page.context().waitForEvent('page'),
                firstProduct.click()
            ]);
        } else {
            await firstProduct.click();
        }
        await productPage.waitForLoadState('domcontentloaded');
        return new ProductPage(productPage);
    }

    async selectPrice(index, price) {
    const dropdown = this.priceSelects.nth(index);
    const targetPrice = String(price).replace(/\D/g, '');
    const optionValue = await dropdown.locator('option').evaluateAll(
        (options, target) => {
            const matchingOption = options.find(option => {
                const labelPrice = option.textContent.replace(/\D/g, '');
                const valuePrice = option.value.replace(/\D/g, '');
                return labelPrice === target || valuePrice === target;
            });
            return matchingOption?.value;
        },
        targetPrice
    );

    if (optionValue === undefined) {
        throw new Error(`Price ${price} was not found in dropdown ${index}`);
    }
    await dropdown.selectOption(optionValue);
    }

    async setMinimumPrice(price) {
    await this.selectPrice(0, price);
    }

    async setMaximumPrice(price) {
    await this.selectPrice(1, price);
    }

    async getSelectedPrice(index) {
    return await this.priceSelects.nth(index)
        .locator('option:checked')
        .evaluate(option => option.textContent.replace(/\D/g, ''));
    }

    // Read selected price filters from the URL
    async getPriceFacets() {
        const params = new URL(this.page.url())
            .searchParams.getAll('p[]');

        return params.filter(param =>
            param.startsWith('facets.price_range.')
        );
    }

    // Find a brand option
    brandOption(label) {
        return this.page.getByText(label, {
            exact: true
        }).first();
    }

    // Find a sort option
    sortOption(label) {
        return this.page.getByText(label, {exact: true}).last();
    }

    // Check whether product results are displayed
    async areResultsDisplayed() {
        return await this.resultCards.first().isVisible();
    }

    async getPriceDropdownCount() {
    return await this.priceSelects.count();
    }

    async isFilterPanelVisible() {
    return await this.filterHeading.isVisible();
    }
}

module.exports = SearchPage;