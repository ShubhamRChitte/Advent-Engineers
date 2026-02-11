
const mongoose = require('mongoose');
const fs = require('fs');
const { TransformerModel } = require('./models/TransformerModel');
const { UserModel } = require('./models/UserModel');
require('dotenv').config();

const uri = process.env.MONGO_URL;
const logFile = 'd:/Advent/Backend/query_debug.txt';

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

async function debugQuery() {
    try {
        fs.writeFileSync(logFile, '--- Query Debug Report ---\n');
        await mongoose.connect(uri);
        log("Connected to DB");

        const targetName = "Vikram Singh";
        // Simulate what taskRoutes.js does
        // const user = req.user;
        // const currentUserName = (user.name || user.fullName || '').trim();

        // We fetch user to get the exact string
        const user = await UserModel.findOne({ fullName: targetName });
        const currentUserName = (user.name || user.fullName || '').trim();

        log(`Simulated currentUserName: '${currentUserName}'`);

        const regex = new RegExp(currentUserName, 'i');
        log(`Regex: ${regex}`);

        const query = {
            "testHistory.secondary_test.status": "Completed",
            $or: [
                { "testHistory.secondary_test.tester": { $regex: regex } },
                { "assignments.secondary_tester": { $regex: regex } }
            ]
        };

        log("Executing Query: " + JSON.stringify(query, null, 2));

        const transformers = await TransformerModel.find(query);
        log(`Query returned ${transformers.length} results.`);

        transformers.forEach(t => {
            log(`- Found: ${t.uniqueId} | Status: ${t.testHistory.secondary_test.status} | Tester: ${t.testHistory.secondary_test.tester}`);
        });

    } catch (err) {
        log(`ERROR: ${err.message}`);
    } finally {
        mongoose.connection.close();
    }
}

debugQuery();
