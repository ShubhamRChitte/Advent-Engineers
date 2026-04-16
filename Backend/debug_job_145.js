const mongoose = require('mongoose');
const { OrderModel } = require('./models/OrderModel');
const { TransformerModel } = require('./models/TransformerModel');

async function checkJob() {
    try {
        const uri = 'mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster';
        await mongoose.connect(uri); 
        const order = await OrderModel.findOne({ jobId: 'JOB-2026-145' });
        if (!order) {
            console.log("Order not found");
            return;
        }
        const fs = require('fs');
        let output = "";
        output += `Order Type: ${order.transformerType}\n`;
        output += `Order Stage: ${order.currentStage}\n`;
        output += `Transformers Count: ${transformers.length}\n`;
        
        transformers.forEach(t => {
            output += `Unit: ${t.uniqueId}\n`;
            output += `  Stage: ${t.currentStage}\n`;
            output += `  Primary Test Status: ${t.testHistory?.primary_test?.status}\n`;
            output += `  History Keys: ${Object.keys(t.testHistory || {}).join(', ')}\n`;
        });
        fs.writeFileSync('debug_output.txt', output);
        console.log("Output written to debug_output.txt");
        
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

checkJob();
