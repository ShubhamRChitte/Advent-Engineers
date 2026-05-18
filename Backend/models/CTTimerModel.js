const mongoose = require('mongoose');
const { CTTimerSchema } = require('../schema/CTTimerSchema');

const CTTimerModel = mongoose.model('CTTimerRecord', CTTimerSchema);

module.exports = { CTTimerModel };
