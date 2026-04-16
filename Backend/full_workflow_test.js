const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

async function runFullWorkflowTest() {
    try {
        const uri = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster';
        await mongoose.connect(uri);
        console.log("Connected to MongoDB for Full Workflow Test...");

        const TEST_JOB_ID = "JOB-TEST-WF-999";
        const TEST_UNIQUE_ID = "TR-JOB-TEST-WF-999-001";

        // 0. Cleanup
        await OrderModel.deleteMany({ jobId: TEST_JOB_ID });
        await TransformerModel.deleteMany({ jobId: TEST_JOB_ID });
        console.log("1. Cleaned up old test data.");

        // 1. Create Order
        const order = await OrderModel.create({
            jobId: TEST_JOB_ID,
            clientName: "Test Robot Ltd",
            clientContactNo: "9000000000",
            transformerName: "CT-100A-Test",
            transformerType: "CT",
            quantity: 1,
            noOfCores: 1,
            coreDetails: [{ coreType: "Metering", accuracyClass: "0.5s" }],
            nominalSystemVoltage: 11,
            ratedSecondaryCurrent: 1,
            deadline: new Date(Date.now() + 86400000),
            isApproved: true,
            isStandard: "Standard",
            currentStage: "core"
        });
        console.log(`2. Created Order: ${order.jobId}`);

        // 2. Create Transformer
        const transformer = await TransformerModel.create({
            uniqueId: TEST_UNIQUE_ID,
            orderId: order._id,
            jobId: order.jobId,
            transformerType: "CT",
            currentStage: "core",
            testHistory: {
                core_test: { status: "Pending" }
            }
        });
        console.log(`3. Created Transformer: ${transformer.uniqueId}`);

        // 3. Move to Secondary (Simulate Core Completion)
        transformer.currentStage = "secondary";
        transformer.testHistory.core_test = {
            status: "Completed",
            tester: "Core Tester",
            timestamp: new Date()
        };
        await transformer.save();
        console.log("4. Completed Core Test -> Moved to Secondary.");

        // 4. Move to Primary (Simulate Secondary Completion)
        transformer.currentStage = "primary";
        transformer.testHistory.secondary_test = {
            status: "Completed",
            tester: "Secondary Tester",
            timestamp: new Date(),
            metering_results: [{ ratioValue: "100/1", rows: [{ current: "100%", r100: "0.1", p100: "2" }] }]
        };
        await transformer.save();
        console.log("5. Completed Secondary Test -> Moved to Primary.");

        // 5. Move to Heating (Simulate Primary Completion)
        transformer.currentStage = "heating";
        transformer.testHistory.primary_test = {
            status: "Completed",
            tester: "Primary Tester",
            timestamp: new Date()
        };
        await transformer.save();
        console.log("6. Completed Primary Test -> Moved to Heating.");

        // 6. Move to Final (Simulate Heating Approval - THE NEW LOGIC)
        transformer.currentStage = "final";
        transformer.testHistory.heating_test = {
            status: "Approved",
            processSteps: [
                { process: "Coil Drying", duration: "12h", remarks: "OK" },
                { process: "Oil Filling", duration: "4h", remarks: "Vacuum stable" }
            ],
            preparedBy: "Antigravity AI",
            reportDate: new Date(),
            timestamp: new Date()
        };
        transformer.markModified('testHistory.heating_test');
        await transformer.save();
        console.log("7. Approved Heating Test -> Moved to Final Stage.");

        // 7. Complete Final Test (Simulate Shipping)
        transformer.currentStage = "shipped";
        transformer.testHistory.final_test = {
            status: "Completed",
            tester: "Final Tester",
            timestamp: new Date()
        };
        await transformer.save();
        console.log("8. Completed Final Test -> Status: SHIPPED.");

        console.log("\n--- WORKFLOW TEST SUCCESSFUL ---");
        console.log(`Summary: Transformer ${TEST_UNIQUE_ID} successfully transitioned through all 5 testing stages.`);

    } catch (err) {
        console.error("Workflow Test Failed:", err);
    } finally {
        await mongoose.connection.close();
    }
}

runFullWorkflowTest();
