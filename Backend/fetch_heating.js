require('dotenv').config();
const mongoose = require('mongoose');
const { TransformerSchema } = require('./schema/transformerSchema');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const Transformer = mongoose.model('Transformer', TransformerSchema);
  const t = await Transformer.findOne({ 'uniqueId': 'TR-JOB-2026-137-001' }).lean();
  console.log("Heating Record:");
  console.log(JSON.stringify(t?.processHistory?.heatingRecord, null, 2));
  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
