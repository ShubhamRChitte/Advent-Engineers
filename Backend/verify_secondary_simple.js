const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

// Hardcoded URI - avoiding dotenv issues
const mongoURI = 'mongodb://127.0.0.1:27017/advent_db';

// Simulation of the User Request
const mockUser = {
    name: "Vikram Singh",
    fullName: "Vikram Singh",
    department: "Secondary Test"
};

const stageMap = {
    "Core Test": "core",
    "Secondary Test": "secondary",
    "Primary Test": "primary",
    "Final Test": "final"
};

async function verifyFix() {
    try {
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB at " + mongoURI);

        const stageKey = stageMap[mockUser.department];
        const assignmentField = `assignments.${stageKey}_tester`;
        const namesToCheck = [mockUser.name, mockUser.fullName].filter(Boolean);

        console.log(`\nSimulating Request for: ${mockUser.fullName}`);

        // The Query Logic we implemented in taskRoutes.js
        const activeAssignmentQuery = {
            currentStage: stageKey,
            $or: [
                { [assignmentField]: { $in: namesToCheck } },
                { [assignmentField]: { $exists: false } },
                { [assignmentField]: null },
                { [assignmentField]: "" }
            ]
        };

        const assignedTransformers = await TransformerModel.find(activeAssignmentQuery).select('orderId uniqueId assignments currentStage');
        console.log(`\nFound ${assignedTransformers.length} accessible transformers in '${stageKey}' stage.`);

        if (assignedTransformers.length > 0) {
            let unassignedCount = 0;
            assignedTransformers.forEach(t => {
                const assignee = t.assignments ? t.assignments[stageKey + '_tester'] : null;
                if (!assignee) unassignedCount++;
            });
            console.log(`- Unassigned (Visible due to fix): ${unassignedCount}`);
        } else {
            console.log("No transformers found in secondary stage. This might be due to no data, not a bug.");
        }

    } catch (err) {
        console.error("Verification Error:", err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
}

verifyFix();
