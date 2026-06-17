require("dotenv").config({ override: true }); // trigger restart

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

// --- RATE LIMITERS ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

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
      if (e.code !== 27) { // 27 is IndexNotFound
        console.warn("Non-fatal error dropping index:", e.message);
      }
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
    if (!origin || allowedOrigins.includes(origin) || origin === "http://localhost" || origin.startsWith("http://localhost:")) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// 1.5 Security Headers
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.query);
  next();
}); // Prevent NoSQL Injection without crashing Express 5

// 2. Session Config
const { MongoStore } = require('connect-mongo');
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("CRITICAL SECURITY ERROR: SESSION_SECRET is not configured in environment variables!");
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
app.use('/api/auth', authRoutes);
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
// Mounted reports route
app.use('/', require('./routes/reportRoutes'));
//primary Metering test handle
// Mounted legacy transformer test routes
app.use('/', require('./routes/transformerTestRoutes'));

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
      
      // If returning to primary stage (i.e. from Failed Transformers section),
      // we clear the old primary test readings so the form opens empty.
      if (nextStage === 'primary' && transformer.testHistory.primary_test) {
        transformer.testHistory.primary_test.metering_results = [];
        transformer.testHistory.primary_test.ps_results = [];
        transformer.testHistory.primary_test.protection_results = [];
        transformer.testHistory.primary_test.tester = null;
        transformer.testHistory.primary_test.status = 'Pending';
        transformer.testHistory.primary_test.completionDate = null;
        transformer.markModified('testHistory.primary_test');
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

      // Mark failed transformer records as RESOLVED since this stage has been approved
      await FailedTransformerModel.updateMany(
        {
          $or: [
            { transformerId: transformer._id },
            { transformerUniqueId: transformer.uniqueId }
          ],
          status: { $in: ["FAILED", "TREATED"] }
        },
        { $set: { status: "RESOLVED" } }
      );
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
          historyKey = 'final_test';
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
