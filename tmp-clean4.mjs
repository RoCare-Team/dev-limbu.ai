import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const a = await db.collection('automationplans').deleteMany({ userId: 'USR-TEST-FULL' });
const b = await db.collection('users').deleteMany({ userId: 'USR-TEST-FULL' });
console.log('cleanup — plans:', a.deletedCount, '| users:', b.deletedCount);
