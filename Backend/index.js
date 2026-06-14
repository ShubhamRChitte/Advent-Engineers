require("dotenv").config({ override: true }); // trigger restart



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// --- RATE LIMITERS ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: { success: false, message: 'Too many authentication attempts, please try again later' }
});




const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;



const { CustomerModel } = require("./models/CustomerModel");
const { OrderModel } = require('./models/OrderModel');
const { UserModel } = require('./models/UserModel');
const { MeteringCoreTestModel } = require("./models/MeteringCoreTestModel");
const { ProtectionCoreTestModel } = require("./models/ProtectionCoreTestModel");
const { TransformerModel } = require("./models/TransformerModel");
const { SecondaryMeteringTestModel } = require("./models/SecondaryMeteringTestModel");
const AccuracyLimit = require('./models/AccuracyLimit.cjs');
// const VerifyUser = require('./middlewares/VeriifyUser');
// const UsersModel = require("./model/UsersModel");
const { CounterModel } = require("./models/CounterModel");
const { isAuthenticated } = require('./middlewares/authMiddleware');
const { upload, cloudinary } = require('./config/cloudinary'); // Cloudinary upload middleware
const heatingRecordRoutes = require('./routes/heatingRecordRoutes'); // Heating Record Routes
const ptHeatingRecordRoutes = require('./routes/ptHeatingRecordRoutes'); // PT Heating Record Routes
const { HeatingRecordModel } = require('./models/HeatingRecordModel');
const { CoreVendorModel } = require("./models/CoreVendorModel");
const notificationRoutes = require('./routes/notificationRoutes');
const { NotificationModel } = require('./models/NotificationModel');
const { FailedCoreModel } = require("./models/FailedCoreModel");
const { FailedTransformerModel } = require("./models/FailedTransformerModel");
const ReadyTransformerModel = require("./models/ReadyTransformerModel");


const app = express();
app.set('trust proxy', 1); // Trust first proxy for Render deployment and rate limiting

mongoose
  .connect(uri)
  .then(async () => {
    console.log("MongoDB is connected successfully");

    try {
      const collection = mongoose.connection.collection('failedcores');
      await collection.dropIndex('orderId_1_internalCoreNo_1');
      console.log("Successfully dropped duplicate index on failedcores.");
      
      const notifCollection = mongoose.connection.collection('notifications');
      await notifCollection.dropIndex('type_1_orderId_1');
      console.log("Successfully dropped restrictive unique index on notifications.");
    } catch (e) {
      // Ignore if index doesn't exist
    }

    await seedCoreVendors();
    const { runInitialMigration } = require('./services/notificationService');
    await runInitialMigration();
  })
  .catch((err) => console.error(err));

// --- SEEDING LOGIC ---
async function seedCoreVendors() {
  try {
    const count = await CoreVendorModel.countDocuments();
    if (count === 0) {
      const initialVendors = [
        { vendor_no: 1, vendor_name: "ABC Electricals", status: "active" },
        { vendor_no: 2, vendor_name: "Precision Cores Pvt Ltd", status: "active" },
        { vendor_no: 3, vendor_name: "Shakti Transformers", status: "active" },
        { vendor_no: 4, vendor_name: "Omega Core Industries", status: "active" },
        { vendor_no: 5, vendor_name: "Delta Magnetic Cores", status: "active" }
      ];
      await CoreVendorModel.insertMany(initialVendors);
      console.log("Core Vendors seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding core vendors:", err);
  }
}

// --- AUTHENTICATION SETUP ---
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcryptjs'); // Needed for seeding later
require('./config/passportConfig')(passport);
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const meteringTestRoutes = require('./routes/meteringTestRoutes');
const protectionTestRoutes = require('./routes/protectionTestRoutes');

// 1. CORS (Must be first)
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5001', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost")) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// 1.5 Security Headers
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Session Config
const { MongoStore } = require('connect-mongo');
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("CRITICAL SECURITY ERROR: SESSION_SECRET is not configured in production environment!");
  } else {
    sessionSecret = 'advent_engineers_secret_key'; // Local fallback
  }
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URL,
    collectionName: 'sessions' 
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Must be true for cross-origin on HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-domain cookies
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// 3. Passport Config
app.use(passport.initialize());
app.use(passport.session());

