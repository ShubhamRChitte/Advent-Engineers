const express = require('express');
const router = express.Router();
const accuracyLimitController = require('../controllers/accuracyLimitController.cjs');

// Get all limits
router.get('/', accuracyLimitController.getAllLimits);

// Get limits by type
router.get('/:coreType', accuracyLimitController.getLimitsByCoreType);

// Create or Update limit
router.post('/', accuracyLimitController.upsertLimit);

// Delete limit
router.delete('/:id', accuracyLimitController.deleteLimit);

module.exports = router;
