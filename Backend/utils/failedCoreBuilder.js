/**
 * Builds a deterministic snapshot for a Failed Core record.
 * Normalizes enums and ensures all required fields are present.
 *
 * @param {Object} order - The Order document
 * @param {Object} coreData - The specific core reading/row from Test Collection
 * @param {Object} failurePayload - { failureReason, failureStage } from Frontend
 * @param {Object} vendor - The Vendor document (Optional, if we implement Vendor model later)
 */
exports.buildFailedCoreSnapshot = (order, coreData, failurePayload, vendor = null, coreTypeOverride = null) => {
    // 1. Normalize Enums
    const coreType = (coreTypeOverride || order.coreDetails?.[0]?.coreType || "METERING").toUpperCase();
    const failureStage = (failurePayload.failureStage || "INITIAL_TEST").toUpperCase();

    // 2. Extract Core Number (Handle different field names in different test schemas)
    // Metering/Protection/PS usually have 'vendorCoreNo' in the readings/rows
    const vendorCoreNo = coreData.vendorCoreNo || coreData.coreVendorNo || "UNKNOWN-VENDOR-NO";
    const internalCoreNo = coreData.internalCoreNo || "UNKNOWN-INTERNAL-NO";

    // 3. Build Snapshot
    return {
        // --- Order Context ---
        orderId: order._id,
        orderNumber: order.orderNumber || "ODR-UNKNOWN", // Fallback if missing
        jobId: order.jobId,
        clientName: order.clientName || "Unknown Client",

        // --- Core Identity ---
        internalCoreNo: internalCoreNo,
        vendorCoreNo: vendorCoreNo,
        coreType: coreType,

        // --- Vendor Context ---
        vendorId: vendor ? vendor._id : null,
        vendorName: vendor ? vendor.name : (order.vendorName || "Unknown Vendor"), // Fallback to Order's vendor if exists

        // --- Failure Metadata ---
        failureReason: failurePayload.failureReason,
        failureStage: failureStage,
        failedAt: new Date(),
        status: "FAILED",

        // --- Technical Snapshot (Optional) ---
        // We can capture the specific readings that failed if needed
        // dynamicValues: coreData 
    };
};
