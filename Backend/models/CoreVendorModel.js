const mongoose = require('mongoose');

const CoreVendorSchema = new mongoose.Schema({
    vendor_no: { type: Number, required: true, unique: true },
    vendor_name: { type: String, required: true },
    vendor_code: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true, collection: 'vendors' });

const CoreVendorModel = mongoose.model('CoreVendor', CoreVendorSchema);

module.exports = { CoreVendorModel };
