const express = require('express');
const router = express.Router();
const { TransformerModel } = require('../models/TransformerModel');
const { OrderModel } = require('../models/OrderModel');
const { HeatingRecordModel } = require('../models/HeatingRecordModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// ==========================================
// NEW ROUTES (HeatingRecordModel Based)
// ==========================================

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
        const { type } = req.query;

        if (!type) {
            return res.status(400).json({ success: false, message: "'type' query param required (CT or PT)" });
        }

        const typeStr = type.toString().toUpperCase();

        let transQuery = {
            // EXCLUDE: Transformers already approved in heating
            "testHistory.heating_test.status": { $ne: "Approved" }
        };

        if (typeStr === 'PT') {
            transQuery.$or = [
                { currentStage: "core" },
                { currentStage: "pt" },
                { currentStage: "heating" },
                { currentStage: "final" },
                { "testHistory.pt_test.status": "Completed" }
            ];
        } else {
            transQuery.$or = [
                { currentStage: "heating" },
                { "testHistory.primary_test.status": "Completed" },
                { "testHistory.pt_test.status": "Completed" }
            ];
        }

        // Note: We populate orderId to get transformerType and other details
        const transformers = await TransformerModel.find(transQuery).populate('orderId').lean();
        
        const ordersMap = new Map();
        for (const t of transformers) {
            // Only include if order exists and matches requested type (CT/PT)
            if (t.orderId && t.orderId.transformerType === typeStr) {
                const oid = t.orderId._id.toString();
                
                // Add to map if not present
                if (!ordersMap.has(oid)) {
                    ordersMap.set(oid, t.orderId);
                }
            }
        }

        const orders = Array.from(ordersMap.values());
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching heating record orders:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/heating-record/transformers/:orderId
// Returns transformers for an order that have completed Primary test
router.get('/transformers/:orderId', isAuthenticated, async (req, res) => {
    try {
        const { orderId } = req.params;
        const mongoose = require('mongoose');
        
        let queryOrderId = orderId;
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            queryOrderId = new mongoose.Types.ObjectId(orderId);
        }

        const order = await OrderModel.findById(queryOrderId).lean();
        const jobNo = order ? order.jobId : null;

        const includeApproved = req.query.includeApproved === 'true';

        const query = {
            $and: [
                {
                    $or: [
                        { orderId: queryOrderId },
                        { orderId: orderId },
                        ...(jobNo ? [{ jobId: jobNo }] : [])
                    ]
                },
                {
                    // Robust Filter: Show transformers that are ready for OR in heating stage.
                    $and: [
                        ...(includeApproved ? [] : [{ "testHistory.heating_test.status": { $ne: "Approved" } }]),
                        {
                            $or: [
                                { currentStage: "heating" },
                                { "testHistory.primary_test.status": "Completed" },
                                { "testHistory.pt_test": { $exists: true, $ne: {} } }
                            ]
                        }
                    ]
                }
            ]
        };

        const transformers = await TransformerModel.find(query).lean();
        res.json({ success: true, transformers });
    } catch (error) {
        console.error("Error fetching heating transformers:", error);
        res.status(500).json({ success: false, error: error.message });
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
            return res.status(200).json({ success: true, data: null }); // Returning null sets up correctly
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
        
        // Find ALL transformers for these orders that have REACHED the heating stage potential
        // (Must match the transQuery criteria used in assigned-orders)
        const eligibleTransformers = await TransformerModel.find({ 
            orderId: { $in: orderIds },
            $or: [
                { currentStage: "heating" },
                { "testHistory.primary_test.status": "Completed" },
                { "testHistory.pt_test.status": "Completed" }
            ]
        }).select('orderId testHistory.heating_test.status').lean();

        // Group by OrderId and check completion relative to ELIGIBLE units
        const orderStatusMap = {};
        eligibleTransformers.forEach(t => {
            const oid = t.orderId.toString();
            if (!orderStatusMap[oid]) orderStatusMap[oid] = { eligibleTotal: 0, completed: 0 };
            orderStatusMap[oid].eligibleTotal++;
            
            const status = t.testHistory?.heating_test?.status;
            if (status === "Approved" || status === "Completed") {
                orderStatusMap[oid].completed++;
            }
        });

        const completedIds = Object.keys(orderStatusMap).filter(oid => 
            orderStatusMap[oid].eligibleTotal > 0 && orderStatusMap[oid].completed === orderStatusMap[oid].eligibleTotal
        );

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
        const mongoose = require('mongoose');

        const record = await HeatingRecordModel.findOne({ orderId, transformerType: { $regex: type || '', $options: 'i' } });
        
        if (!record) {
            return res.status(404).json({ success: false, message: 'Heating record not found for this order' });
        }

        // 1. Update HeatingRecordModel status
        record.status = 'Completed';
        await record.save();

        // 2. Update OrderModel currentStage and completionStages
        let order = null;
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            order = await OrderModel.findById(orderId);
        }
        if (!order) {
            order = await OrderModel.findOne({ jobId: orderId });
        }

        if (order) {
            console.log(`[DEBUG] Transitioning Order ${order.jobId} from ${order.currentStage} to 'final' after heating approval.`);
            order.currentStage = 'final';
            if (!order.completionStages) order.completionStages = {};
            order.completionStages.heating = true;
            await order.save();

            // 3. Update all Transformers associated with this order
            const transformers = await TransformerModel.find({ 
                $or: [
                    { orderId: order._id },
                    { jobId: order.jobId }
                ]
            });

            console.log(`[DEBUG] Updating ${transformers.length} transformers for Job ${order.jobId} to 'final' stage.`);
            for (const t of transformers) {
                t.currentStage = 'final';
                t.isHeatingApproved = true;
                
                // Update internal process history if it exists for consistency with old reporting system
                if (t.processHistory && t.processHistory.heatingRecord && t.processHistory.heatingRecord.length > 0) {
                    t.processHistory.heatingRecord[0].status = 'Approved';
                }
                
                await t.save();
            }

            // 4. Notify next stage testers (Final Test Stage)
            try {
                const { notifyNextStage, clearNotifications } = require('../services/notificationService');
                
                // Clear current stage notifications
                await clearNotifications(order._id, 'heating');
                
                await notifyNextStage(order, 'final');
            } catch (notifyErr) {
                console.error("[ERROR] Notification failed during heating approval:", notifyErr);
            }
        } else {
            console.warn(`[WARN] Order not found for ID: ${orderId} during heating approval transition.`);
        }

        res.status(200).json({ success: true, message: 'Heating record approved successfully and moved to Final Test.' });
    } catch (error) {
        console.error('Error approving heating record:', error);
        res.status(500).json({ success: false, message: 'Server error approving heating record' });
    }
});


