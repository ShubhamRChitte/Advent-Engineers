const mongoose = require('mongoose');

// Define Transformer Schema Shell
const TransformerSchema = new mongoose.Schema({}, { strict: false });
const Transformer = mongoose.model('Transformer', TransformerSchema);

async function debugTransformer() {
  try {
    await mongoose.connect('mongodb://localhost:27010/transformer_db');
    console.log('Connected to DB');

    const t = await Transformer.findOne({ uniqueId: 'TR-JOB-2026-165-001' });
    if (!t) {
      console.log('Transformer not found');
      return;
    }

    console.log('--- Transformer ---');
    console.log('ID:', t.uniqueId);
    console.log('PT Test Keys:', t.testHistory?.pt_test ? Object.keys(t.testHistory.pt_test) : 'NONE');
    
    if (t.testHistory?.pt_test) {
      console.log('Final Testing:', JSON.stringify(t.testHistory.pt_test.finalTesting, null, 2));
      console.log('Accuracy Test:', JSON.stringify(t.testHistory.pt_test.accuracyTest, null, 2));
      console.log('Pre Testing:', JSON.stringify(t.testHistory.pt_test.preTesting, null, 2));
    }

    // Check heating records
    const HeatingRecordSchema = new mongoose.Schema({}, { strict: false });
    const HeatingRecord = mongoose.model('HeatingRecord', HeatingRecordSchema);
    const heating = await HeatingRecord.findOne({ orderId: t.orderId });
    console.log('--- Heating Record for Order ---');
    if (heating) {
      console.log('Found heating record with ID:', heating._id);
      console.log('Blocks:', JSON.stringify(heating.blocks.map(b => b.serialNumber), null, 2));
    } else {
      console.log('No heating record found for orderId:', t.orderId);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugTransformer();
