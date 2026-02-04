require("dotenv").config();


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');




const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;



const { CustomerModel } = require("./models/CustomerModel");
const { OrderModel } = require('./models/OrderModel');
const { UserModel } = require('./models/UserModel');
const { MeteringCoreTestModel } = require("./models/MeteringCoreTestModel");
const { ProtectionCoreTestModel } = require("./models/ProtectionCoreTestModel");
const { TransformerModel } = require("./models/TransformerModel");
const { SecondaryMeteringTestModel } = require("./models/SecondaryMeteringTestModel");
// const VerifyUser = require('./middlewares/VeriifyUser');
// const UsersModel = require("./model/UsersModel");
const { CounterModel } = require("./models/CounterModel");


const app = express();


mongoose
  .connect(uri)
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));

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
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

app.use(express.json());

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
app.use('/auth', authRoutes);
app.use('/api', taskRoutes); // Mounted at /api
app.use('/api', meteringTestRoutes); // Mounted at /api/metering-tests
app.use('/api', protectionTestRoutes); // Mounted at /api/protection-tests
app.use('/api/core-tests', require('./routes/coreTestRoutes')); // New Generic Route for Approval
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



// 2. Method: Create Order (Operator Level)
const createOrder = async (req, res) => {
  try {
    // 1. Generate the Job ID
    const jobSeq = await getNextSequenceValue("job_sequence");
    const currentYear = new Date().getFullYear();
    const jobId = `JOB-${currentYear}-${jobSeq.toString().padStart(3, '0')}`;

    // 2. Create Order with "Pending Approval" status
    const newOrder = new OrderModel({
      ...req.body,
      jobId: jobId,
      isApproved: false,
      isRead: false,
      status: "Pending Approval"
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order submitted to Admin for approval.",
      jobId: savedOrder.jobId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    // 2. Generate Transformers with Combined IDs
    const transformerRecords = [];

    for (let i = 1; i <= order.quantity; i++) {
      // Build ID: jobId + "/" + index (e.g., JOB-2026-001/01)
      const unitId = `${order.jobId}/${i.toString().padStart(2, '0')}`;

      transformerRecords.push({
        orderId: order._id,
        jobId: order.jobId,
        uniqueId: unitId, // THE COMBINATION ID
        currentStage: "core",
        testHistory: {
          core_test: { status: "Pending" },
          secondary_test: { status: "Pending" },
          primary_test: { status: "Pending" },
          final_test: { status: "Pending" }
        }
      });
    }

    await TransformerModel.insertMany(transformerRecords);

    res.status(200).json({
      success: true,
      message: `Approved. ${order.quantity} units generated for ${order.jobId}.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Method: Get Pending Notifications (Admin View)
const getAdminNotifications = async (req, res) => {
  try {
    const pendingOrders = await OrderModel.find({ isApproved: false })
      .select("jobId clientName quantity createdAt")
      .sort({ createdAt: -1 });

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
      });

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

    let tempOrders=[
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
    deadline:"2026-03-10T00:00:00.000Z",
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
    let tempUsers = [
      {
        "employeeId": "EMP-1001",
        "fullName": "Amit Kulkarni",
        "mobileNumber": "9876543211",
        "emailId": "amit.kulkarni@transformer.com",
        "designation": "Admin",
        "department": "Core Test",
        "dateOfJoining": "2022-04-12",
        "employmentType": "Permanent",
        "transformerSkills": {
          "canTestCT": true,
          "canTestPT": true
        },
        "testCapabilities": {
          "ratioTest": true,
          "polarityTest": true,
          "burdenTest": true,
          "accuracyTest": true,
          "excitationTest": true,
          "insulationResistanceTest": true,
          "tanDeltaTest": true
        },
        "voltageExperience": [11, 33, 66, 132],
        "assignedLab": "Core Testing Lab",
        "activeStatus": true,
        "password": "password123"
      },
      {
        "employeeId": "EMP-1002",
        "fullName": "Rohit Patil",
        "mobileNumber": "9876543212",
        "emailId": "rohit.patil@transformer.com",
        "designation": "Testing",
        "department": "After Secondary Test",
        "dateOfJoining": "2023-01-20",
        "employmentType": "Permanent",
        "transformerSkills": {
          "canTestCT": true,
          "canTestPT": false
        },
        "testCapabilities": {
          "ratioTest": true,
          "polarityTest": true,
          "burdenTest": true,
          "accuracyTest": false,
          "excitationTest": true,
          "insulationResistanceTest": true
        },
        "voltageExperience": [11, 33],
        "assignedLab": "Secondary Testing Lab",
        "activeStatus": true,
        "password": "password123"
      },
      {
        "employeeId": "EMP-1003",
        "fullName": "Sneha Deshmukh",
        "mobileNumber": "9876543213",
        "emailId": "sneha.deshmukh@transformer.com",
        "designation": "Entry Level",
        "department": "After Primary Test",
        "dateOfJoining": "2024-06-10",
        "employmentType": "Trainee",
        "transformerSkills": {
          "canTestCT": true,
          "canTestPT": false
        },
        "testCapabilities": {
          "ratioTest": true,
          "polarityTest": false,
          "burdenTest": false,
          "accuracyTest": false,
          "excitationTest": true,
          "insulationResistanceTest": false
        },
        "voltageExperience": [11],
        "assignedLab": "Primary Testing Lab",
        "activeStatus": true,
        "password": "password123"
      },
      {
        "employeeId": "EMP-1004",
        "fullName": "Vikas Jadhav",
        "mobileNumber": "9876543214",
        "emailId": "vikas.jadhav@transformer.com",
        "designation": "Testing",
        "department": "Final Test",
        "dateOfJoining": "2021-09-18",
        "employmentType": "Permanent",
        "transformerSkills": {
          "canTestCT": true,
          "canTestPT": true
        },
        "testCapabilities": {
          "ratioTest": true,
          "polarityTest": true,
          "burdenTest": true,
          "accuracyTest": true,
          "excitationTest": true,
          "insulationResistanceTest": true,
          "tanDeltaTest": true
        },
        "voltageExperience": [11, 33, 66],
        "assignedLab": "Final Testing Lab",
        "activeStatus": true,
        "password": "password123"
      },
      {
        "employeeId": "EMP-1005",
        "fullName": "Neha More",
        "mobileNumber": "9876543215",
        "emailId": "neha.more@transformer.com",
        "designation": "Entry Level",
        "department": "Core Test",
        "dateOfJoining": "2024-02-05",
        "employmentType": "Contract",
        "transformerSkills": {
          "canTestCT": false,
          "canTestPT": false
        },
        "testCapabilities": {
          "ratioTest": false,
          "polarityTest": false,
          "burdenTest": false,
          "accuracyTest": false,
          "excitationTest": false,
          "insulationResistanceTest": true
        },
        "voltageExperience": [],
        "assignedLab": "Core Assembly Area",
        "activeStatus": true,
        "password": "password123"
      },
      {
        "employeeId": "EMP-1006",
        "fullName": "Suresh Pawar",
        "mobileNumber": "9876543216",
        "emailId": "suresh.pawar@transformer.com",
        "designation": "Admin",
        "department": "Final Test",
        "dateOfJoining": "2020-11-01",
        "employmentType": "Permanent",
        "transformerSkills": {
          "canTestCT": true,
          "canTestPT": true
        },
        "testCapabilities": {
          "ratioTest": true,
          "polarityTest": true,
          "burdenTest": true,
          "accuracyTest": true,
          "excitationTest": true,
          "insulationResistanceTest": true,
          "tanDeltaTest": true
        },
        "voltageExperience": [11, 33, 66, 132],
        "assignedLab": "Quality & Final Approval",
        "activeStatus": true,
        "password": "password123"
      }
    ];

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


// get allorders
app.get("/allorders", async (req, res) => {
  let orders = await OrderModel.find({});
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


//secondary metering test handle
app.post("/transformer-secondary-metering-tests", async (req, res) => {
  try {
    const { uniqueId, tester, metering_results } = req.body;

    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.secondary_login.tester": tester,
          "testHistory.secondary_login.metering_results": metering_results,
          "testHistory.secondary_login.status": "Completed",
          "testHistory.secondary_login.timestamp": new Date()
        }
      },
      { new: true }
    );

    // ✅ FIXED: Check if null and RETURN immediately
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found. Ensure it exists in the database first.`
      });
    }

    // ✅ Only reached if transformer is NOT null
    res.status(201).json({
      success: true,
      message: "Secondary Metering Test Saved Successfully",
      transformerId: transformer._id
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Failed to save test",
      error: err.message
    });
  }
});


