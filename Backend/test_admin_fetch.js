require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const { UserModel } = require('./models/UserModel');

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const admin = await UserModel.findOne({ designation: 'Admin' });
    if (!admin) {
        console.log('No admin found');
        process.exit();
    }
    const token = jwt.sign(
        { id: admin._id, role: 'admin' },
        process.env.JWT_SECRET || 'advent_engineers_secret_key',
        { expiresIn: '24h' }
    );
    console.log('Generated admin token. Fetching /api/final/reports...');
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
            console.log('Raw data:', data2);
            process.exit();
        });
    });
    getReq.end();
});
