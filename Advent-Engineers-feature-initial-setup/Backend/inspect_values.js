const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const { OrderModel } = require('./models/OrderModel');
const { MeteringCoreTestModel } = require('./models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('./models/ProtectionCoreTestModel');

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('d:\\Advent\\Backend\\debug_values.txt', msg + '\n');
};

const inspectValues = async () => {
    try {
        fs.writeFileSync('d:\\Advent\\Backend\\debug_values.txt', 'Starting Inspection\n');
        await mongoose.connect(process.env.MONGO_URL);
        log("Connected to DB");

        const targetJobId = "JOB-2026-033";
        const order = await OrderModel.findOne({ jobId: targetJobId });

        if (!order) {
            log("Order NOT FOUND");
            return;
        }

        const pTests = await ProtectionCoreTestModel.find({ orderId: order._id });
        log(`Found ${pTests.length} Protection Tests`);

        pTests.forEach((t, i) => {
            log(`[${i}] ID: ${t._id}, testedBy: "${t.testedBy}", valid: ${t.testedBy === "" ? 'Empty String' : 'Not Empty'}`);
            log(`    Typeof: ${typeof t.testedBy}`);
        });

    } catch (err) {
        log("Error: " + err.message);
    } finally {
        await mongoose.disconnect();
    }
};

inspectValues();
