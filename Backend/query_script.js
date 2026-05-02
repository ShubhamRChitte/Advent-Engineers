require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const db = mongoose.connection.db;
    const coll = db.collection('transformers');
    const docs = await coll.find({'finalReportData': {$exists: true}}).toArray();
    console.log('Atlas CT reports with finalReportData:', docs.length);
    const completed = await coll.find({'testHistory.final_test.status': 'Completed'}).toArray();
    console.log('Atlas CT reports with status Completed:', completed.length);
    process.exit();
});
