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
        const loginData = JSON.stringify({ employeeId: "EMP-1001", password: "password123" }); // Admin login
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

        const cookies = loginRes.headers['set-cookie'];
        if (!cookies) return console.error("Login failed");

        console.log("2. Creating Test Order...");
        const orderPayload = JSON.stringify({
            clientName: "Test Client Fix",
            clientContactNo: "1234567890",
            quantity: 1,
            transformerName: "Test Transformer",
            transformerType: "CT",
            isStandard: "Yes",
            noOfCores: 1,
            coreTypes: ["Metering"],
            // FLATTENED FIELDS
            nominalSystemVoltage: 33,
            burden: 15,
            ratedPrimaryCurrent: 200,
            ratedSecondaryCurrent: 5,
            accuracyClass: "0.2S",
            mountingDetails: "Pole",
            overallDimension: "100x100x100",
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            assignments: [
                {
                    testerName: "Rahul Core",
                    stage: "core",
                    unitRange: { from: 1, to: 1 }
                }
            ]
        });

        const createRes = await makeRequest({
            hostname: 'localhost',
            port: 3002,
            path: '/api/create_order',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': orderPayload.length,
                'Cookie': cookies
            }
        }, orderPayload);

        console.log("Create Status:", createRes.statusCode);
        console.log("Create Body:", createRes.body);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
