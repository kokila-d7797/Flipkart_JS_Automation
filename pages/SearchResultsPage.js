const BasePage = require('./BasePage');
const ProductPage = require('./ProductPage');

class SearchResultsPage extends BasePage {
    constructor(page) {
        super(page);

        this.searchBox = page.getByRole('textbox', { name: /search for products, brands and more/i }).first();

        // Real product cards only: they contain "Add to Compare" or a price.
        // Suggestion-dropdown links contain neither.
        this.resultCards = page
            .locator('a[href*="/p/"]')
            .filter({ hasText: /add to compare|₹/i });

        this.noResultsMessage = page.getByText(/sorry, no results found|no results found/i).first();
    }

    async search(query) {
        await this.searchBox.fill(query);

        await Promise.all([
            this.page.waitForURL(/\/search\?q=/, { waitUntil: 'domcontentloaded' }),
            this.searchBox.press('Enter')
        ]);

        await this.resultCards.first().or(this.noResultsMessage).waitFor({ state: 'visible' });
    }

    /** Returns locators for the first `limit` result cards (fewer if less are shown). */
    async getTopResults(limit = 5) {
        await this.resultCards.first().waitFor({ state: 'visible' });
        const count = Math.min(await this.resultCards.count(), limit);
        return Array.from({ length: count }, (_, i) => this.resultCards.nth(i));
    }

    /** Opens the first result (new tab or same tab) and returns its ProductPage. */
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
}

module.exports = SearchResultsPage;