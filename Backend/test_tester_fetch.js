require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const { UserModel } = require('./models/UserModel');

mongoose.connect(process.env.MONGO_URL).then(async () => {
    // Find a final tester
    const tester = await UserModel.findOne({ department: 'Final Test' });
    if (!tester) {
        console.log('No tester found');
        process.exit();
    }
    const token = jwt.sign(
        { id: tester._id, role: 'final-tester' },
        process.env.JWT_SECRET || 'advent_engineers_secret_key',
        { expiresIn: '24h' }
    );
    console.log('Generated tester token for:', tester.fullName);
    const getReq = http.request('http://localhost:5001/api/final/reports', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }, (res2) => {
        let data2 = '';
        res2.on('data', d => data2 += d);
        res2.on('end', () => {
            console.log('Status code:', res2.statusCode);
            try {
                const arr = JSON.parse(data2);
                console.log('Array length:', arr.length);
            } catch (e) {
                console.log('Parse error:', e.message);
            }
            process.exit();
        });
    });
    getReq.end();
});
