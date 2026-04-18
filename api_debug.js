const axios = require('axios');

async function debugAPI() {
    try {
        const orderId = '67a1...'; // I need to find the real ID
        // Let's first list all orders to find JOB-2026-165
        const ordersRes = await axios.get('http://localhost:5000/api/orders');
        const orders = ordersRes.data;
        const targetOrder = orders.find(o => o.jobId === 'JOB-2026-165');
        
        if (!targetOrder) {
            console.log('Order JOB-2026-165 not found');
            return;
        }
        
        console.log('--- Order Info ---');
        console.log('ID:', targetOrder._id);
        console.log('Type:', targetOrder.transformerType);
        console.log('Rating:', targetOrder.voltageRating);

        const orderIdReal = targetOrder._id;
        
        // Fetch Transformers
        const transRes = await axios.get(`http://localhost:5000/api/transformers/order/${orderIdReal}`);
        const transformers = transRes.data;
        
        const t = transformers.find(tr => tr.uniqueId === 'TR-JOB-2026-165-001');
        if (t) {
            console.log('\n--- Transformer 001 ---');
            console.log('Unique ID:', t.uniqueId);
            console.log('PT Test Data Keys:', t.testHistory?.pt_test ? Object.keys(t.testHistory.pt_test) : 'NONE');
            if (t.testHistory?.pt_test) {
                console.log('Final Testing Keys:', Object.keys(t.testHistory.pt_test.finalTesting || {}));
                console.log('Accuracy Test Keys:', Object.keys(t.testHistory.pt_test.accuracyTest || {}));
                console.log('Pre Testing Keys:', Object.keys(t.testHistory.pt_test.preTesting || {}));
            }
        } else {
            console.log('Transformer 001 not found');
        }

        // Fetch Heating
        const heatingRes = await axios.get(`http://localhost:5000/api/heating-record/${orderIdReal}/33KV_PT`).catch(e => e.response);
        console.log('\n--- Heating Fetch ---');
        console.log('Status:', heatingRes.status);
        console.log('Success:', heatingRes.data?.success);
        if (heatingRes.data?.data?.blocks) {
            console.log('Blocks Found:', heatingRes.data.data.blocks.length);
            console.log('Serials:', heatingRes.data.data.blocks.map(b => b.serialNumber));
        } else {
            console.log('No blocks in heating record');
        }

    } catch (err) {
        console.error('Debug failed:', err.message);
    }
}

debugAPI();
