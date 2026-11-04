const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
/*
    timeout: 60000,

    expect: {
        timeout: 10000
    },
*/
    fullyParallel: true,

    reporter: [
        ['list'],
        ['html', { open: 'on-failure' }]
    ],

    use: {
        baseURL: 'https://www.flipkart.com/',
        browserName: 'chromium',
        headless: false,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure'
    }
});