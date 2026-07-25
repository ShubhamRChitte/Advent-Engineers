const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { isAuthenticated, isAdmin } = require("../middlewares/authMiddleware");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth requests per windowMs
  message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Helper to map designation/department to frontend role
const getMappedRole = (user, targetDept) => {
    if (user.designation === 'Admin') return 'admin';
    if (user.designation === 'Entry Operator' || user.designation === 'Entry Level') return 'entry-operator';
    
    const userDepts = Array.isArray(user.departments) && user.departments.length > 0 
      ? user.departments 
      : (Array.isArray(user.department) ? user.department : [user.department].filter(Boolean));

    const deptToUse = targetDept || userDepts[0] || user.department;
    
    switch (deptToUse) {
      case 'Core Test': return 'core-tester';
      case 'Secondary Test': return 'secondary-tester';
      case 'Primary Test': return 'after-primary-tester';
      case 'Final Test': return 'final-tester';
      case 'PT Test': return 'pt-tester';
      case 'PT Pretest': return 'pt-pretester';
      case 'Heating': return 'heating_operator';
      default: return 'viewer';
    }
};

// Login Route
router.post("/login", authLimiter, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ success: false, message: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);

            const role = getMappedRole(user);
            const userDepts = Array.isArray(user.departments) && user.departments.length > 0 
              ? user.departments 
              : (Array.isArray(user.department) ? user.department : [user.department].filter(Boolean));

            // Generate JWT Token
            const token = jwt.sign(
                { id: user._id, role: role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Manually save session to ensure cookie is set before response
            req.session.save((err) => {
                if (err) return next(err);

                return res.status(200).json({
                    success: true,
                    message: "Login successful",
                    token: token, // Send token to frontend
                    user: {
                        id: user._id,
                        fullName: user.fullName,
                        employeeId: user.employeeId,
                        designation: user.designation,
                        department: user.department,
                        departments: userDepts,
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
        const user = req.user;
        const role = getMappedRole(user);
        const userDepts = Array.isArray(user.departments) && user.departments.length > 0 
          ? user.departments 
          : (Array.isArray(user.department) ? user.department : [user.department].filter(Boolean));

        res.status(200).json({
            isAuthenticated: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                employeeId: user.employeeId,
                designation: user.designation,
                department: user.department,
                departments: userDepts,
                role: role
            }
        });
    } else {
        res.status(200).json({ isAuthenticated: false });
    }
});

// Get Testers List (for Admin Dropdowns)
router.get("/testers", isAuthenticated, async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel"); // Lazy load to avoid circular deps if any
        // Roles that are considered testers
        const testerRoles = ["Core Tester", "Secondary Tester", "Final Tester"];
        // Or filter by designation/department if roles are dynamic

        // Fetch all users and filter or just fetch all and frontend filters
        const users = await UserModel.find({
            activeStatus: true,
            $or: [
                { department: { $in: ['Core Test', 'Secondary Test', 'Primary Test', 'Final Test', 'PT Test', 'PT Pretest'] } },
                { departments: { $in: ['Core Test', 'Secondary Test', 'Primary Test', 'Final Test', 'PT Test', 'PT Pretest'] } }
            ]
        }).select("fullName designation department departments employeeId");

        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



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
router.post("/add-employee", authLimiter, isAdmin, async (req, res) => {
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

        const depts = Array.isArray(req.body.departments) && req.body.departments.length > 0
          ? req.body.departments
          : (typeof department === 'string' ? department.split(',').map(d => d.trim()).filter(Boolean) : [department].filter(Boolean));

        const primaryDeptStr = depts.join(', ') || department || 'Operations';

        const newUser = new UserModel({
            employeeId,
            fullName,
            mobileNumber,
            emailId,
            designation,
            department: primaryDeptStr,
            departments: depts,
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
router.get("/all-employees", isAdmin, async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel");
        const limit = parseInt(req.query.limit) || 0;
        const skip = parseInt(req.query.skip) || 0;

        if (req.query.paginated === 'true') {
            const users = await UserModel.find({})
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
            
            const totalCount = await UserModel.countDocuments({});
            res.status(200).json({ success: true, users, totalCount });
        } else {
            const users = await UserModel.find({}).select("-password").sort({ createdAt: -1 }).limit(1000).lean();
            res.status(200).json({ success: true, users });
        }
    } catch (error) {
        console.error("Get Employees Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Update Employee Route
router.put("/update-employee/:id", isAdmin, async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel");
        const bcrypt = require("bcryptjs");
        const { id } = req.params;
        const updateData = { ...req.body };

        if (updateData.departments || updateData.department) {
            const depts = Array.isArray(updateData.departments) && updateData.departments.length > 0
              ? updateData.departments
              : (typeof updateData.department === 'string' ? updateData.department.split(',').map(d => d.trim()).filter(Boolean) : [updateData.department].filter(Boolean));
            updateData.departments = depts;
            if (depts.length > 0) {
              updateData.department = depts.join(', ');
            }
        }

        // If password is provided, hash it
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password; // Don't overwrite with empty
        }

        const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "Employee updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Update Employee Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Delete Employee Route
router.delete("/delete-employee/:id", isAdmin, async (req, res) => {
    try {
        const { UserModel } = require("../models/UserModel");
        const { id } = req.params;
        const deletedUser = await UserModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Delete Employee Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

module.exports = router;
