const mongoose = require('mongoose');
require('dotenv').config();

const { OrderModel } = require('./models/OrderModel');

const uri = process.env.MONGO_URL;

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to DB.");

        try {
            const order = await OrderModel.findOne({ jobId: "JOB-2026-001" });
            if (order) {
                // New multi-core array format!
                order.reportData = [
                    {
                        coreName: "Metering",
                        coreType: "Metering",
                        testSetup: {
                            coreMaterial: "M4CRGO",
                            turnsUsed: 10,
                            coreSizeMm: { id: 115, od: 145, height: 35 },
                            mmp: 42.39,
                            areaSqCm: 41.225
                        },
                        testLimits: {
                            bsatGauss: [1000, 3000, 5000, 7000],
                            setMilliVolt: [93.19, 277.64, 465.96, 652.34],
                            leLimitMa: [17.14, 34.28, 42.86, 56.73]
                        },
                        testedBy: "Rahul Sharma",
                        tableData: [
                            {
                                date: new Date().toLocaleDateString('en-GB'),
                                vendorCoreNo: 'VC-001',
                                internalCoreNo: 'M-2082',
                                measuredMa: [9.5, 18.3, 24.7, 30.6],
                                result: 'P'
                            },
                            {
                                date: new Date().toLocaleDateString('en-GB'),
                                vendorCoreNo: 'VC-002',
                                internalCoreNo: 'M-2083',
                                measuredMa: [9.8, 18.7, 25.0, 31.0],
                                result: 'P'
                            }
                        ]
                    },
                    {
                        coreName: "Protection",
                        coreType: "Protection",
                        testSetup: {
                            description: "M4CRGO",
                            turnsUsed: 10,
                            coreSizeMm: { id: 110, od: 140, height: 30 }
                        },
                        testSpecification: {
                            fluxTesla: 1.5,
                            voltageV: 7.04,
                            iexLimitMa: 1696
                        },
                        testedBy: "Rahul Sharma",
                        tableData: [
                            {
                                date: new Date().toLocaleDateString('en-GB'),
                                vendorCoreNo: 'VC-003',
                                internalCoreNo: 'P-1011',
                                value: 950,
                                result: 'P'
                            }
                        ]
                    }
                ];
                await order.save();
                console.log(`Updated Order ${order.jobId} with multi-core report data array.`);
            } else {
                console.log("No orders found to update.");
            }

        } catch (e) {
            console.error(e);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error(err));
