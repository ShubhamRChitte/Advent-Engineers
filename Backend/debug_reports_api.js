const fetch = require('node-fetch');

async function testClientStats() {
    try {
        console.log("Fetching client stats...");
        const response = await fetch('http://localhost:3002/api/orders/clients/stats');
        const data = await response.json();

        console.log("Status:", response.status);
        console.log("Data success:", data.success);
        console.log("Clients found:", data.clients ? data.clients.length : 'undefined');
        if (data.clients && data.clients.length > 0) {
            console.log("Sample Client:", JSON.stringify(data.clients[0], null, 2));
        } else {
            console.log("Full Data:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

testClientStats();
