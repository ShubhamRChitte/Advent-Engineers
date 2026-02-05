const mongoose = require('mongoose');
require("dotenv").config();
const { OrderModel } = require('./models/OrderModel');
const { UserModel } = require('./models/UserModel');

const uri = process.env.MONGO_URL;

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB for debugging...");

        const users = await UserModel.find({}, 'fullName department designation employeeId');
        const orders = await OrderModel.find({});

        const dump = { users, orders };
        const fs = require('fs');
        fs.writeFileSync('debug_dump.json', JSON.stringify(dump, null, 2));
        console.log("Dumped to debug_dump.json");

        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
