const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactPerson: String,
    email: String,
    phone: String,
    address: String,
    coresSupplied: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const VendorModel = mongoose.model('Vendor', VendorSchema);

module.exports = { VendorModel };
