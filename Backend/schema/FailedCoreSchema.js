const { Schema } = require("mongoose");

const FailedCoreSchema = new Schema(
    {
        // --- Order Information (Backend Enriched) ---
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: false,
            index: true
        },
        orderNumber: {
            type: String,
            required: false,
            index: true,
            trim: true
        },
        batchId: {
            type: String,
            index: true
        },
        // Snapshot for Audit
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
            enum: ["METERING", "PROTECTION", "PS", "SPECIAL", "OTHER"],
            required: true,
            index: true
        },

        // --- Vendor Information ---
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "CoreVendor", // Reference to CoreVendor model
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
        dynamicValues: {
            type: Schema.Types.Mixed,
            default: {}
        },
        failureStage: {
            type: String,
            enum: [
                "INITIAL_TEST",
                "TESTING",
                "SECONDARY_TEST", "SECONDARY_METERING_TEST", "SECONDARY_PROTECTION_TEST", "SECONDARY_PS_TEST",
                "PRIMARY_TEST", "PRIMARY_METERING_TEST", "PRIMARY_PROTECTION_TEST", "PRIMARY_PS_TEST",
                "FINAL_QA", "FINAL_METERING_TEST", "FINAL_PROTECTION_TEST", "FINAL_PS_TEST",
                "FINAL_MEGGER_TEST", "FINAL_POLARITY_TEST", "FINAL_HV_SECONDARY", "FINAL_HV_PRIMARY", "FINAL_HV_CORE", "FINAL_OVIT",
                "FIELD_RETURN"
            ],
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
            enum: ["FAILED", "REPLACED", "SCRAPPED", "UNDER_ANALYSIS", "RETURNED", "REUSED", "REUSE_TESTING"],
            default: "FAILED",
            index: true
        },
        replacementCoreId: {
            type: Schema.Types.ObjectId
        }, // ID of the new core/order created
        replacementInternalCoreNo: {
            type: String,
            trim: true
        },

        // --- Return to Vendor Tracking ---
        returnStatus: {
            type: String,
            enum: ["PENDING", "RETURNED"],
            default: "PENDING",
            index: true
        },
        returnedDate: {
            type: Date
        },
        returnedBy: {
            type: String,
            trim: true
        },
        returnFormId: {
            type: Schema.Types.ObjectId,
            ref: "ReturnForm",
            index: true
        },

        // --- Workflow Control for Final Testing Routing ---
        retestStatus: {
            type: String,
            enum: ["PENDING", "COMPLETED", "NOT_APPLICABLE"],
            default: "NOT_APPLICABLE"
        },
        adminApprovalStatus: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "NOT_REQUIRED"],
            default: "NOT_REQUIRED"
        }
    },
    {
        timestamps: true
    }
);

// --- Indexes ---

// 1. Composite Index: Support querying by order and core, but NOT unique.
// A core can fail multiple times across different tests (e.g. initial failure -> retest -> another failure)
FailedCoreSchema.index({ orderId: 1, internalCoreNo: 1 });

// 2. Additional Indexes for Dashboard
// failedAt (DESC) - created in field definition or here
FailedCoreSchema.index({ failedAt: -1 });

// vendorId is indexed in field definition
// coreType is indexed in field definition
// status is indexed in field definition
// orderId is indexed in field definition

module.exports = { FailedCoreSchema };
