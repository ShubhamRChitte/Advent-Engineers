const mongoose = require('mongoose');

// Connect to MongoDB - update if index.js is different
mongoose.connect('mongodb://127.0.0.1:27017/transformer-test-db')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

const transformerSchema = new mongoose.Schema({}, { strict: false });
const TransformerModel = mongoose.model('Transformer', transformerSchema, 'transformers');

async function listTransformers() {
    try {
        const transformers = await TransformerModel.find().sort({ _id: -1 }).limit(10).lean();
        console.log(`Found ${transformers.length} transformers.`);
        transformers.forEach(t => {
            console.log(`ID: ${t.uniqueId} | Order: ${t.orderId}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
}

listTransformers();
