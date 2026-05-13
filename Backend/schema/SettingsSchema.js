const { Schema } = require('mongoose');

const SettingsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

module.exports = { SettingsSchema };
