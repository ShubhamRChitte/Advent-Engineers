



const { model } = require("mongoose");
const { ProtectionCoreTestSchema } = require("../schema/ProtectionCoreTestSchema");

const ProtectionCoreTestModel = model("ProtectionCoreTest", ProtectionCoreTestSchema);

module.exports = { ProtectionCoreTestModel };
