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

router.post('/submit', isAuthenticated, submitReport);
router.put('/:orderId/approve', isAuthenticated, approveOrder);
router.put('/transformer/:transformerId/approve', isAuthenticated, approveTransformer);
router.post('/failed', isAuthenticated, logFailed);
router.get('/all-transformers', isAuthenticated, getAllTransformers);
router.get('/reports', isAuthenticated, getReports);
router.get('/assigned-orders', isAuthenticated, getAssignedOrders);
router.get('/:transformerId', isAuthenticated, getTransformerData);

module.exports = router;
