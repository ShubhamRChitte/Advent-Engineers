const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Order = require("./models/Order.model");
const Transformer = require("./models/Transformer.model");

const seedOrders = async () => {
  try {
    await connectDB();

    await Order.deleteMany();
    await Transformer.deleteMany();

    const orders = [
      {
        jobId: "ORD-1732157890123",
        clientName: "MSEB Power Distribution Ltd.",
        ratio: ["200/5", "400/5"],
        clientContactNo: "9876543210",
        transformerName: "Outdoor Epoxy Resin Cast",
        transformerType: "CT",
        quantity: 25,
        noOfCores: 2,
        coreDetails: [{ coreType: "Metering" }, { coreType: "Protection" }],
        nominalSystemVoltage: 11000,
        burden: 15,
        ratedPrimaryCurrent: 400,
        ratedSecondaryCurrent: 5,
        accuracyClass: "0.5",
        mountingDetails: "Panel Mounted",
        overallDimension: "320 x 260 x 210 mm",
        deadline: new Date("2026-04-10"),
        instructions: "Pack separately",
        status: "In Progress",
        priority: "High",
        isStandard: "Standard"
      },
      {
        jobId: "ORD-1732157890456",
        clientName: "Adani Transmission Ltd.",
        ratio: ["800/5"],
        clientContactNo: "9123456789",
        transformerName: "Dead Tank Type",
        transformerType: "CT",
        quantity: 15,
        noOfCores: 1,
        coreDetails: [{ coreType: "Protection" }],
        nominalSystemVoltage: 33000,
        burden: 10,
        ratedPrimaryCurrent: 800,
        ratedSecondaryCurrent: 5,
        accuracyClass: "1.0",
        mountingDetails: "Outdoor",
        overallDimension: "400 x 300 x 250 mm",
        deadline: new Date("2026-05-01"),
        instructions: "",
        status: "Pending",
        priority: "Medium",
        isStandard: "Standard"
      }
    ];

    const createdOrders = await Order.insertMany(orders);

    // 🔥 AUTO CREATE TRANSFORMERS
    const transformers = [];

    createdOrders.forEach(order => {
      for (let i = 1; i <= order.quantity; i++) {
        transformers.push({
          orderId: order.jobId,
          transformerId: `Tata-2407-${order.jobId.slice(-6)}${String(i).padStart(2,"0")}`
        });
      }
    });

    await Transformer.insertMany(transformers);

    console.log("✅ Orders + Transformers seeded");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedOrders();
