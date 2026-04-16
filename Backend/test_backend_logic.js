require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

async function testBackendLogic() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        
        const orderId = "69ca3bd23987064030c19669"; // From my previous check for Job 137
        
        let queryOrderId = orderId;
        if (mongoose.Types.ObjectId.isValid(orderId)) {
            queryOrderId = new mongoose.Types.ObjectId(orderId);
        }

        const order = await OrderModel.findById(queryOrderId).lean();
        const jobNo = order ? order.jobId : null;

        console.log(`[DEBUG] order found: ${!!order} | jobNo: ${jobNo}`);

        const query = {
            $or: [
                { orderId: queryOrderId },
                ...(jobNo ? [{ jobId: jobNo }] : [])
            ],
            "testHistory.primary_test.status": "Completed"
        };
        
        console.log("[DEBUG] query:", JSON.stringify(query, null, 2));

        const transformers = await TransformerModel.find(query).lean();
        console.log(`[DEBUG] result count: ${transformers.length}`);
        
        transformers.forEach(t => {
            console.log(`- TR: ${t.uniqueId} | stage: ${t.currentStage} | primary_status: ${t.testHistory?.primary_test?.status}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
testBackendLogic();
