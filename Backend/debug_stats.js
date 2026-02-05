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
    fs.appendFileSync('d:\\Advent\\Backend\\debug_output.txt', msg + '\n');
};

const runDebug = async () => {
    try {
        fs.writeFileSync('d:\\Advent\\Backend\\debug_output.txt', 'Starting Debug\n');
        await mongoose.connect(process.env.MONGO_URL);
        log("Connected to DB");

        // 1. Find the target order (JOB-2026-033 from screenshot)
        const order = await OrderModel.findOne({ jobId: "JOB-2026-033" });
        if (!order) {
            log("Order not found!");
            return;
        }
        log(`Order Found: ${order._id} (Status: ${order.status})`);

        // 2. Fetch all tests for this order
        const meteringTests = await MeteringCoreTestModel.find({ orderId: order._id });
        const protectionTests = await ProtectionCoreTestModel.find({ orderId: order._id });

        log(`\nFound ${meteringTests.length} Metering Tests`);
        log(`Found ${protectionTests.length} Protection Tests`);

        // 3. Inspect 'testedBy' field
        const allTests = [...meteringTests, ...protectionTests];

        log("\n--- Tester Names in Records ---");
        const uniqueTesters = [...new Set(allTests.map(t => t.testedBy))];
        uniqueTesters.forEach(tester => {
            log(`- "${tester}" (Type: ${typeof tester})`);
        });

        // 4. Simulate the logic from taskRoutes.js
        const simulateUserCheck = (userNameToCheck) => {
            log(`\nChecking against user: "${userNameToCheck}"`);
            const normalizedUser = (userNameToCheck || '').trim().toLowerCase();

            const matches = allTests.filter(t => {
                if (!t.testedBy) return false;
                const normalizedTester = String(t.testedBy).trim().toLowerCase();
                const isMatch = normalizedTester === normalizedUser;
                return isMatch;
            });

            log(`Total Matches via filter: ${matches.length}`);
        };

        // Test with expected names from previous context
        simulateUserCheck("Pranav Godse");
        simulateUserCheck("Rahul Sharma");

    } catch (err) {
        log("Error: " + err.message);
    } finally {
        await mongoose.disconnect();
    }
};

runDebug();
