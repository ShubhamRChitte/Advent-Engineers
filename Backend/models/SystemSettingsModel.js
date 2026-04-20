const mongoose = require('mongoose');
const { Schema } = mongoose;

const SystemSettingsSchema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
    description: { type: String }
}, { timestamps: true });

const SystemSettingsModel = mongoose.model('SystemSettings', SystemSettingsSchema);

module.exports = { SystemSettingsModel };
