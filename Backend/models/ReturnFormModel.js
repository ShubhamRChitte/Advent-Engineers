const mongoose = require('mongoose');
const { ReturnFormSchema } = require('../schema/ReturnFormSchema');

const ReturnFormModel = mongoose.model('ReturnForm', ReturnFormSchema);

module.exports = { ReturnFormModel };
