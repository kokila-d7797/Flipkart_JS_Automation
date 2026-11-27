const uniqueToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const uniqueAddressText = `Automation QA address ${uniqueToken}`;

module.exports = {
    profileFieldLabels: {
        name: 'Name',
        mobileNumber: 'Mobile Number',
        emailId: ['Email ID', 'Email Address']
    },
    pageHeadings: {
        manageAddresses: 'Manage Addresses',
        panCardInformation: 'PAN Card Information',
        giftCards: 'Gift Cards',
        savedCards: ['Manage Saved Cards', 'Saved Cards']
    },
    pageContent: {
        noSavedUPI: 'No VPAs saved to be shown'
    },
    address: {
        name: 'Automation Test User',
        mobileNumber: '9123456789',
        pincode: '600071',
        locality: 'Automation Test Locality',
        address: `${uniqueAddressText}, Test Street`,
        city: 'Chennai',
        landmark: 'Near Test Bus Stop',
        alternatePhone: '9123456780',
        addressType: 'Home',
        uniqueAddressText
    },
    urlPatterns: {
        profileInformation: /\/account(?:[?#].*)?$/,
        manageAddresses: /\/account\/addresses(?:[?#].*)?$/,
        panCardInformation: /\/account\/pancard(?:[?#].*)?$/,
        giftCards: /\/account\/giftcard(?:[?#].*)?$/,
        savedUPI: /\/account\/vpadetails(?:[?#].*)?$/,
        savedCards: /\/account\/carddetails(?:[?#].*)?$/
    }
};
