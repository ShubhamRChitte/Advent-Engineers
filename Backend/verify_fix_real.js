
async function runTest() {
    console.log("Starting Verification (using fetch)...");
    const baseUrl = 'http://localhost:3002';

    // Helper to get cookie
    let cookie = '';

    // Test 1: Amit Patel
    console.log("\n--- TEST 1: Login as Amit Patel ---");
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: 'EMP-1007', password: 'password123' })
        });

        if (loginRes.ok) {
            console.log("Login Successful!");
            const setCookie = loginRes.headers.get('set-cookie');
            if (setCookie) {
                // Fetch extracts just the first part often, but let's try to use it raw
                // Node fetch might return multiple set-cookie headers joined or array.
                // For simple session, usually one line.
                cookie = setCookie.split(';')[0];
                console.log("Session Cookie obtained:", cookie);
            }

            const ordersRes = await fetch(`${baseUrl}/api/assigneed_orders`, {
                headers: { Cookie: cookie }
            });

            if (ordersRes.ok) {
                const orders = await ordersRes.json();
                console.log(`Found ${orders.length} orders.`);
                const targetOrder = orders.find(o => o.clientName === "Tata Power");
                if (targetOrder) {
                    console.log("SUCCESS: Found 'Tata Power' order!");
                } else {
                    console.log("FAILURE: 'Tata Power' order not found.");
                }
            } else {
                console.log("Fetch failed:", ordersRes.status);
            }

        } else {
            console.log("Login Failed:", loginRes.status, await loginRes.text());
        }
    } catch (e) {
        console.error("Error Test 1:", e);
    }

    // Test 2: Admin
    console.log("\n--- TEST 2: Login as Admin ---");
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: 'EMP-1001', password: 'password123' })
        });

        if (loginRes.ok) {
            console.log("Login Successful!");
            const setCookie = loginRes.headers.get('set-cookie');
            if (setCookie) cookie = setCookie.split(';')[0];

            const ordersRes = await fetch(`${baseUrl}/api/assigneed_orders`, {
                headers: { Cookie: cookie }
            });

            if (ordersRes.ok) {
                const orders = await ordersRes.json();
                console.log(`Found ${orders.length} orders.`);
                const targetOrder = orders.find(o => o.clientName === "Tata Power");
                if (targetOrder) {
                    console.log("SUCCESS: Found 'Tata Power' order as Admin!");
                } else {
                    console.log("FAILURE: 'Tata Power' order not found for Admin.");
                }
            } else {
                console.log("Fetch failed:", ordersRes.status);
            }
        } else {
            console.log("Login Failed:", loginRes.status);
        }
    } catch (e) {
        console.error("Error Test 2:", e);
    }
}

runTest();
