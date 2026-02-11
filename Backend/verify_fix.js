require("dotenv").config();
const mongoose = require('mongoose');
const analyticsController = require('./controllers/AnalyticsController');

const uri = process.env.MONGO_URL;

const mockRes = {
    status: function(code) {
        console.log(`[Status]: ${code}`);
        return this;
    },
    json: function(data) {
        if (data.success) {
            console.log("Data:", JSON.stringify(data.data, null, 2));
        } else {
            console.log("Error:", data.error);
        }
        return this;
    }
};

async function run() {
    await mongoose.connect(uri);
    await analyticsController.getTestingProgress({}, mockRes);
    await mongoose.disconnect();
}

run();
