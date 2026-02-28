require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');

mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        const orders = await OrderModel.find({
            $or: [
                { 'assignments.core_tester': 'Rahul Sharma' },
                {
                    assignments: {
                        $elemMatch: { testerName: 'Rahul Sharma', stage: 'core' }
                    }
                }
            ]
        });
        console.log('Orders for Rahul Sharma:', orders.length);
        orders.forEach(o => console.log('Job:', o.jobId, '| Approved:', o.approved, '| Status:', o.status, '| Stage:', o.currentStage));
        process.exit(0);
    });
