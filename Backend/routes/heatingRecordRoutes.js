const express = require('express');
const router = express.Router();
const { HeatingRecordModel } = require('../models/HeatingRecordModel');

// @route   POST /api/heating-record
// @desc    Add or update heating records for an order
// @access  Private 
router.post('/', async (req, res) => {
    try {
        const { orderId, transformerType, blocks } = req.body;

        if (!orderId || !transformerType || !blocks || !Array.isArray(blocks)) {
            return res.status(400).json({ success: false, message: 'Invalid payload structure. orderId, transformerType, and blocks array are required.' });
        }

        const existing = await HeatingRecordModel.findOne({ orderId, transformerType });

        if (existing) {
            existing.blocks = blocks;
            existing.updatedAt = Date.now();
            await existing.save();
        } else {
            await HeatingRecordModel.create({
                orderId,
                transformerType,
                blocks
            });
        }

        res.status(200).json({ success: true, message: 'Heating record saved successfully' });
    } catch (error) {
        console.error('Error saving heating record:', error);
        res.status(500).json({ success: false, message: 'Server error saving heating record' });
    }
});

// @route   GET /api/heating-record/assigned-orders
// @desc    Fetch all orders by transformerType (CT or PT) with NO stage restriction.
//          Use ?type=CT or ?type=PT
router.get('/assigned-orders', async (req, res) => {
    try {
        const { OrderModel } = require('../models/OrderModel');
        const { type } = req.query;

        if (!type) {
            return res.status(400).json({ success: false, message: "'type' query param required (CT or PT)" });
        }

        const orders = await OrderModel.find({ transformerType: type.toString().toUpperCase() })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching heating record orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/heating-record/:orderId/:type
// @desc    Get heating records for a specific order and transformer type
// @access  Private
router.get('/:orderId/:type', async (req, res) => {
    try {
        const { orderId, type } = req.params;

        const record = await HeatingRecordModel.findOne({ orderId, transformerType: type });
        
        if (!record) {
            return res.status(200).json({ success: true, data: null }); // Returning null instead of 404 sets up perfectly for initial states
        }

        res.status(200).json({ 
            success: true, 
            data: record 
        });
    } catch (error) {
        console.error('Error fetching heating records:', error);
        res.status(500).json({ success: false, message: 'Server error fetching heating records' });
    }
});

// @route   POST /api/heating-record/completed-status
// @desc    Check which of the given order IDs have completed heating records
// @access  Private
router.post('/completed-status', async (req, res) => {
    try {
        const { orderIds, prefix } = req.body;
        
        let query = { 
            orderId: { $in: orderIds },
            status: 'Completed'
        };
        // if prefix is specified, we check if transformerType includes it
        if (prefix) {
            query.transformerType = { $regex: prefix, $options: 'i' };
        }

        const records = await HeatingRecordModel.find(query).select('orderId');
        // Filter unique completed IDs
        const completedIds = [...new Set(records.map(r => r.orderId))];

        res.status(200).json({ success: true, completedIds });
    } catch (error) {
        console.error('Error fetching completed status:', error);
        res.status(500).json({ success: false, message: 'Server error fetching completed status' });
    }
});

// @route   PUT /api/heating-record/:orderId/approve
// @desc    Approve a heating record and move it to completed
// @access  Private
router.put('/:orderId/approve', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { type } = req.body;

        const record = await HeatingRecordModel.findOne({ orderId, transformerType: { $regex: type || '', $options: 'i' } });
        
        if (!record) {
            return res.status(404).json({ success: false, message: 'Heating record not found for this order' });
        }

        record.status = 'Completed';
        await record.save();

        res.status(200).json({ success: true, message: 'Heating record approved successfully' });
    } catch (error) {
        console.error('Error approving heating record:', error);
        res.status(500).json({ success: false, message: 'Server error approving heating record' });
    }
});

// Reverted back

module.exports = router;
