const express = require('express');
const router = express.Router();
const { PTTimerModel } = require('../models/PTTimerModel');
const { TransformerModel } = require('../models/TransformerModel');
const { SettingsModel } = require('../models/SettingsModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Default time limits (minutes) used if no SettingsModel entry exists
const DEFAULT_LIMITS = {
  pt_pretest: 7,
  pt:         30
};

const SETTINGS_KEYS = {
  pt_pretest: 'pt_pretest_minutes',
  pt:         'pt_final_minutes'
};

// Helper: get expected minutes for a stage from DB settings
async function getExpectedMinutes(stage) {
  const key = SETTINGS_KEYS[stage];
  if (!key) return DEFAULT_LIMITS[stage] || 7;

  // Use findOneAndUpdate with $setOnInsert so:
  //  - If key doesn't exist → create it with the current DEFAULT_LIMITS value
  //  - If key exists (even with old value) → return it unchanged (admin controls it)
  const setting = await SettingsModel.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, value: DEFAULT_LIMITS[stage] } },
    { new: true, upsert: true }
  );
  return parseInt(setting.value, 10) || DEFAULT_LIMITS[stage];
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pt-timer/start
// Called when a tester opens a transformer for PT testing.
// RESUMES an existing "In Progress" record if one exists (preserves original startTime).
// Only creates a new record if no active record is found.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', isAuthenticated, async (req, res) => {
  try {
    const { transformerId, orderId, jobId, stage } = req.body;

    if (!transformerId || !orderId || !stage) {
      return res.status(400).json({ success: false, message: 'transformerId, orderId, and stage are required.' });
    }

    if (!['pt_pretest', 'pt'].includes(stage)) {
      return res.status(400).json({ success: false, message: 'stage must be pt_pretest or pt.' });
    }

    // Check for an existing active record — RESUME it
    const existing = await PTTimerModel.findOne({ transformerId, stage, status: 'In Progress' });
    if (existing) {
      // Return the original startTime so the frontend countdown continues from where it was
      return res.status(200).json({
        success: true,
        resumed: true,
        data: {
          recordId:        existing._id,
          startTime:       existing.startTime,
          expectedMinutes: existing.expectedMinutes
        }
      });
    }

    // No active record — create a fresh one
    const user = req.user;
    const testerName = user.name || user.fullName || 'PT Tester';
    const role = stage === 'pt_pretest' ? 'pt-pretester' : 'pt-tester';
    const expectedMinutes = await getExpectedMinutes(stage);

    const record = await PTTimerModel.create({
      transformerId,
      orderId,
      jobId: jobId || 'UNKNOWN',
      testerId:    user._id ? user._id.toString() : '',
      testerName,
      role,
      stage,
      startTime: new Date(),
      expectedMinutes,
      status: 'In Progress'
    });

    res.status(201).json({
      success: true,
      resumed: false,
      data: {
        recordId:        record._id,
        startTime:       record.startTime,
        expectedMinutes: record.expectedMinutes
      }
    });
  } catch (err) {
    console.error('[PTTimer] Error starting timer:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pt-timer/end
// Called when tester submits or approves a transformer.
// Calculates actualTimeMs, delayMs, isDelayed and marks Completed.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/end', isAuthenticated, async (req, res) => {
  try {
    const { transformerId, stage } = req.body;

    if (!transformerId || !stage) {
      return res.status(400).json({ success: false, message: 'transformerId and stage are required.' });
    }

    // Find the active record
    const record = await PTTimerModel.findOne({ transformerId, stage, status: 'In Progress' });
    if (!record) {
      // Silently succeed — timer may not have started (e.g. already-approved unit re-opened)
      return res.status(200).json({ success: true, message: 'No active timer found. Skipped.' });
    }

    const endTime = new Date();
    const actualTimeMs = endTime - new Date(record.startTime);
    const expectedMs   = (record.expectedMinutes || DEFAULT_LIMITS[stage]) * 60 * 1000;
    const delayMs      = Math.max(0, actualTimeMs - expectedMs);

    record.endTime      = endTime;
    record.actualTimeMs = actualTimeMs;
    record.delayMs      = delayMs;
    record.isDelayed    = delayMs > 0;
    record.status       = 'Completed';
    await record.save();

    res.status(200).json({
      success: true,
      data: {
        actualTimeMs,
        delayMs,
        isDelayed: record.isDelayed
      }
    });
  } catch (err) {
    console.error('[PTTimer] Error ending timer:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pt-timer/settings
// Returns current time limits for both PT stages.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    const [pretestMin, finalMin] = await Promise.all([
      getExpectedMinutes('pt_pretest'),
      getExpectedMinutes('pt')
    ]);

    res.json({
      success: true,
      data: {
        pt_pretest_minutes: pretestMin,
        pt_final_minutes:   finalMin
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pt-timer/dashboard
// Returns aggregated data for the admin PT Delay Dashboard.
// Query params: stage (optional: 'pt_pretest' | 'pt'), startDate, endDate
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const { stage, startDate, endDate } = req.query;

    // Build base filter — only completed records
    const filter = { status: 'Completed' };
    if (stage && ['pt_pretest', 'pt'].includes(stage)) {
      filter.stage = stage;
    }
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate)   filter.startTime.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // Only include timers for transformers that are NOT completed/shipped
    const activeTransformers = await TransformerModel.find({ currentStage: { $ne: 'shipped' } }).select('uniqueId').lean();
    const activeTransformerIds = activeTransformers.map(t => t.uniqueId);
    filter.transformerId = { $in: activeTransformerIds };

    // Fetch all matching completed records (with populated jobId already stored)
    const records = await PTTimerModel.find(filter)
      .sort({ startTime: -1 })
      .lean();

    // ── 1. Flat record list ─────────────────────────────────────────────────
    const flatList = records.map(r => ({
      _id:             r._id,
      jobId:           r.jobId,
      testerName:      r.testerName,
      role:            r.role,
      stage:           r.stage,
      startTime:       r.startTime,
      endTime:         r.endTime,
      expectedMinutes: r.expectedMinutes,
      actualTimeMs:    r.actualTimeMs,
      delayMs:         r.delayMs,
      isDelayed:       r.isDelayed,
      transformerId:   r.transformerId
    }));

    // ── 2. Job-wise aggregation ─────────────────────────────────────────────
    const jobMap = {};
    records.forEach(r => {
      const key = r.jobId;
      if (!jobMap[key]) {
        jobMap[key] = {
          jobId:        r.jobId,
          totalUnits:   0,
          delayedUnits: 0,
          totalDelayMs: 0
        };
      }
      jobMap[key].totalUnits++;
      if (r.isDelayed) {
        jobMap[key].delayedUnits++;
        jobMap[key].totalDelayMs += r.delayMs;
      }
    });
    const jobWise = Object.values(jobMap);

    // ── 3. Tester-wise aggregation ──────────────────────────────────────────
    const testerMap = {};
    records.forEach(r => {
      const key = `${r.testerName}__${r.role}`;
      if (!testerMap[key]) {
        testerMap[key] = {
          testerName:    r.testerName,
          role:          r.role,
          totalUnits:    0,
          delayedUnits:  0,
          totalDelayMs:  0,
          totalActualMs: 0
        };
      }
      testerMap[key].totalUnits++;
      testerMap[key].totalActualMs += r.actualTimeMs || 0;
      if (r.isDelayed) {
        testerMap[key].delayedUnits++;
        testerMap[key].totalDelayMs += r.delayMs;
      }
    });
    const testerWise = Object.values(testerMap).map(t => ({
      ...t,
      avgActualMs: t.totalUnits > 0 ? Math.round(t.totalActualMs / t.totalUnits) : 0,
      avgDelayMs:  t.delayedUnits > 0 ? Math.round(t.totalDelayMs / t.delayedUnits) : 0
    }));

    res.json({
      success: true,
      data: { flatList, jobWise, testerWise, totalRecords: records.length }
    });
  } catch (err) {
    console.error('[PTTimer] Error fetching dashboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
