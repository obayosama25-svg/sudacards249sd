const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/sudacards_admin');
    const txs = await mongoose.connection.db.collection('transactions').find({ transactionId: /^ADM-/ }).toArray();
    let count = 0;
    for (let tx of txs) {
        const timestampStr = Date.now().toString(); // 13 digits
        const randomDigits = Math.floor(100 + Math.random() * 900).toString(); // 3 digits
        const newId = timestampStr + randomDigits;
        await mongoose.connection.db.collection('transactions').updateOne(
            { _id: tx._id },
            { $set: { transactionId: newId } }
        );
        count++;
        // Small delay to ensure unique timestamps if Date.now() resolves too fast
        await new Promise(res => setTimeout(res, 5));
    }
    console.log(`Updated ${count} transactions.`);
    process.exit(0);
}

run().catch(console.error);
