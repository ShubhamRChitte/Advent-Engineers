const express = require('express');
const router = express.Router();
const { VendorModel } = require('../models/VendorModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// GET all vendors
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const vendors = await VendorModel.find({ status: 'active' }).sort({ createdAt: -1 });
        // Transform _id to id for frontend
        const formattedVendors = vendors.map(v => ({
            id: v._id,
            name: v.name,
            contactPerson: v.contactPerson,
            email: v.email,
            phone: v.phone,
            address: v.address,
            coresSupplied: v.coresSupplied,
            status: v.status
        }));
        res.json(formattedVendors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new vendor
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const newVendor = new VendorModel(req.body);
        await newVendor.save();
        res.status(201).json({ success: true, vendor: newVendor });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE vendor (soft delete or hard delete?)
// Let's do soft delete by setting status to inactive, or hard delete.
// Frontend expects delete.
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await VendorModel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
