const mongoose = require('mongoose');
// require("dotenv").config(); // Removed

const fs = require('fs');
function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug_log.txt', msg + '\n');
}

// Clear log file
fs.writeFileSync('debug_log.txt', '');

log("Imports starting...");
const { TransformerModel } = require('./models/TransformerModel');
log("TransformerModel imported");
const { OrderModel } = require('./models/OrderModel');
log("OrderModel imported");

const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

log("Connecting to DB...");
mongoose.connect(uri)
    .then(async () => {
        log("Connected to DB");
        await debugOrder('JOB-2026-067');
        log("Debug finished, disconnecting...");
        mongoose.disconnect();
    })
    .catch(err => log("DB Error: " + err));

async function debugOrder(jobString) {
    log(`\n--- Debugging ${jobString} ---`);

    // 1. Find Order
    const order = await OrderModel.findOne({
        $or: [{ jobId: jobString }, { orderId: jobString }]
    }).lean();

    if (!order) {
        log("Order not found!");
        return;
    }
    log(`Order Found: ${order.jobId} (_id: ${order._id})`);

    // 2. Find Transformers (Logic from taskRoutes.js)
    const transQuery = {
        $or: [
            { orderId: order._id },
            { orderId: order._id.toString() }
        ]
    };
    if (order.jobId) {
        transQuery.$or.push({ jobId: order.jobId });
    }

    const transformers = await TransformerModel.find(transQuery).lean();
    log(`Total Transformers Found: ${transformers.length}`);

    // 3. Run Aggregation Logic
    let coreCount = 0;
    let secondaryCount = 0;
    let primaryCount = 0;
    let finalCount = 0;

    transformers.forEach((t, i) => {
        log(`\n[Unit ${i + 1}] ID: ${t.uniqueId} | Stage: ${t.currentStage}`);

        const stages = ['core', 'secondary', 'primary', 'final', 'completed', 'dispatch'];
        const currentStageIdx = stages.indexOf(t.currentStage || 'core');

        // Log details
        const h = t.testHistory || {};
        log(`  History: Core=${h.core_test?.status}, Sec=${h.secondary_test?.status}, Pri=${h.primary_test?.status}, Final=${h.final_test?.status}`);
        log(`  StageIdx: ${currentStageIdx}`);

        // Check Core
        const coreDone = (currentStageIdx > 0 || h.core_test?.status === 'Completed' || h.core_test?.status === 'Pass');
        if (coreDone) coreCount++;
        log(`  -> Core Done? ${coreDone}`);

        // Check Secondary
        const secDone = (currentStageIdx > 1 || h.secondary_test?.status === 'Completed' || h.secondary_test?.status === 'Pass');
        if (secDone) secondaryCount++;
        log(`  -> Sec Done? ${secDone}`);

        // Check Primary
        const priDone = (currentStageIdx > 2 || h.primary_test?.status === 'Completed' || h.primary_test?.status === 'Pass');
        if (priDone) primaryCount++;
        log(`  -> Pri Done? ${priDone}`);

        // Check Final
        const finalDone = (currentStageIdx > 3 || h.final_test?.status === 'Completed' || h.final_test?.status === 'Pass');
        if (finalDone) finalCount++;
        log(`  -> Final Done? ${finalDone}`);
    });

    log("\n--- Totals ---");
    log(`Core: ${coreCount}/${transformers.length}`);
    log(`Secondary: ${secondaryCount}/${transformers.length}`);
    log(`Primary: ${primaryCount}/${transformers.length}`);
    log(`Final: ${finalCount}/${transformers.length}`);

    let stageSlug = 'core-testing';

    if (coreCount === transformers.length) stageSlug = 'secondary-testing';
    if (coreCount === transformers.length && secondaryCount === transformers.length) stageSlug = 'after-primary-testing';
    if (coreCount === transformers.length && secondaryCount === transformers.length && primaryCount === transformers.length) stageSlug = 'final-testing';
    if (coreCount === transformers.length && secondaryCount === transformers.length && primaryCount === transformers.length && finalCount === transformers.length) stageSlug = 'completed';

    log(`\nCalculated Stage Slug: ${stageSlug}`);
}
