require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

const uri = process.env.MONGO_URL;

async function verifyVisibility() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const stageKey = 'secondary';
        const user = {
            fullName: "Vikram Singh",
            department: "Secondary Test"
        };
        const namesToCheck = [user.fullName];

        // Copied Logic from taskRoutes.js (Granular Assignment Logic)
        const assignmentField = `assignments.${stageKey}_tester`;

        const activeAssignmentQuery = {
            currentStage: stageKey,
            $or: [
                { [assignmentField]: { $in: namesToCheck } },
                { [assignmentField]: { $exists: false } },
                { [assignmentField]: null },
                { [assignmentField]: "" }
            ]
        };

        console.log("Querying with:", JSON.stringify(activeAssignmentQuery, null, 2));

        const assignedTransformers = await TransformerModel.find(activeAssignmentQuery).select('orderId uniqueId currentStage');
        console.log(`Found ${assignedTransformers.length} assigned transformers for ${user.fullName}`);

        const targetTransformers = assignedTransformers.filter(t => t.uniqueId.includes("JOB-2026-037"));

        if (targetTransformers.length > 0) {
            console.log("SUCCESS: Found transformers for JOB-2026-037!");
            targetTransformers.forEach(t => {
                console.log(` - ${t.uniqueId} [${t.currentStage}]`);
            });
        } else {
            console.log("FAILURE: Did not find transformers for JOB-2026-037.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyVisibility();
