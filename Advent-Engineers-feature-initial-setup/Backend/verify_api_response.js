const http = require('http');

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ headers: res.headers, statusCode: res.statusCode, body }));
        });

        req.on('error', reject);

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

async function run() {
    try {
        console.log("1. Logging in...");
        const loginData = JSON.stringify({ employeeId: "EMP-2001", password: "password123" });
        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: 3002,
            path: '/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, loginData);

        console.log("Login Status:", loginRes.statusCode);

        const cookies = loginRes.headers['set-cookie'];
        if (!cookies) {
            console.error("No cookies received!");
            return;
        }
        console.log("Cookies received.");

        console.log("2. Fetching Assigned Orders...");
        const ordersRes = await makeRequest({
            hostname: 'localhost',
            port: 3002,
            path: '/api/assigneed_orders',
            method: 'GET',
            headers: {
                'Cookie': cookies
            }
        });

        console.log("Orders Status:", ordersRes.statusCode);
        const orders = JSON.parse(ordersRes.body);

        if (Array.isArray(orders) && orders.length > 0) {
            console.log("First Order Keys:", Object.keys(orders[0]));
            if (orders[0].nominalSystemVoltage !== undefined) {
                console.log("First Order nominalSystemVoltage:", orders[0].nominalSystemVoltage);
            } else {
                console.log("MISSING: nominalSystemVoltage in first order");
            }
            // Check all orders for missing fields
            orders.forEach(o => {
                if (!o.nominalSystemVoltage) console.log(`Order ${o.jobId} missing voltage`);
                else console.log(`Order ${o.jobId} Voltage: ${o.nominalSystemVoltage}`);
            });
        } else {
            console.log("No orders found or invalid response");
            console.log(ordersRes.body.substring(0, 200));
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
