const express = require('express');
const router = express.Router();
const { TransformerModel } = require("../models/TransformerModel");
const { HeatingRecordModel } = require("../models/HeatingRecordModel");

router.get("/api/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.query; // Optional: specify stage to get specific readings

    const mongoose = require('mongoose');
    let transformer;

    if (mongoose.Types.ObjectId.isValid(id)) {
      transformer = await TransformerModel.findById(id).populate('orderId');
    }

    if (!transformer) {
      transformer = await TransformerModel.findOne({ uniqueId: id }).populate('orderId');
    }

    if (!transformer) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Attempt to fetch Heating Record from separate collection if needed (for PT or modern CT modules)
    let heatingRecordFromCollection = null;
    try {
      if (transformer.orderId) {
        const orderId = transformer.orderId._id || transformer.orderId;
        const type = transformer.orderId.transformerType || "PT";

        const hRecord = await HeatingRecordModel.findOne({
          orderId: orderId,
          transformerType: { $regex: type, $options: 'i' }
        });

        if (hRecord && hRecord.blocks) {
          // Find the block matching this transformer's uniqueId
          const block = hRecord.blocks.find(b =>
            b.serialNumber === transformer.uniqueId ||
            (b.transformerId && b.transformerId.toString() === transformer._id.toString())
          );

          if (block) {
            // NORMALIZE: Convert String dates to Date objects for report consistency
            const normalizedSteps = (block.processSteps || []).map(step => {
              const normalized = { ...step.toObject ? step.toObject() : step };

              // Construct startDateTime if missing but strings exist
              if (!normalized.startDateTime && normalized.startDate && normalized.startTime) {
                try {
                  normalized.startDateTime = new Date(`${normalized.startDate}T${normalized.startTime}`);
                } catch (e) { console.warn("Date parse error for startDateTime:", e.message); }
              }
              // Construct completionDateTime if missing
              if (!normalized.completionDateTime && normalized.endDate && normalized.endTime) {
                try {
                  normalized.completionDateTime = new Date(`${normalized.endDate}T${normalized.endTime}`);
                } catch (e) { console.warn("Date parse error for completionDateTime:", e.message); }
              }

              return normalized;
            });

            heatingRecordFromCollection = {
              ...block.toObject ? block.toObject() : block,
              processSteps: normalizedSteps
            };
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch supplementary heating record:", err.message);
    }

    const reportData = transformer.toObject();
    if (heatingRecordFromCollection) {
      reportData.heatingRecordFromCollection = heatingRecordFromCollection;
    }

    // Normalize ptHeatingRecord if present
    if (reportData.processHistory && reportData.processHistory.ptHeatingRecord) {
      reportData.processHistory.ptHeatingRecord = reportData.processHistory.ptHeatingRecord.map(record => {
        if (record.processSteps) {
          record.processSteps = record.processSteps.map(step => {
            const normalized = { ...step };
            if (!normalized.startDateTime && normalized.startDate && normalized.startTime) {
              try {
                normalized.startDateTime = new Date(`${normalized.startDate}T${normalized.startTime}`);
              } catch (e) { console.warn("Date parse error for startDateTime (PT):", e.message); }
            }
            if (!normalized.completionDateTime && normalized.completionDate && normalized.completionTime) {
              try {
                normalized.completionDateTime = new Date(`${normalized.completionDate}T${normalized.completionTime}`);
              } catch (e) { console.warn("Date parse error for completionDateTime (PT):", e.message); }
            }
            return normalized;
          });
        }
        return record;
      });
    }

    const currentStage = stage || transformer.currentStage;
    const stageKey = `${currentStage}_test`;

    // Extract readings based on stage
    let readings = [];
    const history = transformer.testHistory?.[stageKey];
    if (history) {
      if (currentStage === 'final') {
        // For final test, we might use the readings from finalReportData if history results are empty
        readings = history.metering_results || history.protection_results || history.ps_results || transformer.finalReportData?.readings || [];
      } else if (currentStage === 'pt') {
        readings = transformer.testHistory.pt_test?.readings || [];
      } else {
        readings = history.metering_results || history.protection_results || history.ps_results || [];
      }
    }

    res.json({
      success: true,
      data: {
        ...reportData,
        readings: readings,
        reportDate: history?.reportDate || history?.timestamp || transformer.finalReportData?.generatedAt || new Date()
      }
    });
  } catch (error) {
    console.error("Error fetching report detail:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
