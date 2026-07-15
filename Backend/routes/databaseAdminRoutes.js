const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
const { OrderModel } = require('../models/OrderModel');
const { TransformerModel } = require('../models/TransformerModel');
const { FailedTransformerModel } = require('../models/FailedTransformerModel');
const ReadyTransformerModel = require('../models/ReadyTransformerModel');
const { NotificationModel } = require('../models/NotificationModel');
const { SettingsModel } = require('../models/SettingsModel');
const { CTTimerModel } = require('../models/CTTimerModel');
const { PTTimerModel } = require('../models/PTTimerModel');
const { FailedCoreModel } = require('../models/FailedCoreModel');
const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');
const { SecondaryMeteringTestModel } = require('../models/SecondaryMeteringTestModel');
const { HeatingRecordModel } = require('../models/HeatingRecordModel');

// Map of collection name to Mongoose Model
const modelsMap = {
    'orders': OrderModel,
    'transformers': TransformerModel,
    'failed-transformers': FailedTransformerModel,
    'ready-stock': ReadyTransformerModel,
    'notifications': NotificationModel
};

// Map of collection name to display properties
const displayPropsMap = {
    'orders': { titleField: 'jobId', descField: 'clientName', subField: 'status' },
    'transformers': { titleField: 'uniqueId', descField: 'name', subField: 'currentStage' },
    'failed-transformers': { titleField: 'transformerUniqueId', descField: 'coreType', subField: 'status' },
    'ready-stock': { titleField: 'coreId', descField: 'coreType', subField: 'status' },
    'notifications': { titleField: 'type', descField: 'message', subField: 'jobId' }
};

// GET /api/database-admin/collections
// Lists available collections and their record counts
router.get('/collections', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const stats = [];
        for (const [key, Model] of Object.entries(modelsMap)) {
            const count = await Model.countDocuments();
            stats.push({
                id: key,
                name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                count
            });
        }
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error("Error fetching collection stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch collection stats" });
    }
});

// GET /api/database-admin/records/:collection
// Fetch records for a specific collection
router.get('/records/:collection', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const collectionKey = req.params.collection;
        const Model = modelsMap[collectionKey];
        if (!Model) {
            return res.status(400).json({ success: false, message: "Invalid collection" });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const displayProps = displayPropsMap[collectionKey];

        let query = {};
        if (search) {
            query = {
                $or: [
                    { [displayProps.titleField]: { $regex: search, $options: 'i' } },
                    { [displayProps.descField]: { $regex: search, $options: 'i' } }
                ]
            };
        }

        let recordsQuery = Model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        if (collectionKey === 'transformers') {
            recordsQuery = recordsQuery.populate('orderId', 'transformerType');
        }
        const records = await recordsQuery.lean();
        const total = await Model.countDocuments(query);

        // Format uniformly for the frontend table
        const formattedRecords = records.map(r => {
            let description = r[displayProps.descField];
            if (collectionKey === 'transformers' && r.orderId) {
                description = r.orderId.transformerType || description;
            }
            
            return {
                _id: r._id,
                title: r[displayProps.titleField] || 'N/A',
                description: description || 'N/A',
                sub: r[displayProps.subField] || 'N/A',
                createdAt: r.createdAt || r.created_at || new Date()
            };
        });

        res.status(200).json({
            success: true,
            data: formattedRecords,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching records:", error);
        res.status(500).json({ success: false, message: "Failed to fetch records" });
    }
});

// Helper for Cascading Deletes
const cascadeDeleteTransformer = async (transformerId) => {
    const transformer = await TransformerModel.findById(transformerId).lean();
    if (transformer) {
        await FailedTransformerModel.deleteMany({ transformerId });
        await CTTimerModel.deleteMany({ transformerId: transformer.uniqueId });
        await PTTimerModel.deleteMany({ transformerId: transformer.uniqueId });
        await NotificationModel.deleteMany({ unitId: transformer.uniqueId });
        await ReadyTransformerModel.deleteMany({ "transformerId.uniqueId": transformer.uniqueId }); 
        await SecondaryMeteringTestModel.deleteMany({ uniqueId: transformer.uniqueId });
        await MeteringCoreTestModel.deleteMany({ uniqueId: transformer.uniqueId });
        await ProtectionCoreTestModel.deleteMany({ uniqueId: transformer.uniqueId });
        await HeatingRecordModel.updateMany(
            {},
            { $pull: { blocks: { transformerId: transformer.uniqueId } } }
        );
    }
    await TransformerModel.findByIdAndDelete(transformerId);
};

const cascadeDeleteOrder = async (orderId) => {
    const transformers = await TransformerModel.find({ orderId }).lean();
    for (const t of transformers) {
        await cascadeDeleteTransformer(t._id);
    }
    await CTTimerModel.deleteMany({ orderId });
    await PTTimerModel.deleteMany({ orderId });
    await FailedCoreModel.deleteMany({ orderId });
    await NotificationModel.deleteMany({ orderId });
    await OrderModel.findByIdAndDelete(orderId);
};


// DELETE /api/database-admin/records/:collection/:id
router.delete('/records/:collection/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { collection, id } = req.params;

        if (collection === 'orders') {
            await cascadeDeleteOrder(id);
        } else if (collection === 'transformers') {
            await cascadeDeleteTransformer(id);
        } else {
            // Direct delete for others
            const Model = modelsMap[collection];
            if (!Model) return res.status(400).json({ success: false, message: "Invalid collection" });
            await Model.findByIdAndDelete(id);
        }

        res.status(200).json({ success: true, message: "Record deleted successfully" });
    } catch (error) {
        console.error("Error deleting record:", error);
        res.status(500).json({ success: false, message: "Failed to delete record" });
    }
});

