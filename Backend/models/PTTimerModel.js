const mongoose = require('mongoose');
const { PTTimerSchema } = require('../schema/PTTimerSchema');

const PTTimerModel = mongoose.model('PTTimerRecord', PTTimerSchema);

module.exports = { PTTimerModel };
