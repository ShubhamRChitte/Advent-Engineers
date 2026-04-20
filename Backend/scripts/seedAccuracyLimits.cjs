require('dotenv').config();
const mongoose = require('mongoose');
const AccuracyLimit = require('../models/AccuracyLimit.cjs');

const uri = process.env.MONGO_URL;

const CT_ACCURACY_CLASS_LIMITS = {
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

const PT_ACCURACY_CLASS_LIMITS = {
    "0.1": [{ load: "100%", ratioLimit: 0.1, phaseLimit: 5 }],
    "0.2": [{ load: "100%", ratioLimit: 0.2, phaseLimit: 10 }],
    "0.5": [{ load: "100%", ratioLimit: 0.5, phaseLimit: 20 }],
    "1": [{ load: "100%", ratioLimit: 1.0, phaseLimit: 40 }],
    "3": [{ load: "100%", ratioLimit: 3.0, phaseLimit: null }]
};

const CT_PROTECTION_CLASS_LIMITS = {
    "5P": { maxCurrentError: 1.0, maxPhaseError: 60, maxCompositeError: 5.0 },
    "10P": { maxCurrentError: 3.0, maxPhaseError: null, maxCompositeError: 10.0 },
    "15P": { maxCurrentError: 5.0, maxPhaseError: null, maxCompositeError: 15.0 }
};

const PT_PROTECTION_CLASS_LIMITS = {
    "3P": { maxCurrentError: 3.0, maxPhaseError: 120, maxCompositeError: null },
    "6P": { maxCurrentError: 6.0, maxPhaseError: 240, maxCompositeError: null }
};

const PS_LIMITS = {
    psRatioErrorLimit: 0.25,
    psExcitationMultiplier: 1.5
};

async function seedLimitsForType(transformerType, meteringLimits, protectionLimits, psLimits) {
    // Seed Metering
    for (const [accuracyClass, limits] of Object.entries(meteringLimits)) {
        await AccuracyLimit.findOneAndUpdate(
            { transformerType, coreType: 'metering', accuracyClass },
            { transformerType, coreType: 'metering', accuracyClass, limits },
            { upsert: true, new: true }
        );
        console.log(`Seeded ${transformerType} Metering Class ${accuracyClass}`);
    }

    // Seed Protection
    for (const [protectionClass, limits] of Object.entries(protectionLimits)) {
        await AccuracyLimit.findOneAndUpdate(
            { transformerType, coreType: 'protection', protectionClass },
            {
                transformerType,
                coreType: 'protection',
                protectionClass,
                maxCurrentError: limits.maxCurrentError,
                maxPhaseError: limits.maxPhaseError,
                maxCompositeError: limits.maxCompositeError
            },
            { upsert: true, new: true }
        );
        console.log(`Seeded ${transformerType} Protection Class ${protectionClass}`);
    }

    // Seed PS (usually only for CT)
    if (psLimits) {
        await AccuracyLimit.findOneAndUpdate(
            { transformerType, coreType: 'ps' },
            {
                transformerType,
                coreType: 'ps',
                psRatioErrorLimit: psLimits.psRatioErrorLimit,
                psExcitationMultiplier: psLimits.psExcitationMultiplier
            },
            { upsert: true, new: true }
        );
        console.log(`Seeded ${transformerType} PS Limits`);
    }
}

async function seedLimits() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Seed CT Limits
        await seedLimitsForType('CT', CT_ACCURACY_CLASS_LIMITS, CT_PROTECTION_CLASS_LIMITS, PS_LIMITS);
        
        // Seed PT Limits
        await seedLimitsForType('PT', PT_ACCURACY_CLASS_LIMITS, PT_PROTECTION_CLASS_LIMITS, null);

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedLimits();
