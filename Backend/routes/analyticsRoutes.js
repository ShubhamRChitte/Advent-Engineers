const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/AnalyticsController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Dashboard Overview
router.get('/dashboard-stats', isAuthenticated, analyticsController.getDashboardStats);

// Charts Data
router.get('/production-overview', isAuthenticated, analyticsController.getProductionOverview);
router.get('/transformer-distribution', isAuthenticated, analyticsController.getTransformerDistribution);
router.get('/testing-progress', isAuthenticated, analyticsController.getTestingProgress);
router.get('/recent-activity', isAuthenticated, analyticsController.getRecentActivity);

// Advanced Analytics Page
router.get('/advanced-analytics', isAuthenticated, analyticsController.getAdvancedAnalytics);


module.exports = router;