// Debug Middleware: Log Session info for every request
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - SessionID: ${req.sessionID} - User: ${req.user ? req.user.employeeId : 'Guest'}`);
  next();
});

// Enable Pre-Flight for all routes
// app.options('*', cors()); // Removed to fix PathError crash

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api', globalLimiter); // Apply global limiter to all /api routes
app.use('/api/transformers', require('./routes/transformerRoutes')); // Move above taskRoutes to avoid shadowing
app.use('/api', taskRoutes); // Mounted at /api
app.use('/api', meteringTestRoutes); // Mounted at /api/metering-tests
app.use('/api', protectionTestRoutes); // Mounted at /api/protection-tests
app.use('/api/core-tests', require('./routes/coreTestRoutes')); // Generic Route
app.use('/api/final', require('./routes/finalTestRoutes')); // New Final Test Routes
app.use('/api/dashboard', require('./routes/dashboardRoutes')); // New Dashboard Stats Route
app.use('/api/failed-cores', require('./routes/failedCoreRoutes')); // Failed Core Management
app.use('/api/failed-transformers', require('./routes/failedTransformerRoutes')); // Failed Transformer Management
app.use('/api/return-forms', require('./routes/returnFormRoutes')); // New Return Form Routes
app.use('/api/pt-tests', require('./routes/ptTestRoutes')); // PT Testing Routes
app.use('/api/pt-pretests', require('./routes/ptPretestRoutes')); // PT Pretesting Routes
app.use('/api/pt-timer', require('./routes/ptTimerRoutes')); // PT Delay Timer Tracking
app.use('/api/ct-timer', require('./routes/ctTimerRoutes')); // CT Delay Timer Tracking
app.use('/api/heating-record', heatingRecordRoutes); // Heating Record Routes
app.use('/api/pt-heating-record', ptHeatingRecordRoutes); // PT Heating Record Routes
app.use('/api/accuracy-limits', require('./routes/accuracyLimits.cjs')); // Accuracy Limits Management
app.use('/api/core-vendors', require('./routes/coreVendorRoutes')); // Core Vendors Management
app.use('/api/notifications', notificationRoutes); // Persistent Notifications
app.use('/api/ready-transformers', require('./routes/readyTransformerRoutes')); // Ready Transformers System
app.use('/api/pre-test-batches', require('./routes/preTestBatchRoutes')); // Pre-Test Batch Management

// Provide configuration for Protection Classes dynamically to the frontend
app.get('/api/protection-limits', (req, res) => {
  const { PROTECTION_CLASS_LIMITS } = require('./utils/protectionLimits');
  res.json({ success: true, data: PROTECTION_CLASS_LIMITS });
});
// ----------------------------




// 1. Helper: Atomic Sequence Generator
async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await CounterModel.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}



// Order routes are handled by orderRoutes
const orderRoutes = require('./routes/orderRoutes');
app.use('/api', orderRoutes);

// 4. Method: Get Pending Notifications (Admin View)
async function getAdminNotifications(req, res) {
  try {
    const pendingOrders = await OrderModel.find({ isApproved: false })
      .select("jobId clientName quantity createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = await OrderModel.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      pendingOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. This is how you fetch the list for a specific worker. It joins (populates) the Order data so you can check the assignment.
const getWorkerTasks = async (req, res) => {
  try {
    const { workerName, role } = req.query; // e.g., "Rahul Sharma", "core"

    // 1. Find transformers where the current stage matches the worker's role
    // 2. Populate 'orderId' to check if THIS specific worker is assigned
    const tasks = await TransformerModel.find({ currentStage: role })
      .populate({
        path: 'orderId',
        match: { [`assignments.${role}_tester`]: workerName } // Dynamic key check
      })
      .lean();

    // 3. Filter out transformers where the worker isn't the assigned one for this job
    const assignedTasks = tasks.filter(t => t.orderId !== null);

    res.status(200).json(assignedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.get("/", (req, res) => {
  res.send("Backend running successfully");
});


// --- BATCH APPROVAL ROUTE (New) ---
app.put('/api/core-tests/approve-batch', async (req, res) => {
  try {
    const { jobId, internalCoreNos } = req.body;

    if (!jobId || !internalCoreNos || !Array.isArray(internalCoreNos)) {
      return res.status(400).json({ success: false, message: "Invalid payload. jobId and internalCoreNos array required." });
    }

    // Update Transformers matching these internalCoreNos (mapped to unitNo via parsing or regex if needed,
    // BUT our TransformerSchema has 'uniqueId' like TR-JOB-2026-007-001. 
    // And CoreTestingForm uses 'internalCoreNo' like M-007-001.
    // The link is the Sequence Number.
    // Let's assume frontend passes VALID TRANSFORMER IDs or we query by regex.
    // Actually, CoreTestingForm generates internalCoreNo. It doesn't know the Transformer UniqueID directly unless we passed it.
    // Let's check if we can match by 'internalCoreNo' in the readings? NO.
    // Better: Frontend sends the UNIT Suffixes (001, 002) and we construct the Transformer UniqueID.

    // WAIT. The frontend "Internal Core No" IS the identifier used in the test readings.
    // But the Transformer Document has 'uniqueId'.
    // Logic: 
    // internalCoreNo "M-007-001" -> Transformer "TR-JOB-2026-007-001".
    // 001 is the link.

    // -----------------------------------------------------------
    // BATCH APPROVAL LOGIC
    // -----------------------------------------------------------
    console.log(`[Batch Approve] JobId: ${jobId}, Cores:`, internalCoreNos);

    const updatePromises = internalCoreNos.map(async (coreId) => {
      // Extract sequence: M-007-001 -> 001
      // OR P-007-001 -> 001
      // We take the last part.
      const parts = coreId.split('-');
      const seq = parts[parts.length - 1]; // "001" or "01"

      // 1. Try Standard Format (TR-{jobId}-{seq}) - e.g. TR-JOB-2026-007-001
      // Ensure seq is padStart(3, '0') for standard
      const seq3 = seq.padStart(3, '0');
      let transformerUniqueId = `TR-${jobId}-${seq3}`;

      // Try update
      let updated = await TransformerModel.findOneAndUpdate(
        { uniqueId: transformerUniqueId },
        {
          $set: {
            currentStage: 'secondary',
            "testHistory.core_test.status": "Completed"
          }
        },
        { new: true }
      );

      // 2. If not found, Try Legacy Format ({jobId}/{seq}) - e.g. JOB-2026-007/01
      if (!updated) {
        // Legacy used padStart(2, '0') BUT we must ensure we strip leading zeros first
        const seqInt = parseInt(seq, 10);
        const seq2 = String(seqInt).padStart(2, '0');

        const legacyId = `${jobId}/${seq2}`;
        console.log(`[Batch Approve] Trying Legacy ID: ${legacyId}`);

        updated = await TransformerModel.findOneAndUpdate(
          { uniqueId: legacyId },
          {
            $set: {
              currentStage: 'secondary',
              "testHistory.core_test.status": "Completed"
            }
          },
          { new: true }
        );
      }

      return updated;
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r !== null).length;

    // Update the parent Order to reflect approval for the new Tab workflow
    try {
      const { OrderModel } = require('./models/OrderModel');
      await OrderModel.findOneAndUpdate({ jobId: jobId }, { approved: true });
    } catch (e) {
      console.error("[Batch Approve] Failed to update OrderModel approved status:", e);
    }

    res.status(200).json({
      success: true,
      message: `Batch processed. Approved ${successCount} / ${internalCoreNos.length} cores.`,
      details: results.map((r, i) => r ? `Matched: ${r.uniqueId}` : `Failed: ${internalCoreNos[i]}`)
    });

  } catch (error) {
    console.error("Batch Approval Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- EXISTING ROUTES ---
// get allorders
app.get("/allorders", require('./controllers/orderController').getAllOrders);






// --- NEW: Report Detail API for Admin ---
// Returns full transformer data with populated order and a flattened 'readings' field for the current stage
app.get("/api/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.query; // Optional: specify stage to get specific readings

    const mongoose = require('mongoose');
    let transformer;

    if (mongoose.Types.ObjectId.isValid(id)) {
      transformer = await TransformerModel.findById(id).populate('orderId');
    }

    if (!transformer) {
      transformer = await TransformerModel.findOne({ uniqueId: id }).populate('orderId');
    }

    if (!transformer) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Attempt to fetch Heating Record from separate collection if needed (for PT or modern CT modules)
    let heatingRecordFromCollection = null;
    try {
      if (transformer.orderId) {
        const orderId = transformer.orderId._id || transformer.orderId;
        const type = transformer.orderId.transformerType || "PT";

        const hRecord = await HeatingRecordModel.findOne({
          orderId: orderId,
          transformerType: { $regex: type, $options: 'i' }
        });

        if (hRecord && hRecord.blocks) {
          // Find the block matching this transformer's uniqueId
          const block = hRecord.blocks.find(b =>
            b.serialNumber === transformer.uniqueId ||
            (b.transformerId && b.transformerId.toString() === transformer._id.toString())
          );

          if (block) {
            // NORMALIZE: Convert String dates to Date objects for report consistency
            const normalizedSteps = (block.processSteps || []).map(step => {
              const normalized = { ...step.toObject ? step.toObject() : step };

              // Construct startDateTime if missing but strings exist
              if (!normalized.startDateTime && normalized.startDate && normalized.startTime) {
                try {
                  normalized.startDateTime = new Date(`${normalized.startDate}T${normalized.startTime}`);
                } catch (e) { }
              }
              // Construct completionDateTime if missing
              if (!normalized.completionDateTime && normalized.endDate && normalized.endTime) {
                try {
                  normalized.completionDateTime = new Date(`${normalized.endDate}T${normalized.endTime}`);
                } catch (e) { }
              }

              return normalized;
            });

            heatingRecordFromCollection = {
              ...block.toObject ? block.toObject() : block,
              processSteps: normalizedSteps
            };
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch supplementary heating record:", err.message);
    }

    const reportData = transformer.toObject();
    if (heatingRecordFromCollection) {
      reportData.heatingRecordFromCollection = heatingRecordFromCollection;
    }

    // Normalize ptHeatingRecord if present
    if (reportData.processHistory && reportData.processHistory.ptHeatingRecord) {
      reportData.processHistory.ptHeatingRecord = reportData.processHistory.ptHeatingRecord.map(record => {
        if (record.processSteps) {
          record.processSteps = record.processSteps.map(step => {
            const normalized = { ...step };
            if (!normalized.startDateTime && normalized.startDate && normalized.startTime) {
              try {
                normalized.startDateTime = new Date(`${normalized.startDate}T${normalized.startTime}`);
              } catch (e) { }
            }
            if (!normalized.completionDateTime && normalized.completionDate && normalized.completionTime) {
              try {
                normalized.completionDateTime = new Date(`${normalized.completionDate}T${normalized.completionTime}`);
              } catch (e) { }
            }
            return normalized;
          });
        }
        return record;
      });
    }

    const currentStage = stage || transformer.currentStage;
    const stageKey = `${currentStage}_test`;

    // Extract readings based on stage
    let readings = [];
    const history = transformer.testHistory?.[stageKey];
    if (history) {
      if (currentStage === 'final') {
        // For final test, we might use the readings from finalReportData if history results are empty
        readings = history.metering_results || history.protection_results || history.ps_results || transformer.finalReportData?.readings || [];
      } else if (currentStage === 'pt') {
        readings = transformer.testHistory.pt_test?.readings || [];
      } else {
        readings = history.metering_results || history.protection_results || history.ps_results || [];
      }
    }

    res.json({
      success: true,
      data: {
        ...reportData,
        readings: readings,
        reportDate: history?.reportDate || history?.timestamp || transformer.finalReportData?.generatedAt || new Date()
      }
    });
  } catch (error) {
    console.error("Error fetching report detail:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//primary Metering test handle
app.post("/transformer-primary-metering-tests", async (req, res) => {
  try {
    const { uniqueId, tester, metering_results, coreId } = req.body;
    console.log(`[DEBUG] POST /transformer-primary-metering-tests. Payload:`, req.body);

    // Fetch the Transformer to get Accuracy Class
    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId }).populate('orderId');
    if (!transformerDoc) {
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    const accuracyClass = transformerDoc.orderId ? transformerDoc.orderId.accuracyClass : "0.5";

    // Fetch dynamic limits from DB
    const dbLimits = await AccuracyLimit.find({ coreType: 'metering', transformerType: 'CT' }).lean();

    // Validate Readings
    const validatedResults = metering_results.map(resultBlock => {
      const coreAccuracyClass = resultBlock.accuracyClass || accuracyClass || "0.5";
      const cleanClass = String(coreAccuracyClass).toUpperCase().replace(/\s+/g, '');
      const limitConfig = dbLimits.find(l => {
        const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
        return lClass === cleanClass;
      });

      if (resultBlock.rows) {
        resultBlock.rows.forEach(row => {
          let rPass = true, pPass = true;
          const reasons = [];
          const loadLimit = limitConfig?.limits?.find(l => String(l.load) === String(row.current));

          if (row.r100 !== undefined && row.r100 !== null && String(row.r100).trim() !== '') {
            const rVal = parseFloat(row.r100);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass = false; reasons.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p100 !== undefined && row.p100 !== null && String(row.p100).trim() !== '') {
            const pVal = parseFloat(row.p100);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass = false; reasons.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r100_r_pass = rPass; row.r100_p_pass = pPass; row.r100_pass = rPass && pPass;
          row.r100_reason = reasons.length > 0 ? reasons.join('; ') : null;

          let rPass25 = true, pPass25 = true;
          const reasons25 = [];
          if (row.r25 !== undefined && row.r25 !== null && String(row.r25).trim() !== '') {
            const rVal = parseFloat(row.r25);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass25 = false; reasons25.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p25 !== undefined && row.p25 !== null && String(row.p25).trim() !== '') {
            const pVal = parseFloat(row.p25);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass25 = false; reasons25.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r25_r_pass = rPass25; row.r25_p_pass = pPass25; row.r25_pass = rPass25 && pPass25;
          row.r25_reason = reasons25.length > 0 ? reasons25.join('; ') : null;
        });
      }
      return { ...resultBlock, internalCoreNo: coreId || resultBlock.internalCoreNo, accuracyClass: coreAccuracyClass };
    });

    // Explicitly update fields for merging
    if (!transformerDoc.testHistory.primary_test) {
      transformerDoc.testHistory.primary_test = {};
    }

    transformerDoc.testHistory.primary_test.status = "Completed";
    transformerDoc.testHistory.primary_test.tester = tester;
    transformerDoc.testHistory.primary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformerDoc.testHistory.primary_test.reportDate) {
      transformerDoc.testHistory.primary_test.reportDate = new Date();
    }

    // Merge logic: Filter out old results for this coreId/internalCoreNo, then append new ones
    const newResults = validatedResults;
    const existingResults = transformerDoc.testHistory.primary_test.metering_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformerDoc.testHistory.primary_test.metering_results = [...otherCoresResults, ...newResults];
    transformerDoc.markModified('testHistory');

    const transformer = await transformerDoc.save();

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({ success: true, message: "Primary Metering Test Saved" });
  } catch (err) {
    console.error("Error saving primary metering test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


//primary protection test handle
app.post("/transformer-primary-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, protection_results } = req.body;
    console.log(`[DEBUG] POST /transformer-primary-protection-tests. Core: ${coreId}`);

    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    if (!transformer.testHistory.primary_test) transformer.testHistory.primary_test = {};

    transformer.testHistory.primary_test.tester = tester;

    // Merge logic for Protection (Primary)
    const newResults = protection_results.map(r => ({ ...r, internalCoreNo: coreId }));
    const existingResults = transformer.testHistory.primary_test.protection_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.primary_test.protection_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.primary_test.status = "Completed";
    transformer.testHistory.primary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.primary_test.reportDate) {
      transformer.testHistory.primary_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();

    res.status(201).json({
      success: true,
      message: "Primary Protection Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save protection test",
      error: err.message
    });
  }
});


//primary PS test handle
app.post("/transformer-primary-ps-tests", async (req, res) => {
  try {
    const { uniqueId, tester, ps_results, coreId } = req.body;

    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId });
    if (!transformerDoc) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    // Initialize if missing
    if (!transformerDoc.testHistory.primary_test) transformerDoc.testHistory.primary_test = {};

    transformerDoc.testHistory.primary_test.tester = tester;

    // Merge logic for PS
    const newResults = ps_results.map(r => ({ ...r, internalCoreNo: coreId || r.internalCoreNo || r.coreId }));
    const existingResults = transformerDoc.testHistory.primary_test.ps_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformerDoc.testHistory.primary_test.ps_results = [...otherCoresResults, ...newResults];
    transformerDoc.testHistory.primary_test.status = "Completed";
    transformerDoc.testHistory.primary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformerDoc.testHistory.primary_test.reportDate) {
      transformerDoc.testHistory.primary_test.reportDate = new Date();
    }

    transformerDoc.markModified('testHistory');
    const transformer = await transformerDoc.save();

    // ✅ FIXED: Standard error handling for missing ID
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found in database.`
      });
    }

    // ✅ SUCCESS: Response
    res.status(201).json({
      success: true,
      message: "Primary PS Test Saved Successfully",
      transformerId: transformer._id
    });

  } catch (err) {
    console.error("Backend PS Save Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save PS test",
      error: err.message
    });
  }
});


