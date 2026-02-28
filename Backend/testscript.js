require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');

mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/advent-engineers')
    .then(async () => {
        const allOrders = await OrderModel.find({});
        const approvedOrders = allOrders.filter(o => o.approved === true);
        console.log('Total Orders:', allOrders.length);
        console.log('Total Approved Orders:', approvedOrders.length);

        const rahulOrders = allOrders.filter(o => {
            // legacy check
            if (o.assignments && o.assignments.core_tester === 'Rahul Sharma') return true;
            // new check
            if (o.assignments && Array.isArray(o.assignments)) {
                return o.assignments.some(a => a.testerName === 'Rahul Sharma');
            }
            return false;
        });
        console.log('Total Orders assigned to Rahul Sharma:', rahulOrders.length);
        console.log('Approved Orders assigned to Rahul Sharma:', rahulOrders.filter(o => o.approved === true).length);

        if (approvedOrders.length > 0) {
            console.log('Sample Approved Job:', approvedOrders[0].jobId);
        } else {
            console.log('No approved orders found in the database. approve-batch might be failing silently.');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
