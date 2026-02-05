const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require("dotenv").config();
const { UserModel } = require("./models/UserModel");

const uri = process.env.MONGO_URL;

const seedUsers = async () => {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB...");

        // Clear existing users
        await UserModel.deleteMany({});
        console.log("Cleared existing users.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);

        const users = [
            {
                employeeId: "EMP-1001",
                fullName: "Amit Admin",
                designation: "Admin",
                department: "Management",
                mobileNumber: "9999999999", // Dummy required field
                dateOfJoining: new Date(),   // Dummy required field
                employmentType: "Permanent", // Dummy required field
                password: hashedPassword
            },
            {
                employeeId: "EMP-1002",
                fullName: "Suresh Entry",
                designation: "Entry Level",
                department: "Office",
                mobileNumber: "9999999998",
                dateOfJoining: new Date(),
                employmentType: "Permanent",
                password: hashedPassword
            },
            {
                employeeId: "EMP-2001",
                fullName: "Rahul Core",
                designation: "Testing",
                department: "Core Test",
                mobileNumber: "9999999997",
                dateOfJoining: new Date(),
                employmentType: "Permanent",
                password: hashedPassword
            },
            {
                employeeId: "EMP-2002",
                fullName: "Vijay Second",
                designation: "Testing",
                department: "Secondary Test",
                mobileNumber: "9999999996",
                dateOfJoining: new Date(),
                employmentType: "Permanent",
                password: hashedPassword
            },
            {
                employeeId: "EMP-2003",
                fullName: "Anil Primary",
                designation: "Testing",
                department: "Primary Test",
                mobileNumber: "9999999995",
                dateOfJoining: new Date(),
                employmentType: "Permanent",
                password: hashedPassword
            },
            {
                employeeId: "EMP-2004",
                fullName: "Sunil Final",
                designation: "Testing",
                department: "Final Test",
                mobileNumber: "9999999994",
                dateOfJoining: new Date(),
                employmentType: "Permanent",
                password: hashedPassword
            }
        ];

        await UserModel.insertMany(users);
        console.log("Users seeded successfully!");

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();
