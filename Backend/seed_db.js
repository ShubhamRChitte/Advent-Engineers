const mongoose = require('mongoose');
require("dotenv").config();
const { TransformerModel } = require("./models/TransformerModel");
const uri = process.env.MONGO_URL;

const TransformerReading = [
    // =========================
    // TRANSFORMER 1
    // =========================
    {
        uniqueId: "TR-2026-001",
        ratings: ["200/1", "400/1", "800/1"],
        coreType: ["Metering", "Protection", "PS"],

        testHistory: {
            secondary_login: {
                tester: "R. Sharma",
                status: "Completed",

                metering_results: [
                    {
                        ratioValue: "200/1",
                        rows: [
                            { current: "120%", r100: "-0.12", p100: "2.1", r25: "-0.10", p25: "1.9" },
                            { current: "100%", r100: "-0.10", p100: "2.0", r25: "-0.08", p25: "1.8" }
                        ]
                    },
                    {
                        ratioValue: "400/1",
                        rows: [
                            { current: "100%", r100: "-0.05", p100: "1.4", r25: "-0.04", p25: "1.2" }
                        ]
                    }
                ],

                protection_results: [
                    {
                        ratioValue: "200/1",
                        burden100: "15 VA",
                        resistance: "2.2 Ω",
                        secondaryLimitingVtg: "620 V",
                        excitationCurrent: "48 mA",
                        compositeError: "4.1 %"
                    }
                ],

                ps_results: [
                    {
                        ratioValue: "200/1",
                        turnRatioError: "0.11 %",
                        resistance: "1.4 Ω",
                        vk: "380",
                        vkVal: "418",
                        iexVk: "26 mA",
                        iex11Vk: "33 mA"
                    }
                ]
            },

            primary_login: {
                tester: "R. Sharma",
                status: "Completed",

                metering_results: [
                    {
                        ratioValue: "800/1",
                        rows: [
                            { current: "100%", r100: "-0.03", p100: "1.0", r25: "-0.02", p25: "0.9" }
                        ]
                    }
                ],

                protection_results: [
                    {
                        ratioValue: "400/1",
                        burden100: "20 VA",
                        resistance: "3.1 Ω",
                        secondaryLimitingVtg: "700 V",
                        excitationCurrent: "52 mA",
                        compositeError: "3.6 %"
                    }
                ],

                ps_results: [
                    {
                        ratioValue: "400/1",
                        turnRatioError: "0.08 %",
                        resistance: "1.9 Ω",
                        vk: "420",
                        vkVal: "462",
                        iexVk: "31 mA",
                        iex11Vk: "38 mA"
                    }
                ]
            },

            final_test_login: {
                tester: "A. Verma",
                status: "Completed",

                metering_results: [
                    {
                        ratioValue: "800/1",
                        rows: [
                            { current: "120%", r100: "-0.02", p100: "0.9", r25: "-0.01", p25: "0.8" }
                        ]
                    }
                ],

                protection_results: [
                    {
                        ratioValue: "800/1",
                        burden100: "30 VA",
                        resistance: "4.8 Ω",
                        secondaryLimitingVtg: "820 V",
                        excitationCurrent: "60 mA",
                        compositeError: "2.9 %"
                    }
                ],

                ps_results: [
                    {
                        ratioValue: "800/1",
                        turnRatioError: "0.05 %",
                        resistance: "2.6 Ω",
                        vk: "510",
                        vkVal: "561",
                        iexVk: "39 mA",
                        iex11Vk: "46 mA"
                    }
                ]
            }
        }
    },

    // =========================
    // TRANSFORMER 2
    // =========================
    {
        uniqueId: "TR-2026-002",
        ratings: ["200/1", "400/1"],
        coreType: ["Metering", "Protection"],

        testHistory: {
            secondary_login: {
                tester: "S. Patil",
                status: "Completed",

                metering_results: [
                    {
                        ratioValue: "200/1",
                        rows: [
                            { current: "100%", r100: "-0.14", p100: "2.4", r25: "-0.11", p25: "2.0" }
                        ]
                    }
                ],

                protection_results: [
                    {
                        ratioValue: "200/1",
                        burden100: "10 VA",
                        resistance: "2.0 Ω",
                        secondaryLimitingVtg: "600 V",
                        excitationCurrent: "44 mA",
                        compositeError: "4.8 %"
                    }
                ],

                ps_results: []
            },

            primary_login: {
                tester: "S. Patil",
                status: "Completed",

                metering_results: [
                    {
                        ratioValue: "400/1",
                        rows: [
                            { current: "100%", r100: "-0.06", p100: "1.3", r25: "-0.05", p25: "1.1" }
                        ]
                    }
                ],

                protection_results: [
                    {
                        ratioValue: "400/1",
                        burden100: "18 VA",
                        resistance: "2.9 Ω",
                        secondaryLimitingVtg: "690 V",
                        excitationCurrent: "50 mA",
                        compositeError: "3.9 %"
                    }
                ],

                ps_results: []
            },

            final_test_login: {
                tester: "QA Team",
                status: "Completed",
                metering_results: [],
                protection_results: [],
                ps_results: []
            }
        }
    },

    // =========================
    // TRANSFORMER 3
    // =========================
    {
        uniqueId: "TR-2026-003",
        ratings: ["800/1"],
        coreType: ["PS"],

        testHistory: {
            secondary_login: {
                tester: "M. Kulkarni",
                status: "Completed",

                metering_results: [],
                protection_results: [],

                ps_results: [
                    {
                        ratioValue: "800/1",
                        turnRatioError: "0.06 %",
                        resistance: "2.4 Ω",
                        vk: "520",
                        vkVal: "572",
                        iexVk: "41 mA",
                        iex11Vk: "48 mA"
                    }
                ]
            },

            primary_login: {
                tester: "M. Kulkarni",
                status: "Completed",

                metering_results: [],
                protection_results: [],

                ps_results: [
                    {
                        ratioValue: "800/1",
                        turnRatioError: "0.05 %",
                        resistance: "2.3 Ω",
                        vk: "530",
                        vkVal: "583",
                        iexVk: "42 mA",
                        iex11Vk: "49 mA"
                    }
                ]
            },

            final_test_login: {
                tester: "Chief Inspector",
                status: "Completed",

                metering_results: [],
                protection_results: [],

                ps_results: [
                    {
                        ratioValue: "800/1",
                        turnRatioError: "0.04 %",
                        resistance: "2.2 Ω",
                        vk: "540",
                        vkVal: "594",
                        iexVk: "43 mA",
                        iex11Vk: "50 mA"
                    }
                ]
            }
        }
    }
];

mongoose.connect(uri)
    .then(async () => {
        console.log("Connected to MongoDB for SEEDING...");

        try {
            await TransformerModel.deleteMany({}); // Delete existing first just in case
            console.log("Cleared existing transformers.");

            for (const item of TransformerReading) {
                let newTransformerReading = new TransformerModel(item);
                await newTransformerReading.save();
            }
            console.log("Seeding Completed Successfully!");
        } catch (err) {
            console.error("Seeding Failed:", err);
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error("Connection Error:", err);
        process.exit(1);
    });
