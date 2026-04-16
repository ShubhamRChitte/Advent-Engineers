require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

async function testVerbose() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        console.log("Checking Job: JOB-2026-137");

        // 1. Check all units for this job without status filter
        const allUnits = await TransformerModel.find({ jobId: "JOB-2026-137" }).lean();
        console.log(`Total units found for 137 (Any Status): ${allUnits.length}`);
        
        if (allUnits.length > 0) {
            allUnits.forEach(u => {
                console.log(`- TR: ${u.uniqueId} | stage: ${u.currentStage} | primary_status: [${u.testHistory?.primary_test?.status}] | orderId: ${u.orderId}`);
            });
        }

        // 2. Exact Replicated Query from heatingRecordRoutes.js
        const queryOrderId = new mongoose.Types.ObjectId("69ca3bd23987064030c19649");
        const jobNo = "JOB-2026-137";
        
        const query = {
            $or: [
                { orderId: queryOrderId },
                { jobId: jobNo }
            ],
            "testHistory.primary_test.status": "Completed"
        };
        
        const results = await TransformerModel.find(query).lean();
        console.log(`Final Query Results: ${results.length}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testVerbose();
