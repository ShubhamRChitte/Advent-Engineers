const mongoose = require('mongoose');
require('dotenv').config();
const { UserModel } = require('./models/UserModel');
const { CounterModel } = require('./models/CounterModel');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URL;

async function testEmployeeFeature() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to DB");

        // 1. Test ID Generation
        console.log("Testing ID Generation...");
        const sequenceDocument = await CounterModel.findOneAndUpdate(
            { id: "employee_id" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seq = sequenceDocument.seq;
        const employeeId = `EMP${seq.toString().padStart(3, '0')}`;
        console.log("Generated ID:", employeeId);

        // 2. Test User Creation
        console.log("Testing User Creation...");
        const testUser = {
            employeeId,
            fullName: "Test Automated User",
            mobileNumber: "9999999999",
            emailId: "testauto@example.com",
            designation: "Tester",
            department: "Core Test",
            dateOfJoining: new Date(),
            employmentType: "Permanent",
            password: "password123",
            activeStatus: true
        };

        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        testUser.password = hashedPassword;

        const newUser = new UserModel(testUser);
        await newUser.save();
        console.log("User saved successfully.");

        // 3. Verify User exists
        const savedUser = await UserModel.findOne({ employeeId });
        if (savedUser) {
            console.log("User found in DB:", savedUser.fullName, savedUser.employeeId);
        } else {
            console.error("User NOT found!");
        }

        // Cleanup
        await UserModel.deleteOne({ employeeId });
        console.log("Cleanup: User deleted.");

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
}

testEmployeeFeature();
