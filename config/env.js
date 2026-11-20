
const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env'),
    override: true
});

function getMobile() {
    const mobile = String(process.env.FLIPKART_MOBILE || '').trim();

    if (!/^\d{10}$/.test(mobile)) {
        throw new Error(
            'Invalid FLIPKART_MOBILE. Add a valid 10-digit number to the .env file.'
        );
    }

    return mobile;
}

module.exports = { getMobile };
