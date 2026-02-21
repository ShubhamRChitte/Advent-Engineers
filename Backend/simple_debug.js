const mongoose = require('mongoose');
const uri = "mongodb+srv://shubhamvrchitte_db_user:AOUnbkDzZYHOSDfh@adventengineerscluster.mbj8fg1.mongodb.net/?appName=AdventEngineersCluster";

console.log("Starting script...");
mongoose.connect(uri)
    .then(() => {
        console.log("Connected to DB!");
        mongoose.connection.db.listCollections().toArray().then(cols => {
            console.log("Collections:", cols.map(c => c.name));
            mongoose.disconnect();
            console.log("Done.");
        });
    })
    .catch(err => console.error("Connection Error:", err));
