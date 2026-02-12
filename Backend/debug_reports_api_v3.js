const http = require('http');

function testClientStats() {
    http.get('http://localhost:3002/api/orders/clients/stats', (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });
        resp.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log("Clients Count: " + (jsonData.clients ? jsonData.clients.length : "N/A"));
                if (jsonData.clients && jsonData.clients.length > 0) {
                    console.log("First Client Name: " + jsonData.clients[0].name);
                }
            } catch (e) {
                console.log("Error parsing JSON");
            }
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}
testClientStats();
