const { Schema } = require("mongoose");

const ReturnFormSchema = new Schema(
    {
        returnNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
            // required: true, 
            index: true
        },
        vendorName: {
            type: String,
            required: true
        },
        returnDate: {
            type: Date,
            default: Date.now
        },
        cores: [
            {
                failedCoreId: {
                    type: Schema.Types.ObjectId,
                    ref: "FailedCore"
                },
                internalCoreNo: String,
                vendorCoreNo: String,
                failureReason: String,
                orderNumber: String,
                jobId: String,
                clientName: String
            }
        ],
        status: {
            type: String,
            enum: ["PENDING", "SENT", "ACKNOWLEDGED"],
            default: "SENT"
        },
        remarks: String,
        createdBy: String
    },
    {
        timestamps: true
    }
);

module.exports = { ReturnFormSchema };
