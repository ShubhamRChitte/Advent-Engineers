const express = require("express");
const passport = require("passport");
const router = express.Router();

// Helper to map designation/department to frontend role
const getMappedRole = (user) => {
    const role = user.designation === 'Admin' ? 'admin' :
        user.designation === 'Entry Level' ? 'entry-operator' :
            user.department === 'Core Test' ? 'core-tester' :
                user.department === 'Secondary Test' ? 'secondary-tester' :
                    user.department === 'Primary Test' ? 'after-primary-tester' :
                        user.department === 'Final Test' ? 'final-tester' : 'viewer';
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

                // generate token
                const jwt = require("jsonwebtoken");
                const token = jwt.sign(
                    { id: user._id, role: role, department: user.department },
                    process.env.JWT_SECRET || "advent_engineers_secret_key",
                    { expiresIn: "1d" }
                );

                return res.status(200).json({
                    success: true,
                    message: "Login successful",
                    token: token,
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
            department: { $in: ['Core Test', 'Secondary Test', 'Primary Test', 'Final Test'] }
        }).select("fullName designation department employeeId");

        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
