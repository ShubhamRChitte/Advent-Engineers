const axios = require('axios');
const fs = require('fs');

async function runTest() {
    console.log("Starting Assignment Debug V2...");
    const baseUrl = 'http://localhost:3002';
    const employeeId = 'EMP002';
    const password = 'password123';

    try {
        console.log(`Logging in as ${employeeId}...`);
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            employeeId,
            password
        });
        const cookie = loginRes.headers['set-cookie'];
        console.log("Login Successful!");

        console.log("Fetching assigned orders...");
        const ordersRes = await axios.get(`${baseUrl}/api/assigneed_orders?type=active`, {
            headers: { Cookie: cookie }
        });
        const orders = ordersRes.data;
        console.log(`Found ${orders.length} orders.`);

        const debugData = [];

        for (const order of orders) {
            console.log(`Processing Order: ${order.jobId}`);
            const orderData = {
                jobId: order.jobId,
                orderAssignments: order.assignments,
                calculatedAssignedUnitIds: order.assignedUnitIds,
                transformers: []
            };

            try {
                const transRes = await axios.get(`${baseUrl}/api/orders/${order._id}/transformers`, {
                    headers: { Cookie: cookie }
                });
                orderData.transformers = transRes.data.map(t => ({
                    uniqueId: t.uniqueId,
                    stage: t.currentStage,
                    assignments: t.assignments,
                    testHistory: t.testHistory // Also check this!
                }));
            } catch (err) {
                console.error(`Failed to fetch transformers for ${order.jobId}`);
            }
            debugData.push(orderData);
        }

        fs.writeFileSync('debug_output.json', JSON.stringify(debugData, null, 2));
        console.log("Debug data written to debug_output.json");

    } catch (e) {
        console.error("Error:", e.message);
    }
}

runTest();
