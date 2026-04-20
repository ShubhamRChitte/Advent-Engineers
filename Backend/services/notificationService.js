const { NotificationModel } = require('../models/NotificationModel');
const { SystemSettingsModel } = require('../models/SystemSettingsModel');
const { OrderModel } = require('../models/OrderModel');

/**
 * Atomicly handles order completion notification to prevent duplicates and race conditions.
 * @param {Object} order - The order document
 * @param {string} oldStatus - The status before transition
 */
const handleOrderCompletion = async (order, oldStatus) => {
    try {
        if (!order) return;

        // Ensure status is normalized to COMPLETED
        const newStatus = order.status;
        
        // Critical: Only trigger if transition is TO COMPLETED from a DIFFERENT status
        if (oldStatus !== 'COMPLETED' && newStatus === 'COMPLETED') {
            const message = `Order #${order.jobId} completed. All testing stages approved.`;
            
            // Atomic Upsert: type + orderId is unique index
            // Using try-catch to handle potential duplicate key error (11000) gracefully
            try {
                await NotificationModel.updateOne(
                    { type: 'ORDER_COMPLETED', orderId: order._id },
                    { 
                        $setOnInsert: {
                            recipientRole: 'admin',
                            message: message,
                            type: 'ORDER_COMPLETED',
                            orderId: order._id,
                            jobId: order.jobId,
                            isRead: false,
                            createdAt: new Date()
                        }
                    },
                    { upsert: true }
                );
                console.log(`[NOTIFICATION_CREATED] COMPLETED alert for Order ${order.jobId}`);
            } catch (mongoErr) {
                if (mongoErr.code === 11000) {
                    console.log(`[NOTIFICATION_SKIP] Duplicate completion alert prevented for Order ${order.jobId}`);
                } else {
                    throw mongoErr;
                }
            }
        }
    } catch (err) {
        console.error(`[Notification Error] Failed to handle completion for Order ${order._id}:`, err);
    }
};

/**
 * Notifies the next stage testers assigned to an order.
 */
const notifyNextStage = async (order, nextStage) => {
    try {
        if (!order || !order.assignments) return;

        const stageNames = {
            'core': 'Core',
            'secondary': 'Secondary',
            'primary': 'Primary',
            'final': 'Final',
            'pt': 'PT'
        };

        const readableStage = stageNames[nextStage] || nextStage;
        const nextStageAssignments = order.assignments.filter(a => a.stage === nextStage);

        for (const assignment of nextStageAssignments) {
            await NotificationModel.create({
                recipientName: assignment.testerName,
                recipientRole: nextStage,
                message: `New assignment available for order ${order.jobId} at stage ${readableStage}.`,
                type: 'ASSIGNMENT',
                orderId: order._id,
                jobId: order.jobId
            });
            console.log(`[Notification] Created for ${assignment.testerName} (Role: ${nextStage}) for Order ${order.jobId}`);
        }
    } catch (err) {
        console.error(`[Notification Error] Failed to notify next stage (${nextStage}) for Order ${order._id}:`, err);
    }
};

/**
 * Marks notifications for a specific order and role as read.
 */
const clearNotifications = async (orderId, role, recipientName = null) => {
    try {
        const query = { orderId, recipientRole: role, isRead: false };
        if (recipientName) query.recipientName = recipientName;

        const result = await NotificationModel.updateMany(query, { $set: { isRead: true } });
        console.log(`[Notification Cleanup] Marked ${result.modifiedCount} notifications as read for Order ${orderId}, Role: ${role}`);
    } catch (err) {
        console.error(`[Notification Cleanup Error] Failed to clear notifications for Order ${orderId}:`, err);
    }
};

/**
 * One-time migration to normalize "Completed" -> "COMPLETED" status.
 * Guarded by SystemSettings flag.
 */
const runInitialMigration = async () => {
    try {
        const flagKey = 'STATUS_NORMALIZATION_V1';
        const isRun = await SystemSettingsModel.findOne({ key: flagKey });

        if (!isRun) {
            console.log(`[MIGRATION_START] Normalizing Order statuses to COMPLETED...`);
            
            // Normalize existing "Completed" or "completed" to "COMPLETED"
            const result = await OrderModel.updateMany(
                { status: { $in: ["Completed", "completed"] } },
                { $set: { status: "COMPLETED" } }
            );

            await SystemSettingsModel.create({
                key: flagKey,
                value: true,
                description: 'Order status normalization to COMPLETED'
            });

            console.log(`[MIGRATION_DONE] Updated ${result.modifiedCount} orders to COMPLETED.`);
        } else {
            console.log(`[MIGRATION_SKIP] Status normalization already performed.`);
        }
    } catch (err) {
        console.error(`[MIGRATION_ERROR] Migration failed:`, err);
    }
};

module.exports = {
    handleOrderCompletion,
    notifyNextStage,
    clearNotifications,
    runInitialMigration
};
