
const mongoose = require('mongoose');
const fs = require('fs');
const { TransformerModel } = require('./models/TransformerModel');
const { UserModel } = require('./models/UserModel');
require('dotenv').config();

const uri = process.env.MONGO_URL;
const logFile = 'd:/Advent/Backend/debug_report.txt';

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

async function debugReports() {
    try {
        fs.writeFileSync(logFile, '--- Debug Report ---\n');
        await mongoose.connect(uri);
        log("Connected to DB");

        const targetName = "Vikram Singh";
        log(`Debugging for User: ${targetName}`);

        // 1. Check User existance
        const user = await UserModel.findOne({ $or: [{ name: targetName }, { fullName: targetName }] });
        if (user) {
            log(`User found: Name=${user.name}, FullName=${user.fullName}, Role=${user.role}`);
        } else {
            log("User NOT found in UserModel.");
        }

        // 2. Find ALL transformers where 'Vikram' appears
        const looseRegex = new RegExp("Vikram", 'i');

        const potentialTransformers = await TransformerModel.find({
            $or: [
                { "testHistory.secondary_test.tester": looseRegex },
                { "assignments.secondary_tester": looseRegex }
            ]
        }).select('uniqueId currentStage testHistory assignments');

        log(`Found ${potentialTransformers.length} transformers matching 'Vikram'.`);

        potentialTransformers.forEach(t => {
            log(`\nID: ${t.uniqueId}`);
            log(`Stage: ${t.currentStage}`);

            const secTest = t.testHistory?.secondary_test;
            const status = secTest?.status;
            const tester = secTest?.tester;
            const assigned = t.assignments?.secondary_tester;

            log(`Secondary Status: '${status}'`);
            log(`Recorded Tester: '${tester}'`);
            log(`Assigned Tester: '${assigned}'`);

            const nameMatch = (tester && new RegExp(targetName, 'i').test(tester)) ||
                (assigned && new RegExp(targetName, 'i').test(assigned));
            const isCompleted = status === 'Completed';

            log(`> Name Matches '${targetName}'? ${nameMatch}`);
            log(`> Status is Completed? ${isCompleted}`);
            log(`> Expected in 'My Reports'? ${nameMatch && isCompleted}`);

            if (nameMatch && !isCompleted) {
                console.log("ALERT: Name matches but status is NOT Completed.");
            }
        });

    } catch (err) {
        log(`ERROR: ${err.message}`);
    } finally {
        mongoose.connection.close();
    }
}

debugReports();
