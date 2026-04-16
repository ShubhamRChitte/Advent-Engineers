const { NotificationModel } = require('../models/NotificationModel');

/**
 * Notifies the next stage testers assigned to an order.
 * @param {Object} order - The order document
 * @param {string} nextStage - The stage name (core, secondary, primary, final, pt)
 */
const notifyNextStage = async (order, nextStage) => {
    try {
        if (!order || !order.assignments) return;

        // Map stage to a more readable name for the notification message
        const stageNames = {
            'core': 'Core',
            'secondary': 'Secondary',
            'primary': 'Primary',
            'final': 'Final',
            'pt': 'PT'
        };

        const readableStage = stageNames[nextStage] || nextStage;

        // Filter assignments for the next stage
        const nextStageAssignments = order.assignments.filter(a => a.stage === nextStage);

        for (const assignment of nextStageAssignments) {
            await NotificationModel.create({
                recipientName: assignment.testerName,
                recipientRole: nextStage, // Ensure this matches existing roles in NotificationModel if possible
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
 * Notifies Admin about an order milestone.
 */
const notifyAdmin = async (order, message) => {
  try {
    await NotificationModel.create({
      recipientRole: 'admin',
      message: message,
      type: 'STAGE_TRANSITION',
      orderId: order._id,
      jobId: order.jobId
    });
    console.log(`[Notification] Admin notified for Order ${order.jobId}`);
  } catch (err) {
    console.error(`[Notification Error] Failed to notify Admin for Order ${order._id}:`, err);
  }
};

/**
 * Marks notifications for a specific order and role as read.
 * Useful when a stage is approved and we want to clear the 'New Assignment' alerts.
 */
const clearNotifications = async (orderId, role, recipientName = null) => {
    try {
        const query = {
            orderId: orderId,
            recipientRole: role,
            isRead: false
        };

        if (recipientName) {
            query.recipientName = recipientName;
        }

        const result = await NotificationModel.updateMany(query, {
            $set: { isRead: true }
        });

        console.log(`[Notification Cleanup] Marked ${result.modifiedCount} notifications as read for Order ${orderId}, Role: ${role}`);
    } catch (err) {
        console.error(`[Notification Cleanup Error] Failed to clear notifications for Order ${orderId}:`, err);
    }
};

module.exports = {
    notifyNextStage,
    notifyAdmin,
    clearNotifications
};
