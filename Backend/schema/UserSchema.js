const { Schema } = require("mongoose");

const UserSchema = new Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  mobileNumber: {
    type: String,
    required: true
  },

  emailId: {
    type: String
  },

  designation: {
    type: String,
    required: true
  },

  department: {
    type: Schema.Types.Mixed,
    required: true
  },

  departments: [{
    type: String
  }],

  dateOfJoining: {
    type: Date,
    required: true
  },

  employmentType: {
    type: String,
    enum: ["Permanent", "Contract", "Trainee"],
    required: true
  },

  transformerSkills: {
    canTestCT: { type: Boolean, default: false },
    canTestPT: { type: Boolean, default: false }
  },

  testCapabilities: {
    ratioTest: Boolean,
    polarityTest: Boolean,
    burdenTest: Boolean,
    accuracyTest: Boolean,
    excitationTest: Boolean,
    insulationResistanceTest: Boolean,
    tanDeltaTest: Boolean
  },

  voltageExperience: {
    type: [Number], // Example: [11, 33, 66]
    default: []
  },

  assignedLab: {
    type: String
  },

  activeStatus: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});



module.exports = { UserSchema };