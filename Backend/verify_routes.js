const axios = require('axios');

async function verifyRoutes() {
    const baseUrl = 'http://localhost:3002';

    try {
        // 1. Test Get All Employees
        console.log("Testing GET /auth/all-employees...");
        const getResponse = await axios.get(`${baseUrl}/auth/all-employees`);
        console.log("GET Response Status:", getResponse.status);
        console.log("GET Success:", getResponse.data.success);

        // 2. Test Add Employee
        console.log("\nTesting POST /auth/add-employee...");
        const newEmployee = {
            fullName: "Route Test User",
            mobileNumber: "1122334455",
            emailId: "routetest@example.com",
            designation: "Tester",
            department: "Secondary Test",
            dateOfJoining: new Date(),
            employmentType: "Contract",
            password: "password123",
            activeStatus: true
        };

        const postResponse = await axios.post(`${baseUrl}/auth/add-employee`, newEmployee);
        console.log("POST Response Status:", postResponse.status);
        console.log("POST Success:", postResponse.data.success);
        console.log("Generated ID:", postResponse.data.employeeId);

    } catch (error) {
        console.error("Verification Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

verifyRoutes();