//secondary protection test handle
app.post("/transformer-secondary-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, protection_results } = req.body;

    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.secondary_login.tester": tester,
          "testHistory.secondary_login.protection_results": protection_results,
          "testHistory.secondary_login.status": "Completed",
          "testHistory.secondary_login.timestamp": new Date()
        }
      },
      { new: true, runValidators: true }
    );

    // ✅ CHECK: If transformer doesn't exist
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found. Ensure it exists in the database first.`
      });
    }

    // ✅ SUCCESS: Response
    res.status(201).json({
      success: true,
      message: "Secondary Protection Test Saved Successfully",
      transformerId: transformer._id
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


//secondary PS test handle
app.post("/transformer-secondary-ps-tests", async (req, res) => {
  try {
    const { uniqueId, tester, ps_results } = req.body;

    // Use $set with dot notation to target the specific test stage
    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.secondary_login.tester": tester,
          "testHistory.secondary_login.ps_results": ps_results,
          "testHistory.secondary_login.status": "Completed",
          "testHistory.secondary_login.timestamp": new Date()
        }
      },
      { new: true, runValidators: true }
    );

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
      message: "Secondary PS Test Saved Successfully",
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


//primary Metering test handle
app.post("/transformer-primary-metering-tests", async (req, res) => {
  try {
    const { uniqueId, tester, metering_results } = req.body;
    console.log(`[DEBUG] POST /transformer-primary-metering-tests. Payload:`, req.body);

    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          // TARGETING PRIMARY_LOGIN HERE
          "testHistory.primary_login.tester": tester,
          "testHistory.primary_login.metering_results": metering_results,
          "testHistory.primary_login.status": "Completed",
          "testHistory.primary_login.timestamp": new Date()
        }
      },
      { new: true }
    );

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({ success: true, message: "Primary Metering Test Saved" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


//primary protection test handle
app.post("/transformer-primary-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, protection_results } = req.body;

    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.primary_login.tester": tester,
          "testHistory.primary_login.protection_results": protection_results,
          "testHistory.primary_login.status": "Completed",
          "testHistory.primary_login.timestamp": new Date()
        }
      },
      { new: true, runValidators: true }
    );

    // ✅ CHECK: If transformer doesn't exist
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found. Ensure it exists in the database first.`
      });
    }

    // ✅ SUCCESS: Response
    res.status(201).json({
      success: true,
      message: "Primary Protection Test Saved Successfully",
      transformerId: transformer._id
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
    const { uniqueId, tester, ps_results } = req.body;

    // Use $set with dot notation to target the specific test stage
    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.primary_login.tester": tester,
          "testHistory.primary_login.ps_results": ps_results,
          "testHistory.primary_login.status": "Completed",
          "testHistory.primary_login.timestamp": new Date()
        }
      },
      { new: true, runValidators: true }
    );

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
    const { uniqueId, tester, metering_results } = req.body;
    console.log(`[DEBUG] POST /transformer-final-metering-tests. Payload:`, req.body);

    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          // TARGETING PRIMARY_LOGIN HERE
          "testHistory.final_test_login.tester": tester,
          "testHistory.final_test_login.metering_results": metering_results,
          "testHistory.final_test_login.status": "Completed",
          "testHistory.final_test_login.timestamp": new Date()
        }
      },
      { new: true }
    );

    if (!transformer) {
      console.log(`[ERROR] Transformer not found for uniqueId: "${uniqueId}"`);
      return res.status(404).json({ success: false, message: "Transformer not found" });
    }

    res.status(201).json({ success: true, message: "Final Metering Test Saved" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


//final protection test handle
app.post("/transformer-final-protection-tests", async (req, res) => {
  try {
    const { uniqueId, tester, protection_results } = req.body;

    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.final_test_login.tester": tester,
          "testHistory.final_test_login.protection_results": protection_results,
          "testHistory.final_test_login.status": "Completed",
          "testHistory.final_test_login.timestamp": new Date()
        }
      },
      { new: true, runValidators: true }
    );

    // ✅ CHECK: If transformer doesn't exist
    if (!transformer) {
      return res.status(404).json({
        success: false,
        message: `Transformer ID [${uniqueId}] not found. Ensure it exists in the database first.`
      });
    }

    // ✅ SUCCESS: Response
    res.status(201).json({
      success: true,
      message: "Final Protection Test Saved Successfully",
      transformerId: transformer._id
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
    const { uniqueId, tester, ps_results } = req.body;

    // Use $set with dot notation to target the specific test stage
    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.final_test_login.tester": tester,
          "testHistory.final_test_login.ps_results": ps_results,
          "testHistory.final_test_login.status": "Completed",
          "testHistory.final_test_login.timestamp": new Date()
        }
      },
      { new: true, runValidators: true }
    );

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

    // 1. Save detailed test report (Upsert)
    const testRecord = await SecondaryMeteringTestModel.findOneAndUpdate(
      { uniqueId, coreId },
      {
        uniqueId,
        coreId,
        tester,
        metering_results,
        remarks,
        testDate: new Date(),
        status: "Completed"
      },
      { upsert: true, new: true, runValidators: true }
    );

    // 2. Update Master Transformer Status
    const transformer = await TransformerModel.findOneAndUpdate(
      { uniqueId: uniqueId },
      {
        $set: {
          "testHistory.secondary_test.status": "In Progress",
          "testHistory.secondary_test.tester": tester,
          "testHistory.secondary_test.timestamp": new Date()
        }
      },
      { new: true }
    );

    if (!transformer) {
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

//primary protection test handle
app.listen(PORT, () => {
  console.log(`App Started! ${PORT}`);
})

