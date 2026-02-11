const { Schema } = require("mongoose");

const FailedCoreSchema = new Schema(
    {
        // --- Order Information (Backend Enriched) ---
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true
        },
        orderNumber: {
            type: String,
            required: true,
            index: true,
            trim: true
        }, // Snapshot for Audit
        jobId: {
            type: String,
            trim: true
        },
        clientName: {
            type: String,
            trim: true
        }, // Snapshot for Audit

        // --- Core Identification ---
        internalCoreNo: {
            type: String,
            required: true,
            trim: true
        },
        vendorCoreNo: {
            type: String,
            required: true,
            trim: true
        },
        coreType: {
            type: String,
            enum: ["METERING", "PROTECTION", "SPECIAL", "OTHER"],
            required: true,
            index: true
        },

        // --- Vendor Information ---
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "Vendor", // Assumes Vendor model exists or will be created
            index: true
        },
        vendorName: {
            type: String,
            trim: true
        }, // Snapshot for Audit

        // --- Failure Metadata ---
        failureReason: {
            type: String,
            required: true,
            trim: true
        },
        failureStage: {
            type: String,
            enum: ["INITIAL_TEST", "SECONDARY_TEST", "FINAL_QA", "FIELD_RETURN"],
            required: true
        },
        failedAt: {
            type: Date,
            default: Date.now,
            index: true
        },

        // --- Replacement Tracking (Future Safe) ---
        status: {
            type: String,
            enum: ["FAILED", "REPLACED", "SCRAPPED", "UNDER_ANALYSIS"],
            default: "FAILED",
            index: true
        },
        replacementCoreId: {
            type: Schema.Types.ObjectId
        }, // ID of the new core/order created
        replacementInternalCoreNo: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// --- Indexes ---

// 1. Composite Unique Index: Prevent duplicate failure entries for the same core in an order
// status is included? No, prompt says: "orderId + internalCoreNo" unique.
// "A core should not appear twice in failed records unless replaced."
// If replaced, it might fail again? The prompt implies "replace" means a NEW core.
// So `internalCoreNo` refers to the specifier. If identifying PHYSICAL core, then unique makes sense.
FailedCoreSchema.index({ orderId: 1, internalCoreNo: 1 }, { unique: true });

// 2. Additional Indexes for Dashboard
// failedAt (DESC) - created in field definition or here
FailedCoreSchema.index({ failedAt: -1 });

// vendorId is indexed in field definition
// coreType is indexed in field definition
// status is indexed in field definition
// orderId is indexed in field definition

module.exports = { FailedCoreSchema };
