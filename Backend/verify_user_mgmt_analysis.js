async function verifyUserManagement() {
    const baseUrl = 'http://localhost:3002/api/users';
    const authUrl = 'http://localhost:3002/auth/login';
    let cookie = '';

    console.log("1. Authenticating as Admin...");
    try {
        const loginRes = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: 'EMP001', 
                password: 'admin' 
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);

        const setCookie = loginRes.headers.get('set-cookie');
        if (setCookie) {
            cookie = setCookie.split(';')[0];
            console.log("Logged in. Cookie:", cookie);
        } else {
            console.warn("Warning: No Set-Cookie header received.");
        }

        console.log("2. Fetching Users...");
        const usersRes = await fetch(baseUrl, {
            headers: { 
                'Cookie': cookie 
            }
        });

        if (!usersRes.ok) throw new Error(`Fetch users failed: ${usersRes.status} ${usersRes.statusText}`);
        
        const data = await usersRes.json();
        console.log("Users Fetched:", data.success ? data.users.length : "Failed");
        if (data.success) {
             console.log("User List:", data.users.map(u => `${u.fullName} (${u.designation})`).join(", "));
        }

    } catch (err) {
        console.error("Verification failed:", err.message);
    }
}

verifyUserManagement();
