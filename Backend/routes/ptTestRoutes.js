const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const {
  submitReport,
  approveOrder,
  approveTransformer,
  logFailed,
  getAllTransformers,
  getReports,
  getAssignedOrders,
  getTransformerData
} = require('../controllers/ptTestController');
const { TransformerModel } = require('../models/TransformerModel');

router.post('/submit', isAuthenticated, submitReport);
router.put('/:orderId/approve', isAuthenticated, approveOrder);
router.put('/transformer/:transformerId/approve', isAuthenticated, approveTransformer);
router.post('/failed', isAuthenticated, logFailed);
router.get('/all-transformers', isAuthenticated, getAllTransformers);
router.get('/reports', isAuthenticated, getReports);
router.get('/assigned-orders', isAuthenticated, getAssignedOrders);

// ── PT INSPECTION ROUTES ──────────────────────────────────────────────────────
// GET /api/pt/inspection/:transformerId  — load saved PT inspection data
router.get('/inspection/:transformerId', isAuthenticated, async (req, res) => {
  try {
    const transformer = await TransformerModel.findOne({ uniqueId: req.params.transformerId });
    if (!transformer) return res.status(404).json({ success: false, message: 'Transformer not found' });
    res.json({ success: true, data: transformer.testHistory?.pt_inspection_data || {} });
  } catch (err) {
    console.error('[PT Inspection GET]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/pt/inspection/:transformerId  — save PT inspection data
router.post('/inspection/:transformerId', isAuthenticated, async (req, res) => {
  try {
    const result = await TransformerModel.findOneAndUpdate(
      { uniqueId: req.params.transformerId },
      { $set: { 'testHistory.pt_inspection_data': { ...req.body, savedAt: new Date() } } },
      { new: true }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Transformer not found' });
    res.json({ success: true, message: 'PT Inspection report saved successfully.' });
  } catch (err) {
    console.error('[PT Inspection POST]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Note: wildcard route must be LAST to avoid matching /inspection/:id
router.get('/:transformerId', isAuthenticated, getTransformerData);

module.exports = router;
