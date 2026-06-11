const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
  createOrder,
  approveOrder,
  updateOrder,
  deleteOrder,
  reassignTester,
  updateOrderTimer,
  getOrderById,
  getAllOrders
} = require('../controllers/orderController');

// Multer upload middleware handler
const handleUpload = (req, res, next) => {
  const uploadMiddleware = upload.array('images', 10);
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error("Cloudinary Upload Error:", err);
      return res.status(500).json({
        success: false,
        error: "Image upload failed. Please check your Cloudinary credentials.",
        details: err.message
      });
    }
    next();
  });
};

router.post('/create-order', handleUpload, createOrder);
router.put('/orders/:orderId/approve', approveOrder);
router.put('/orders/:orderId/reassign', reassignTester);
router.put('/orders/:orderId', updateOrder);
router.delete('/orders/:orderId', isAuthenticated, deleteOrder);
router.post('/orders/:orderId/update-timer', isAuthenticated, updateOrderTimer);
router.get('/orders/:orderId', getOrderById);
router.get('/allorders', getAllOrders);

module.exports = router;
