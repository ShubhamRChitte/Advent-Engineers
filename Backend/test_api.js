const axios = require('axios');

async function testApi() {
    try {
        const orderId = "69dd01bfa67bc7e3010f4d99"; // jobId: JOB-2026-149
        const res = await axios.get(`http://localhost:3002/api/heating-record/transformers/${orderId}`);
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}
testApi();
