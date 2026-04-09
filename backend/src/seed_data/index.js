import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import seedUsers from './user.js';
import seedCategories from './implemented/category.seed.js';
import seedProducts from './implemented/product.seed.js';
import seedOrders from './implemented/order.seed.js';
import seedReviews from './implemented/review.seed.js';

dotenv.config();
dns.setServers(['1.1.1.1', '1.0.0.1']);

const parseNumberArg = (flag, fallback) => {
  const arg = process.argv.find((item) => item.startsWith(`${flag}=`));
  if (!arg) return fallback;
  const parsed = Number(arg.split('=')[1]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const getSeedConfig = () => {
  const keepExisting = process.argv.includes('--keep-existing');
  const clearExisting = !keepExisting;
  return {
    clearExisting,
    customerCount: parseNumberArg('--customers', 18),
    sellerCount: parseNumberArg('--sellers', 18),
    orderCount: parseNumberArg('--orders', 90),
  };
};

const runSeed = async () => {
  const {
    clearExisting,
    customerCount,
    sellerCount,
    orderCount,
  } = getSeedConfig();

  if (!process.env.MONGO_URI_APP) {
    throw new Error('MONGO_URI_APP is not defined. Add it to your backend environment variables.');
  }

  await mongoose.connect(process.env.MONGO_URI_APP, { family: 4 });
  console.log('Connected to MongoDB for seeding.');

  try {
    const userResult = await seedUsers({ clearExisting, customerCount, sellerCount });
    const categoryResult = await seedCategories({ clearExisting });
    const productResult = await seedProducts({ clearExisting });
    const orderResult = await seedOrders({ clearExisting, orderCount });
    const reviewResult = await seedReviews({ clearExisting });

    console.log('----------------------------------------');
    console.log('Seeding completed successfully.');
    console.log(`Users      : ${JSON.stringify(userResult.summary)}`);
    console.log(`Categories : ${JSON.stringify({
      rootCount: categoryResult.rootCount,
      categoryCount: categoryResult.categoryCount,
      leafCount: categoryResult.leafCount,
      templateCount: categoryResult.templateCount,
    })}`);
    console.log(`Products   : ${JSON.stringify(productResult)}`);
    console.log(`Orders     : ${JSON.stringify(orderResult)}`);
    console.log(`Reviews    : ${JSON.stringify(reviewResult)}`);
    console.log('----------------------------------------');
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

runSeed()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  });
