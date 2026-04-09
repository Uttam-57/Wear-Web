import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import seedProducts from './product.seed.js';

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
    const result = await seedProducts({ clearExisting });
    console.log('Product seeding done:', result);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error('Product seed failed:', error.message);
  process.exitCode = 1;
});
