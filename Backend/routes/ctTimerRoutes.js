const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { CTTimerModel } = require('../models/CTTimerModel');
const { SettingsModel } = require('../models/SettingsModel');
const { TransformerModel } = require('../models/TransformerModel');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// ── Default time limits (minutes) ────────────────────────────────────────────
// after_primary has conditional logic (single vs multicore) handled in /start
const DEFAULT_LIMITS = {
  core:          3,
  secondary:     5,
  after_primary: 5,   // single core default; multicore = 20 (see getExpectedMinutes)
  final:         22
};

const SETTINGS_KEYS = {
  core:                'ct_core_minutes',
  secondary:           'ct_secondary_minutes',
  after_primary_single:'ct_after_primary_single_minutes',
  after_primary_multi: 'ct_after_primary_multi_minutes',
  final:               'ct_final_minutes'
};

// Helper: get expected minutes for a stage from DB settings
// For after_primary, coreCount determines which limit key to use
async function getExpectedMinutes(stage, coreCount = 1) {
  let key;
  let defaultVal;

  if (stage === 'after_primary') {
    const isMulti = parseInt(coreCount, 10) > 1;
    key        = isMulti ? SETTINGS_KEYS.after_primary_multi : SETTINGS_KEYS.after_primary_single;
    defaultVal = isMulti ? 20 : 5;
  } else {
    key        = SETTINGS_KEYS[stage];
    defaultVal = DEFAULT_LIMITS[stage] || 5;
  }

  if (!key) return defaultVal;

  const setting = await SettingsModel.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, value: defaultVal } },
    { new: true, upsert: true }
  );
  return parseInt(setting.value, 10) || defaultVal;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ct-timer/start
