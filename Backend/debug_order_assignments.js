const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/advent_db';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to MongoDB");

        try {
            // Find recent orders in 'secondary' or 'core' stage
            const recentOrders = await OrderModel.find({}).sort({ updatedAt: -1 }).limit(5);

            console.log("\n--- RECENT ORDERS ---");
            for (const order of recentOrders) {
                console.log(`\nOrder ID: ${order._id}`);
                console.log(`Job ID: ${order.jobId}`);
                console.log(`Status: ${order.status}`);
                console.log(`Current Stage: ${order.currentStage}`);
                console.log(`Assignments (Order Level):`, order.assignments);

                // Check Transformers
                const transformers = await TransformerModel.find({ orderId: order._id });
                console.log(`Transformers Found: ${transformers.length}`);
                if (transformers.length > 0) {
                    console.log(`Sample Transformer Assignments:`, transformers[0].assignments);
                    console.log(`Sample Transformer Current Stage:`, transformers[0].currentStage);

                    // Check if any have secondary_tester
                    const hasSecondary = transformers.some(t => t.assignments && t.assignments.secondary_tester);
                    console.log(`Has secondary_tester set on any transformer? ${hasSecondary}`);
                    if (hasSecondary) {
                        const testers = transformers.map(t => t.assignments?.secondary_tester).filter(Boolean);
                        console.log(`Secondary Testers: ${[...new Set(testers)].join(', ')}`);
                    }
                }
            }

        } catch (err) {
            console.error("Error:", err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error("Connection Error:", err));
