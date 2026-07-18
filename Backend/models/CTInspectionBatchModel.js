const { model } = require('mongoose');
const { CTInspectionBatchSchema } = require('../schema/CTInspectionBatchSchema');

const CTInspectionBatchModel = model('CTInspectionBatch', CTInspectionBatchSchema);
module.exports = { CTInspectionBatchModel };