// Resumes existing In Progress record, or creates fresh one.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', isAuthenticated, async (req, res) => {
  try {
    const { transformerId, orderId, jobId, stage, coreCount } = req.body;

    if (!transformerId || !orderId || !stage) {
      return res.status(400).json({ success: false, message: 'transformerId, orderId, and stage are required.' });
    }

    const validStages = ['core', 'secondary', 'after_primary', 'final'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, message: `stage must be one of: ${validStages.join(', ')}` });
    }

    // RESUME: check for existing In Progress record
    const existing = await CTTimerModel.findOne({ transformerId, stage, status: 'In Progress' });
    if (existing) {
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

    // CREATE: fresh timer record
    const user = req.user;
    const testerName = user.name || user.fullName || 'CT Tester';

    const roleMap = {
      core:          'core-tester',
      secondary:     'secondary-tester',
      after_primary: 'after-primary-tester',
      final:         'final-tester'
    };
    const role = roleMap[stage] || stage;

    let cores = parseInt(coreCount, 10) || 1;
    if (stage === 'secondary') {
      const orQuery = [];
      if (mongoose.Types.ObjectId.isValid(transformerId)) {
        orQuery.push({ _id: new mongoose.Types.ObjectId(transformerId) });
      }
      orQuery.push({ uniqueId: transformerId });
      
      const transformer = await TransformerModel.findOne({ $or: orQuery }).populate('orderId');
      if (transformer) {
        if (transformer.cores && Array.isArray(transformer.cores)) {
          cores = transformer.cores.length;
        } else if (transformer.orderId) {
          cores = transformer.orderId.noOfCores || (transformer.orderId.coreDetails ? transformer.orderId.coreDetails.length : 1);
        }
      }
    }

    let expectedMinutes = await getExpectedMinutes(stage, cores);
    if (stage === 'secondary') {
      expectedMinutes = cores * 5;
    }

    const record = await CTTimerModel.create({
      transformerId,
      orderId,
      jobId:           jobId || 'UNKNOWN',
      testerId:        user._id ? user._id.toString() : '',
      testerName,
      role,
      stage,
      coreCount:       cores,
      totalCores:      cores, // New field for completion tracking
      startTime:       new Date(),
      expectedMinutes,
      status:          'In Progress'
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
    console.error('[CTTimer] Error starting timer:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ct-timer/end
// ─────────────────────────────────────────────────────────────────────────────
router.post('/end', isAuthenticated, async (req, res) => {
  try {
    const { transformerId, stage } = req.body;

    if (!transformerId || !stage) {
      return res.status(400).json({ success: false, message: 'transformerId and stage are required.' });
    }

    const record = await CTTimerModel.findOne({ transformerId, stage, status: 'In Progress' });
    if (!record) {
      return res.status(200).json({ success: true, message: 'No active CT timer found. Skipped.' });
    }

    const endTime      = new Date();
    const actualTimeMs = endTime - new Date(record.startTime);
    const expectedMinutesVal = record.expectedMinutes || (stage === 'secondary' ? (record.totalCores || record.coreCount || 1) * 5 : (DEFAULT_LIMITS[stage] || 5));
    const expectedMs   = expectedMinutesVal * 60 * 1000;
    const delayMs      = Math.max(0, actualTimeMs - expectedMs);

    record.endTime      = endTime;
    record.actualTimeMs = actualTimeMs;
    record.delayMs      = delayMs;
    record.isDelayed    = delayMs > 0;
    record.status       = 'Completed';
    await record.save();

    res.status(200).json({
      success: true,
      data: { actualTimeMs, delayMs, isDelayed: record.isDelayed }
    });
  } catch (err) {
    console.error('[CTTimer] Error ending timer:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ct-timer/complete-core
// Used by Secondary Testing to track core-by-core progress
// ─────────────────────────────────────────────────────────────────────────────
router.post('/complete-core', isAuthenticated, async (req, res) => {
  try {
    const { transformerId, stage, coreId } = req.body;

    if (!transformerId || !stage || !coreId) {
      return res.status(400).json({ success: false, message: 'transformerId, stage, and coreId are required.' });
    }

    const record = await CTTimerModel.findOne({ transformerId, stage, status: 'In Progress' });
    if (!record) {
      return res.status(200).json({ success: true, message: 'No active CT timer found. Skipped.' });
    }

    // Add coreId if not already present
    if (!record.completedCoresList) record.completedCoresList = [];
    if (!record.completedCoresList.includes(coreId)) {
      record.completedCoresList.push(coreId);
      record.completedCores = record.completedCoresList.length;
    }

    // Check if all cores are complete
    if (record.completedCores >= record.totalCores) {
      const endTime      = new Date();
      const actualTimeMs = endTime - new Date(record.startTime);
      const expectedMinutesVal = record.expectedMinutes || (stage === 'secondary' ? (record.totalCores || record.coreCount || 1) * 5 : (DEFAULT_LIMITS[stage] || 5));
      const expectedMs   = expectedMinutesVal * 60 * 1000;
      const delayMs      = Math.max(0, actualTimeMs - expectedMs);

      record.endTime      = endTime;
      record.actualTimeMs = actualTimeMs;
      record.delayMs      = delayMs;
      record.isDelayed    = delayMs > 0;
      record.status       = 'Completed';
    }

    await record.save();

    res.status(200).json({
      success: true,
      data: { 
        completedCores: record.completedCores, 
        totalCores: record.totalCores,
        status: record.status
      }
    });
  } catch (err) {
    console.error('[CTTimer] Error completing core:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ct-timer/settings
// ─────────────────────────────────────────────────────────────────────────────
router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    const [coreMin, secondaryMin, apSingleMin, apMultiMin, finalMin] = await Promise.all([
      getExpectedMinutes('core',          1),
      getExpectedMinutes('secondary',     1),
      getExpectedMinutes('after_primary', 1),
      getExpectedMinutes('after_primary', 2),
      getExpectedMinutes('final',         1)
    ]);

    res.json({
      success: true,
      data: {
        ct_core_minutes:                 coreMin,
        ct_secondary_minutes:            secondaryMin,
        ct_after_primary_single_minutes: apSingleMin,
        ct_after_primary_multi_minutes:  apMultiMin,
        ct_final_minutes:                finalMin
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ct-timer/dashboard
// Query params: stage, startDate, endDate
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const { stage, startDate, endDate } = req.query;

    const filter = { status: 'Completed' };
    const validStages = ['core', 'secondary', 'after_primary', 'final'];
    if (stage && validStages.includes(stage)) filter.stage = stage;
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate)   filter.startTime.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const records = await CTTimerModel.find(filter).sort({ startTime: -1 }).lean();

    // Flat list
    const flatList = records.map(r => ({
      _id:             r._id,
      jobId:           r.jobId,
      testerName:      r.testerName,
      role:            r.role,
      stage:           r.stage,
      coreCount:       r.coreCount,
      startTime:       r.startTime,
      endTime:         r.endTime,
      expectedMinutes: r.expectedMinutes,
      actualTimeMs:    r.actualTimeMs,
      delayMs:         r.delayMs,
      isDelayed:       r.isDelayed,
      transformerId:   r.transformerId
    }));

    // Job-wise aggregation
    const jobMap = {};
    records.forEach(r => {
      if (!jobMap[r.jobId]) {
        jobMap[r.jobId] = { jobId: r.jobId, totalUnits: 0, delayedUnits: 0, totalDelayMs: 0 };
      }
      jobMap[r.jobId].totalUnits++;
      if (r.isDelayed) {
        jobMap[r.jobId].delayedUnits++;
        jobMap[r.jobId].totalDelayMs += r.delayMs;
      }
    });
    const jobWise = Object.values(jobMap);

    // Tester-wise aggregation
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
      avgActualMs: t.totalUnits    > 0 ? Math.round(t.totalActualMs / t.totalUnits)    : 0,
      avgDelayMs:  t.delayedUnits  > 0 ? Math.round(t.totalDelayMs  / t.delayedUnits)  : 0
    }));

    res.json({
      success: true,
      data: { flatList, jobWise, testerWise, totalRecords: records.length }
    });
  } catch (err) {
    console.error('[CTTimer] Error fetching dashboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
