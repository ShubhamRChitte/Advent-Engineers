const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

const { OrderModel } = require('./models/OrderModel');
const { MeteringCoreTestModel } = require('./models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('./models/ProtectionCoreTestModel');
const { TransformerModel } = require('./models/TransformerModel');

const mongoURI = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/advent-db";

const debugOrder = async () => {
    const debugData = {};
    try {
        await mongoose.connect(mongoURI);
        debugData.connection = "Connected";

        const jobId = "JOB-2026-072";
        const order = await OrderModel.findOne({ jobId });

        if (!order) {
            debugData.error = "Order not found";
        } else {
            debugData.order = {
                _id: order._id,
                jobId: order.jobId,
                assignments: order.assignments
            };

            const transformers = await TransformerModel.find({ orderId: order._id });
            debugData.transformersCount = transformers.length;

            const meteringTests = await MeteringCoreTestModel.find({ orderId: order._id });
            const protectionTests = await ProtectionCoreTestModel.find({ orderId: order._id });

            debugData.testCounts = {
                metering: meteringTests.length,
                protection: protectionTests.length
            };

            const allTests = [...meteringTests, ...protectionTests];
            debugData.uniqueTestedBy = [...new Set(allTests.map(t => t.testedBy))];

            // Log the raw testedBy values to be sure
            debugData.rawTestedByValues = allTests.map(t => ({ id: t._id, testedBy: t.testedBy, type: t.coreType }));

            if (meteringTests.length > 0) {
                debugData.sampleMeteringOrderId = meteringTests[0].orderId;
                debugData.sampleMeteringOrderIdType = typeof meteringTests[0].orderId;
            }

            const userName = "Rahul Sharma";
            const userTests = allTests.filter(t => t.testedBy && t.testedBy.trim().toLowerCase() === userName.toLowerCase());
            debugData.userTestsCount = userTests.length;

            // Check string match for orderId
            const orderIdMatch = allTests.filter(t => t.orderId && t.orderId.toString() === order._id.toString());
            debugData.orderIdMatchCount = orderIdMatch.length;
        }

    } catch (error) {
        debugData.error = error.toString();
    } finally {
        await mongoose.disconnect();
        fs.writeFileSync('debug_output.json', JSON.stringify(debugData, null, 2), 'utf8');
    }
};

debugOrder();
