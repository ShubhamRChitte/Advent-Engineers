const cron = require("node-cron");
const ReadyTransformer = require("../models/ReadyTransformerModel");

const initReservationCleanup = () => {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const now = new Date();

      const result = await ReadyTransformer.updateMany(
        {
          status: "reserved",
          reservationExpiresAt: { $lt: now }
        },
        {
          status: "available",
          reservedBy: null,
          reservationExpiresAt: null
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Cron] Cleared ${result.modifiedCount} expired reservations.`);
        if (global.io) global.io.emit("readyStockUpdated");
      }
    } catch (err) {
      console.error("[Cron Error] Error in reservation cleanup:", err);
    }
  });
  console.log("Reservation Cleanup Cron Job initialized.");
};

module.exports = { initReservationCleanup };
