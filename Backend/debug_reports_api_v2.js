const http = require('http');

function testClientStats() {
    console.log("Fetching client stats...");

    http.get('http://localhost:3002/api/orders/clients/stats', (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        resp.on('end', () => {
            console.log("Status:", resp.statusCode);
            try {
                const jsonData = JSON.parse(data);
                console.log("Data success:", jsonData.success);
                console.log("Clients found:", jsonData.clients ? jsonData.clients.length : 'undefined');
                if (jsonData.clients && jsonData.clients.length > 0) {
                    console.log("Sample Client:", JSON.stringify(jsonData.clients[0], null, 2));
                } else {
                    console.log("Full Data:", JSON.stringify(jsonData, null, 2));
                }
            } catch (e) {
                console.log("Raw Data:", data);
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

testClientStats();
