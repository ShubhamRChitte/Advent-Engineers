const mongoose = require('mongoose');
const { OrderSchema } = require('./Backend/schema/OrderSchema');
const OrderModel = mongoose.model('Order', OrderSchema);

async function testPersistence() {
    await mongoose.connect('mongodb://localhost:27017/advent_engineers');
    console.log("Connected to MongoDB");

    const testOrder = new OrderModel({
        jobId: "TEST-ORD-001",
        clientName: "Test Client",
        clientContactNo: "1234567890",
        transformerName: "Test Transformer",
        transformerType: "CT",
        quantity: 1,
        noOfCores: 1,
        coreDetails: [{ coreType: "Metering", accuracyClass: "0.5", vendorNo: "V-001" }],
        coreVendors: {
            metering: [
                { serialNo: 1, name: "Vendor A" },
                { serialNo: 2, name: "Vendor B" }
            ]
        },
        deadline: new Date(),
        isStandard: "Yes",
        ratedSecondaryCurrent: 5
    });

    const saved = await testOrder.save();
    console.log("Saved Order coreVendors:", JSON.stringify(saved.coreVendors, null, 2));

    const retrieved = await OrderModel.findById(saved._id);
    console.log("Retrieved Order coreVendors:", JSON.stringify(retrieved.coreVendors, null, 2));

    await OrderModel.deleteOne({ _id: saved._id });
    console.log("Cleanup done.");
    await mongoose.disconnect();
}

testPersistence().catch(console.error);
