const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { CTInspectionBatchModel } = require('../models/CTInspectionBatchModel');
const { TransformerModel } = require('../models/TransformerModel');
const { CounterModel } = require('../models/CounterModel');

// ── Helper: Generate batch number INS-CT-YYYY-NNN ──────────────────────────
async function generateCTBatchNumber() {
  const year = new Date().getFullYear();
  const counter = await CounterModel.findOneAndUpdate(
    { id: `ct_inspection_batch_${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seq = String(counter.seq).padStart(3, '0');
  return `INS-CT-${year}-${seq}`;
}

// ── GET /api/ct-inspection/batches ─────────────────────────────────────────
router.get('/batches', isAuthenticated, async (req, res) => {
  try {
    const batches = await CTInspectionBatchModel.find({})
      .populate('transformers.orderId')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: batches });
  } catch (err) {
    console.error('[CT Inspection] GET /batches:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/ct-inspection/batches ────────────────────────────────────────
router.post('/batches', isAuthenticated, async (req, res) => {
  try {
    const { transformers } = req.body;
    if (!Array.isArray(transformers) || transformers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one transformer is required.' });
    }

    const batchNumber = await generateCTBatchNumber();
    const createdBy = req.user?.name || req.user?.fullName || 'CT Tester';

    const batch = new CTInspectionBatchModel({
      batchNumber,
      createdBy,
      status: 'In Progress',
      transformers: transformers.map(t => ({
        transformerId: t.transformerId,
        jobId:         t.jobId || '',
        customerName:  t.customerName || '',
        orderId:       t.orderId || null,
        status:        'Pending',
        reportData:    {}
      }))
    });
    await batch.save();
    const populatedBatch = await CTInspectionBatchModel.findById(batch._id)
      .populate('transformers.orderId')
      .lean();
    res.json({ success: true, data: populatedBatch });
  } catch (err) {
    console.error('[CT Inspection] POST /batches:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/ct-inspection/batches/:batchId ────────────────────────────────
router.get('/batches/:batchId', isAuthenticated, async (req, res) => {
  try {
    const batch = await CTInspectionBatchModel.findById(req.params.batchId)
      .populate('transformers.orderId')
      .lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.json({ success: true, data: batch });
  } catch (err) {
    console.error('[CT Inspection] GET /batches/:id:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/ct-inspection/available-transformers ──────────────────────────
// Search completed CT transformers
router.get('/available-transformers', isAuthenticated, async (req, res) => {
  try {
    const { q = '', excludeBatchId } = req.query;

    // CT transformers that have completed final testing
    const baseQuery = {
      $or: [
        { 'testHistory.final_test.status': 'Completed' },
        { 'finalReportData': { $exists: true } }
      ]
    };

    if (q.trim()) {
      const re = new RegExp(q.trim(), 'i');
      baseQuery.$and = [
        {
          $or: [
            { uniqueId: re },
            { jobId: re }
          ]
        }
      ];
    }

    const transformers = await TransformerModel.find(baseQuery)
      .populate('orderId')
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    let excludedIds = new Set();
    if (excludeBatchId) {
      const existingBatch = await CTInspectionBatchModel.findById(excludeBatchId).lean();
      if (existingBatch) {
        existingBatch.transformers.forEach(t => excludedIds.add(t.transformerId));
      }
    }

    const result = transformers
      .filter(t => !excludedIds.has(t.uniqueId))
      .map(t => ({
        _id:           t._id,
        transformerId: t.uniqueId,
        uniqueId:      t.uniqueId,
        jobId:         t.jobId || t.orderId?.jobId || 'Unknown Job',
        customerName:  t.orderId?.clientName || '',
        orderId:       t.orderId?._id || t.orderId || null,
        orderDetails:  t.orderId || null
      }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[CT Inspection] GET /available-transformers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/ct-inspection/report/:batchId/:transformerId ──────────────────
router.get('/report/:batchId/:transformerId', isAuthenticated, async (req, res) => {
  try {
    const batch = await CTInspectionBatchModel.findById(req.params.batchId).lean();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const entry = batch.transformers.find(t => t.transformerId === req.params.transformerId);
    if (!entry) return res.status(404).json({ success: false, message: 'Transformer not in batch.' });

    res.json({ success: true, data: entry.reportData || {} });
  } catch (err) {
    console.error('[CT Inspection] GET /report:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/ct-inspection/report/:batchId/:transformerId ─────────────────
// Save inspection report — writes ONLY to CTInspectionBatch collection
router.post('/report/:batchId/:transformerId', isAuthenticated, async (req, res) => {
  try {
    const { batchId, transformerId } = req.params;
    const reportData = req.body;

    const batch = await CTInspectionBatchModel.findById(batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const idx = batch.transformers.findIndex(t => t.transformerId === transformerId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Transformer not in batch.' });

    batch.transformers[idx].reportData = { ...reportData, savedAt: new Date() };
    batch.transformers[idx].status = 'Completed';
    if (!batch.transformers[idx].startedAt) {
      batch.transformers[idx].startedAt = new Date();
    }
    batch.transformers[idx].completedAt = new Date();

    if (batch.transformers.every(t => t.status === 'Completed')) {
      batch.status = 'Completed';
    }

    await batch.save();
    res.json({ success: true, message: 'CT Inspection report saved successfully.' });
  } catch (err) {
    console.error('[CT Inspection] POST /report:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/ct-inspection/batches/:batchId/transformers/:transformerId/status ──
router.patch('/batches/:batchId/transformers/:transformerId/status', isAuthenticated, async (req, res) => {
  try {
    const { batchId, transformerId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const batch = await CTInspectionBatchModel.findById(batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const idx = batch.transformers.findIndex(t => t.transformerId === transformerId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Transformer not in batch.' });

    batch.transformers[idx].status = status;
    if (status === 'Completed') batch.transformers[idx].completedAt = new Date();

    if (batch.transformers.every(t => t.status === 'Completed')) {
      batch.status = 'Completed';
    }

    await batch.save();
    res.json({ success: true, data: batch });
  } catch (err) {
    console.error('[CT Inspection] PATCH /status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
