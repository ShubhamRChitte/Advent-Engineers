const { Schema, model } = require("mongoose");

const EmployeeSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
    },

    emailId: {
      type: String,
    },

    designation: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    dateOfJoining: {
      type: Date,
      required: true,
    },

    employmentType: {
      type: String,
      enum: ["Permanent", "Contract", "Trainee"],
      required: true,
    },

    assignedLab: {
      type: String,
    },

    activeStatus: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Employee", EmployeeSchema);
