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

module.exports = router;
