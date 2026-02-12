const { model } = require("mongoose");
const { MeteringCoreTestSchema } = require("../schema/MeteringCoreTestSchema");

const MeteringCoreTestModel = model("MeteringCoreTest", MeteringCoreTestSchema);

module.exports = { MeteringCoreTestModel };