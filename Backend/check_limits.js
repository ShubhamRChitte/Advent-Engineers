
const mongoose = require('mongoose');

async function checkLimits() {
    await mongoose.connect('mongodb://localhost:27017/advent_engineers');
    const MeteringLimit = mongoose.model('MeteringAccuracyLimit', new mongoose.Schema({}, { strict: false }));

    const limits = await MeteringLimit.find({});
    console.log('--- Metering Limits ---');
    limits.forEach(l => {
        console.log(`Class: ${l.accuracyClass}, Limits: ${l.limits?.length || 0} rows`);
    });

    const ProtectionLimit = mongoose.model('ProtectionAccuracyLimit', new mongoose.Schema({}, { strict: false }));
    const pLimits = await ProtectionLimit.find({});
    console.log('\n--- Protection Limits ---');
    pLimits.forEach(l => {
        console.log(`Class: ${l.protectionClass}`);
    });

    process.exit(0);
}

checkLimits();
