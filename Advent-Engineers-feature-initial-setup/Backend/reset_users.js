const mongoose = require('mongoose');
require("dotenv").config();
const { UserModel } = require("./models/UserModel");
const uri = process.env.MONGO_URL;

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB for USER RESET...");
        const deleteResult = await UserModel.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} users.`);
        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
