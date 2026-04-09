import User from "../../modules/user/user.model.js";

// ─── Test Credentials (reuse these in tests for login) ───────────────────────

export const testUsers = {
  admin: {
    email: "admin@test.com",
    password: "Admin@123",
  },
  customer: {
    email: "customer@test.com",
    password: "Customer@123",
  },
  seller: {
    email: "seller@test.com",
    password: "Seller@123",
  },
};

// ─── Seed Users ───────────────────────────────────────────────────────────────

const seedUsers = async () => {
  await User.create([
    {
      firstName: "Test",
      lastName: "Admin",
      email: testUsers.admin.email,
      password: testUsers.admin.password,
      role: "admin",
      status: "active",
    },
    {
      firstName: "Test",
      lastName: "Customer",
      email: testUsers.customer.email,
      password: testUsers.customer.password,
      role: "customer",
      status: "active",
    },
    {
      firstName: "Test",
      lastName: "Seller",
      email: testUsers.seller.email,
      password: testUsers.seller.password,
      role: "seller",
      status: "active",
      profileComplete: false,
    },
  ]);
};

export default seedUsers;
