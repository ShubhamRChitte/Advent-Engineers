
const mongoose = require('mongoose');
const { TransformerModel } = require('./models/TransformerModel');

mongoose.connect('mongodb://127.0.0.1:27017/Testing_Software').then(async () => {
    try {
        const anyPt = await TransformerModel.findOne({ currentStage: 'pt' });
        console.log('Any PT transformer exist?', !!anyPt);
        if(anyPt) {
            console.log('History keys for this pt:', anyPt.testHistory ? Object.keys(anyPt.testHistory) : null);
            console.log('Has pt_test?', anyPt.testHistory && !!anyPt.testHistory.pt_test);
            if (anyPt.testHistory && anyPt.testHistory.pt_test) {
                console.log('pt_test contents:', Object.keys(anyPt.testHistory.pt_test));
                console.log('Signature:', anyPt.testHistory.pt_test.signature);
            }
        }
    } catch (err) { console.error('Error:', err); }
    process.exit();
});

