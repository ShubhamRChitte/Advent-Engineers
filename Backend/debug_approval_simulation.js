const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
require("dotenv").config();

const uri = process.env.MONGO_URL;

async function debugApproval() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB");

        const jobId = "JOB-2026-007";
        const coreId = "M-007-001"; // Simulated payload input

        console.log(`[Simulation] Job: ${jobId}, Input: ${coreId}`);

        // --- COPY OF BACKEND LOGIC ---
        const parts = coreId.split('-');
        const seq = parts[parts.length - 1]; // "001"
        console.log(`[Simulation] Parsed Seq: "${seq}"`);

        // 1. Standard
        const seq3 = seq.padStart(3, '0');
        let transformerUniqueId = `TR-${jobId}-${seq3}`;
        console.log(`[Simulation] Retrying Standard ID: "${transformerUniqueId}"`);

        let updated = await TransformerModel.findOne({ uniqueId: transformerUniqueId });
        console.log(`[Simulation] Standard Match (${transformerUniqueId}): ${updated ? 'YES' : 'NO'}`);

        // 2. Legacy Pattern
        // Logic: parseInt -> padStart(2)
        const seqInt = parseInt(seq, 10);
        const seq2 = String(seqInt).padStart(2, '0');

        const legacyId = `${jobId}/${seq2}`;
        console.log(`[Simulation] Retrying Legacy ID: "${legacyId}"`);

        updated = await TransformerModel.findOne({ uniqueId: legacyId });
        console.log(`[Simulation] Legacy Match (${legacyId}): ${updated ? 'YES' : 'NO'}`);

        if (updated) {
            console.log("Found Document:", updated._id);
            console.log("Current Stage:", updated.currentStage);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

debugApproval();
