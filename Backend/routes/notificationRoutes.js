const express = require('express');
const router = express.Router();
const { NotificationModel } = require('../models/NotificationModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Helper to determine role from user object
const getUserRole = (user) => {
    if (!user) return 'admin';
    const dept = user.department;
    if (dept === "Core Test") return 'core';
    if (dept === "Secondary Test") return 'secondary';
    if (dept === "Primary Test" || dept === "After Primary Test") return 'primary';
    if (dept === "Final Test") return 'final';
    if (dept === "PT Test") return 'pt';
    if (dept === "Heating Control") return 'heating';
    return 'admin';
};

// GET /api/notifications
// Fetch notifications for the current user's role or specifically for them
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const role = getUserRole(user);
        const name = user.name || user.fullName;

        console.log(`[Notification] Fetching for user: ${name}, Role: ${role}`);

        const notifications = await NotificationModel.find({
            $or: [
                { recipientRole: role }, // Match Role
                { recipientName: name }   // Match Specific Individual
            ]
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notifications/unread-count
router.get('/unread-count', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const role = getUserRole(user);
        const name = user.name || user.fullName;

        const count = await NotificationModel.countDocuments({
            $or: [
                { recipientRole: role },
                { recipientName: name }
            ],
            isRead: false
        });

        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notifications/mark-read
// Mark all for this user as read
router.put('/mark-read', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const role = getUserRole(user);
        const name = user.name || user.fullName;

        await NotificationModel.updateMany(
            {
                $or: [
                    { recipientRole: role },
                    { recipientName: name }
                ],
                isRead: false
            },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: "All notifications marked as read." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', isAuthenticated, async (req, res) => {
    try {
        await NotificationModel.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true, message: "Notification marked as read." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
