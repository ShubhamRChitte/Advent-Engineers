const {Schema} = require("mongoose");

const CoreDetailSchema = new Schema({
  coreType: {
    type: String,
    required: true,
    enum: ["Metering", "Protection", "PS"]
  }
});

const OrderSchema = new Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },

  clientContactNo: {
    type: String,
    required: true,
    trim: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  isStandard: {
    type: String,
    required: true,
    trim: true
  },

  transformerType: {
    type: String,
    required: true,
    enum: ["CT", "PT"]
  },

  noOfCores: {
    type: Number,
    required: true,
    min: 1
  },

  coreDetails: {
    type: [CoreDetailSchema],
    required: true,
    validate: {
      validator: function (value) {
        return value.length === this.noOfCores;
      },
      message: "Core details count must match number of cores"
    }
  },

  nominalSystemVoltage: {
    type: Number,
    required: true
  },

  burden: {
    type: Number,
    required: true
  },

  ratedPrimaryCurrent: {
    type: Number,
    required: true
  },

  ratedSecondaryCurrent: {
    type: Number,
    required: true
  },

  accuracyClass: {
    type: String,
    required: true,
    trim: true
  },

  mountingDetails: {
    type: String,
    required: true,
    trim: true
  },

  overallDimension: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});


module.exports = {OrderSchema};