//final Metering test handle
app.post("/transformer-final-metering-tests", async (req, res) => {
  try {
    const { uniqueId, tester, metering_results, coreId } = req.body;
    console.log(`[DEBUG] POST /transformer-final-metering-tests. Payload:`, req.body);

    // Fetch the Transformer to get Accuracy Class
    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId }).populate('orderId');
    if (!transformerDoc) {
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    const accuracyClass = transformerDoc.orderId ? transformerDoc.orderId.accuracyClass : "0.5";

    // Fetch dynamic limits from DB
    const dbLimits = await AccuracyLimit.find({ coreType: 'metering', transformerType: 'CT' }).lean();

    // Validate Readings
    const validatedResults = metering_results.map(resultBlock => {
      const coreAccuracyClass = resultBlock.accuracyClass || accuracyClass || "0.5";
      const cleanClass = String(coreAccuracyClass).toUpperCase().replace(/\s+/g, '');
      const limitConfig = dbLimits.find(l => {
        const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
        return lClass === cleanClass;
      });

      if (resultBlock.rows) {
        resultBlock.rows.forEach(row => {
          let rPass = true, pPass = true;
          const reasons = [];
          const loadLimit = limitConfig?.limits?.find(l => String(l.load) === String(row.current));

          if (row.r100 !== undefined && row.r100 !== null && String(row.r100).trim() !== '') {
            const rVal = parseFloat(row.r100);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass = false; reasons.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p100 !== undefined && row.p100 !== null && String(row.p100).trim() !== '') {
            const pVal = parseFloat(row.p100);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass = false; reasons.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r100_r_pass = rPass; row.r100_p_pass = pPass; row.r100_pass = rPass && pPass;
          row.r100_reason = reasons.length > 0 ? reasons.join('; ') : null;

          let rPass25 = true, pPass25 = true;
          const reasons25 = [];
          if (row.r25 !== undefined && row.r25 !== null && String(row.r25).trim() !== '') {
            const rVal = parseFloat(row.r25);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) { rPass25 = false; reasons25.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`); }
            }
          }
          if (row.p25 !== undefined && row.p25 !== null && String(row.p25).trim() !== '') {
            const pVal = parseFloat(row.p25);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) { pPass25 = false; reasons25.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`); }
            }
          }
          row.r25_r_pass = rPass25; row.r25_p_pass = pPass25; row.r25_pass = rPass25 && pPass25;
          row.r25_reason = reasons25.length > 0 ? reasons25.join('; ') : null;
        });
      }
      return { ...resultBlock, internalCoreNo: coreId || resultBlock.internalCoreNo, accuracyClass: coreAccuracyClass };
    });

    // Explicitly update fields for merging
    if (!transformerDoc.testHistory.final_test) {
      transformerDoc.testHistory.final_test = {};
    }

    transformerDoc.testHistory.final_test.status = "Completed";
    transformerDoc.testHistory.final_test.tester = tester;
    transformerDoc.testHistory.final_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformerDoc.testHistory.final_test.reportDate) {
      transformerDoc.testHistory.final_test.reportDate = new Date();
    }

    // Merge logic: Filter out old results for this coreId, then append new ones
    const newResults = validatedResults;
    const existingResults = transformerDoc.testHistory.final_test.metering_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformerDoc.testHistory.final_test.metering_results = [...otherCoresResults, ...newResults];
    transformerDoc.markModified('testHistory');

    const transformer = await transformerDoc.save();

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({ success: true, message: "Final Metering Test Saved" });
  } catch (err) {
    console.error("Error saving final metering test:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


//final protection test handle
app.post("/transformer-final-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, protection_results } = req.body;
    console.log(`[DEBUG] POST /transformer-final-protection-tests. Core: ${coreId}`);

    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    if (!transformer.testHistory.final_test) transformer.testHistory.final_test = {};

    transformer.testHistory.final_test.tester = tester;

    // Merge logic for Protection (Final)
    const { validateProtectionReading } = require('./utils/protectionLimits');
    const newResults = protection_results.map(r => {
      const validation = validateProtectionReading(
        r.protectionClass,
        r.ratioError100,
        r.phaseError,
        r.compositeError
      );
      return {
        ...r,
        internalCoreNo: coreId,
        isPass: validation.isPass,
        reason: validation.reason
      };
    });
    const existingResults = transformer.testHistory.final_test.protection_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.final_test.protection_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.final_test.status = "Completed";
    transformer.testHistory.final_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.final_test.reportDate) {
      transformer.testHistory.final_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();

    res.status(201).json({
      success: true,
      message: "Final Protection Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save protection test",
      error: err.message
    });
  }
});


