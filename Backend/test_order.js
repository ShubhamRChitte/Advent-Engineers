const axios = require('axios');
const FormData = require('form-data');

async function testOrder() {
    try {
        const payload = {
            clientName: "Test Client",
            clientContactNo: "1234567890",
            transformerName: "Custom Transformer",
            transformerType: "CT",
            quantity: 1,
            noOfCores: 1,
            coreDetails: JSON.stringify([{ coreType: 'Metering' }]),
            ratio: JSON.stringify(['200/1']),
            voltageRating: "11",
            nominalSystemVoltage: 0,
            burden: 0,
            ratedPrimaryCurrent: 200,
            ratedSecondaryCurrent: 5,
            accuracyClass: "N/A",
            mountingDetails: "N/A",
            overallDimension: "N/A",
            images: [],
            isStandard: "No",
            indoorOutdoor: "",
            insulationType: "",
            tankType: "",
            instructions: "None",
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            assignments: JSON.stringify([{
                testerName: "Admin User",
                stage: "core",
                unitRange: { from: 1, to: 1 },
                status: "Assigned"
            }]),
            bypassApproval: true
        };

        const formData = new FormData();
        Object.keys(payload).forEach(key => formData.append(key, String(payload[key])));

        const response = await axios.post('http://localhost:3002/api/create-order', formData, {
            headers: formData.getHeaders()
        });

        console.log("Success:", response.data);
    } catch (error) {
        console.error("Error from API:", error.response?.data || error.message);
    }
}

testOrder();
