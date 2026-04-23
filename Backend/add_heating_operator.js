/**
 * add_heating_operator.js
 * Safely adds the heating_operator user to the database without wiping existing users.
 * Run: node add_heating_operator.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
const { UserModel } = require('./models/UserModel');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URL;

const heatingUser = {
    employeeId: 'EMP_TEST_HEATING',
    password: 'password123',
    fullName: 'Heating Operator',
    mobileNumber: '9000000001',
    designation: 'Heating Operator',
    department: 'Heating',
    dateOfJoining: new Date('2023-01-01'),
    employmentType: 'Permanent',
    activeStatus: true
};

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to MongoDB...');

        const existing = await UserModel.findOne({ employeeId: heatingUser.employeeId });
        if (existing) {
            console.log(`User ${heatingUser.employeeId} already exists. Skipping.`);
            mongoose.connection.close();
            return;
        }

        const salt = await bcrypt.genSalt(10);
        heatingUser.password = await bcrypt.hash(heatingUser.password, salt);

        const newUser = new UserModel(heatingUser);
        await newUser.save();

        console.log(`✅ Heating Operator user created: ${heatingUser.employeeId} / password123`);
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
