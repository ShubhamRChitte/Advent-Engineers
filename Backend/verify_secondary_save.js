async function testSecondarySave() {
    const payload = {
        uniqueId: "TR-JOB-2026-038-001",
        coreId: "CORE-001",
        tester: "DebugScript",
        metering_results: [
            {
                ratioValue: "200/1",
                rows: [{ current: "TEST-100", r100: "0.1" }]
            }
        ],
        remarks: "Debugging persistence"
    };

    try {
        console.log("Sending POST request...");
        const response = await fetch('http://localhost:3002/transformer-secondary-metering-tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log("--- RESPONSE HEADERS ---");
        // Headers API is slightly different in fetch
        const debugHeader = response.headers.get('x-debug-version');
        console.log("X-Debug-Version:", debugHeader);

        console.log("--- RESPONSE BODY ---");
        const data = await response.json();

        if (!response.ok) {
            console.error("Status:", response.status);
            console.error("Error Message:", data.message || data.error);
            return;
        }

        // We added debug_transformer to the response
        const transformer = data.debug_transformer;

        if (transformer) {
            console.log("Transformer ID:", transformer._id);
            console.log("Secondary Status:", transformer.testHistory?.secondary_test?.status);
            console.log("Secondary Metering Results:", JSON.stringify(transformer.testHistory?.secondary_test?.metering_results, null, 2));
        } else {
            console.log("No transformer returned in debug info.");
            console.log(data);
        }

    } catch (error) {
        console.error("Request Failed:", error.message);
    }
}

testSecondarySave();
