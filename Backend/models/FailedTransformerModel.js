const { Schema, model } = require("mongoose");

const FailedTransformerSchema = new Schema(
    {
        // --- Order Information ---
        transformerId: {
            type: Schema.Types.ObjectId,
            ref: "Transformer",
            required: true,
            index: true
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true
        },
        jobNumber: {
            type: String,
            trim: true
        },
        clientName: {
            type: String,
            trim: true
        },

        // --- Core & Failure details ---
        coreType: {
            // e.g. "METERING", "PROTECTION 1", "PROTECTION 2"
            type: String, 
            required: true,
            trim: true
        },
        failureParameters: {
            // Store the specific failing rows/ratios/values for reference
            type: Schema.Types.Mixed,
            default: {}
        },
        failureReason: {
            type: String,
            required: true,
            trim: true
        },
        
        // --- Audit details ---
        reportedBy: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: Date,
            default: Date.now,
            index: true
        },

        // --- Extensibility ---
        stage: {
            type: String,
            enum: ["PT_TESTING", "FIELD_RETURN", "SECONDARY_TESTING", "pt_pretest_testING"],
            default: "PT_TESTING"
        },
        status: {
            type: String,
            enum: ["FAILED", "REPLACED", "SCRAPPED", "UNDER_ANALYSIS", "RETURNED", "TREATING", "RETESTED", "TREATED", "RESOLVED"],
            default: "FAILED",
            index: true
        },
        transformerUniqueId: {
            type: String,
            trim: true
        },
        testType: {
            type: String,
            trim: true
        },
        retestHistory: {
            type: Schema.Types.Mixed,
            default: []
        },
        treatedBy: {
            type: String,
            trim: true
        },
        treatedAt: {
            type: Date
        },
        resolutionRemarks: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes
FailedTransformerSchema.index({ transformerId: 1, coreType: 1 }, { unique: true });
FailedTransformerSchema.index({ date: -1 });

const FailedTransformerModel = model("FailedTransformer", FailedTransformerSchema);

module.exports = { FailedTransformerModel, FailedTransformerSchema };