//primary PS test handle
app.post("/transformer-final-ps-tests", async (req, res) => {
  try {
    const { uniqueId, tester, ps_results, coreId } = req.body;

    const existingTransformer = await TransformerModel.findOne({ uniqueId: uniqueId });
    if (!existingTransformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found in database.`
      });
    }

    // Initialize if missing
    if (!existingTransformer.testHistory.final_test) existingTransformer.testHistory.final_test = {};

    existingTransformer.testHistory.final_test.tester = tester;

    // Merge logic for PS (Final)
    const newResults = ps_results.map(r => ({ ...r, internalCoreNo: coreId || r.internalCoreNo || r.coreId }));
    const existingResults = existingTransformer.testHistory.final_test.ps_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    existingTransformer.testHistory.final_test.ps_results = [...otherCoresResults, ...newResults];
    existingTransformer.testHistory.final_test.status = "Completed";
    existingTransformer.testHistory.final_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!existingTransformer.testHistory.final_test.reportDate) {
      existingTransformer.testHistory.final_test.reportDate = new Date();
    }

    existingTransformer.markModified('testHistory');
    const transformer = await existingTransformer.save();

    // ✅ FIXED: Standard error handling for missing ID
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found in database.`
      });
    }

    // ✅ SUCCESS: Response
    res.status(201).json({
      success: true,
      message: "Final PS Test Saved Successfully",
      transformerId: transformer._id
    });

  } catch (err) {
    console.error("Backend PS Save Error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to save PS test",
      error: err.message
    });
  }
});