// DELETE /api/database-admin/records/:collection
// Delete ALL records in a collection with cascade
router.delete('/records/:collection', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { collection } = req.params;

        if (collection === 'orders') {
            const allOrders = await OrderModel.find({}, '_id').lean();
            for (const o of allOrders) await cascadeDeleteOrder(o._id);
        } else if (collection === 'transformers') {
            const allTransformers = await TransformerModel.find({}, '_id').lean();
            for (const t of allTransformers) await cascadeDeleteTransformer(t._id);
        } else if (collection === 'failed-transformers') {
            await FailedTransformerModel.deleteMany({});
        } else {
            const Model = modelsMap[collection];
            if (!Model) return res.status(400).json({ success: false, message: "Invalid collection" });
            await Model.deleteMany({});
        }

        res.status(200).json({ success: true, message: `All records in ${collection} deleted successfully` });
    } catch (error) {
        console.error("Error deleting all records:", error);
        res.status(500).json({ success: false, message: "Failed to clear collection" });
    }
});

// GET /api/database-admin/timers
// Fetch all timer settings from SettingsModel
router.get('/timers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const settings = await SettingsModel.find({}).lean();
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error("Error fetching timers:", error);
        res.status(500).json({ success: false, message: "Failed to fetch timers" });
    }
});

// PUT /api/database-admin/timers
// Bulk update timer settings
router.put('/timers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { updates } = req.body; // Expecting array of { key, value }
        if (!Array.isArray(updates)) {
            return res.status(400).json({ success: false, message: "Updates must be an array" });
        }

        for (const update of updates) {
            await SettingsModel.findOneAndUpdate(
                { key: update.key },
                { $set: { value: update.value } },
                { upsert: true }
            );
        }
        res.status(200).json({ success: true, message: "Timers updated successfully" });
    } catch (error) {
        console.error("Error updating timers:", error);
        res.status(500).json({ success: false, message: "Failed to update timers" });
    }
});

// -----------------------------------------------------------------------------
// ID GENERATION SETTINGS
// -----------------------------------------------------------------------------

router.get('/id-settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
        let settings = await SettingsModel.findOne({ key: 'id_generation_settings' });
        if (!settings) {
            // Default configuration
            settings = await SettingsModel.create({
                key: 'id_generation_settings',
                value: {
                    orderId: { enabled: false, prefix: 'ORD-', lastSequence: '000' },
                    transformerId: { enabled: false, prefix: 'TR-JOB-', lastSequence: '000' },
                    preTestBatchId: { enabled: false, prefix: 'BATCH-', lastSequence: '000' },
                    preTestCoreId: { enabled: false, prefix: 'PRE-', lastSequence: '000' }
                }
            });
        }
        res.status(200).json({ success: true, data: settings.value });
    } catch (error) {
        console.error("Error fetching ID settings:", error);
        res.status(500).json({ success: false, message: "Failed to fetch ID settings" });
    }
});

router.put('/id-settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { updates } = req.body;
        if (!updates) return res.status(400).json({ success: false, message: "Missing updates data" });

        const updatedSettings = await SettingsModel.findOneAndUpdate(
            { key: 'id_generation_settings' },
            { $set: { value: updates } },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, message: "ID settings updated successfully", data: updatedSettings.value });
    } catch (error) {
        console.error("Error updating ID settings:", error);
        res.status(500).json({ success: false, message: "Failed to update ID settings" });
    }
});

module.exports = router;
