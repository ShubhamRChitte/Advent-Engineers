async function run() {
    const payload = {
        uniqueId: "TR-JOB-2026-038-001",
        tester: "DebugTester",
        ps_results: [
            {
                ratioValue: "200/1",
                turnRatioError: "0.5",
                resistance: "10.2",
                vk: "100",
                vkVal: "110",
                iexVk: "0.05",
                iex11Vk: "0.06"
            },
            {
                ratioValue: "400/1",
                turnRatioError: "0.2",
                resistance: "5.5",
                vk: "200",
                vkVal: "220",
                iexVk: "0.02",
                iex11Vk: "0.03"
            }
        ]
    };

    try {
        console.log("Sending Payload via FETCH...");
        const res = await fetch("http://localhost:3002/transformer-secondary-ps-tests", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log("Response Status:", res.status);
        const data = await res.json();
        console.log("Response Data:", JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    }
}

run();
