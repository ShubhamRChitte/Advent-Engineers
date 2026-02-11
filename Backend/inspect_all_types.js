const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const { MeteringCoreTestModel } = require('./models/MeteringCoreTestModel');
const { ProtectionCoreTestModel } = require('./models/ProtectionCoreTestModel');

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('d:\\Advent\\Backend\\inspect_all.txt', msg + '\n');
};

const inspectAll = async () => {
    try {
        fs.writeFileSync('d:\\Advent\\Backend\\inspect_all.txt', 'Starting Full Inspection\n');
        await mongoose.connect(process.env.MONGO_URL);
        log("Connected to DB");

        // 1. Check Metering
        const meteringCount = await MeteringCoreTestModel.countDocuments({});
        const meteringEmpty = await MeteringCoreTestModel.countDocuments({ $or: [{ testedBy: "" }, { testedBy: { $exists: false } }] });
        log(`Metering Tests: Total ${meteringCount}, Empty testedBy: ${meteringEmpty}`);

        // 2. Check Protection
        const proCount = await ProtectionCoreTestModel.countDocuments({});
        const proEmpty = await ProtectionCoreTestModel.countDocuments({
            $and: [
                { coreType: 'Protection' },
                { $or: [{ testedBy: "" }, { testedBy: { $exists: false } }] }
            ]
        });
        log(`Protection Tests: Total ${proCount}, Empty testedBy: ${proEmpty}`);

        // 3. Check PS
        const psCount = await ProtectionCoreTestModel.countDocuments({ coreType: 'PS' });
        const psEmpty = await ProtectionCoreTestModel.countDocuments({
            $and: [
                { coreType: 'PS' },
                { $or: [{ testedBy: "" }, { testedBy: { $exists: false } }] }
            ]
        });
        log(`PS Tests: Total ${psCount}, Empty testedBy: ${psEmpty}`);

    } catch (err) {
        log("Error: " + err.message);
    } finally {
        await mongoose.disconnect();
    }
};

inspectAll();
