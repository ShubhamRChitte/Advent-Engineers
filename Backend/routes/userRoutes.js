const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { UserModel } = require('../models/UserModel');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// GET all users (Admin only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const users = await UserModel.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ADD a new user (Admin only)
router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { fullName, emailId, employeeId, password, designation, department, mobileNumber, employmentType, dateOfJoining } = req.body;

        // Check if user exists
        const existingUser = await UserModel.findOne({ employeeId });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this Employee ID already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new UserModel({
            fullName,
            emailId,
            employeeId,
            password: hashedPassword,
            designation,
            department,
            mobileNumber: mobileNumber || '0000000000', // Default if missing
            employmentType: employmentType || 'Permanent', // Default
            dateOfJoining: dateOfJoining || new Date(), // Default to now
            activeStatus: true
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "User created successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE a user (Admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const user = await UserModel.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
