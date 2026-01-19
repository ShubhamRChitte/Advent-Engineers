require("dotenv").config();


const express = require('express');
const mongoose = require('mongoose');




const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;



const {CustomerModel}= require("./models/CustomerModel");
const {OrderModel} = require('./models/OrderModel');
const {UserModel} = require('./models/UserModel');
const { MeteringCoreTestModel } = require("./models/MeteringCoreTestModel");
const { ProtectionCoreTestModel } = require("./models/ProtectionCoreTestModel");
// const VerifyUser = require('./middlewares/VeriifyUser');
// const UsersModel = require("./model/UsersModel");


const app = express();


mongoose
  .connect(uri)
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));


 //add the dummy data of the customers 
app.get('/addCustomers',async(req,res)=>{
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


tempCustomers.forEach((item)=> {
    let newCustomer = new CustomerModel({
            name: item.name,
            address:item.address,
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
    let tempOrders = [
  {
    "clientName": "Shubham Industries",
    "clientContactNo": "9876543210",
    "quantity": 5,
    "isStandard": "IS 2705",
    "transformerType": "CT",
    "noOfCores": 3,
    "coreDetails": [
      { "coreType": "Metering" },
      { "coreType": "Protection" },
      { "coreType": "PS" }
    ],
    "nominalSystemVoltage": 33,
    "burden": 15,
    "ratedPrimaryCurrent": 200,
    "ratedSecondaryCurrent": 5,
    "accuracyClass": "0.5",
    "mountingDetails": "Wall mounted with clamp",
    "overallDimension": "300x200x150 mm"
  },
  {
    "clientName": "ABC Power Station",
    "clientContactNo": "9123456780",
    "quantity": 2,
    "isStandard": "IS 3156",
    "transformerType": "PT",
    "noOfCores": 1,
    "coreDetails": [
      { "coreType": "Metering" }
    ],
    "nominalSystemVoltage": 11,
    "burden": 5,
    "ratedPrimaryCurrent": 1,
    "ratedSecondaryCurrent": 1,
    "accuracyClass": "0.2",
    "mountingDetails": "Panel mounted",
    "overallDimension": "250x150x100 mm"
  },
  {
    "clientName": "XYZ Substation",
    "clientContactNo": "9988776655",
    "quantity": 3,
    "isStandard": "IS 2705",
    "transformerType": "CT",
    "noOfCores": 2,
    "coreDetails": [
      { "coreType": "Metering" },
      { "coreType": "Protection" }
    ],
    "nominalSystemVoltage": 66,
    "burden": 10,
    "ratedPrimaryCurrent": 400,
    "ratedSecondaryCurrent": 5,
    "accuracyClass": "1",
    "mountingDetails": "Outdoor pole mounted",
    "overallDimension": "320x220x170 mm"
  },
  {
    "clientName": "PowerGrid Ltd.",
    "clientContactNo": "9001234567",
    "quantity": 1,
    "isStandard": "IS 2705",
    "transformerType": "CT",
    "noOfCores": 4,
    "coreDetails": [
      { "coreType": "Metering" },
      { "coreType": "Protection" },
      { "coreType": "Protection" },
      { "coreType": "PS" }
    ],
    "nominalSystemVoltage": 132,
    "burden": 20,
    "ratedPrimaryCurrent": 800,
    "ratedSecondaryCurrent": 5,
    "accuracyClass": "0.5",
    "mountingDetails": "Indoor panel mounted",
    "overallDimension": "400x250x200 mm"
  },
  {
    "clientName": "Rural Distribution Co.",
    "clientContactNo": "9556677889",
    "quantity": 4,
    "isStandard": "IS 2705",
    "transformerType": "CT",
    "noOfCores": 1,
    "coreDetails": [
      { "coreType": "Metering" }
    ],
    "nominalSystemVoltage": 11,
    "burden": 5,
    "ratedPrimaryCurrent": 100,
    "ratedSecondaryCurrent": 5,
    "accuracyClass": "0.2",
    "mountingDetails": "Pole mounted",
    "overallDimension": "220x140x120 mm"
  },
  {
    "clientName": "Metro Rail Energy",
    "clientContactNo": "9988001122",
    "quantity": 2,
    "isStandard": "IS 3156",
    "transformerType": "PT",
    "noOfCores": 1,
    "coreDetails": [
      { "coreType": "Metering" }
    ],
    "nominalSystemVoltage": 33,
    "burden": 10,
    "ratedPrimaryCurrent": 1,
    "ratedSecondaryCurrent": 1,
    "accuracyClass": "0.5",
    "mountingDetails": "Panel mounted",
    "overallDimension": "270x160x130 mm"
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
    let tempUsers =[
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
    "activeStatus": true
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
    "activeStatus": true
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
    "activeStatus": true
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
    "activeStatus": true
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
    "activeStatus": true
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
    "activeStatus": true
  }
];

    for (const item of tempUsers) {
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
    let tempMeteringReading =[
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
//     let tempProtectionReading =[
//   {
//     "orderId": "64f9b0c7f1e7b4a1d3c6e8a9",
//     "transformerSerialNo": "TR-PRO-001",
//     "coreIndex": 1,
//     "coreType": "Protection",
//     "testSetup": {
//       "description": "M4CRGO",
//       "coreSizeMm": { "id": 85, "od": 185, "height": 85 },
//       "turnsUsed": 10,
//       "areaSqCm": 41.225,
//       "mmp": 42.39
//     },
//     "testSpecification": {
//       "fluxTesla": 1.5,
//       "voltageV": 7.04,
//       "iexLimitMa": 1696
//     },
//     "readings": [
//       {
//         "date": "2026-01-18T10:00:00.000Z",
//         "vendorCoreNo": "04",
//         "internalCoreNo": "P-1455",
//         "value": 486,
//         "result": "P"
//       },
//       {
//         "date": "2026-01-18T10:15:00.000Z",
//         "vendorCoreNo": "55",
//         "internalCoreNo": "P-1456",
//         "value": 550,
//         "result": "P"
//       },
//       {
//         "date": "2026-01-18T10:30:00.000Z",
//         "vendorCoreNo": "51",
//         "internalCoreNo": "P-1457",
//         "value": 465,
//         "result": "P"
//       }
//     ],
//     "testedBy": "Ravi Kumar",
//     "authorisedBy": "Priya Singh"
//   },

//   {
//     "orderId": "64f9b0c7f1e7b4a1d3c6e8aa",
//     "transformerSerialNo": "TR-PRO-002",
//     "coreIndex": 2,
//     "coreType": "Protection",
//     "testSetup": {
//       "description": "M4CRGO",
//       "coreSizeMm": { "id": 85, "od": 185, "height": 85 },
//       "turnsUsed": 10,
//       "areaSqCm": 41.225,
//       "mmp": 42.39
//     },
//     "testSpecification": {
//       "fluxTesla": 1.5,
//       "voltageV": 7.04,
//       "iexLimitMa": 1696
//     },
//     "readings": [
//       {
//         "date": "2026-01-19T10:00:00.000Z",
//         "vendorCoreNo": "11",
//         "internalCoreNo": "P-1458",
//         "value": 553,
//         "result": "P"
//       },
//       {
//         "date": "2026-01-19T10:15:00.000Z",
//         "vendorCoreNo": "38",
//         "internalCoreNo": "P-1459",
//         "value": 606,
//         "result": "P"
//       },
//       {
//         "date": "2026-01-19T10:30:00.000Z",
//         "vendorCoreNo": "33",
//         "internalCoreNo": "P-1460",
//         "value": 579,
//         "result": "P"
//       }
//     ],
//     "testedBy": "Amit Sharma",
//     "authorisedBy": "Anjali Verma"
//   },

//   {
//     "orderId": "64f9b0c7f1e7b4a1d3c6e8ab",
//     "transformerSerialNo": "TR-PRO-003",
//     "coreIndex": 3,
//     "coreType": "Protection",
//     "testSetup": {
//       "description": "M4CRGO",
//       "coreSizeMm": { "id": 85, "od": 185, "height": 85 },
//       "turnsUsed": 10,
//       "areaSqCm": 41.225,
//       "mmp": 42.39
//     },
//     "testSpecification": {
//       "fluxTesla": 1.5,
//       "voltageV": 7.04,
//       "iexLimitMa": 1696
//     },
//     "readings": [
//       {
//         "date": "2026-01-20T10:00:00.000Z",
//         "vendorCoreNo": "26",
//         "internalCoreNo": "P-1461",
//         "value": 508,
//         "result": "P"
//       },
//       {
//         "date": "2026-01-20T10:15:00.000Z",
//         "vendorCoreNo": "25",
//         "internalCoreNo": "P-1462",
//         "value": 512,
//         "result": "P"
//       },
//       {
//         "date": "2026-01-20T10:30:00.000Z",
//         "vendorCoreNo": "45",
//         "internalCoreNo": "P-1463",
//         "value": 475,
//         "result": "P"
//       }
//     ],
//     "testedBy": "Suresh Patil",
//     "authorisedBy": "Vikas Joshi"
//   }
// ];


//addin the dummy data of the PS Core
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



  app.listen(PORT,()=>{
    console.log(`App Started! ${PORT}`);
})