const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');
require("dotenv").config();

const uri = process.env.MONGO_URL;

async function inspect() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB");

        const items = await TransformerModel.find({
            // Try to match by regex or just list all for this job if ID pattern is weird
            uniqueId: { $regex: "2026-007" }
        });

        const fs = require('fs');
        let output = `Found ${items.length} transformers matching '2026-007'\n`;

        items.forEach(t => {
            output += "---------------------------------------------------\n";
            output += `ID: ${t.uniqueId}\n`;
            output += `Stage: ${t.currentStage}\n`;
            output += `Assignments: ${JSON.stringify(t.assignments)}\n`;
            output += `TestHistory Core: ${t.testHistory?.core_test?.status}\n`;
        });

        fs.writeFileSync('d:/Advent/Backend/inspection_output.txt', output);
        console.log("Written to d:/Advent/Backend/inspection_output.txt");

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

inspect();
