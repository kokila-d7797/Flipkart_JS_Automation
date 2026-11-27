const { expect } = require('@playwright/test');

class MyAccountPage {
    constructor(page) {
        this.page = page;

        this.menuItems = {
            profileInformation: page.locator('a[href="/account"]').first(),
            manageAddresses: page.locator('a[href="/account/addresses"]').first(),
            panCardInformation: page.locator('a[href="/account/pancard"]').first(),
            giftCards: page.locator('a[href="/account/giftcard"]').first(),
            savedUPI: page.locator('a[href="/account/vpadetails"]').first(),
            savedCards: page.locator('a[href="/account/carddetails"]').first()
        };

        this.myOrdersSection = page.getByText('MY ORDERS', { exact: true });
        this.accountSettingsSection = page.getByText('ACCOUNT SETTINGS', { exact: true });
        this.paymentsSection = page.getByText('PAYMENTS', { exact: true });
        this.myStuffSection = page.getByText('MY STUFF', { exact: true });

        this.addNewAddressButton = page.getByText('ADD A NEW ADDRESS', { exact: true });
        this.addressFormFields = {
            name: page.getByText('Name', { exact: true }).locator('xpath=preceding::input[1]'),
            mobileNumber: page.getByText('10-digit mobile number', { exact: true }).locator('xpath=preceding::input[1]'),
            pincode: page.getByText('Pincode', { exact: true }).locator('xpath=preceding::input[1]'),
            locality: page.getByText('Locality', { exact: true }).locator('xpath=preceding::input[1]'),
            address: page.getByText('Address (Area and Street)', { exact: true }).locator('xpath=preceding::textarea[1]'),
            city: page.getByText('City/District/Town', { exact: true }).locator('xpath=preceding::input[1]'),
            landmark: page.getByText('Landmark (Optional)', { exact: true }).locator('xpath=preceding::input[1]'),
            alternatePhone: page.getByText('Alternate Phone (Optional)', { exact: true }).locator('xpath=preceding::input[1]')
        };
        this.addressTypeOption = type => page.getByText(type, { exact: true }).first();
        this.saveAddressButton = page.getByRole('button', { name: /^SAVE$/i });
    }

    async openAccountPage(accountUrl) {
        if (!accountUrl) {
            throw new Error('FLIPKART_ACCOUNT_URL must be set to open the My Account page.');
        }

        await this.page.goto(accountUrl, { waitUntil: 'domcontentloaded' });
        await expect(this.myOrdersSection).toBeVisible({ timeout: 15000 });
    }

    async verifySidebarSections() {
        await expect(this.myOrdersSection).toBeVisible();
        await expect(this.accountSettingsSection).toBeVisible();
        await expect(this.paymentsSection).toBeVisible();
        await expect(this.myStuffSection).toBeVisible();
    }

    async navigateToMenuItem(locator, expectedUrl) {
        await expect(locator).toBeVisible();
        await locator.click();
        await expect(this.page).toHaveURL(expectedUrl);
    }

    async verifyProfileFieldsPopulated(fieldLabels) {
        for (const [fieldKey, configuredLabels] of Object.entries(fieldLabels)) {
            if (fieldKey === 'name') {
                const nameInputs = this.page.locator('input[disabled]');
                for (const index of [0, 1]) {
                    const nameInput = nameInputs.nth(index);
                    await expect(nameInput, `Name field ${index + 1} should be visible`).toBeVisible();
                    await expect(nameInput, `Name field ${index + 1} should be populated`).toHaveValue(/\S+/);
                }
                continue;
            }

            const labels = Array.isArray(configuredLabels)
                ? configuredLabels
                : [configuredLabels];
            let fieldLabel;

            for (const label of labels) {
                const matchingLabel = this.page.getByText(label, { exact: true });
                if (await matchingLabel.count() > 0) {
                    fieldLabel = matchingLabel.first();
                    break;
                }
            }

            expect(fieldLabel, `A visible label should exist for ${fieldKey}`).toBeTruthy();
            const field = fieldLabel.locator('xpath=following::input[1]');
            await expect(field, `${fieldKey} should be visible`).toBeVisible();
            await expect(field, `${fieldKey} should be populated`).toHaveValue(/\S+/);
        }
    }

    async openNewAddressForm() {
        await this.addNewAddressButton.click();
        await expect(this.addressFormFields.name).toBeVisible();
    }

    async fillAddressForm(addressData) {
        for (const [fieldKey, locator] of Object.entries(this.addressFormFields)) {
            await locator.fill(addressData[fieldKey]);
        }

        await this.addressTypeOption(addressData.addressType).click();
        await this.saveAddressButton.click();
    }

    async verifyAddressDisplayed(uniqueAddressText) {
        await expect(this.page.getByText(uniqueAddressText, { exact: false })).toBeVisible();
    }

    async verifyContentHeading(headings, sidebarHeading) {
        const candidates = Array.isArray(headings) ? headings : [headings];

        for (const heading of candidates) {
            const matchingText = this.page.getByText(heading, { exact: true });
            const count = await matchingText.count();
            const isSidebarHeading = heading === sidebarHeading;

            if (count < (isSidebarHeading ? 2 : 1)) {
                continue;
            }

            await expect(matchingText.nth(count > 1 ? 1 : 0)).toBeVisible();
            return;
        }

        throw new Error(`Expected page content heading not found: ${candidates.join(' or ')}`);
    }
}

module.exports = MyAccountPage;
