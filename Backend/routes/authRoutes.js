const express = require("express");
const passport = require("passport");
const router = express.Router();

// Helper to map designation/department to frontend role
const getMappedRole = (user) => {
    const role = user.designation === 'Admin' ? 'admin' :
        (user.designation === 'Entry Operator' || user.designation === 'Entry Level') ? 'entry-operator' :
            user.department === 'Core Test' ? 'core-tester' :
                user.department === 'Secondary Test' ? 'secondary-tester' :
                    user.department === 'Primary Test' ? 'after-primary-tester' :
                        user.department === 'Final Test' ? 'final-tester' : 
                            user.department === 'PT Test' ? 'pt-tester' : 'viewer';
    return role;
};

// Login Route
router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, message: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);

            const role = getMappedRole(user);

            // Manually save session to ensure cookie is set before response
            req.session.save((err) => {
                if (err) return next(err);

                return res.status(200).json({
                    success: true,
                    message: "Login successful",
                    user: {
                        id: user._id,
                        fullName: user.fullName,
                        employeeId: user.employeeId,
                        designation: user.designation,
                        department: user.department,
                        role: role
                    }
                });
            });
        });
    })(req, res, next);
});

// Logout Route
router.post("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.status(200).json({ success: true, message: "Logged out successfully" });
    });
});

// Check Auth Status (Optional helper for frontend)
router.get("/check-auth", (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({ isAuthenticated: true, user: req.user });
    } else {
        res.status(200).json({ isAuthenticated: false });
    }
});

// Get Testers List (for Admin Dropdowns)
router.get("/testers", async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel"); // Lazy load to avoid circular deps if any
        // Roles that are considered testers
        const testerRoles = ["Core Tester", "Secondary Tester", "Final Tester"];
        // Or filter by designation/department if roles are dynamic

        // Fetch all users and filter or just fetch all and frontend filters
        const users = await UserModel.find({
            activeStatus: true,
            department: { $in: ['Core Test', 'Secondary Test', 'Primary Test', 'Final Test', 'PT Test'] }
        }).select("fullName designation department employeeId");

        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

// --- User Management Routes ---

// Helper: Generate Employee ID
const getNextEmployeeId = async () => {
    try {
        const { CounterModel } = require("../models/CounterModel");
        const sequenceDocument = await CounterModel.findOneAndUpdate(
            { id: "employee_id" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const seq = sequenceDocument.seq;
        return `EMP${seq.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error("Error generating employee ID:", error);
        throw error;
    }
};

// Add Employee Route
router.post("/add-employee", async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel");
        const bcrypt = require("bcryptjs");

        const {
            fullName,
            mobileNumber,
            emailId,
            designation,
            department,
            dateOfJoining,
            employmentType,
            transformerSkills,
            testCapabilities,
            voltageExperience,
            assignedLab,
            password
        } = req.body;

        // Check if user already exists
        const existingUser = await UserModel.findOne({
            $or: [{ emailId: emailId }, { mobileNumber: mobileNumber }]
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email or mobile number already exists." });
        }

        // Generate Employee ID
        const employeeId = await getNextEmployeeId();

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel({
            employeeId,
            fullName,
            mobileNumber,
            emailId,
            designation,
            department,
            dateOfJoining,
            employmentType,
            transformerSkills,
            testCapabilities,
            voltageExperience,
            assignedLab,
            password: hashedPassword,
            activeStatus: true
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: `Employee added successfully with ID: ${employeeId}`,
            employeeId
        });

    } catch (error) {
        console.error("Add Employee Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Get All Employees Route
router.get("/all-employees", async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel");
        const users = await UserModel.find({}).select("-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Get Employees Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// DEBUG: Get all users WITH passwords (hashes)
router.get("/debug-users", async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel");
        // Explicitly selecting password to be sure, though it's usually included by default unless excluded in schema
        const users = await UserModel.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Get Debug Users Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});
