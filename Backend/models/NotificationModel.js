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
    type: { 
        type: String, 
        enum: ["ASSIGNMENT", "STAGE_TRANSITION", "REASSIGNMENT", "ALERT"],
        default: "ASSIGNMENT"
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const NotificationModel = mongoose.model('Notification', NotificationSchema);

module.exports = { NotificationModel };
