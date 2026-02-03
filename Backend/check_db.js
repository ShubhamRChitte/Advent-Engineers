const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Define a minimal Order Schema to query coreDetails
const OrderSchema = new mongoose.Schema({
    coreDetails: []
}, { strict: false });

const OrderModel = mongoose.model('orders', OrderSchema);

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        // Find one order with coreDetails
        const order = await OrderModel.findOne({ 'coreDetails.0': { $exists: true } });

        if (order) {
            console.log('Found Order with coreDetails:');
            console.log(JSON.stringify(order.coreDetails, null, 2));
        } else {
            console.log('No order with coreDetails found.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkDB();
