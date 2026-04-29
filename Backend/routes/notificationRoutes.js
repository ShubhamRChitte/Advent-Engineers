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

// Middleware to restrict to Admin only
const isAdmin = (req, res, next) => {
    const role = getUserRole(req.user);
    if (role !== 'admin' && req.user.role !== 'admin' && req.user.designation !== 'Admin') {
        return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }
    next();
};

// GET /api/notifications/admin
// Specialized endpoint for Admin Completion Alerts
router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const notifications = await NotificationModel.find({
            type: { $in: ["ORDER_COMPLETED", "STRICT_APPROVAL_REQUESTED"] },
            recipientRole: 'admin'
        })
        .populate('orderId')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notifications
// Fetch notifications for the current user's role (Workers)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const role = getUserRole(user);
        const name = user.name || user.fullName;

        // Workers should NOT see ORDER_COMPLETED notifications
        const notifications = await NotificationModel.find({
            $and: [
                { type: { $ne: "ORDER_COMPLETED" } },
                {
                    $or: [
                        { recipientRole: role }, 
                        { recipientName: name }
                    ]
                }
            ]
        })
        .populate('orderId')
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

        const query = { isRead: false };
        if (role === 'admin' || user.role === 'admin') {
            query.type = { $in: ["ORDER_COMPLETED", "STRICT_APPROVAL_REQUESTED"] };
            query.recipientRole = 'admin';
        } else {
            query.type = { $ne: "ORDER_COMPLETED" };
            query.$or = [{ recipientRole: role }, { recipientName: name }];
        }

        const count = await NotificationModel.countDocuments(query);
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/notifications/mark-read (Admin or Worker)
router.put('/mark-read', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const role = getUserRole(user);
        const name = user.name || user.fullName;

        const query = { isRead: false };
        if (role === 'admin' || user.role === 'admin') {
            query.type = { $in: ["ORDER_COMPLETED", "STRICT_APPROVAL_REQUESTED"] };
            query.recipientRole = 'admin';
        } else {
            query.type = { $ne: "ORDER_COMPLETED" };
            query.$or = [{ recipientRole: role }, { recipientName: name }];
        }

        await NotificationModel.updateMany(query, { $set: { isRead: true } });
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
