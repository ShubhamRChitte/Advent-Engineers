const { Schema } = require("mongoose");

const HeatingRecordSchema = new Schema(
  {
    orderId: { type: String, required: true },
    transformerType: { type: String, required: true }, // "11KV_CT", "33KV_CT", "33KV_PT"
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },

    blocks: [
      {
        transformerId: String,
        groupNo: String,
        serialNumber: String,
        startDate: String,

        leftInputs: [
          {
            col1: String,
            col2: String
          }
        ], // length = 4 (per process)

        processSteps: [
          {
            process: String,
            duration: String,

            startDate: String,
            startTime: String,

            endDate: String,
            endTime: String,

            remarks: String
          }
        ],

        preparedBy: String,
        productionManager: String,
        verifiedBy: String,
        date: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = { HeatingRecordSchema };
