const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
    recipientRole: { 
        type: String, 
        required: true,
        enum: ["core", "secondary", "primary", "heating", "final", "pt", "admin"]
    },
    recipientName: { type: String }, // Optional: If assigned to a specific person
    message: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    jobId: { type: String },
    unitId: { type: String }, // Added to support unit-specific notifications (like Strict Approval)
    type: { 
        type: String, 
        enum: ["ASSIGNMENT", "STAGE_TRANSITION", "REASSIGNMENT", "ALERT", "ORDER_COMPLETED", "STRICT_APPROVAL_REQUESTED", "STRICT_APPROVAL_RESOLVED"],
        default: "ASSIGNMENT"
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 2592000 } // TTL 30 days
}, { timestamps: true });

// Remove the unique index on type and orderId to allow multiple units/requests per order
// NotificationSchema.index({ type: 1, orderId: 1 }, { unique: true });

const NotificationModel = mongoose.model('Notification', NotificationSchema);

module.exports = { NotificationModel };
