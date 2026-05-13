const { model } = require("mongoose");
const { SettingsSchema } = require("../schema/SettingsSchema");

const SettingsModel = model("Setting", SettingsSchema);

module.exports = { SettingsModel };
