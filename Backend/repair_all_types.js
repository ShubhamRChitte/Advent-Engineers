const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const { MeteringCoreTestModel } = require('./models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('./models/ProtectionCoreTestModel');

const runRepair = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB");

        const targetUser = "Rahul Sharma"; // Assigning orphans to the current user

        // 1. Repair Metering
        const resM = await MeteringCoreTestModel.updateMany(
            { $or: [{ testedBy: "" }, { testedBy: { $exists: false } }] },
            { $set: { testedBy: targetUser } }
        );
        console.log(`Updated Metering Tests: ${resM.modifiedCount}`);

        // 2. Repair Protection & PS (Same Model)
        const resP = await ProtectionCoreTestModel.updateMany(
            { $or: [{ testedBy: "" }, { testedBy: { $exists: false } }] },
            { $set: { testedBy: targetUser } }
        );
        console.log(`Updated Protection/PS Tests: ${resP.modifiedCount}`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

runRepair();
