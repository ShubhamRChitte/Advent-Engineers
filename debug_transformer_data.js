const mongoose = require('mongoose');
const { TransformerSchema } = require('./Backend/schema/TransformerSchema');
const TransformerModel = mongoose.model('Transformer', TransformerSchema);

async function checkData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/advent-backend'); // Adjust DB name if needed
        console.log("Connected to MongoDB");

        const uniqueId = 'TR-JOB-2026-078-001';
        const transformer = await TransformerModel.findOne({ uniqueId }).lean();

        if (!transformer) {
            console.log(`Transformer ${uniqueId} not found.`);
            return;
        }

        console.log("Transformer Data:");
        console.log(JSON.stringify(transformer, null, 2));

        console.log("\nSecondary Test History:");
        console.log(JSON.stringify(transformer.testHistory?.secondary_test, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
