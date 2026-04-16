const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

async function verify() {
    try {
        const uri = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster';
        await mongoose.connect(uri);

        console.log("--- TRANS QUERY START ---");
        const typeStr = 'CT';
        const transQuery = {
            $or: [
                { currentStage: "heating" },
                { "testHistory.primary_test.status": "Completed" },
                { "testHistory.pt_test.status": "Completed" }
            ]
        };

        const transformers = await TransformerModel.find(transQuery).populate('orderId').lean();
        console.log(`Found ${transformers.length} total transformers in broad query.`);

        const ordersMap = new Map();
        for (const t of transformers) {
            if (t.orderId && t.orderId.transformerType === typeStr) {
                const oid = t.orderId._id.toString();
                if (!ordersMap.has(oid)) {
                    ordersMap.set(oid, t.orderId);
                }
            }
        }

        const orders = Array.from(ordersMap.values());
        console.log(`Found ${orders.length} orders for CT in Heating Tracking.`);
        const job145 = orders.find(o => o.jobId === 'JOB-2026-145');
        console.log(`Job 145 found: ${!!job145}`);

        if (job145) {
            console.log("--- COMPLETED STATUS TEST ---");
            const orderIds = [job145._id.toString()];
            const compQuery = { 
                orderId: { $in: orderIds },
                "processHistory.heatingRecord.status": { $in: ["Approved", "Completed"] }
            };
            const compTransformers = await TransformerModel.find(compQuery).lean();
            const completedIds = [...new Set(compTransformers.map(t => t.orderId ? t.orderId.toString() : null).filter(id => id !== null))];
            console.log(`Order ${job145.jobId} is completed: ${completedIds.includes(job145._id.toString())}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

verify();
