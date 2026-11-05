const BasePage = require('./BasePage');

class SearchPage extends BasePage {
    constructor(page) {
        super(page);
        this.searchBox = page.getByRole('textbox', { name: /search for products, brands and more/i }).first();
        this.resultCards = page.locator('a[href*="/p/"]').filter({ hasText: /add to compare|₹/i });
        this.noResultsMessage = page.getByText(/sorry, no results found|no results found/i).first();
        this.priceSelects = page.getByRole('combobox');
        this.sortOption = (label) => page.getByText(label, { exact: true }).last();
        this.brandOption = (label) => page.getByText(label, { exact: true }).first();
    }

    async searchProduct(query) {
        const previousURL = this.page.url();
        await this.searchBox.fill(query);
        await this.searchBox.press('Enter');
        await this.page.waitForURL((url) => url.href !== previousURL, {
            waitUntil: 'domcontentloaded'
        });
        await this.resultCards.first().or(this.noResultsMessage).waitFor({ state: 'visible' });
    }

    async openFirstProduct() {
        const firstProduct = this.resultCards.first();
        await firstProduct.waitFor({ state: 'visible' });

        if (await firstProduct.getAttribute('target') === '_blank') {
            const [productPage] = await Promise.all([
                this.page.waitForEvent('popup'),
                firstProduct.click()
            ]);
            return productPage;
        }

        await firstProduct.click();
        return this.page;
    }

    async openResults(query) {
        await this.page.goto(`/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });
        await this.resultCards.first().waitFor({ state: 'visible' });
    }

    async setMinimumPrice(label) {
        await this.priceSelects.nth(0).selectOption({ label });
    }

    async setMaximumPrice(label) {
        await this.priceSelects.nth(1).selectOption({ label });
    }

    async getPriceFacets() {
        const params = new URL(this.page.url()).searchParams.getAll('p[]');
        return params.filter((param) => param.startsWith('facets.price_range.'));
    }
}

module.exports = SearchPage;