// -------------------------------------------------------------------
// SECONDARY TEST ROUTES
// -------------------------------------------------------------------

app.post("/transformer-secondary-metering-tests", async (req, res) => {
  try {
    const { uniqueId, coreId, tester, metering_results, remarks } = req.body;
    const { validateMeteringReading } = require('./utils/accuracyLimits');

    // 0. Fetch the Transformer & Order to get Accuracy Class
    const transformerDoc = await TransformerModel.findOne({ uniqueId: uniqueId }).populate('orderId');
    if (!transformerDoc) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    const order = transformerDoc.orderId;
    const accuracyClass = order ? order.accuracyClass : "0.5"; // Default if not found

    // Fetch dynamic limits from DB
    const dbLimits = await AccuracyLimit.find({ coreType: 'metering', transformerType: 'CT' }).lean();

    // 0.5. Validate Readings
    let isOverallPass = true;
    const validatedResults = metering_results.map(resultBlock => {
      const coreAccuracyClass = resultBlock.accuracyClass || accuracyClass || "0.5";
      const cleanClass = String(coreAccuracyClass).toUpperCase().replace(/\s+/g, '');
      
      // Find matching limit config from DB
      const limitConfig = dbLimits.find(l => {
        const lClass = l.accuracyClass ? String(l.accuracyClass).toUpperCase().replace(/\s+/g, '') : '';
        return lClass === cleanClass;
      });

      if (resultBlock.rows) {
        resultBlock.rows.forEach(row => {
          // Manual Validation against DB limits
          let rPass = true;
          let pPass = true;
          const reasons = [];

          const loadLimit = limitConfig?.limits?.find(l => String(l.load) === String(row.current));

          if (row.r100 !== undefined && row.r100 !== null && String(row.r100).trim() !== '') {
            const rVal = parseFloat(row.r100);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) {
                rPass = false;
                reasons.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`);
              }
            }
          }

          if (row.p100 !== undefined && row.p100 !== null && String(row.p100).trim() !== '') {
            const pVal = parseFloat(row.p100);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) {
                pPass = false;
                reasons.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`);
              }
            }
          }

          row.r100_r_pass = rPass;
          row.r100_p_pass = pPass;
          row.r100_pass = rPass && pPass;
          row.r100_reason = reasons.length > 0 ? reasons.join('; ') : null;

          // 25% Burden
          let rPass25 = true;
          let pPass25 = true;
          const reasons25 = [];

          if (row.r25 !== undefined && row.r25 !== null && String(row.r25).trim() !== '') {
            const rVal = parseFloat(row.r25);
            if (!isNaN(rVal) && loadLimit?.ratioLimit !== undefined) {
              if (Math.abs(rVal) >= loadLimit.ratioLimit) {
                rPass25 = false;
                reasons25.push(`Ratio Error (${rVal}) exceeds ±${loadLimit.ratioLimit}`);
              }
            }
          }

          if (row.p25 !== undefined && row.p25 !== null && String(row.p25).trim() !== '') {
            const pVal = parseFloat(row.p25);
            if (!isNaN(pVal) && loadLimit?.phaseLimit !== undefined && loadLimit.phaseLimit !== null) {
              if (Math.abs(pVal) >= loadLimit.phaseLimit) {
                pPass25 = false;
                reasons25.push(`Phase Error (${pVal}) exceeds ±${loadLimit.phaseLimit}`);
              }
            }
          }

          row.r25_r_pass = rPass25;
          row.r25_p_pass = pPass25;
          row.r25_pass = rPass25 && pPass25;
          row.r25_reason = reasons25.length > 0 ? reasons25.join('; ') : null;

          if (!row.r100_pass || !row.r25_pass) {
            isOverallPass = false;
          }
        });
      }
      return { ...resultBlock, internalCoreNo: coreId, accuracyClass: coreAccuracyClass };
    });

    const finalStatus = isOverallPass ? "Pass" : "Fail";

    // 1. Save detailed test report (Upsert)
    const existingTestRecord = await SecondaryMeteringTestModel.findOne({ uniqueId, coreId });
    const updatePayload = {
      uniqueId,
      coreId,
      tester,
      metering_results: validatedResults,
      remarks,
      testDate: new Date(),
      status: finalStatus
    };

    if (!existingTestRecord || !existingTestRecord.reportDate) {
      updatePayload.reportDate = new Date();
    }

    const testRecord = await SecondaryMeteringTestModel.findOneAndUpdate(
      { uniqueId, coreId },
      updatePayload,
      { upsert: true, new: true, runValidators: true }
    );

    // 2. Update Master Transformer Status
    // 2. Update Master Transformer Status
    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    // Explicitly update fields
    if (!transformer.testHistory.secondary_test) {
      transformer.testHistory.secondary_test = {};
    }

    transformer.testHistory.secondary_test.status = "Completed";
    transformer.testHistory.secondary_test.tester = tester;
    transformer.testHistory.secondary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.secondary_test.reportDate) {
      transformer.testHistory.secondary_test.reportDate = new Date();
    }

    // Merge logic: Filter out old results for this coreId, then append new ones
    // Note: validatedResults from frontend is an ARRAY of ratios for this core, correctly populated with pass/fail statuses.
    const newResults = validatedResults; // use the array that already has r100_pass etc

    const existingResults = transformer.testHistory.secondary_test.metering_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );

    transformer.testHistory.secondary_test.metering_results = [...otherCoresResults, ...newResults];

    // Mark modified (sometimes needed for mixed types, though these are schemas)
    transformer.markModified('testHistory');

    const savedTransformer = await transformer.save();
    console.log("[DEBUG] Transformer Saved. Secondary Results Length:", savedTransformer.testHistory.secondary_test.metering_results.length);


    // Verify transformer update
    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({
      success: true,
      message: "Secondary Metering Test Saved",
      data: testRecord
    });

  } catch (error) {
    console.error("Error saving secondary metering test:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------------
// SECONDARY PS TEST
// -------------------------------------------------------------------
app.post("/transformer-secondary-ps-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, ps_results } = req.body;
    console.log(`[DEBUG] POST /transformer-secondary-ps-tests. Payload:`, req.body);

    // PS Test Update
    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    // Initialize if missing
    if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

    transformer.testHistory.secondary_test.tester = tester;
    // Merge logic for PS
    const newResults = ps_results.map(r => ({ ...r, internalCoreNo: coreId }));
    const existingResults = transformer.testHistory.secondary_test.ps_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.secondary_test.ps_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.secondary_test.status = "Completed";
    transformer.testHistory.secondary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.secondary_test.reportDate) {
      transformer.testHistory.secondary_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();
    console.log("[DEBUG] PS Test Saved. Results Length:", savedTransformer.testHistory.secondary_test.ps_results.length);

    res.status(201).json({
      success: true,
      message: "Secondary PS Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend PS Save Error:", err);
    res.status(400).json({ success: false, message: "Failed to save PS test", error: err.message });
  }
});

// -------------------------------------------------------------------
// SECONDARY PROTECTION TEST
// -------------------------------------------------------------------
app.post("/transformer-secondary-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, coreId, protection_results } = req.body;
    console.log(`[DEBUG] POST /transformer-secondary-protection-tests. Payload:`, req.body);

    const transformer = await TransformerModel.findOne({ uniqueId: uniqueId });

    if (!transformer) {
      return res.status(404).json({ success: false, message: `Transformer ID [${uniqueId}] not found.` });
    }

    if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};

    transformer.testHistory.secondary_test.tester = tester;
    // Merge logic for Protection
    const { validateProtectionReading } = require('./utils/protectionLimits');
    const newResults = protection_results.map(r => {
      const validation = validateProtectionReading(
        r.protectionClass,
        r.ratioError100,
        r.phaseError,
        r.compositeError
      );
      return {
        ...r,
        internalCoreNo: coreId,
        isPass: validation.isPass,
        reason: validation.reason
      };
    });
    const existingResults = transformer.testHistory.secondary_test.protection_results || [];
    const otherCoresResults = existingResults.filter(r =>
      r.internalCoreNo !== coreId && r.coreId !== coreId
    );
    transformer.testHistory.secondary_test.protection_results = [...otherCoresResults, ...newResults];
    transformer.testHistory.secondary_test.status = "Completed";
    transformer.testHistory.secondary_test.timestamp = new Date();

    // Set reportDate only if not already present
    if (!transformer.testHistory.secondary_test.reportDate) {
      transformer.testHistory.secondary_test.reportDate = new Date();
    }

    transformer.markModified('testHistory');
    const savedTransformer = await transformer.save();
    console.log("[DEBUG] Protection Test Saved. Results Length:", savedTransformer.testHistory.secondary_test.protection_results.length);

    res.status(201).json({
      success: true,
      message: "Secondary Protection Test Saved Successfully",
      transformerId: savedTransformer._id
    });

  } catch (err) {
    console.error("Backend Protection Save Error:", err);
    res.status(400).json({ success: false, message: "Failed to save Protection test", error: err.message });
  }
});


