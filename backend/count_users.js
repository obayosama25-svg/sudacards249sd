const mongoose = require('mongoose');
const User = require('./models/User');

const mongoURI = 'mongodb://localhost:27017/sudacards_admin';

async function count() {
    try {
        await mongoose.connect(mongoURI);
        const count = await User.countDocuments({});
        console.log('Total users in MongoDB:', count);
        const users = await User.find({}).limit(5);
        console.log('Sample users:', users.map(u => ({ id: u.userId, name: `${u.firstName} ${u.lastName}`, branch: u.branchId })));
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}
count();
