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
app.use(session({
  secret: 'advent_engineers_secret_key', // Change this in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using https
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

// Provide configuration for Accuracy Classes dynamically to the frontend
app.get('/api/accuracy-limits', (req, res) => {
  const { ACCURACY_CLASS_LIMITS } = require('./utils/accuracyLimits');
  res.json({ success: true, data: ACCURACY_CLASS_LIMITS });
});

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



// Helper: Generate Transformers with Assignments
const generateTransformersForOrder = async (order) => {

  try {
    const { jobId, quantity, ratings, coreDetails, assignments } = order;
    const transformers = [];

    // 1. Create a map of Unit Number -> Assignments
    // Logic: Iterate through order.assignments (e.g., "Rahul: Core, 1-3") and build a map.
    const unitAssignments = {};

    // Initialize map
    for (let i = 1; i <= quantity; i++) {
      unitAssignments[i] = {
        core_tester: "",
        secondary_tester: "",
        primary_tester: "",
        final_tester: "",
        pt_tester: ""
      };
    }

    if (assignments && assignments.length > 0) {
      assignments.forEach(assign => {
        const { stage, testerName, unitRange } = assign; // stage: 'core', 'secondary', etc.
        const from = parseInt(unitRange.from);
        const to = parseInt(unitRange.to) || quantity; // Default to max if empty

        for (let u = from; u <= to; u++) {
          if (unitAssignments[u]) {
            unitAssignments[u][`${stage}_tester`] = testerName;
          }
        }
      });
    }

    // Determine Start Stage based on Assignments
    let startStage = 'core';
    let hasCore = false;
    let hasSecondary = false;

    if (assignments && assignments.length > 0) {
      hasCore = assignments.some(a => a.stage === 'core');
      hasSecondary = assignments.some(a => a.stage === 'secondary');
    }

    // Logic: If NO core assignments but YES secondary -> Start at Secondary
    // (User explicitly skipped core in assignments)
    if (order.transformerType === 'PT') {
      startStage = 'pt_pretest';
      order.currentStage = 'pt_pretest';
      await order.save();
    } else if (!hasCore && hasSecondary) {
      startStage = 'secondary';
      // Mark Order as Core Completed effectively
      order.currentStage = 'secondary';
      order.completionStages.core = true;
      await order.save();
      console.log(`[Generate] Skipping Core stage. Starting at Secondary.`);
    }

    console.log(`[Generate] Generating ${quantity} transformers for ${jobId} with assignments mapping.`);

    for (let i = 1; i <= quantity; i++) {
      const uniqueId = `TR-${jobId}-${String(i).padStart(3, '0')}`;

      // Construct Initial History
      const initialHistory = {
        secondary_login: { status: 'Pending' },
        primary_login: { status: 'Pending' },
        final_test_login: { status: 'Pending' }
      };

      transformers.push({
        uniqueId,
        orderId: order._id, // Link to Parent Order
        // ratings: ratings,
        // coreType: coreDetails.map(c => c.coreType),
        currentStage: startStage, // Dynamic Start Stage
        testHistory: initialHistory,
        // Populate the specific assignments for THIS unit
        assignments: unitAssignments[i],
        jobId: jobId,
      });
    }

    // Bulk Insert for performance
    await TransformerModel.insertMany(transformers);
    console.log(`Successfully generated ${quantity} transformers for ${jobId}`);

    // --- CREATE NOTIFICATIONS ---
    // Identify all unique testers assigned in this order for the starting stage
    if (assignments && assignments.length > 0) {
      const uniqueTesters = [...new Set(assignments.filter(a => a.stage === startStage).map(a => a.testerName))];

      const notificationPromises = uniqueTesters.map(tester => {
        return new NotificationModel({
          recipientRole: startStage,
          recipientName: tester,
          message: `New testing task assigned: ${quantity} units for ${order.clientName} (Job: ${jobId})`,
          orderId: order._id,
          jobId: jobId,
          type: "ASSIGNMENT"
        }).save();
      });
      await Promise.all(notificationPromises);
      console.log(`Created ${uniqueTesters.length} notifications for ${startStage} testers.`);
    }

  } catch (error) {
    console.error("Error generating transformers:", error);
    throw error; // Re-throw to be caught by caller
  }
};
// 2. Method: Create Order (Operator Level OR Admin Level)
const createOrder = async (req, res) => {
  try {
    // 1. Generate the Job ID
    const jobSeq = await getNextSequenceValue("job_sequence");
    const currentYear = new Date().getFullYear();
    const jobId = `JOB-${currentYear}-${jobSeq.toString().padStart(3, '0')}`;

    const isDirectApproval = req.body.bypassApproval === true || req.body.bypassApproval === 'true';

    // 2. Extract Cloudinary Images if any
    const imagesArray = req.files ? req.files.map(file => ({
      url: file.path,
      public_id: file.filename
    })) : [];

    // Parse specific nested JSON objects sent as strings via FormData
    const parsedBody = { ...req.body };
    try {
      if (req.body.coreDetails && typeof req.body.coreDetails === 'string') {
        parsedBody.coreDetails = JSON.parse(req.body.coreDetails);
      }
      if (req.body.assignments && typeof req.body.assignments === 'string') {
        parsedBody.assignments = JSON.parse(req.body.assignments);
      }
      if (req.body.ratio && typeof req.body.ratio === 'string') {
        parsedBody.ratio = JSON.parse(req.body.ratio);
      }
      if (req.body.coreVendors && typeof req.body.coreVendors === 'string') {
        parsedBody.coreVendors = JSON.parse(req.body.coreVendors);
      }
    } catch (e) {
      console.error("Body parsing error:", e);
    }

    // 3. Create Order
    const newOrder = new OrderModel({
      ...parsedBody,
      images: imagesArray,
      jobId: jobId,
      isApproved: isDirectApproval,
      isRead: !isDirectApproval, // If admin created it, it's already "read"
      status: isDirectApproval ? "In Progress" : "Pending Approval"
    });

    console.log(`[CreateOrder] Payload for ${jobId}:`, JSON.stringify(req.body, null, 2));
    console.log(`[CreateOrder] Processed Ratio:`, newOrder.ratio);

    const savedOrder = await newOrder.save();

    // 3. Trigger Transformer Generation if approved immediately
    if (isDirectApproval) {
      await generateTransformersForOrder(savedOrder);
    } else {
      console.log(`Order ${jobId} created with status Pending Approval`);
    }

    res.status(201).json({
      success: true,
      message: isDirectApproval
        ? `Order created and ${savedOrder.quantity} units generated.`
        : "Order submitted to Admin for approval.",
      jobId: savedOrder.jobId
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ success: false, error: error.message, details: error.errors });
  }
};


// 3. Method: Admin Approval & Auto-Generation
const approveOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.isApproved) return res.status(400).json({ message: "Already approved" });

    // 1. Update Order Status
    order.isApproved = true;
    order.status = "In Progress";
    await order.save();

    // 2. Generate Transformers using Helper
    await generateTransformersForOrder(order);

    res.status(200).json({
      success: true,
      message: `Approved. ${order.quantity} units generated for ${order.jobId}.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3.5 Method: Update Order (Assignments or Details) - Admin
const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    // 1. Get the existing order first to compare quantity
    const existingOrder = await OrderModel.findById(orderId);
    if (!existingOrder) return res.status(404).json({ message: "Order not found" });

    const oldQuantity = existingOrder.quantity || 0;
    const newQuantity = updates.quantity ? parseInt(updates.quantity) : oldQuantity;

    // 2. Perform the update
    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true }
    );

    // 3. Sync Transformers if quantity changed
    if (newQuantity !== oldQuantity) {
      console.log(`[UpdateOrder] Quantity changed from ${oldQuantity} to ${newQuantity}. Syncing transformers...`);
      
      if (newQuantity > oldQuantity) {
        // Generate missing transformers (from oldQuantity + 1 to newQuantity)
        for (let i = oldQuantity + 1; i <= newQuantity; i++) {
          const uniqueId = `TR-${order.jobId}-${String(i).padStart(3, '0')}`;
          
          // Check if already exists just in case
          const existing = await TransformerModel.findOne({ uniqueId });
          if (existing) continue;

          // Determine start stage
          let startStage = order.transformerType === 'PT' ? 'pt_pretest' : 'core';
          
          const newTransformer = new TransformerModel({
            orderId: order._id,
            uniqueId: uniqueId,
            jobId: order.jobId,
            currentStage: startStage,
            testHistory: {
              core_test: { status: 'Pending' },
              secondary_test: { status: 'Pending' },
              primary_test: { status: 'Pending' },
              final_test: { status: 'Pending' }
            },
            assignments: {} 
          });
          
          // Apply assignments from order.assignments if possible
          if (order.assignments && order.assignments.length > 0) {
            order.assignments.forEach(assign => {
              const from = parseInt(assign.unitRange.from);
              const to = parseInt(assign.unitRange.to) || newQuantity;
              if (i >= from && i <= to) {
                newTransformer.assignments[`${assign.stage}_tester`] = assign.testerName;
              }
            });
          }

          await newTransformer.save();
        }

        // Send notification for new units
        if (order.assignments && order.assignments.length > 0) {
          const startStage = order.transformerType === 'PT' ? 'pt_pretest' : 'core';
          const uniqueTesters = [...new Set(order.assignments.filter(a => a.stage === startStage).map(a => a.testerName))];
          
          for (const tester of uniqueTesters) {
            await new NotificationModel({
              recipientRole: startStage,
              recipientName: tester,
              message: `Updated order: ${newQuantity - oldQuantity} new units added for ${order.clientName} (Job: ${order.jobId})`,
              orderId: order._id,
              jobId: order.jobId,
              type: "ASSIGNMENT"
            }).save();
          }
        }
      } else {
        // Decrease quantity: Delete transformers from the end
        for (let i = oldQuantity; i > newQuantity; i--) {
          const uniqueId = `TR-${order.jobId}-${String(i).padStart(3, '0')}`;
          
          // Delete from TransformerModel
          await TransformerModel.deleteOne({ uniqueId });
          
          // Cleanup test records
          await MeteringCoreTestModel.deleteMany({ uniqueId });
          await ProtectionCoreTestModel.deleteMany({ uniqueId });
          await SecondaryMeteringTestModel.deleteMany({ uniqueId });
          
          // Cleanup HeatingRecord blocks
          await HeatingRecordModel.updateMany(
            { orderId: order._id },
            { $pull: { blocks: { transformerId: uniqueId } } }
          );

          await FailedCoreModel.deleteMany({ uniqueId });
          await FailedTransformerModel.deleteMany({ uniqueId });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully and transformers synced",
      order
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3.6 Method: Delete Order (Admin Only) with Cloudinary Cleanup
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Optional: Add admin check here if `isAuthenticated` middleware attaches roles (e.g. `req.user.role === 'Admin'`)

    // 1. Find the order
    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2. Delete Images from Cloudinary
    if (order.images && order.images.length > 0) {
      const deletePromises = order.images.map(img => {
        if (img.public_id) {
          return cloudinary.uploader.destroy(img.public_id).catch(err => {
            console.error(`[DeleteOrder] Cloudinary cleanup failed for ${img.public_id}:`, err);
            return null; // Continue even if image deletion fails
          });
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
      console.log(`[DeleteOrder] Cleaned up images from Cloudinary for order ${orderId}`);
    }

    // 3. Delete Associated Transformers and Test Records
    // Delete transformers (this is the most important for testers)
    await TransformerModel.deleteMany({ orderId: order._id });
    
    // Delete Notifications (removes alerts from dashboards)
    await NotificationModel.deleteMany({ orderId: order._id });

    // Delete Failed core/transformer records
    await FailedCoreModel.deleteMany({ orderId: order._id });
    await FailedTransformerModel.deleteMany({ orderId: order._id });

    // Delete Ready stock items
    await ReadyTransformerModel.deleteMany({ orderId: order._id });

    // Delete specific test models that might have separate linkage
    await SecondaryMeteringTestModel.deleteMany({ orderId: order._id });
    await MeteringCoreTestModel.deleteMany({ orderId: order._id });
    await ProtectionCoreTestModel.deleteMany({ orderId: order._id });
    await HeatingRecordModel.deleteMany({ orderId: order._id });

    // 4. Delete the Order itself
    await OrderModel.findByIdAndDelete(orderId);

    res.status(200).json({
      success: true,
      message: "Order, associated transformers, and images deleted successfully"
    });
  } catch (error) {
    console.error("Delete Order Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 3.7 Method: Reassign Tester for a Stage (Admin Notification)
const reassignTester = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { stage, testerName } = req.body; // e.g. { stage: 'core', testerName: 'Rahul' }

    if (!stage || !testerName) {
      return res.status(400).json({ message: "Stage and Tester Name are required" });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 1. Remove ALL existing assignments for this stage
    // We filter out the old ones and push the new one
    // This effectively "Resets" the stage to a single tester
    const outputAssignments = order.assignments.filter(a => a.stage !== stage);

    // 2. Add New Assignment (Full Range)
    outputAssignments.push({
      testerName: testerName,
      stage: stage,
      unitRange: { from: 1, to: order.quantity }, // Assign full range
      status: "Assigned"
    });

    order.assignments = outputAssignments;

    // Also update legacy fields if they exist to match schema (for backward compatibility if needed)
    // But schema says assignments is array only now.

    await order.save();

    // 3. Update Transformers (Critical for visibility)
    // We need to update existing Transformers to reflect this change
    // Find all transformers for this order
    const transformers = await TransformerModel.find({ orderId: order._id });

    // Update each transformer's assignment map
    const updatePromises = transformers.map(t => {
      if (!t.assignments) t.assignments = {};
      t.assignments[`${stage}_tester`] = testerName;
      return t.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Reassigned ${stage} stage to ${testerName}`,
      order
    });

  } catch (error) {
    console.error("Reassignment Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Routes for Orders
// Middleware to handle multer/cloudinary errors gracefully
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

app.post('/api/create-order', handleUpload, createOrder);
app.put('/api/orders/:orderId/approve', approveOrder);
app.put('/api/orders/:orderId/reassign', reassignTester); // New Reassign Route
app.put('/api/orders/:orderId', updateOrder); // Generic Update Route
app.delete('/api/orders/:orderId', isAuthenticated, deleteOrder); // Delete order with Cloudinary cleanup

// POST /api/orders/:orderId/update-timer
// Handles start, pause, complete actions for order-level core testing timer
app.post('/api/orders/:orderId/update-timer', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, coreType } = req.body; // coreType: 'metering', 'protection', 'ps'

    if (!action || !coreType) {
      return res.status(400).json({ success: false, message: "action and coreType are required" });
    }

    const { OrderModel } = require('./models/OrderModel');
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.stageTracking) order.stageTracking = {};
    if (!order.stageTracking.core) order.stageTracking.core = {};
    if (!order.stageTracking.core[coreType]) {
      order.stageTracking.core[coreType] = {
        accumulatedTimeMs: 0,
        status: "Pending",
        isAcknowledged: false
      };
    }

    const stageData = order.stageTracking.core[coreType];

    if (action === 'start') {
      // Allocate time if not already set using dynamic database value
      if (!stageData.allocatedMinutes) {
        const { SettingsModel } = require('./models/SettingsModel');
        let timeSetting = await SettingsModel.findOne({ key: 'core_core_minutes' });
        if (!timeSetting) {
          timeSetting = await SettingsModel.create({ key: 'core_core_minutes', value: 3 });
        }
        
        // Calculate total number of cores of this specific type for the whole order
        const coresPerTransformer = (order.coreDetails || []).filter(
          (core) => (core.coreType || core.type).toLowerCase() === coreType.toLowerCase()
        ).length || 1;
        const totalRowsNeeded = (order.quantity || 1) * coresPerTransformer;
        
        stageData.allocatedMinutes = totalRowsNeeded * parseInt(timeSetting.value, 10);
      }

      if (stageData.status !== 'In Progress') {
        stageData.status = 'In Progress';
        stageData.startTime = new Date();
        if (stageData.accumulatedTimeMs === undefined) {
          stageData.accumulatedTimeMs = 0;
        }
      }
    } else if (action === 'pause') {
      if (stageData.status === 'In Progress' && stageData.startTime) {
        const elapsedMs = new Date() - new Date(stageData.startTime);
        stageData.accumulatedTimeMs = (stageData.accumulatedTimeMs || 0) + elapsedMs;
        stageData.status = 'Paused';
        stageData.startTime = null;
      }
    } else if (action === 'complete') {
      if (stageData.status === 'In Progress' && stageData.startTime) {
        const elapsedMs = new Date() - new Date(stageData.startTime);
        stageData.accumulatedTimeMs = (stageData.accumulatedTimeMs || 0) + elapsedMs;
      }
      stageData.status = 'Completed';
      stageData.startTime = null;
    }

    // Save changes
    await OrderModel.findByIdAndUpdate(orderId, { stageTracking: order.stageTracking });

    res.json({
      success: true,
      data: {
        startTime: stageData.startTime,
        accumulatedTimeMs: stageData.accumulatedTimeMs,
        allocatedMinutes: stageData.allocatedMinutes,
        status: stageData.status
      }
    });

  } catch (error) {
    console.error("Error updating order timer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const mongoose = require('mongoose');
    let order = null;

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await OrderModel.findById(orderId);
    }

    if (!order) {
      order = await OrderModel.findOne({ jobId: orderId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Fetch Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

//add the dummy data of the customers 
app.get('/addCustomers', async (req, res) => {
  let tempCustomers = [
    {
      name: "Advent Engineers",
      address: "MIDC Bhosari, Pune, Maharashtra",
      gstNo: "27ABCDE1234F1Z5",
      contactPerson: "Mr. Shubham Chitte",
      contactNumber: "9876543210",
      email: "info@adventengineers.com",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "PowerTech Solutions",
      address: "Andheri East, Mumbai, Maharashtra",
      gstNo: "27PQRSX5678L1Z2",
      contactPerson: "Mr. Ramesh Patil",
      contactNumber: "9123456789",
      email: "sales@powertechsolutions.in",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "ElectroCore Industries",
      address: "Peenya Industrial Area, Bengaluru, Karnataka",
      gstNo: "29LMNOP4321A1Z9",
      contactPerson: "Ms. Anjali Rao",
      contactNumber: "9988776655",
      email: "contact@electrocore.in",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "GridMax Utilities",
      address: "Industrial Area Phase 2, Chandigarh",
      gstNo: "04ABCDE9876F1Z3",
      contactPerson: "Mr. Amit Sharma",
      contactNumber: "9012345678",
      email: "support@gridmaxutilities.com",
      status: "INACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]


  tempCustomers.forEach((item) => {
    let newCustomer = new CustomerModel({
      name: item.name,
      address: item.address,
      gstNo: item.gstNo,
      contactPerson: item.contactPerson,
      contactNumber: item.contactNumber,
      email: item.email,
      status: item.status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    newCustomer.save();
  });

  res.send("Done");

})


// add the dummy data of orders
app.get('/addOrders', async (req, res) => {
  try {
    // let tempOrders = [
    //   {
    //     "jobId": "JOB-2026-021",
    //     "clientName": "Reliance Infrastructure",
    //     "clientContactNo": "+91-9876543210",
    //     "transformerName": "Outdoor CT 33kV",
    //     "transformerType": "CT",
    //     "quantity": 3,
    //     "ratio": ["400/1", "800/1"],
    //     "noOfCores": 2,
    //     "coreDetails": [{ "coreType": "Metering" }, { "coreType": "Protection" }],
    //     "nominalSystemVoltage": 33,
    //     "burden": 30,
    //     "accuracyClass": "0.5S/5P20",
    //     "deadline": "2026-03-10T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "John Doe",
    //       "secondary_tester": "Alice Smith",
    //       "primary_tester": "Bob Johnson",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "core",
    //     "completionStages": { "core": false, "secondary": false, "primary": false, "final": false },
    //     "isApproved": true,
    //     "status": "Core Testing In Progress",
    //     "priority": "High",
    //     "ratedPrimaryCurrent": 800,
    //     "ratedSecondaryCurrent": 1,
    //     "mountingDetails": "Structure Mounted",
    //     "overallDimension": "800x600x1200mm",
    //     "isStandard": "Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-022",
    //     "clientName": "Tata Power",
    //     "clientContactNo": "+91-9922334455",
    //     "transformerName": "Indoor PT 11kV",
    //     "transformerType": "PT",
    //     "quantity": 2,
    //     "ratio": ["11000/110"],
    //     "noOfCores": 1,
    //     "coreDetails": [{ "coreType": "Metering" }],
    //     "nominalSystemVoltage": 11,
    //     "burden": 100,
    //     "accuracyClass": "1.0",
    //     "deadline": "2026-04-15T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "Jane Wilson",
    //       "secondary_tester": "Alice Smith",
    //       "primary_tester": "David Miller",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "core",
    //     "completionStages": { "core": false, "secondary": false, "primary": false, "final": false },
    //     "isApproved": false,
    //     "status": "Pending Approval",
    //     "priority": "Medium",
    //     "ratedPrimaryCurrent": 0,
    //     "ratedSecondaryCurrent": 0,
    //     "mountingDetails": "Panel Mounted",
    //     "overallDimension": "400x400x500mm",
    //     "isStandard": "Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-023",
    //     "clientName": "Adani Electricity",
    //     "clientContactNo": "+91-8877665544",
    //     "transformerName": "PS Class CT",
    //     "transformerType": "CT",
    //     "quantity": 5,
    //     "ratio": ["2000/1"],
    //     "noOfCores": 3,
    //     "coreDetails": [{ "coreType": "Metering" }, { "coreType": "Protection" }, { "coreType": "PS" }],
    //     "nominalSystemVoltage": 0.66,
    //     "burden": 15,
    //     "accuracyClass": "0.5/5P10/PX",
    //     "deadline": "2026-02-28T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "John Doe",
    //       "secondary_tester": "Sam Adams",
    //       "primary_tester": "Bob Johnson",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "secondary",
    //     "completionStages": { "core": true, "secondary": false, "primary": false, "final": false },
    //     "isApproved": true,
    //     "status": "Core Testing Completed",
    //     "priority": "High",
    //     "ratedPrimaryCurrent": 2000,
    //     "ratedSecondaryCurrent": 1,
    //     "mountingDetails": "Busbar Mounted",
    //     "overallDimension": "300x300x200mm",
    //     "isStandard": "Non-Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-014",
    //     "clientName": "L&T Construction",
    //     "clientContactNo": "+91-7788990011",
    //     "transformerName": "Ring Type CT",
    //     "transformerType": "CT",
    //     "quantity": 10,
    //     "ratio": ["1000/5"],
    //     "noOfCores": 1,
    //     "coreDetails": [{ "coreType": "Protection" }],
    //     "nominalSystemVoltage": 0.66,
    //     "burden": 20,
    //     "accuracyClass": "5P20",
    //     "deadline": "2026-05-20T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "Jane Wilson",
    //       "secondary_tester": "Alice Smith",
    //       "primary_tester": "David Miller",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "core",
    //     "completionStages": { "core": false, "secondary": false, "primary": false, "final": false },
    //     "isApproved": true,
    //     "status": "Core Testing In Progress",
    //     "priority": "Low",
    //     "ratedPrimaryCurrent": 1000,
    //     "ratedSecondaryCurrent": 5,
    //     "mountingDetails": "Indoor Case",
    //     "overallDimension": "200x200x150mm",
    //     "isStandard": "Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-015",
    //     "clientName": "Siemens India",
    //     "clientContactNo": "+91-6655443322",
    //     "transformerName": "Differential CT (PS)",
    //     "transformerType": "CT",
    //     "quantity": 6,
    //     "ratio": ["1200/1"],
    //     "noOfCores": 1,
    //     "coreDetails": [{ "coreType": "PS" }],
    //     "nominalSystemVoltage": 11,
    //     "burden": 0,
    //     "accuracyClass": "PX",
    //     "deadline": "2026-03-05T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "John Doe",
    //       "secondary_tester": "Sam Adams",
    //       "primary_tester": "Bob Johnson",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "primary",
    //     "completionStages": { "core": true, "secondary": true, "primary": false, "final": false },
    //     "isApproved": true,
    //     "status": "In Progress",
    //     "priority": "High",
    //     "ratedPrimaryCurrent": 1200,
    //     "ratedSecondaryCurrent": 1,
    //     "mountingDetails": "Bushing Mounted",
    //     "overallDimension": "450x450x300mm",
    //     "isStandard": "Non-Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-016",
    //     "clientName": "ABB Limited",
    //     "clientContactNo": "+91-5544332211",
    //     "transformerName": "Cast Resin PT",
    //     "transformerType": "PT",
    //     "quantity": 4,
    //     "ratio": ["33000/110/110"],
    //     "noOfCores": 2,
    //     "coreDetails": [{ "coreType": "Metering" }, { "coreType": "Metering" }],
    //     "nominalSystemVoltage": 33,
    //     "burden": 150,
    //     "accuracyClass": "0.2/0.5",
    //     "deadline": "2026-06-12T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "Jane Wilson",
    //       "secondary_tester": "Alice Smith",
    //       "primary_tester": "David Miller",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "core",
    //     "completionStages": { "core": false, "secondary": false, "primary": false, "final": false },
    //     "isApproved": true,
    //     "status": "Pending Approval",
    //     "priority": "Medium",
    //     "ratedPrimaryCurrent": 0,
    //     "ratedSecondaryCurrent": 0,
    //     "mountingDetails": "Outdoor Post",
    //     "overallDimension": "900x700x1100mm",
    //     "isStandard": "Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-017",
    //     "clientName": "BHEL",
    //     "clientContactNo": "+91-4433221100",
    //     "transformerName": "Multi-Ratio CT",
    //     "transformerType": "CT",
    //     "quantity": 8,
    //     "ratio": ["500-1000/5"],
    //     "noOfCores": 2,
    //     "coreDetails": [{ "coreType": "Metering" }, { "coreType": "Protection" }],
    //     "nominalSystemVoltage": 0.66,
    //     "burden": 15,
    //     "accuracyClass": "0.5S/5P15",
    //     "deadline": "2026-03-25T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "John Doe",
    //       "secondary_tester": "Sam Adams",
    //       "primary_tester": "Bob Johnson",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "final",
    //     "completionStages": { "core": true, "secondary": true, "primary": true, "final": false },
    //     "isApproved": true,
    //     "status": "In Progress",
    //     "priority": "High",
    //     "ratedPrimaryCurrent": 1000,
    //     "ratedSecondaryCurrent": 5,
    //     "mountingDetails": "Vertical Busbar",
    //     "overallDimension": "250x250x180mm",
    //     "isStandard": "Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-018",
    //     "clientName": "Schneider Electric",
    //     "clientContactNo": "+91-3322110099",
    //     "transformerName": "Control PT",
    //     "transformerType": "PT",
    //     "quantity": 15,
    //     "ratio": ["415/110"],
    //     "noOfCores": 1,
    //     "coreDetails": [{ "coreType": "Metering" }],
    //     "nominalSystemVoltage": 0.415,
    //     "burden": 25,
    //     "accuracyClass": "1.0",
    //     "deadline": "2026-04-01T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "Jane Wilson",
    //       "secondary_tester": "Alice Smith",
    //       "primary_tester": "David Miller",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "completed",
    //     "completionStages": { "core": true, "secondary": true, "primary": true, "final": true },
    //     "isApproved": true,
    //     "status": "Completed",
    //     "priority": "Low",
    //     "ratedPrimaryCurrent": 0,
    //     "ratedSecondaryCurrent": 0,
    //     "mountingDetails": "DIN Rail",
    //     "overallDimension": "150x150x120mm",
    //     "isStandard": "Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-019",
    //     "clientName": "KEC International",
    //     "clientContactNo": "+91-2211009988",
    //     "transformerName": "Summation CT",
    //     "transformerType": "CT",
    //     "quantity": 3,
    //     "ratio": ["5+5/5"],
    //     "noOfCores": 1,
    //     "coreDetails": [{ "coreType": "Metering" }],
    //     "nominalSystemVoltage": 0.66,
    //     "burden": 10,
    //     "accuracyClass": "0.5",
    //     "deadline": "2026-03-15T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "John Doe",
    //       "secondary_tester": "Sam Adams",
    //       "primary_tester": "Bob Johnson",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "core",
    //     "completionStages": { "core": false, "secondary": false, "primary": false, "final": false },
    //     "isApproved": true,
    //     "status": "Core Testing In Progress",
    //     "priority": "Medium",
    //     "ratedPrimaryCurrent": 5,
    //     "ratedSecondaryCurrent": 5,
    //     "mountingDetails": "Panel Internal",
    //     "overallDimension": "180x180x100mm",
    //     "isStandard": "Non-Standard"
    //   },
    //   {
    //     "jobId": "JOB-2026-020",
    //     "clientName": "MSETCL",
    //     "clientContactNo": "+91-1100998877",
    //     "transformerName": "Dead Tank CT",
    //     "transformerType": "CT",
    //     "quantity": 1,
    //     "ratio": ["1200/1"],
    //     "noOfCores": 5,
    //     "coreDetails": [
    //       { "coreType": "Metering" },
    //       { "coreType": "Protection" },
    //       { "coreType": "Protection" },
    //       { "coreType": "PS" },
    //       { "coreType": "PS" }
    //     ],
    //     "nominalSystemVoltage": 132,
    //     "burden": 30,
    //     "accuracyClass": "0.2S/5P20/PX",
    //     "deadline": "2026-05-30T00:00:00.000Z",
    //     "assignments": {
    //       "core_tester": "Jane Wilson",
    //       "secondary_tester": "Alice Smith",
    //       "primary_tester": "David Miller",
    //       "final_tester": "Charlie Brown"
    //     },
    //     "currentStage": "core",
    //     "completionStages": { "core": false, "secondary": false, "primary": false, "final": false },
    //     "isApproved": true,
    //     "status": "Pending Approval",
    //     "priority": "High",
    //     "ratedPrimaryCurrent": 1200,
    //     "ratedSecondaryCurrent": 1,
    //     "mountingDetails": "Outdoor Foundation",
    //     "overallDimension": "1200x1200x2500mm",
    //     "isStandard": "Non-Standard"
    //   }
    // ];

    let tempOrders = [
      {

        jobId: "JOB-2026-031",
        clientName: "Tata Power",
        clientContactNo: "9876543210",
        transformerName: "CT-200A",
        transformerType: "CT",
        quantity: 50,
        ratio: ["200/1", "400/1"],
        noOfCores: 2,
        coreDetails: [{ coreType: "Metering" }, { coreType: "Protection" }],
        deadline: "2026-03-10T00:00:00.000Z",
        nominalSystemVoltage: 132,
        burden: 30,
        accuracyClass: "0.2S/5P20/PX",
        assignments: [
          { testerName: "Rahul Sharma", stage: "core", unitRange: { from: 1, to: 25 } },
          { testerName: "Pranav Godse", stage: "core", unitRange: { from: 26, to: 50 } },
          { testerName: "Rahul Sharma", stage: "core", unitRange: { from: 1, to: 50 } },
          { testerName: "Amit Verma", stage: "secondary", unitRange: { from: 1, to: 50 } },
          { testerName: "Neha Patil", stage: "primary", unitRange: { from: 1, to: 25 } },
          { testerName: "Sai Ghumare", stage: "primary", unitRange: { from: 26, to: 50 } },
          { testerName: "Suresh Kulkarni", stage: "final", unitRange: { from: 1, to: 50 } },
          { testerName: "YD", stage: "final", unitRange: { from: 1, to: 30 } },
          { testerName: "Suresh Kulkarni", stage: "final", unitRange: { from: 31, to: 50 } }
        ],
        currentStage: "core",
        isApproved: true,
        ratedPrimaryCurrent: 200,
        ratedSecondaryCurrent: 1,
        mountingDetails: "Panel Mounted",
        overallDimension: "250x180x120 mm",
        isStandard: "Yes",
        status: "Pending Approval",
        completionStages: { "core": false, "secondary": false, "primary": false, "final": false },
      },

      {
        status: "Pending Approval",
        jobId: "JOB-2026-032",
        clientName: "Mahavitaran",
        clientContactNo: "9123456780",
        transformerName: "CT-400A",
        transformerType: "CT",
        quantity: 30,
        ratio: ["400/1"],
        noOfCores: 1,
        coreDetails: [{ coreType: "Metering" }],
        deadline: "2026-03-10T00:00:00.000Z",
        nominalSystemVoltage: 132,
        burden: 30,
        accuracyClass: "0.2S/5P20/PX",
        assignments: [
          { testerName: "Rohit Deshmukh", stage: "core", unitRange: { from: 1, to: 10 } },
          { testerName: "Pranav Godse", stage: "core", unitRange: { from: 11, to: 30 } },
          { testerName: "Pooja Joshi", stage: "secondary", unitRange: { from: 1, to: 15 } },
          { testerName: "Tejas Demse", stage: "secondary", unitRange: { from: 16, to: 30 } },
          { testerName: "Amit Verma", stage: "primary", unitRange: { from: 1, to: 15 } },
          { testerName: "Sai Ghumare", stage: "primary", unitRange: { from: 16, to: 30 } },
          { testerName: "Neha Patil", stage: "final", unitRange: { from: 1, to: 20 } },
          { testerName: "YD", stage: "final", unitRange: { from: 21, to: 30 } },
        ],
        currentStage: "secondary",
        isApproved: true,
        ratedPrimaryCurrent: 400,
        ratedSecondaryCurrent: 1,
        mountingDetails: "Busbar Mounted",
        overallDimension: "300x200x150 mm",
        isStandard: "Yes",
        completionStages: { "core": false, "secondary": false, "primary": false, "final": false },
      },

      {
        status: "Pending Approval",
        jobId: "JOB-2026-033",
        clientName: "L&T Electricals",
        clientContactNo: "9988776655",
        transformerName: "PT-11KV",
        transformerType: "PT",
        quantity: 20,
        ratio: ["11000/110"],
        noOfCores: 1,
        coreDetails: [{ coreType: "Protection" }],
        deadline: "2026-03-10T00:00:00.000Z",
        nominalSystemVoltage: 132,
        burden: 30,
        accuracyClass: "0.2S/5P20/PX",
        assignments: [
          { testerName: "Kunal Mehta", stage: "core", unitRange: { from: 1, to: 10 } },
          { testerName: "Pranav Godse", stage: "core", unitRange: { from: 11, to: 20 } },
          { testerName: "Rahul Sharma", stage: "secondary", unitRange: { from: 1, to: 10 } },
          { testerName: "Pooja Joshi", stage: "primary", unitRange: { from: 1, to: 20 } },
          { testerName: "Tejas Demse", stage: "secondary", unitRange: { from: 11, to: 20 } },
          { testerName: "Suresh Kulkarni", stage: "final", unitRange: { from: 1, to: 20 } }
        ],
        currentStage: "primary",
        isApproved: true,
        ratedPrimaryCurrent: 11000,
        ratedSecondaryCurrent: 110,
        mountingDetails: "Floor Mounted",
        overallDimension: "400x300x250 mm",
        isStandard: "No",
        completionStages: { "core": false, "secondary": false, "primary": false, "final": false },
      },

      {
        status: "Pending Approval",
        jobId: "JOB-2026-034",
        clientName: "Reliance Energy",
        clientContactNo: "9001122334",
        transformerName: "CT-800A",
        transformerType: "CT",
        quantity: 40,
        ratio: ["800/1"],
        noOfCores: 2,
        coreDetails: [{ coreType: "Protection" }, { coreType: "PS" }],
        deadline: "2026-03-10T00:00:00.000Z",
        nominalSystemVoltage: 132,
        burden: 30,
        accuracyClass: "0.2S/5P20/PX",
        assignments: [
          { testerName: "Amit Verma", stage: "core", unitRange: { from: 1, to: 20 } },
          { testerName: "Pranav Godse", stage: "core", unitRange: { from: 21, to: 40 } },
          { testerName: "Tejas Demse", stage: "secondary", unitRange: { from: 1, to: 20 } },
          { testerName: "Neha Patil", stage: "secondary", unitRange: { from: 21, to: 40 } },
          { testerName: "Kunal Mehta", stage: "primary", unitRange: { from: 1, to: 40 } },
          { testerName: "Rahul Sharma", stage: "final", unitRange: { from: 1, to: 40 } }
        ],
        currentStage: "final",
        isApproved: true,
        ratedPrimaryCurrent: 800,
        ratedSecondaryCurrent: 1,
        mountingDetails: "Panel Mounted",
        overallDimension: "350x250x180 mm",
        isStandard: "Yes",
        completionStages: { "core": false, "secondary": false, "primary": false, "final": false },
      },

      {
        status: "Pending Approval",
        jobId: "JOB-2026-035",
        clientName: "Adani Power",
        clientContactNo: "9112233445",
        transformerName: "CT-1000A",
        transformerType: "CT",
        quantity: 25,
        ratio: ["1000/1"],
        noOfCores: 1,
        coreDetails: [{ coreType: "PS" }],
        deadline: "2026-03-10T00:00:00.000Z",
        nominalSystemVoltage: 132,
        burden: 30,
        accuracyClass: "0.2S/5P20/PX",
        assignments: [
          { testerName: "Suresh Kulkarni", stage: "core", unitRange: { from: 1, to: 25 } },
          { testerName: "Rohit Deshmukh", stage: "secondary", unitRange: { from: 1, to: 14 } },
          { testerName: "Tejas Demse", stage: "secondary", unitRange: { from: 15, to: 25 } },
          { testerName: "Amit Verma", stage: "primary", unitRange: { from: 1, to: 25 } },
          { testerName: "Neha Patil", stage: "final", unitRange: { from: 1, to: 25 } }
        ],
        currentStage: "completed",
        isApproved: true,
        ratedPrimaryCurrent: 1000,
        ratedSecondaryCurrent: 1,
        mountingDetails: "Outdoor Mounted",
        overallDimension: "450x320x260 mm",
        isStandard: "No",
        completionStages: { "core": false, "secondary": false, "primary": false, "final": false }
      }
    ];



    for (const item of tempOrders) {
      let newOrder = new OrderModel(item);
      await newOrder.save();
    }

    res.send("Orders Added Successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding orders");
  }
});


// add the dummy data of the users
app.get('/addUsers', async (req, res) => {
  try {
    // let tempUsers = [
    //   {
    //     "employeeId": "EMP-1001",
    //     "fullName": "Amit Kulkarni",
    //     "mobileNumber": "9876543211",
    //     "emailId": "amit.kulkarni@transformer.com",
    //     "designation": "Admin",
    //     "department": "Core Test",
    //     "dateOfJoining": "2022-04-12",
    //     "employmentType": "Permanent",
    //     "transformerSkills": {
    //       "canTestCT": true,
    //       "canTestPT": true
    //     },
    //     "testCapabilities": {
    //       "ratioTest": true,
    //       "polarityTest": true,
    //       "burdenTest": true,
    //       "accuracyTest": true,
    //       "excitationTest": true,
    //       "insulationResistanceTest": true,
    //       "tanDeltaTest": true
    //     },
    //     "voltageExperience": [11, 33, 66, 132],
    //     "assignedLab": "Core Testing Lab",
    //     "activeStatus": true,
    //     "password": "password123"
    //   },
    //   {
    //     "employeeId": "EMP-1002",
    //     "fullName": "Rohit Patil",
    //     "mobileNumber": "9876543212",
    //     "emailId": "rohit.patil@transformer.com",
    //     "designation": "Testing",
    //     "department": "After Secondary Test",
    //     "dateOfJoining": "2023-01-20",
    //     "employmentType": "Permanent",
    //     "transformerSkills": {
    //       "canTestCT": true,
    //       "canTestPT": false
    //     },
    //     "testCapabilities": {
    //       "ratioTest": true,
    //       "polarityTest": true,
    //       "burdenTest": true,
    //       "accuracyTest": false,
    //       "excitationTest": true,
    //       "insulationResistanceTest": true
    //     },
    //     "voltageExperience": [11, 33],
    //     "assignedLab": "Secondary Testing Lab",
    //     "activeStatus": true,
    //     "password": "password123"
    //   },
    //   {
    //     "employeeId": "EMP-1003",
    //     "fullName": "Sneha Deshmukh",
    //     "mobileNumber": "9876543213",
    //     "emailId": "sneha.deshmukh@transformer.com",
    //     "designation": "Entry Level",
    //     "department": "After Primary Test",
    //     "dateOfJoining": "2024-06-10",
    //     "employmentType": "Trainee",
    //     "transformerSkills": {
    //       "canTestCT": true,
    //       "canTestPT": false
    //     },
    //     "testCapabilities": {
    //       "ratioTest": true,
    //       "polarityTest": false,
    //       "burdenTest": false,
    //       "accuracyTest": false,
    //       "excitationTest": true,
    //       "insulationResistanceTest": false
    //     },
    //     "voltageExperience": [11],
    //     "assignedLab": "Primary Testing Lab",
    //     "activeStatus": true,
    //     "password": "password123"
    //   },
    //   {
    //     "employeeId": "EMP-1004",
    //     "fullName": "Vikas Jadhav",
    //     "mobileNumber": "9876543214",
    //     "emailId": "vikas.jadhav@transformer.com",
    //     "designation": "Testing",
    //     "department": "Final Test",
    //     "dateOfJoining": "2021-09-18",
    //     "employmentType": "Permanent",
    //     "transformerSkills": {
    //       "canTestCT": true,
    //       "canTestPT": true
    //     },
    //     "testCapabilities": {
    //       "ratioTest": true,
    //       "polarityTest": true,
    //       "burdenTest": true,
    //       "accuracyTest": true,
    //       "excitationTest": true,
    //       "insulationResistanceTest": true,
    //       "tanDeltaTest": true
    //     },
    //     "voltageExperience": [11, 33, 66],
    //     "assignedLab": "Final Testing Lab",
    //     "activeStatus": true,
    //     "password": "password123"
    //   },
    //   {
    //     "employeeId": "EMP-1005",
    //     "fullName": "Neha More",
    //     "mobileNumber": "9876543215",
    //     "emailId": "neha.more@transformer.com",
    //     "designation": "Entry Level",
    //     "department": "Core Test",
    //     "dateOfJoining": "2024-02-05",
    //     "employmentType": "Contract",
    //     "transformerSkills": {
    //       "canTestCT": false,
    //       "canTestPT": false
    //     },
    //     "testCapabilities": {
    //       "ratioTest": false,
    //       "polarityTest": false,
    //       "burdenTest": false,
    //       "accuracyTest": false,
    //       "excitationTest": false,
    //       "insulationResistanceTest": true
    //     },
    //     "voltageExperience": [],
    //     "assignedLab": "Core Assembly Area",
    //     "activeStatus": true,
    //     "password": "password123"
    //   },
    //   {
    //     "employeeId": "EMP-1006",
    //     "fullName": "Suresh Pawar",
    //     "mobileNumber": "9876543216",
    //     "emailId": "suresh.pawar@transformer.com",
    //     "designation": "Admin",
    //     "department": "Final Test",
    //     "dateOfJoining": "2020-11-01",
    //     "employmentType": "Permanent",
    //     "transformerSkills": {
    //       "canTestCT": true,
    //       "canTestPT": true
    //     },
    //     "testCapabilities": {
    //       "ratioTest": true,
    //       "polarityTest": true,
    //       "burdenTest": true,
    //       "accuracyTest": true,
    //       "excitationTest": true,
    //       "insulationResistanceTest": true,
    //       "tanDeltaTest": true
    //     },
    //     "voltageExperience": [11, 33, 66, 132],
    //     "assignedLab": "Quality & Final Approval",
    //     "activeStatus": true,
    //     "password": "password123"
    //   }
    // ];

    let tempUsers = [
      {
        "employeeId": "EMP-6001",
        "fullName": "Rahul Sharma",
        "mobileNumber": "9822002201",
        "designation": "Testing",
        "department": "Core Test",
        "dateOfJoining": "2025-01-10T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": false },
        "activeStatus": true,
        "password": "password123"
      },
      {
        "employeeId": "EMP-6002",
        "password": "password123",
        "fullName": "Rajesh Kumar",
        "mobileNumber": "9822002202",
        "designation": "Testing",
        "department": "Core Test",
        "dateOfJoining": "2025-03-15T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-6003",
        "fullName": "Amit Patel",
        "password": "password123",
        "mobileNumber": "9822002203",
        "designation": "Testing",
        "department": "Core Test",
        "dateOfJoining": "2026-01-05T09:00:00.000Z",
        "employmentType": "Trainee",
        "transformerSkills": { "canTestCT": true, "canTestPT": false },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-3001",
        "fullName": "Vikram Singh",
        "mobileNumber": "9822003301",
        "password": "password123",
        "designation": "Testing",
        "department": "Secondary Test",
        "dateOfJoining": "2024-11-20T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-3002",
        "fullName": "Suresh Raina",
        "mobileNumber": "9822003302",
        "password": "password123",
        "designation": "Testing",
        "department": "Secondary Test",
        "dateOfJoining": "2025-06-12T09:00:00.000Z",
        "employmentType": "Contract",
        "transformerSkills": { "canTestCT": true, "canTestPT": false },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-3003",
        "fullName": "Priya Das",
        "mobileNumber": "9822003303",
        "password": "password123",
        "designation": "Testing",
        "department": "Secondary Test",
        "dateOfJoining": "2025-08-01T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-4001",
        "fullName": "Anil Primary",
        "mobileNumber": "9999999995",
        "password": "password123",
        "designation": "Testing",
        "department": "Primary Test",
        "dateOfJoining": "2026-02-01T18:30:23.875Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-4002",
        "fullName": "Karan Johar",
        "mobileNumber": "9822004402",
        "password": "password123",
        "designation": "Testing",
        "department": "Primary Test",
        "dateOfJoining": "2024-05-15T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": false },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-4003",
        "fullName": "Deepak Punia",
        "mobileNumber": "9822004403",
        "designation": "Testing",
        "password": "password123",
        "department": "Primary Test",
        "dateOfJoining": "2025-10-10T09:00:00.000Z",
        "employmentType": "Contract",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-5001",
        "fullName": "Sanjay Dutt",
        "mobileNumber": "9822005501",
        "password": "password123",
        "designation": "Testing",
        "department": "Final Test",
        "dateOfJoining": "2023-12-01T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-5002",
        "fullName": "Rohit Verma",
        "mobileNumber": "9822005502",
        "password": "password123",
        "designation": "Testing",
        "department": "Final Test",
        "dateOfJoining": "2024-02-14T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      },
      {
        "employeeId": "EMP-5003",
        "fullName": "Neha Sharma",
        "mobileNumber": "9822005503",
        "password": "password123",
        "designation": "Testing",
        "department": "Final Test",
        "dateOfJoining": "2025-01-20T09:00:00.000Z",
        "employmentType": "Permanent",
        "transformerSkills": { "canTestCT": true, "canTestPT": true },
        "activeStatus": true
      }
    ]
    for (const item of tempUsers) {
      // Hash password before saving
      const salt = await bcrypt.genSalt(10);
      item.password = await bcrypt.hash(item.password, salt);
      let newUser = new UserModel(item);
      await newUser.save();
    }

    res.send("Users Added Successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding users");
  }
});


//add dummy data of the metring core test
app.get('/addMetringdata', async (req, res) => {
  try {
    let tempMeteringReading = [
      {
        "orderId": "64f9b0c7f1e7b4a1d3c6e8a9",
        "transformerSerialNo": "TR-2026-001",
        "coreIndex": 1,
        "coreType": "Metering",
        "testSetup": {
          "coreMaterial": "TOROIDAL CORE NANO CRYSTALLINE",
          "coreSizeMm": { "id": 20, "od": 40, "height": 15 },
          "turnsUsed": 25,
          "areaSqCm": 2.5,
          "mmp": 3.5
        },
        "testLimits": {
          "bsatGauss": [1000, 3000, 5000, 7000],
          "setMilliVolt": [93.19, 277.64, 465.96, 652.34],
          "leLimitMa": [17.14, 34.28, 42.86, 56.73]
        },
        "readings": [
          {
            "date": "2026-01-18T10:00:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-01",
            "internalCoreNo": "INT-CORE-001",
            "measuredMa": [9.5, 18.3, 24.7, 30.6],
            "result": "P"
          },
          {
            "date": "2026-01-18T10:30:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-02",
            "internalCoreNo": "INT-CORE-002",
            "measuredMa": [10.0, 19.0, 25.0, 31.0],
            "result": "P"
          },
          {
            "date": "2026-01-18T11:00:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-03",
            "internalCoreNo": "INT-CORE-003",
            "measuredMa": [8.5, 17.5, 23.5, 29.5],
            "result": "F"
          }
        ],
        "testedBy": "John Doe",
        "authorisedBy": "Jane Smith"
      },

      {
        "orderId": "64f9b0c7f1e7b4a1d3c6e8aa",
        "transformerSerialNo": "TR-2026-002",
        "coreIndex": 2,
        "coreType": "Metering",
        "testSetup": {
          "coreMaterial": "TOROIDAL CORE AMORPHOUS",
          "coreSizeMm": { "id": 25, "od": 45, "height": 20 },
          "turnsUsed": 30,
          "areaSqCm": 3.0,
          "mmp": 4.0
        },
        "testLimits": {
          "bsatGauss": [1200, 3200, 5200, 7200],
          "setMilliVolt": [100.00, 300.00, 500.00, 700.00],
          "leLimitMa": [18.00, 36.00, 45.00, 60.00]
        },
        "readings": [
          {
            "date": "2026-01-19T10:00:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-04",
            "internalCoreNo": "INT-CORE-004",
            "measuredMa": [17.0, 34.0, 43.0, 56.5],
            "result": "P"
          },
          {
            "date": "2026-01-19T10:30:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-05",
            "internalCoreNo": "INT-CORE-005",
            "measuredMa": [18.0, 35.0, 44.0, 57.0],
            "result": "P"
          },
          {
            "date": "2026-01-19T11:00:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-06",
            "internalCoreNo": "INT-CORE-006",
            "measuredMa": [19.0, 36.0, 45.0, 58.0],
            "result": "F"
          }
        ],
        "testedBy": "Ravi Kumar",
        "authorisedBy": "Priya Singh"
      },

      {
        "orderId": "64f9b0c7f1e7b4a1d3c6e8ab",
        "transformerSerialNo": "TR-2026-003",
        "coreIndex": 3,
        "coreType": "Metering",
        "testSetup": {
          "coreMaterial": "TOROIDAL CORE SILICON STEEL",
          "coreSizeMm": { "id": 22, "od": 42, "height": 18 },
          "turnsUsed": 28,
          "areaSqCm": 2.8,
          "mmp": 3.8
        },
        "testLimits": {
          "bsatGauss": [1100, 3100, 5100, 7100],
          "setMilliVolt": [95.00, 280.00, 470.00, 660.00],
          "leLimitMa": [17.50, 35.00, 44.00, 58.00]
        },
        "readings": [
          {
            "date": "2026-01-20T10:00:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-07",
            "internalCoreNo": "INT-CORE-007",
            "measuredMa": [18.0, 35.0, 45.0, 60.0],
            "result": "P"
          },
          {
            "date": "2026-01-20T10:30:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-08",
            "internalCoreNo": "INT-CORE-008",
            "measuredMa": [17.5, 34.5, 44.5, 59.0],
            "result": "P"
          },
          {
            "date": "2026-01-20T11:00:00.000Z",
            "vendorCoreNo": "VENDOR-CORE-09",
            "internalCoreNo": "INT-CORE-009",
            "measuredMa": [19.0, 36.5, 46.0, 61.0],
            "result": "F"
          }
        ],
        "testedBy": "Amit Sharma",
        "authorisedBy": "Anjali Verma"
      }
    ];


    for (const item of tempMeteringReading) {
      let newMeteringReading = new MeteringCoreTestModel(item);
      await newMeteringReading.save();
    }

    res.send("MeteringReading Added Successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding MeteringReading");
  }
});


//add dummy data of the Protection core test
app.get('/addProtectiondata', async (req, res) => {
  try {
    let tempProtectionReading = [
      // ================= ORDER 1 =================
      {
        orderId: "65a8f9c2e4b0a12345678901",
        transformerSerialNo: "TR-PS-2026-001",
        coreIndex: 1,
        coreType: "PS",

        testSetup: {
          description: "M4CRGO",
          coreSizeMm: {
            id: 110,
            od: 220,
            height: 280
          },
          turnsUsed: 140,
          areaSqCm: 42.5,
          mmp: 75.3
        },

        testSpecification: {
          fluxTesla: 1.55,
          voltageV: 220,
          iexLimitMa: 90
        },

        readings: [
          {
            date: "2026-01-05T10:00:00.000Z",
            vendorCoreNo: "PS1-V-001",
            internalCoreNo: "PS1-I-001",
            value: 85,
            result: "P"
          },
          {
            date: "2026-01-05T10:30:00.000Z",
            vendorCoreNo: "PS1-V-002",
            internalCoreNo: "PS1-I-002",
            value: 98,
            result: "F"
          }
        ],

        testedBy: "Amit Sharma",
        authorisedBy: "Suresh Kulkarni"
      },

      // ================= ORDER 2 =================
      {
        orderId: "65a8f9c2e4b0a12345678902",
        transformerSerialNo: "TR-PS-2026-002",
        coreIndex: 1,
        coreType: "PS",

        testSetup: {
          description: "M5CRGO",
          coreSizeMm: {
            id: 130,
            od: 260,
            height: 310
          },
          turnsUsed: 165,
          areaSqCm: 50.2,
          mmp: 82.1
        },

        testSpecification: {
          fluxTesla: 1.6,
          voltageV: 230,
          iexLimitMa: 100
        },

        readings: [
          {
            date: "2026-01-08T11:15:00.000Z",
            vendorCoreNo: "PS2-V-001",
            internalCoreNo: "PS2-I-001",
            value: 92,
            result: "P"
          },
          {
            date: "2026-01-08T11:45:00.000Z",
            vendorCoreNo: "PS2-V-002",
            internalCoreNo: "PS2-I-002",
            value: 97,
            result: "P"
          }
        ],

        testedBy: "Neha Verma",
        authorisedBy: "Suresh Kulkarni"
      },

      // ================= ORDER 3 =================
      {
        orderId: "65a8f9c2e4b0a12345678903",
        transformerSerialNo: "TR-PS-2026-003",
        coreIndex: 2,
        coreType: "PS",

        testSetup: {
          description: "M4CRGO",
          coreSizeMm: {
            id: 125,
            od: 250,
            height: 295
          },
          turnsUsed: 155,
          areaSqCm: 48.7,
          mmp: 80.4
        },

        testSpecification: {
          fluxTesla: 1.5,
          voltageV: 215,
          iexLimitMa: 88
        },

        readings: [
          {
            date: "2026-01-12T09:45:00.000Z",
            vendorCoreNo: "PS3-V-001",
            internalCoreNo: "PS3-I-001",
            value: 86,
            result: "P"
          }
        ],

        testedBy: "Rohit Deshmukh",
        authorisedBy: "Anil Patil"
      }
    ];




    for (const item of tempProtectionReading) {
      let newProtectionReading = new ProtectionCoreTestModel(item);
      await newProtectionReading.save();
    }

    res.send("ProtectionReading Added Successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding ProtectionReading");
  }
});

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
app.get("/allorders", async (req, res) => {
  let orders = await OrderModel.find({}).lean();
  res.json(orders);
})






//add dummy data of the transformer 
app.get('/addTransformerReadingData', async (req, res) => {
  try {
    // let TransformerReading = [
    //   // --- JOB-2026-011 (Quantity 3 | Stage: Core) ---
    //   {
    //     "uniqueId": "TR-2026-021-001",
    //     "jobId": "JOB-2026-021",
    //     "orderId": "65bc5555a1b2c3d4e5f61111",
    //     "currentStage": "core",
    //     "testHistory": { "core_test": { "status": "Pending" } }
    //   },
    //   {
    //     "uniqueId": "TR-2026-021-002",
    //     "jobId": "JOB-2026-021",
    //     "orderId": "65bc5555a1b2c3d4e5f61111",
    //     "currentStage": "core",
    //     "testHistory": { "core_test": { "status": "Pending" } }
    //   },
    //   {
    //     "uniqueId": "TR-2026-021-003",
    //     "jobId": "JOB-2026-021",
    //     "orderId": "65bc5555a1b2c3d4e5f61111",
    //     "currentStage": "core",
    //     "testHistory": { "core_test": { "status": "Pending" } }
    //   },

    //   // --- JOB-2026-013 (Quantity 5 | Stage: Secondary) ---
    //   // (Assuming Core Test is finished for this batch)
    //   {
    //     "uniqueId": "TR-2026-023-001",
    //     "jobId": "JOB-2026-023",
    //     "orderId": "65bc7777a1b2c3d4e5f67777",
    //     "currentStage": "secondary",
    //     "testHistory": {
    //       "core_test": { "status": "Completed", "tester": "John Doe", "timestamp": "2026-02-01T10:00:00Z" },
    //       "secondary_test": { "status": "Pending" }
    //     }
    //   },

    //   // --- JOB-2026-015 (Quantity 6 | Stage: Primary) ---
    //   {
    //     "uniqueId": "TR-2026-015-001",
    //     "jobId": "JOB-2026-015",
    //     "orderId": "65bc8888a1b2c3d4e5f68888",
    //     "currentStage": "primary",
    //     "testHistory": {
    //       "core_test": { "status": "Completed" },
    //       "secondary_test": { "status": "Completed" },
    //       "primary_test": { "status": "Pending" }
    //     }
    //   },

    //   // --- JOB-2026-017 (Quantity 8 | Stage: Final) ---
    //   {
    //     "uniqueId": "TR-2026-017-001",
    //     "jobId": "JOB-2026-017",
    //     "orderId": "65bcaaaaa1b2c3d4e5f6aaaa",
    //     "currentStage": "final",
    //     "testHistory": {
    //       "core_test": { "status": "Completed" },
    //       "secondary_test": { "status": "Completed" },
    //       "primary_test": { "status": "Completed" },
    //       "final_test": { "status": "Pending" }
    //     }
    //   },

    //   // --- JOB-2026-018 (Quantity 15 | Stage: Shipped/Completed) ---
    //   {
    //     "uniqueId": "TR-2026-018-001",
    //     "jobId": "JOB-2026-018",
    //     "orderId": "65bcbbbbb1b2c3d4e5f6bbbb",
    //     "currentStage": "shipped",
    //     "testHistory": {
    //       "core_test": { "status": "Completed" },
    //       "secondary_test": { "status": "Completed" },
    //       "primary_test": { "status": "Completed" },
    //       "final_test": { "status": "Completed" }
    //     }
    //   },

    //   // --- JOB-2026-020 (Dead Tank 5-Core | Stage: Core) ---
    //   {
    //     "uniqueId": "TR-2026-020-001",
    //     "jobId": "JOB-2026-020",
    //     "orderId": "65bcddeea1b2c3d4e5f6ddee",
    //     "currentStage": "core",
    //     "testHistory": {
    //       "core_test": {
    //         "status": "Pending",
    //         "metering_results": [],
    //         "protection_results": [],
    //         "ps_results": []
    //       }
    //     }
    //   }
    // ]
    let TransformerReading = [

      // ---------- JOB-2026-031 (CT-200A | Qty: 50 | Stage: Core) ----------
      {
        uniqueId: "TR-JOB-2026-031-001",
        jobId: "JOB-2026-031",
        orderId: "65bc1111a1b2c3d4e5f61111",
        transformerType: "CT",
        transformerName: "CT-200A",
        unitNo: 1,
        currentStage: "core",
        testHistory: {
          core_test: { status: "Pending" }
        }
      },
      {
        uniqueId: "TR-JOB-2026-031-002",
        jobId: "JOB-2026-031",
        orderId: "65bc1111a1b2c3d4e5f61111",
        transformerType: "CT",
        transformerName: "CT-200A",
        unitNo: 2,
        currentStage: "core",
        testHistory: {
          core_test: { status: "Pending" }
        }
      },
      {
        uniqueId: "TR-JOB-2026-031-003",
        jobId: "JOB-2026-031",
        orderId: "65bc1111a1b2c3d4e5f61111",
        transformerType: "CT",
        transformerName: "CT-200A",
        unitNo: 3,
        currentStage: "core",
        testHistory: {
          core_test: { status: "Pending" }
        }
      },

      // ---------- JOB-2026-032 (CT-400A | Qty: 30 | Stage: Secondary) ----------
      {
        uniqueId: "TR-JOB-2026-032-001",
        jobId: "JOB-2026-032",
        orderId: "65bc2222a1b2c3d4e5f62222",
        transformerType: "CT",
        transformerName: "CT-400A",
        unitNo: 1,
        currentStage: "secondary",
        testHistory: {
          core_test: { status: "Completed" },
          secondary_test: { status: "Pending" }
        }
      },
      {
        uniqueId: "TR-JOB-2026-032-002",
        jobId: "JOB-2026-032",
        orderId: "65bc2222a1b2c3d4e5f62222",
        transformerType: "CT",
        transformerName: "CT-400A",
        unitNo: 2,
        currentStage: "secondary",
        testHistory: {
          core_test: { status: "Completed" },
          secondary_test: { status: "Pending" }
        }
      },

      // ---------- JOB-2026-033 (PT-11KV | Qty: 20 | Stage: Primary) ----------
      {
        uniqueId: "TR-JOB-2026-033-001",
        jobId: "JOB-2026-033",
        orderId: "65bc3333a1b2c3d4e5f63333",
        transformerType: "PT",
        transformerName: "PT-11KV",
        unitNo: 1,
        currentStage: "primary",
        testHistory: {
          core_test: { status: "Completed" },
          secondary_test: { status: "Completed" },
          primary_test: { status: "Pending" }
        }
      },

      // ---------- JOB-2026-034 (CT-800A | Qty: 40 | Stage: Final) ----------
      {
        uniqueId: "TR-JOB-2026-034-001",
        jobId: "JOB-2026-034",
        orderId: "65bc4444a1b2c3d4e5f64444",
        transformerType: "CT",
        transformerName: "CT-800A",
        unitNo: 1,
        currentStage: "final",
        testHistory: {
          core_test: { status: "Completed" },
          secondary_test: { status: "Completed" },
          primary_test: { status: "Completed" },
          final_test: { status: "Pending" }
        }
      },

      // ---------- JOB-2026-035 (CT-1000A | Qty: 25 | Completed) ----------
      {
        uniqueId: "TR-JOB-2026-035-001",
        jobId: "JOB-2026-035",
        orderId: "65bc5555a1b2c3d4e5f65555",
        transformerType: "CT",
        transformerName: "CT-1000A",
        unitNo: 1,
        currentStage: "shipped",
        testHistory: {
          core_test: { status: "Completed" },
          secondary_test: { status: "Completed" },
          primary_test: { status: "Completed" },
          final_test: { status: "Completed" }
        }
      }
    ];




    for (const item of TransformerReading) {
      let newTransformerReading = new TransformerModel(item);
      await newTransformerReading.save();
    }

    res.send("Transformer Reading Added Successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding Transformer Reading");
  }
});

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
