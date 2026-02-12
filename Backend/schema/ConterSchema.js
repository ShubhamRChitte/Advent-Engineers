const mongoose = require("mongoose");
const { Schema } = mongoose;

const CounterSchema = new Schema({
  id: { type: String, required: true, unique: true }, // e.g., "job_id" or "transformer_sn"
  seq: { type: Number, default: 0 }
});


module.exports = { CounterSchema };