// ==========================================
// OLD ROUTES (TransformerModel Based from Remote)
// ==========================================

// GET /api/heating-record/orders
// Returns orders where at least one transformer is ready for or in Heating
// Criteria: testHistory.primary_test.status === "Completed" AND currentStage in ["primary", "heating"]
router.get('/orders', isAuthenticated, async (req, res) => {
    try {
        const query = {
            $or: [
                { "testHistory.primary_test.status": "Completed" },
                { currentStage: "heating" }
            ],
            currentStage: { $in: ["primary", "heating"] }
        };

        const transformers = await TransformerModel.find(query).populate('orderId').lean();
        
        // Group by order
        const ordersMap = new Map();
        for (const t of transformers) {
            if (t.orderId && !ordersMap.has(t.orderId._id.toString())) {
                ordersMap.set(t.orderId._id.toString(), t.orderId);
            }
        }

        const orders = Array.from(ordersMap.values());
        res.json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching heating orders:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});



// SAVE/APPROVE Heating Test (Per Transformer)
// POST /api/heating-record/save/:uniqueId
router.post('/save/:uniqueId', isAuthenticated, async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const { processSteps, preparedBy, verifiedBy, productionManager, leftInputs, isApproveCall } = req.body;
        
        const transformer = await TransformerModel.findOne({ uniqueId }).populate('orderId');
        if (!transformer) return res.status(404).json({ success: false, message: "Transformer not found" });

        // Ensure testHistory.heating_test exists
        if (!transformer.testHistory) transformer.testHistory = {};
        if (!transformer.testHistory.heating_test) {
            transformer.testHistory.heating_test = {
                status: 'Pending',
                processSteps: [],
                leftInputs: []
            };
        }

        const heatingTest = transformer.testHistory.heating_test;
        
        if (processSteps) heatingTest.processSteps = processSteps;
        if (preparedBy) heatingTest.preparedBy = preparedBy;
        if (verifiedBy) heatingTest.verifiedBy = verifiedBy;
        if (productionManager) heatingTest.productionManager = productionManager;
        if (leftInputs) heatingTest.leftInputs = leftInputs;
        
        heatingTest.timestamp = new Date();
        heatingTest.reportDate = new Date();

        if (isApproveCall) {
            // Heating approval only records the status. Stage transitions are
            // handled independently by the testing workflow (not by heating).
            heatingTest.status = "Approved";
            transformer.isHeatingApproved = true;
            console.log(`[HEATING] Transformer ${uniqueId} Heating Approved (no stage change).`);
        } else {
            heatingTest.status = "In Progress";
        }

        // Use markModified for sub-documents to ensure Mongoose detects changes
        transformer.markModified('testHistory.heating_test');
        await transformer.save();

        res.json({ 
            success: true, 
            message: isApproveCall ? "Heating approved." : "Heating saved successfully.",
            currentStage: transformer.currentStage
        });
    } catch (error) {
        console.error(`[ERROR] Save Heating Record failed for ${req.params.uniqueId}:`, error);
        res.status(500).json({ success: false, message: "Server error during save", error: error.message });
    }
});

module.exports = router;
