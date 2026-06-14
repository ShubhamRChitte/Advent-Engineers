const express = require('express');
const router = express.Router();
const { CoreVendorModel } = require('../models/CoreVendorModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// GET all active core vendors
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const vendors = await CoreVendorModel.find({ status: 'active' }).sort({ vendor_no: 1 });
        res.json({ success: true, data: vendors });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST new core vendor
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const newVendor = new CoreVendorModel(req.body);
        await newVendor.save();
        res.status(201).json({ success: true, data: newVendor });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// DELETE core vendor
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await CoreVendorModel.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
