require('dotenv').config();
const mongoose = require('mongoose');
const AccuracyLimit = require('../models/AccuracyLimit.cjs');

const uri = process.env.MONGO_URL;

const ACCURACY_CLASS_LIMITS = {
    "0.1": [
        { load: "120%", ratioLimit: 0.1, phaseLimit: 5 },
        { load: "100%", ratioLimit: 0.1, phaseLimit: 5 },
        { load: "20%", ratioLimit: 0.2, phaseLimit: 8 },
        { load: "5%", ratioLimit: 0.4, phaseLimit: 15 }
    ],
    "0.2": [
        { load: "120%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "100%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "20%", ratioLimit: 0.35, phaseLimit: 15 },
        { load: "5%", ratioLimit: 0.75, phaseLimit: 30 }
    ],
    "0.5": [
        { load: "120%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "100%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "20%", ratioLimit: 0.75, phaseLimit: 45 },
        { load: "5%", ratioLimit: 1.5, phaseLimit: 90 }
    ],
    "1": [
        { load: "120%", ratioLimit: 1.0, phaseLimit: 60 },
        { load: "100%", ratioLimit: 1.0, phaseLimit: 60 },
        { load: "20%", ratioLimit: 1.5, phaseLimit: 90 },
        { load: "5%", ratioLimit: 3.0, phaseLimit: 180 }
    ],
    "3": [
        { load: "120%", ratioLimit: 3.0, phaseLimit: null },
        { load: "50%", ratioLimit: 3.0, phaseLimit: null }
    ],
    "5": [
        { load: "120%", ratioLimit: 5.0, phaseLimit: null },
        { load: "50%", ratioLimit: 5.0, phaseLimit: null }
    ],
    "0.2S": [
        { load: "120%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "100%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "20%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "5%", ratioLimit: 0.35, phaseLimit: 15 },
        { load: "1%", ratioLimit: 0.75, phaseLimit: 30 }
    ],
    "0.5S": [
        { load: "120%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "100%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "20%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "5%", ratioLimit: 0.75, phaseLimit: 45 },
        { load: "1%", ratioLimit: 1.5, phaseLimit: 90 }
    ]
};

const PROTECTION_CLASS_LIMITS = {
    "5P": { maxCurrentError: 1.0, maxPhaseError: 60, maxCompositeError: 5.0 },
    "10P": { maxCurrentError: 3.0, maxPhaseError: null, maxCompositeError: 10.0 },
    "15P": { maxCurrentError: 5.0, maxPhaseError: null, maxCompositeError: 15.0 }
};

const PS_LIMITS = {
    psRatioErrorLimit: 0.25,
    psExcitationMultiplier: 1.5
};

async function seedLimits() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Seed Metering
        for (const [accuracyClass, limits] of Object.entries(ACCURACY_CLASS_LIMITS)) {
            await AccuracyLimit.findOneAndUpdate(
                { coreType: 'metering', accuracyClass },
                { coreType: 'metering', accuracyClass, limits },
                { upsert: true, new: true }
            );
            console.log(`Seeded Metering Class ${accuracyClass}`);
        }

        // Seed Protection
        for (const [protectionClass, limits] of Object.entries(PROTECTION_CLASS_LIMITS)) {
            await AccuracyLimit.findOneAndUpdate(
                { coreType: 'protection', protectionClass },
                {
                    coreType: 'protection',
                    protectionClass,
                    maxCurrentError: limits.maxCurrentError,
                    maxPhaseError: limits.maxPhaseError,
                    maxCompositeError: limits.maxCompositeError
                },
                { upsert: true, new: true }
            );
            console.log(`Seeded Protection Class ${protectionClass}`);
        }

        // Seed PS
        await AccuracyLimit.findOneAndUpdate(
            { coreType: 'ps' },
            {
                coreType: 'ps',
                psRatioErrorLimit: PS_LIMITS.psRatioErrorLimit,
                psExcitationMultiplier: PS_LIMITS.psExcitationMultiplier
            },
            { upsert: true, new: true }
        );
        console.log(`Seeded PS Limits`);


        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedLimits();
