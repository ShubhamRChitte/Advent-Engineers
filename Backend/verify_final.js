const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

// Using the URI found in .env explicitly
const mongoURI = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster';

const mockUser = {
    name: "Vikram Singh",
    fullName: "Vikram Singh",
    department: "Secondary Test"
};

const stageMap = { "Secondary Test": "secondary" };

async function verify() {
    console.log("Starting Verification...");
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB.");

        const stageKey = "secondary";
        const assignmentField = `assignments.${stageKey}_tester`;
        const namesToCheck = [mockUser.name];

        // The Query Logic
        const query = {
            currentStage: stageKey,
            $or: [
                { [assignmentField]: { $in: namesToCheck } },
                { [assignmentField]: { $exists: false } },
                { [assignmentField]: null },
                { [assignmentField]: "" }
            ]
        };

        const count = await TransformerModel.countDocuments(query);
        console.log(`Transformers visible to ${mockUser.name} in Secondary: ${count}`);

        const unassignedFn = async () => {
            const all = await TransformerModel.find(query).select('assignments');
            return all.filter(t => !t.assignments || !t.assignments.secondary_tester).length;
        };
        const unassignedCount = await unassignedFn();
        console.log(`Of which are Unassigned: ${unassignedCount}`);

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
