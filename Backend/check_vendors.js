const mongoose = require('mongoose');
const { CoreVendorModel } = require('./models/CoreVendorModel');
require('dotenv').config();

async function checkVendors() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const vendors = await CoreVendorModel.find({});
        console.log('Total Vendors:', vendors.length);
        console.log('Vendors:', JSON.stringify(vendors, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkVendors();
