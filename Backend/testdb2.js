
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');
const { OrderModel } = require('./models/OrderModel');

mongoose.connect('mongodb://127.0.0.1:27017/Testing_Software').then(async () => {
    try {
        const order = await OrderModel.findOne({ transformerType: 'PT' }).sort({ createdAt: -1 });
        console.log('Latest PT Order:', order ? order.jobId : 'None');
        
        const ptTransformers = await TransformerModel.find({ orderId: order._id });
        console.log('Transformers found:', ptTransformers.length);
        if(ptTransformers.length > 0) {
            console.log('Stage of first:', ptTransformers[0].currentStage);
            console.log('History keys:', ptTransformers[0].testHistory?.pt_test ? Object.keys(ptTransformers[0].testHistory.pt_test) : 'Empty');
            console.log('Signature:', ptTransformers[0].testHistory?.pt_test?.signature);
        }
    } catch (err) { console.error('Error:', err); }
    process.exit();
});

