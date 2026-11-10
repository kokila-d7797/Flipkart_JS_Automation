
const BasePage = require('./BasePage');

class SearchSuggestionPage extends BasePage {
    constructor(page) {
        super(page);
        this.searchBox = page.getByRole('textbox', {name: /search for products, brands and more/i}).first();
    }

    async enterSearchTerm(searchTerm) {
        await this.searchBox.waitFor({ state: 'visible' });
        await this.searchBox.click();
        await this.searchBox.clear();
        // Type character by character to trigger autocomplete
        await this.searchBox.pressSequentially(searchTerm, {
            delay: 150
        });
    }

    getSuggestion(suggestionText) {
        return this.page.getByText(new RegExp(suggestionText, 'i')).first();
    }

    async waitForSuggestion(suggestionText) {
        const suggestion = this.getSuggestion(suggestionText);
        await suggestion.waitFor({
            state: 'visible',
            timeout: 15000
        });
        return suggestion;
    }

    async selectSuggestion(suggestionText) {
        const suggestion = this.getSuggestion(suggestionText);
        await suggestion.click();
    }
}

module.exports = SearchSuggestionPage;
