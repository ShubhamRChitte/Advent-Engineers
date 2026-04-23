require('dotenv').config();
const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/advent');
  const count = await OrderModel.find({
    status: { $regex: /completed/i }
  });
  console.log("Completed Orders:", count.map(c => ({ id: c.jobId, type: c.transformerType, status: c.status })));
  
  const allPTO = await OrderModel.find({ transformerType: 'PT' });
  console.log("All PT Orders statuses:", allPTO.map(c => c.status));
  process.exit();
}
check();
