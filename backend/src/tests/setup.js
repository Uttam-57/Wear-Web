import mongoose from "mongoose";
import { MongoMemoryReplSet  } from "mongodb-memory-server";

let mongod;
process.env.NODE_ENV = "test";
// ─── Start memory DB before all tests ────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryReplSet .create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// ─── Wipe all collections after each test ────────────────────────────────────

// afterEach(async () => {
//   const collections = mongoose.connection.collections;
//   for (const key in collections) {
//     if (key !== "users") {
//       await collections[key].deleteMany({});
//     }
//   }
// });

afterEach(async () => {
  const collections = mongoose.connection.collections;
  const preserved = new Set(["users", "categories", "categorytemplates", "sellerprofiles","products","addresses"]);
  for (const key in collections) {
    if (!preserved.has(key)) {
      await collections[key].deleteMany({});
    }
  }
});
// ─── Disconnect and shut down memory DB after all tests ──────────────────────

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});