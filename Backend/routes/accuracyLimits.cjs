const express = require('express');
const router = express.Router();
const accuracyLimitController = require('../controllers/accuracyLimitController.cjs');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Get all limits
router.get('/', isAuthenticated, accuracyLimitController.getAllLimits);

// Get limits by type
router.get('/:coreType', isAuthenticated, accuracyLimitController.getLimitsByCoreType);

// Create or Update limit
router.post('/', isAuthenticated, accuracyLimitController.upsertLimit);

// Delete limit
router.delete('/:id', isAuthenticated, accuracyLimitController.deleteLimit);

module.exports = router;
