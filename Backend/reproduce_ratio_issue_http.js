const http = require('http');

function testCreateOrder() {
    const payload = JSON.stringify({
        clientName: "Test Client Ratio HTTP",
        clientContactNo: "1234567890",
        transformerName: "Test T/F",
        transformerType: "CT",
        quantity: 1,
        deadline: new Date().toISOString(),
        priority: "Medium",
        noOfCores: 1,
        ratedPrimaryCurrent: 100,
        ratedSecondaryCurrent: 5,
        ratio: ["100/5", "200/5"],
        mountingDetails: "Wall",
        overallDimension: "10x10",
        isStandard: "Yes",
        assignments: [],
        coreDetails: [{ coreType: "Metering" }],

        // Bypass approval to skip to transformer generation
        bypassApproval: true
    });

    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/create-order',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(payload);
    req.end();
}

testCreateOrder();
