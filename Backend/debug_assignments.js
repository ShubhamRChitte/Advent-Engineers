// using native fetch

async function runTest() {
    console.log("Starting Assignment Debug...");
    const baseUrl = 'http://localhost:3002';

    // Rahul Sharma Credentials
    const employeeId = 'EMP002';
    const password = 'password123';

    try {
        console.log(`Logging in as ${employeeId}...`);
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId, password })
        });

        if (!loginRes.ok) {
            console.log("Login Failed:", loginRes.status, await loginRes.text());
            return;
        }

        console.log("Login Successful!");
        const setCookie = loginRes.headers.get('set-cookie');
        let cookie = '';
        if (setCookie) {
            cookie = setCookie.split(';')[0];
        }

        // Fetch Assigned Orders
        console.log("Fetching assigned orders...");
        const ordersRes = await fetch(`${baseUrl}/api/assigneed_orders`, {
            headers: { Cookie: cookie }
        });

        if (!ordersRes.ok) {
            console.log("Fetch Orders Failed:", ordersRes.status);
            return;
        }

        const orders = await ordersRes.json();
        console.log(`Found ${orders.length} orders.`);

        orders.forEach((order, index) => {
            console.log(`\n--- Order ${index + 1} ---`);
            console.log("Job ID:", order.jobId);
            console.log("Quantity:", order.quantity);
            console.log("Assigned Unit IDs:", JSON.stringify(order.assignedUnitIds, null, 2));
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

runTest();
