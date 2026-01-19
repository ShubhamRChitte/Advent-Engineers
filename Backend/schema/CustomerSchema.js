const {Schema} = require("mongoose");

const CustomerSchema = new Schema({
    
    name: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      type: String,
      required: true
    },

    gstNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    },

    contactPerson: {
      type: String
    },

    contactNumber: {
      type: String
    },

    email: {
      type: String,
      lowercase: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE"
    }
  },
  {
    timestamps: true   // adds createdAt & updatedAt
  }
);

module.exports = {CustomerSchema};