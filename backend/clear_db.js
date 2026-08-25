const mongoose = require('mongoose');
require('dotenv').config();

async function clearDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        await mongoose.connection.db.dropDatabase();
        console.log('Database dropped successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
clearDB();
