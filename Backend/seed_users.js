const mongoose = require('mongoose');
require("dotenv").config();
const { UserModel } = require("./models/UserModel");
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URL;

const sampleUsers = [
    // --- Core Testers ---
    {
        employeeId: "EMP002",
        password: "password123",
        fullName: "Rahul Sharma",
        mobileNumber: "9876543210",
        designation: "Senior Tester",
        department: "Core Test",
        dateOfJoining: new Date("2020-01-15"),
        employmentType: "Permanent",
        activeStatus: true,
        transformerSkills: { canTestCT: true, canTestPT: true }
    },
    {
        employeeId: "EMP003",
        password: "password123",
        fullName: "Pranav Godse",
        mobileNumber: "9876543211",
        designation: "Junior Tester",
        department: "Core Test",
        dateOfJoining: new Date("2021-06-20"),
        employmentType: "Contract",
        activeStatus: true
    },
    // --- Secondary Testers ---
    {
        employeeId: "EMP004",
        password: "password123",
        fullName: "Amit Verma",
        mobileNumber: "9876543212",
        designation: "Tester",
        department: "Secondary Test",
        dateOfJoining: new Date("2019-11-05"),
        employmentType: "Permanent",
        activeStatus: true
    },
    {
        employeeId: "EMP005",
        password: "password123",
        fullName: "Pooja Joshi",
        mobileNumber: "9876543213",
        designation: "Trainee",
        department: "Secondary Test",
        dateOfJoining: new Date("2023-02-10"),
        employmentType: "Trainee",
        activeStatus: true
    },
    // --- Primary Testers ---
    {
        employeeId: "EMP006",
        password: "password123",
        fullName: "Neha Patil",
        mobileNumber: "9876543214",
        designation: "Tester",
        department: "Primary Test",
        dateOfJoining: new Date("2021-03-30"),
        employmentType: "Permanent",
        activeStatus: true
    },
    {
        employeeId: "EMP007",
        password: "password123",
        fullName: "Sai Ghumare",
        mobileNumber: "9876543215",
        designation: "Tester",
        department: "Primary Test",
        dateOfJoining: new Date("2022-08-14"),
        employmentType: "Contract",
        activeStatus: true
    },
    // --- Final Testers ---
    {
        employeeId: "EMP008",
        password: "password123",
        fullName: "Suresh Kulkarni",
        mobileNumber: "9876543216",
        designation: "Senior QA",
        department: "Final Test",
        dateOfJoining: new Date("2018-05-22"),
        employmentType: "Permanent",
        activeStatus: true
    },
    {
        employeeId: "EMP009",
        password: "password123",
        fullName: "YD",
        mobileNumber: "9876543217",
        designation: "QA Lead",
        department: "Final Test",
        dateOfJoining: new Date("2017-01-10"),
        employmentType: "Permanent",
        activeStatus: true
    },
    // --- Admin (For Login) ---
    {
        employeeId: "EMP001",
        password: "admin",
        fullName: "System Admin",
        mobileNumber: "9999999999",
        designation: "Admin",
        department: "Management",
        dateOfJoining: new Date("2015-01-01"),
        employmentType: "Permanent",
        activeStatus: true
    },
    // --- Heating Operator ---
    {
        employeeId: "EMP_TEST_HEATING",
        password: "password123",
        fullName: "Heating Operator",
        mobileNumber: "9000000001",
        designation: "Heating Operator",
        department: "Heating",
        dateOfJoining: new Date("2023-01-01"),
        employmentType: "Permanent",
        activeStatus: true
    }
];

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB for USER SEEDING...");

        // Optional: clear existing to avoid duplicates if unique indexes exist
        await UserModel.deleteMany({});
        console.log("Cleared existing users.");

        for (const user of sampleUsers) {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);

            const newUser = new UserModel(user);
            await newUser.save();
        }

        console.log(`Seeded ${sampleUsers.length} users successfully!`);
        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Seeding Error:", err);
        process.exit(1);
    });
