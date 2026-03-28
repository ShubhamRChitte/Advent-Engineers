const mongoose = require('mongoose');

async function dropIndex() {
    try {
        await mongoose.connect('mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const collection = mongoose.connection.collection('failedcores');

        // List explicitly to see if it exists
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        try {
            await collection.dropIndex('orderId_1_internalCoreNo_1');
            console.log('Successfully dropped the index orderId_1_internalCoreNo_1');
        } catch (idxError) {
            console.log('Index might not exist or already dropped:', idxError.message);
            // It could be named differently, trying by key pattern
            try {
                // await collection.dropIndex({ orderId: 1, internalCoreNo: 1 });
                // console.log('Successfully dropped the index by key pattern');
            } catch (err2) {
                // ignore
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error connecting or running:', error);
    }
}

dropIndex();
