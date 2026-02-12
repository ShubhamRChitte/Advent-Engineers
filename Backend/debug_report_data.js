require("dotenv").config({ path: 'd:/Advent/Backend/.env' });
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

const uri = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(uri)
    .then(() => {
        console.log('Connected to MongoDB');
        checkData();
    }).catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });

async function checkData() {
    try {
        // Find a transformer that has completed secondary test
        // specifically one that might have metering results
        const transformer = await TransformerModel.findOne({
            "testHistory.secondary_test.status": "Completed"
        }).sort({ updatedAt: -1 });

        if (!transformer) {
            console.log('No transformer found with completed secondary test.');
        } else {
            console.log('Found transformer:', transformer.uniqueId);
            const history = transformer.testHistory?.secondary_test;
            if (history) {
                const fs = require('fs');
                const output = {
                    uniqueId: transformer.uniqueId,
                    metering_results: history.metering_results,
                    ps_results: history.ps_results,
                    testHistory: transformer.testHistory
                };
                fs.writeFileSync('d:/Advent/Backend/debug_output_full.txt', JSON.stringify(output, null, 2));
                console.log('Results written to d:/Advent/Backend/debug_output_full.txt');
            } else {
                console.log('No secondary test history found.');
            }
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        mongoose.disconnect();
    }
}
