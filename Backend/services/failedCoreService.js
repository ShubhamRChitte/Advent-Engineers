const { FailedCoreModel } = require('../models/FailedCoreModel');
const { OrderModel } = require('../models/OrderModel');
const { MeteringCoreTestModel } = require('../models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('../models/ProtectionCoreTestModel');
const { buildFailedCoreSnapshot } = require('../utils/failedCoreBuilder');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

/**
 * Service to handle Failed Core logic
 */
class FailedCoreService {

    /**
     * Records a failed core with full audit trail.
     * @param {string} orderId 
     * @param {string} internalCoreNo 
     * @param {Object} failureData { failureReason, failureStage, dynamicValues }
     */
    async recordFailure(orderId, internalCoreNo, failureData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Fetch Order (Parent Context)
            const order = await OrderModel.findById(orderId).session(session);
            if (!order) {
                throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
            }

            // 2. Fetch Core Details from Test Records (Source of Truth)
            // We need to find the specific test record that contains this core to get vendor info
            // Strategy: Search both Metering and Protection collections
            let coreData = null;
            let coreType = "UNKNOWN";

            // Check Metering
            const meteringRecord = await MeteringCoreTestModel.findOne({
                orderId: orderId,
                "readings.internalCoreNo": internalCoreNo
            }).session(session);

            if (meteringRecord) {
                coreType = "METERING";
                coreData = meteringRecord.readings.find(r => r.internalCoreNo === internalCoreNo);
            } else {
                // Check Protection
                const protectionRecord = await ProtectionCoreTestModel.findOne({
                    orderId: orderId,
                    "readings.internalCoreNo": internalCoreNo
                }).session(session);

                if (protectionRecord) {
                    coreType = "PROTECTION"; // or PS based on record
                    coreData = protectionRecord.readings.find(r => r.internalCoreNo === internalCoreNo);
                }
            }

            const machineDate = new Date();

            // Fallback Object if not found in Test Results (e.g. Failed during initial entry)
            // This ensures we can still fail a core even if it hasn't successfully SAVED a test result yet (which is common for failures)
            if (!coreData) {
                console.warn(`[Audit Warning] Core ${internalCoreNo} not found in saved test results. Using Order data only.`);
                coreData = {
                    internalCoreNo: internalCoreNo,
                    vendorCoreNo: "NOT-RECORDED-YET", // Explicit audit flag
                    // We could fetch from Order.coreDetails if we had granular core tracking there
                };
            }

            // 4. Build Snapshot
            // 4. Build Snapshot using Builder (Normalizes Enums)
            const failedCorePayload = buildFailedCoreSnapshot(
                order,
                coreData,
                failureData,
                null, // Vendor object (future)
                coreType !== "UNKNOWN" ? coreType : null // coreTypeOverride
            );

            // 5. Check Duplicates (Idempotency)
            const existingFailure = await FailedCoreModel.findOne({
                orderId,
                internalCoreNo,
                status: 'FAILED'
            }).session(session);

            if (existingFailure) {
                // If already failed, just return existing record (Idempotent)
                // Or update dynamic values? For now, prevent double-counting.
                await session.abortTransaction();
                session.endSession();
                return existingFailure;
            }

            const failedCore = new FailedCoreModel(failedCorePayload);
            await failedCore.save({ session });

            await session.commitTransaction();
            session.endSession();
            return failedCore;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Processes the return of a failed core to the vendor.
     * Updates FailedCore and the original Test Record.
     * @param {string} failedCoreId 
     * @param {string} returnedBy 
     */
    async returnToVendor(failedCoreId, returnedBy) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const failedCore = await FailedCoreModel.findById(failedCoreId).session(session);
            if (!failedCore) {
                throw new AppError("Failed core not found", 404, "NOT_FOUND");
            }

            if (failedCore.status === "RETURNED" || failedCore.returnStatus === "RETURNED") {
                await session.abortTransaction();
                session.endSession();
                return failedCore;
            }

            // Update FailedCore Document
            failedCore.status = "RETURNED";
            failedCore.returnStatus = "RETURNED";
            failedCore.returnedDate = new Date();
            failedCore.returnedBy = returnedBy;
            await failedCore.save({ session });

            // Update Main Test Record
            const { orderId, internalCoreNo, coreType } = failedCore;

            if (coreType === "METERING") {
                await MeteringCoreTestModel.updateOne(
                    { orderId, "readings.internalCoreNo": internalCoreNo },
                    { $set: { "readings.$.status": "RETURNED" } },
                    { session }
                );
            } else {
                await ProtectionCoreTestModel.updateOne(
                    { orderId, "readings.internalCoreNo": internalCoreNo },
                    { $set: { "readings.$.status": "RETURNED" } },
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();
            return failedCore;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Undoes the return of a failed core, moving it back to FAILED state.
     * @param {string} failedCoreId 
     */
    async undoReturnToVendor(failedCoreId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const failedCore = await FailedCoreModel.findById(failedCoreId).session(session);
            if (!failedCore) {
                throw new AppError("Failed core not found", 404, "NOT_FOUND");
            }

            if (failedCore.status !== "RETURNED" && failedCore.returnStatus !== "RETURNED") {
                await session.abortTransaction();
                session.endSession();
                return failedCore; // Already not returned
            }

            // Revert FailedCore Document
            failedCore.status = "FAILED";
            failedCore.returnStatus = "PENDING";
            failedCore.returnedDate = undefined;
            failedCore.returnedBy = undefined;
            await failedCore.save({ session });

            // Revert Main Test Record
            const { orderId, internalCoreNo, coreType } = failedCore;

            if (coreType === "METERING") {
                await MeteringCoreTestModel.updateOne(
                    { orderId, "readings.internalCoreNo": internalCoreNo },
                    { $set: { "readings.$.status": "FAIL" } },
                    { session }
                );
            } else {
                await ProtectionCoreTestModel.updateOne(
                    { orderId, "readings.internalCoreNo": internalCoreNo },
                    { $set: { "readings.$.status": "FAIL" } },
                    { session }
                );
            }

            await session.commitTransaction();
            session.endSession();
            return failedCore;

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

module.exports = new FailedCoreService();
