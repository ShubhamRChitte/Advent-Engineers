const mongoose = require('mongoose');
const FailedCoreService = require('./services/failedCoreService');
const { TransformerModel } = require('./models/TransformerModel');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster');
        console.log('Connected');

        const transformer = await TransformerModel.findOne({ uniqueId: 'TR-2026-017-001' }).populate('orderId');
        if (!transformer) {
            console.log('Transformer not found');
            return;
        }

        console.log('Transformer found:', transformer.uniqueId);
        console.log('OrderId Type:', typeof transformer.orderId);
        console.log('OrderId Value:', transformer.orderId);

        if (!transformer.orderId) {
            console.error('CRITICAL: transformer.orderId is NULL/UNDEFINED');
            return;
        }

        const failedCoreSvc = require('./services/failedCoreService');
        await failedCoreSvc.recordFailure(
            transformer.orderId._id || transformer.orderId,
            transformer.uniqueId,
            {
                failureStage: 'FINAL_POLARITY_TEST',
                failureReason: 'Polarity Test Failed'
            }
        );
        console.log('Success');
    } catch (e) {
        require('fs').writeFileSync('error.log', e.stack, 'utf8');
        console.error('CRASH REPRODUCED - Logged to error.log');
    } finally {
        await mongoose.disconnect();
    }
}
test();
