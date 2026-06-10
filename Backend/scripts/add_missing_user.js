const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require("dotenv").config();
const { UserModel } = require('./models/UserModel');

const uri = process.env.MONGO_URL;

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB...");

        const user = await UserModel.findOne({ employeeId: "EMP-1007" });
        if (user) {
            console.log("User Amit Patel already exists.");
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const newUser = new UserModel({
            employeeId: "EMP-1007",
            fullName: "Amit Patel",
            mobileNumber: "9876543217",
            emailId: "amit.patel@transformer.com",
            designation: "Testing",
            department: "Core Test",
            dateOfJoining: "2023-05-15",
            employmentType: "Permanent",
            transformerSkills: {
                canTestCT: true,
                canTestPT: true
            },
            testCapabilities: {
                ratioTest: true,
                polarityTest: true,
                burdenTest: true,
                accuracyTest: true,
                excitationTest: true,
                insulationResistanceTest: true
            },
            voltageExperience: [11, 33],
            assignedLab: "Core Testing Lab",
            activeStatus: true,
            password: hashedPassword
        });

        await newUser.save();
        console.log("User Amit Patel added successfully!");
        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Error:", err);
        process.exit(1);
    });
