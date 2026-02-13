const axios = require('axios');

async function verifyStats() {
    try {
        console.log("Fetching Dashboard Stats...");
        const response = await axios.get('http://localhost:3002/api/dashboard/stats');

        if (response.data.success) {
            console.log("\n✅ API Success");
            console.log("\nStats Overview:");
            response.data.stats.forEach(s => {
                console.log(`- ${s.label}: ${s.value} (Icon: ${s.icon})`);
            });

            console.log("\nOrder Data:");
            console.table(response.data.orderData);

            console.log("\nRecent Activity (First 2):");
            console.log(response.data.recentActivity.slice(0, 2));
        } else {
            console.log("❌ API Returned Success: False");
        }
    } catch (error) {
        console.error("❌ Request Failed:", error.message);
    }
}

verifyStats();
