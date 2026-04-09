import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import seedOrders from './order.seed.js';

dotenv.config();
dns.setServers(['1.1.1.1', '1.0.0.1']);

const keepExisting = process.argv.includes('--keep-existing');
const clearExisting = !keepExisting;

const run = async () => {
  if (!process.env.MONGO_URI_APP) {
    throw new Error('MONGO_URI_APP is not defined in environment variables.');
  }

  await mongoose.connect(process.env.MONGO_URI_APP, { family: 4 });
  try {
    const result = await seedOrders({ clearExisting, orderCount: 30 });
    console.log('Order seeding done:', result);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error('Order seed failed:', error.message);
  process.exitCode = 1;
});
