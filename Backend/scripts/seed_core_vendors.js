require("dotenv").config();
const mongoose = require("mongoose");
const { CoreVendorModel } = require("./models/CoreVendorModel");

const uri = process.env.MONGO_URL;

const dummyVendors = [
    { vendor_no: 1, vendor_name: "ABC Electricals", status: "active" },
    { vendor_no: 2, vendor_name: "Precision Cores Pvt Ltd", status: "active" },
    { vendor_no: 3, vendor_name: "Shakti Transformers", status: "active" },
    { vendor_no: 4, vendor_name: "Omega Core Industries", status: "active" },
    { vendor_no: 5, vendor_name: "Delta Magnetic Cores", status: "active" }
];

async function seedVendors() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB for seeding...");

        for (const vendor of dummyVendors) {
            await CoreVendorModel.findOneAndUpdate(
                { vendor_no: vendor.vendor_no },
                vendor,
                { upsert: true, new: true }
            );
            console.log(`Seeded/Updated: ${vendor.vendor_name}`);
        }

        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seedVendors();
