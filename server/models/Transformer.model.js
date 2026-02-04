const { Schema, model } = require("mongoose");

const TransformerSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true
    },

    transformerId: {
      type: String,
      required: true,
      unique: true   // ⭐ IMPORTANT
    },

    coreTesting: {
      type: String,
      enum: ["Complete", "Pending"],
      default: "Pending"
    },

    secondaryTesting: {
      type: String,
      enum: ["Complete", "Pending"],
      default: "Pending"
    },

    primaryTesting: {
      type: String,
      enum: ["Complete", "Pending"],
      default: "Pending"
    },

    finalTesting: {
      type: String,
      enum: ["Complete", "Pending"],
      default: "Pending"
    },

    reportStatus: {
      type: String,
      enum: ["Open", "In Progress"],
      default: "In Progress"
    }
  },
  { timestamps: true }
);

module.exports = model("Transformer", TransformerSchema);