// ✅ APPROVE TRANSFORMER STAGE (Secondary -> Primary)
// ✅ APPROVE TRANSFORMER STAGE (Secondary -> Primary)
app.put("/api/transformers/:id/approve-stage", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, nextStage } = req.body;
    const user = req.user;

    const userName = user?.name || user?.fullName || user?.username || 'System';
    console.log(`[APPROVE] Transitioning Transformer ${id} from ${stage} to ${nextStage} by ${userName}`);

    const transformer = await TransformerModel.findOne({ uniqueId: id });
    if (!transformer) {
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    // Ensure testHistory and stages are initialized
    if (!transformer.testHistory) transformer.testHistory = {};

    // 1. Mark current stage as Completed
    if (stage === 'secondary') {
      if (!transformer.testHistory.secondary_test) transformer.testHistory.secondary_test = {};
      transformer.testHistory.secondary_test.status = 'Completed';
      transformer.testHistory.secondary_test.completionDate = new Date();
      if (!transformer.testHistory.secondary_test.tester) {
        transformer.testHistory.secondary_test.tester = userName;
      }
    } else if (stage === 'primary') {
      if (!transformer.testHistory.primary_test) transformer.testHistory.primary_test = {};
      transformer.testHistory.primary_test.status = 'Completed';
      transformer.testHistory.primary_test.completionDate = new Date();
      if (!transformer.testHistory.primary_test.tester) {
        transformer.testHistory.primary_test.tester = userName;
      }
    } else if (stage === 'heating') {
      // Heating stage might not have a formal testHistory entry but we track the move
      console.log(`Transformer ${id} moving from Heating to Final`);
    } else if (stage === 'final') {
      if (!transformer.testHistory.final_test) transformer.testHistory.final_test = {};
      transformer.testHistory.final_test.status = 'Completed';
      transformer.testHistory.final_test.completionDate = new Date();
      if (!transformer.testHistory.final_test.tester) {
        transformer.testHistory.final_test.tester = userName;
      }
    }

    // 2. Move to next stage
    transformer.currentStage = nextStage;

    // 3. Save with error catching for validation
    try {
      await transformer.save();
    } catch (saveErr) {
      console.error("Mongoose Save Error on Approval:", saveErr);
      throw saveErr;
    }

    res.json({
      success: true,
      message: `Transformer approved to ${nextStage}`,
      data: transformer
    });

  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ success: false, message: "Failed to approve transformer", error: err.message });
  }
});

//primary protection test handle
// -------------------------------------------------------------------
// STRICT APPROVAL ROUTES
// -------------------------------------------------------------------
const StrictApproval = require('./schema/StrictApprovalSchema');

