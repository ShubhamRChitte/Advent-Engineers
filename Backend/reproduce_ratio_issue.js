const axios = require('axios');

async function testCreateOrder() {
    try {
        const payload = {
            clientName: "Test Client Ratio",
            clientContactNo: "1234567890",
            transformerName: "Test T/F",
            transformerType: "CT",
            quantity: 1,
            deadline: new Date().toISOString(),
            priority: "Medium",
            noOfCores: 1,
            ratedPrimaryCurrent: 100,
            ratedSecondaryCurrent: 5,
            ratio: ["100/5", "200/5"], // Explicitly sending this
            mountingDetails: "Wall",
            overallDimension: "10x10",
            isStandard: "Yes",
            assignments: [],
            coreDetails: [{ coreType: "Metering" }],
            bypassApproval: true
        };

        console.log("Sending payload:", JSON.stringify(payload, null, 2));

        const res = await axios.post('http://localhost:3002/api/create-order', payload);
        console.log("Response:", res.data);

        // Now check the DB (simulated by checking the response or I can check the DB directly if I had access, 
        // but the response usually returns the created object or ID)

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

testCreateOrder();
