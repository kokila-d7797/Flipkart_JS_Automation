const BasePage = require('./BasePage');

class SearchPage extends BasePage {
    constructor(page) {
        super(page);
        this.searchBox = page.getByRole('textbox', { name: /search for products, brands and more/i }).first();
        this.resultCards = page.locator('a[href*="/p/"]');
        this.priceSelects = page.getByRole('combobox');
        this.sortOption = (label) => page.getByText(label, { exact: true }).last();
        this.brandOption = (label) => page.getByText(label, { exact: true }).first();
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