app.post('/api/strict-approvals/request', async (req, res) => {
  try {
    const { orderId, jobId, unitId, clientName, coreType, testType, failureReason, testData, requestedBy } = req.body;

    const newRequest = new StrictApproval({
      orderId,
      jobId,
      unitId,
      clientName,
      coreType,
      testType,
      failureReason,
      requestedBy,
      testData,
      status: 'Pending'
    });

    await newRequest.save();
    
    await new NotificationModel({
      recipientRole: 'admin',
      message: `Strict Approval Required: Job ${jobId} (Unit: ${unitId}) - ${failureReason.split(' | ')[0]}`,
      type: 'STRICT_APPROVAL_REQUESTED',
      orderId: orderId,
      jobId: jobId,
      unitId: unitId
    }).save();

    res.status(201).json({ success: true, message: 'Strict approval requested successfully' });
  } catch (error) {
    console.error("Strict approval request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/strict-approvals', async (req, res) => {
  try {
    const approvals = await StrictApproval.find({ status: 'Pending' }).populate('orderId').sort({ createdAt: -1 }).lean();
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/strict-approvals/:id/resolve', async (req, res) => {
  try {
    const { approved, adminComments, resolvedBy } = req.body;
    const action = approved ? 'Approve' : 'Reject';

    const approval = await StrictApproval.findById(req.params.id);
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    approval.status = approved ? 'Approved' : 'Rejected';
    approval.resolvedBy = resolvedBy || 'Admin';
    approval.resolutionRemark = adminComments;
    await approval.save();
    
    // Mark the notification as read specifically for this unit
    await NotificationModel.updateMany(
      { 
        jobId: approval.jobId, 
        unitId: approval.unitId,
        type: 'STRICT_APPROVAL_REQUESTED', 
        recipientRole: 'admin' 
      },
      { $set: { isRead: true } }
    );

    // ✅ If approved, move the transformer to the next stage
    if (approval.unitId) {
      const transformer = await TransformerModel.findOne({ uniqueId: approval.unitId });
      if (transformer) {
        let historyKey = 'secondary_test';
        let targetStageApprove = 'primary';
        let targetStageReject = 'secondary';

        if (approval.testType === 'Primary Testing') {
          historyKey = 'primary_test';
          targetStageApprove = 'final';
          targetStageReject = 'primary';
        } else if (approval.testType === 'Final Testing') {
          historyKey = 'final_test_login';
          targetStageApprove = 'shipped';
          targetStageReject = 'final';
        }

        if (approved) {
          transformer.currentStage = targetStageApprove;
          if (!transformer.testHistory) transformer.testHistory = {};
          if (!transformer.testHistory[historyKey]) transformer.testHistory[historyKey] = {};
          transformer.testHistory[historyKey].status = 'Completed';
          transformer.testHistory[historyKey].adminApproved = true;
          transformer.testHistory[historyKey].approvalDate = new Date();

          console.log(`[STRICT APPROVAL] Transformer ${approval.unitId} approved and moved to ${targetStageApprove}.`);
        } else {
          transformer.currentStage = targetStageReject;
          console.log(`[STRICT APPROVAL] Transformer ${approval.unitId} rejected and moved back to ${targetStageReject}.`);
        }
        await transformer.save();

        // Update Order if it needs to transition
        if (approved && transformer.orderId) {
          const order = await OrderModel.findById(transformer.orderId);
          if (order) {
            const { notifyNextStage, handleOrderCompletion } = require('./services/notificationService');

            // 1. Send Assignment Notification if this is the FIRST unit to reach this stage
            // This ensures testers are notified as soon as work is available, even if others are pending.
            if (targetStageApprove !== 'shipped' && approved) {
              const existingNotification = await NotificationModel.findOne({
                orderId: order._id,
                recipientRole: targetStageApprove,
                type: 'ASSIGNMENT'
              });

              if (!existingNotification) {
                // We follow the "regular notification" style requested by the user
                const nextStageAssignments = order.assignments.filter(a => a.stage === targetStageApprove);
                for (const assignment of nextStageAssignments) {
                  await NotificationModel.create({
                    recipientName: assignment.testerName,
                    recipientRole: targetStageApprove,
                    message: `New testing task assigned: Job ${order.jobId} (${order.clientName || 'Active Order'})`,
                    type: 'ASSIGNMENT',
                    orderId: order._id,
                    jobId: order.jobId
                  });
                }
                console.log(`[STRICT APPROVAL] First unit reached ${targetStageApprove}. Assignment notification sent for ${order.jobId}.`);
              }
            }

            // 2. Global Order Stage Transition (if ALL units are now past the previous stage)
            if (order.currentStage !== targetStageApprove && order.currentStage !== 'completed') {
              const pendingTotalCount = await TransformerModel.countDocuments({
                $or: [
                  { orderId: transformer.orderId },
                  { orderId: transformer.orderId.toString() },
                  { jobId: transformer.jobId }
                ],
                currentStage: { $in: [targetStageReject, 'admin_review'] }
              });
              
              if (pendingTotalCount === 0) {
                if (targetStageApprove === 'shipped') {
                  const oldStatus = order.status;
                  order.currentStage = 'completed';
                  order.status = 'COMPLETED';
                  if (order.completionStages) order.completionStages.final = true;
                  await order.save();
                  await handleOrderCompletion(order, oldStatus);
                  console.log(`[STRICT APPROVAL] All units shipped. Order ${order.jobId} marked as COMPLETED.`);
                } else {
                  order.currentStage = targetStageApprove;
                  if (order.completionStages) {
                    if (targetStageApprove === 'primary') order.completionStages.secondary = true;
                    if (targetStageApprove === 'final') order.completionStages.primary = true;
                  }
                  await order.save();
                  // Note: We don't call notifyNextStage here because we already sent it for the "first unit" above
                  console.log(`[STRICT APPROVAL] Order ${order.jobId} transitioned to ${targetStageApprove}.`);
                }
              }
            }
          }
        }
      }
    }

    res.json({ success: true, message: `Request ${action}d successfully` });
  } catch (error) {
    console.error("Resolution Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/efficiency
// Returns active/delayed testing sessions across stages
app.get('/api/dashboard/efficiency', isAuthenticated, async (req, res) => {
  try {
    const { OrderModel } = require('./models/OrderModel');
    const { TransformerModel } = require('./models/TransformerModel');

    // --- 1. CORE TEST DELAY TRACKING ---
    const orders = await OrderModel.find({
      $or: [
        { 'stageTracking.core.metering.status': { $in: ['In Progress', 'Paused', 'Completed'] } },
        { 'stageTracking.core.protection.status': { $in: ['In Progress', 'Paused', 'Completed'] } },
        { 'stageTracking.core.ps.status': { $in: ['In Progress', 'Paused', 'Completed'] } }
      ],
      $or: [
        { status: { $ne: 'COMPLETED' } },
        { currentStage: { $ne: 'completed' } }
      ]
    });

    const activeTimers = [];
    orders.forEach(order => {
      if (!order.stageTracking || !order.stageTracking.core) return;
      
      // Find the tester assigned to core testing for this order
      const coreAssignment = order.assignments?.find(a => a.stage === 'core');
      const testerName = coreAssignment ? coreAssignment.testerName : "Unassigned";

      const cores = order.stageTracking.core;
      ['metering', 'protection', 'ps'].forEach(type => {
        const timer = cores[type];
        if (timer && timer.status && timer.status !== "Pending" && !timer.isAcknowledged) {
          let elapsedMs = timer.accumulatedTimeMs || 0;
          if (timer.status === "In Progress" && timer.startTime) {
            elapsedMs += (Date.now() - new Date(timer.startTime).getTime());
          }
          
          const allocatedMs = (timer.allocatedMinutes || 0) * 60 * 1000;
          const isDelayed = elapsedMs > allocatedMs;

          // User requested to show only delayed orders or focusing on them
          // We will include the testerName and potentially filter here if "delay only" was literal
          activeTimers.push({
            orderId: order._id,
            jobId: order.jobId,
            clientName: order.clientName,
            testerName: testerName,
            coreType: type.toUpperCase(),
            startTime: timer.startTime,
            status: timer.status,
            allocatedMinutes: timer.allocatedMinutes,
            elapsedMinutes: Math.floor(elapsedMs / 60000),
            elapsedMs: elapsedMs,
            isDelayed: isDelayed
          });
        }
      });
    });

    // --- 2. SECONDARY & PRIMARY TEST DELAY TRACKING ---
    // Fetch all transformers that have test data but are not fully shipped yet
    const transformers = await TransformerModel.find({
      'currentStage': { $ne: 'shipped' },
      $or: [
        { 'testHistory.secondary_test.timerStatus': { $in: ['In Progress', 'Paused', 'Completed'] } },
        { 'testHistory.primary_test.timerStatus': { $in: ['In Progress', 'Paused', 'Completed'] } },
        { 'testHistory.final_test.timerStatus': { $in: ['In Progress', 'Paused', 'Completed'] } }
      ]
    }).populate('orderId').lean();

    transformers.forEach(transformer => {
      // Don't show delays for completely finished orders
      if (transformer.orderId?.status === 'COMPLETED' || transformer.orderId?.currentStage === 'completed' || transformer.orderId?.currentStage === 'shipped') return;

      const stagesToTrack = [
        { stage: 'secondary_test', label: 'SEC', testerField: 'secondary_tester', role: 'secondary' },
        { stage: 'primary_test', label: 'PRI', testerField: 'primary_tester', role: 'primary' },
        { stage: 'final_test', label: 'FINAL', testerField: 'final_tester', role: 'final' }
      ];

      stagesToTrack.forEach(({ stage, label, defaultMins, testerField, role }) => {
        const stageData = transformer.testHistory?.[stage];
        if (stageData && stageData.timerStatus !== "Pending" && !stageData.isAcknowledged) {
          let elapsedMs = stageData.accumulatedTimeMs || 0;
          // Only continuously track time if it's strictly in progress
          if (stageData.timerStatus === "In Progress" && stageData.startTime) {
            elapsedMs += (Date.now() - new Date(stageData.startTime).getTime());
          }
          
          const allocatedMs = (stageData.allocatedMinutes || 0) * 60 * 1000;
          const isDelayed = elapsedMs > allocatedMs;

          if (isDelayed) {
            let orderAssignments = transformer.orderId?.assignments || [];
            let assignment = orderAssignments.find(a => a.stage === role);

            activeTimers.push({
              orderId: transformer.orderId?._id || transformer.orderId,
              jobId: transformer.jobId,
              clientName: transformer.orderId?.clientName || 'Unknown Client',
              testerName: transformer.assignments?.[testerField] || assignment?.testerName || 'Unknown Tester', 
              coreType: `TR-${transformer.uniqueId.split('-').pop()} (${label})`, // E.g., TR-001 (SEC)
              startTime: stageData.startTime,
              status: stageData.timerStatus,
              allocatedMinutes: stageData.allocatedMinutes || 0,
              elapsedMinutes: Math.floor(elapsedMs / 60000),
              elapsedMs: elapsedMs,
              isDelayed: isDelayed
            });
          }
        }
      });
    });

    const delayedOnly = activeTimers.filter(t => t.isDelayed);
    res.json({ success: true, data: delayedOnly });
  } catch (error) {
    console.error("Efficiency API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/dashboard/efficiency/acknowledge
// Marks a specific delayed timer as acknowledged so it disappears from the dashboard
app.put('/api/dashboard/efficiency/acknowledge', isAuthenticated, async (req, res) => {
  try {
    const { orderId, jobId, coreType } = req.body;
    
    if (!orderId || !coreType) {
      return res.status(400).json({ success: false, message: "Missing orderId or coreType" });
    }

    const { OrderModel } = require('./models/OrderModel');
    const { TransformerModel } = require('./models/TransformerModel');

    // Check if it's a secondary or primary test delay
    if (coreType.includes('(SEC)') || coreType.includes('(PRI)') || coreType.includes('(FINAL)')) {
      const isSecondary = coreType.includes('(SEC)');
      const isPrimary = coreType.includes('(PRI)');
      const isFinal = coreType.includes('(FINAL)');
      
      const stageField = isSecondary ? 'secondary_test' : (isPrimary ? 'primary_test' : 'final_test');
      const label = isSecondary ? 'SEC' : (isPrimary ? 'PRI' : 'FINAL');

      // Find the specific transformer based on the coreType name, e.g., "TR-001 (SEC)"
      const regex = new RegExp(`TR-(\\d+) \\(${label}\\)`);
      const coreNumberMatch = coreType.match(regex);
      
      const transformers = await TransformerModel.find({ jobId });
      let transformer;
      if (coreNumberMatch && coreNumberMatch[1]) {
        const suffix = `-${coreNumberMatch[1]}`;
        transformer = transformers.find(t => t.uniqueId.endsWith(suffix));
      } else {
        // Fallback just in case
        transformer = transformers[0]; 
      }
      
      if (transformer) {
        if (transformer.testHistory && transformer.testHistory[stageField]) {
          transformer.testHistory[stageField].isAcknowledged = true;
          transformer.markModified('testHistory');
          await transformer.save();
          return res.json({ success: true, message: `Marked ${isSecondary ? 'secondary' : 'primary'} test delay as read.` });
        }
      }
    } else {
      // It's a core test delay (METERING, PROTECTION, PS)
      const order = await OrderModel.findById(orderId);
      if (order && order.stageTracking && order.stageTracking.core) {
        const typeKey = coreType.toLowerCase(); // metering, protection, ps
        if (order.stageTracking.core[typeKey]) {
          order.stageTracking.core[typeKey].isAcknowledged = true;
          order.markModified('stageTracking');
          await order.save();
          return res.json({ success: true, message: `Marked ${coreType} test delay as read.` });
        }
      }
    }

    res.status(404).json({ success: false, message: "Timer record not found" });
  } catch (error) {
    console.error("Error acknowledging delay:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const http = require('http');
const { Server } = require('socket.io');
const { initReservationCleanup } = require('./cron/reservationCleanup');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    success: false,
    message: isProduction ? "Internal Server Error" : err.message,
    details: isProduction ? null : err.errors,
    stack: isProduction ? null : err.stack
  });
});

global.io = io; // Make io accessible globally

io.on('connection', (socket) => {
  console.log('Client connected for real-time updates');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

initReservationCleanup();

server.listen(PORT, () => {
  console.log(`App Started! Server running on port ${PORT}`);
});
