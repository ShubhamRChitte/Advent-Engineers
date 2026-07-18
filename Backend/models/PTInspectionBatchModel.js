const { model } = require('mongoose');
const { PTInspectionBatchSchema } = require('../schema/PTInspectionBatchSchema');

const PTInspectionBatchModel = model('PTInspectionBatch', PTInspectionBatchSchema);
module.exports = { PTInspectionBatchModel };
