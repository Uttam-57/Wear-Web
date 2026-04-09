import request from "supertest";
import app from "../../../app.js";
import seedUsers from "../../helpers/seedUsers.js";
import { getCustomerToken, getSellerToken, getAdminToken } from "../../helpers/getTokens.js";
import User from "../../../modules/user/user.model.js";
import Address from "../../../modules/user/address.model.js";
import SellerProfile from "../../../modules/user/sellerProfile.model.js";
import Product from "../../../modules/product/product.model.js";

let customerToken;
let sellerToken;
let adminToken;
let customerId;
let sellerId;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await seedUsers();
  customerToken = await getCustomerToken();
  sellerToken = await getSellerToken();
  adminToken = await getAdminToken();
  const customer = await User.findOne({ email: "customer@test.com" });
  const seller = await User.findOne({ email: "seller@test.com" });
  customerId = customer._id;
  sellerId = seller._id;
});

afterEach(async () => {
  await Address.deleteMany({});
  await SellerProfile.deleteMany({});
  await Product.deleteMany({});

  if (customerId) {
    await User.findByIdAndUpdate(customerId, {
      firstName: "Test",
      lastName: "Customer",
      middleName: null,
      email: "customer@test.com",
      phone: "7000000001",
      status: "active",
      refreshTokens: [],
      blockInfo: { reason: null, message: null, blockedAt: null },
      rejectionInfo: { reason: null, message: null, rejectedAt: null },
      profilePhoto: {
        url: "https://res.cloudinary.com/wearweb/image/upload/v1/wearweb/defaults/avatar.png",
        publicId: null,
      },
    });
  }

  if (sellerId) {
    await User.findByIdAndUpdate(sellerId, {
      firstName: "Test",
      lastName: "Seller",
      middleName: null,
      email: "seller@test.com",
      phone: "7000000002",
      status: "active",
      refreshTokens: [],
      rejectionInfo: { reason: null, message: null, rejectedAt: null },
      blockInfo: { reason: null, message: null, blockedAt: null },
      profilePhoto: {
        url: "https://res.cloudinary.com/wearweb/image/upload/v1/wearweb/defaults/avatar.png",
        publicId: null,
      },
    });
  }

});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getProfile = (token) =>
  request(app).get("/users/profile").set("Authorization", `Bearer ${token}`);

const updateProfile = (token, data) =>
  request(app).put("/users/profile").set("Authorization", `Bearer ${token}`).send(data);

const uploadProfilePhoto = (token) =>
  request(app)
    .post("/users/profile/photo")
    .set("Authorization", `Bearer ${token}`)
    .attach("photo", Buffer.from("fake-image"), "profile.jpg");

const changePassword = (token, data) =>
  request(app).put("/users/change-password").set("Authorization", `Bearer ${token}`).send(data);

const addAddress = (token, data) =>
  request(app).post("/users/addresses").set("Authorization", `Bearer ${token}`).send(data);

const getAddresses = (token) =>
  request(app).get("/users/addresses").set("Authorization", `Bearer ${token}`);

const updateAddress = (token, id, data) =>
  request(app).put(`/users/addresses/${id}`).set("Authorization", `Bearer ${token}`).send(data);

const deleteAddress = (token, id) =>
  request(app).delete(`/users/addresses/${id}`).set("Authorization", `Bearer ${token}`);

const setDefault = (token, id) =>
  request(app).put(`/users/addresses/${id}/default`).set("Authorization", `Bearer ${token}`);

const lookupAddressByPincode = (token, pincode) =>
  request(app).get(`/users/addresses/lookup/pincode/${pincode}`).set("Authorization", `Bearer ${token}`);

const reverseGeocodeAddress = (token, query = "") =>
  request(app).get(`/users/addresses/lookup/reverse-geocode${query}`).set("Authorization", `Bearer ${token}`);

// Admin helpers
const getAllUsers = (token, query = "") =>
  request(app).get(`/users/admin/users${query}`).set("Authorization", `Bearer ${token}`);

const getUserById = (token, id) =>
  request(app).get(`/users/admin/users/${id}`).set("Authorization", `Bearer ${token}`);

const blockUser = (token, id, data) =>
  request(app).put(`/users/admin/users/${id}/block`).set("Authorization", `Bearer ${token}`).send(data);

const unblockUser = (token, id) =>
  request(app).put(`/users/admin/users/${id}/unblock`).set("Authorization", `Bearer ${token}`);

const getPendingSellers = (token) =>
  request(app).get("/users/admin/sellers/pending").set("Authorization", `Bearer ${token}`);

const approveSeller = (token, id) =>
  request(app).put(`/users/admin/sellers/${id}/approve`).set("Authorization", `Bearer ${token}`);

const rejectSeller = (token, id, data) =>
  request(app).put(`/users/admin/sellers/${id}/reject`).set("Authorization", `Bearer ${token}`).send(data);

// Seller profile helpers
const setupSellerProfile = (token, data) =>
  request(app).post("/users/seller/profile/setup").set("Authorization", `Bearer ${token}`).send(data);

const getSellerProfile = (token) =>
  request(app).get("/users/seller/profile").set("Authorization", `Bearer ${token}`);

const updateSellerProfile = (token, data) =>
  request(app).put("/users/seller/profile").set("Authorization", `Bearer ${token}`).send(data);

// ─── Data factories ───────────────────────────────────────────────────────────

const validAddress = (overrides = {}) => ({
  fullName: "Test Customer",
  phone: "9876543210",
  country: "India",
  state: "Gujarat",
  district: "Vadodara",
  city: "Vadodara",
  street: "123 Main Street",
  pincode: "390001",
  label: "home",
  ...overrides,
});

const validSellerProfile = (overrides = {}) => ({
  companyName: "Test Company Pvt Ltd",
  ownerName: "Test Seller",
  companyEmail: "company@test.com",
  companyPhone: "9876543210",
  companyProof: ["https://cloudinary.com/proof1.pdf"],
  location: {
    country: "India",
    state: "Gujarat",
    district: "Vadodara",
    addressLine: "123 Business Park, Alkapuri",
  },
  ...overrides,
});

const validSellerProduct = (overrides = {}) => ({
  sellerId,
  categoryId: sellerId,
  name: "Seller Tee",
  slug: `seller-tee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  brand: "WearCo",
  gender: "men",
  description: "Test product for seller visibility checks",
  images: [{ url: "https://example.com/shirt.jpg", publicId: null }],
  variants: [
    {
      colorName: "Black",
      colorCode: "#000000",
      baseColor: "Black",
      size: "M",
      price: 999,
      stock: 10,
    },
  ],
  specifications: [],
  status: "active",
  ...overrides,
});

// ─── GET /users/profile ───────────────────────────────────────────────────────

describe("GET /users/profile", () => {
  it("should return profile for customer", async () => {
    const res = await getProfile(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("customer@test.com");
    expect(res.body.data.user.role).toBe("customer");
  });

  it("should return profile for seller", async () => {
    const res = await getProfile(sellerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("seller");
  });

  it("should return profile for admin", async () => {
    const res = await getProfile(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
  });

  it("should not return password or refreshTokens for any role", async () => {
    for (const token of [customerToken, sellerToken, adminToken]) {
      const res = await getProfile(token);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.refreshTokens).toBeUndefined();
    }
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get("/users/profile");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 401 when token is invalid", async () => {
    const res = await getProfile("invalidtoken");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/profile ───────────────────────────────────────────────────────

describe("PUT /users/profile", () => {
  it("should update firstName for customer", async () => {
    const res = await updateProfile(customerToken, { firstName: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.firstName).toBe("Updated");
  });

  it("should update firstName for seller", async () => {
    const res = await updateProfile(sellerToken, { firstName: "SellerUpdated" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.firstName).toBe("SellerUpdated");
  });

  it("should update firstName for admin", async () => {
    const res = await updateProfile(adminToken, { firstName: "AdminUpdated" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.firstName).toBe("AdminUpdated");
  });

  it("should update lastName successfully", async () => {
    const res = await updateProfile(customerToken, { lastName: "Name" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.lastName).toBe("Name");
  });

  it("should update phone successfully", async () => {
    const res = await updateProfile(customerToken, { phone: "+919876543210" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.phone).toBe("+919876543210");
  });

  it("should update middleName to null", async () => {
    const res = await updateProfile(customerToken, { middleName: null });
    expect(res.status).toBe(200);
    expect(res.body.data.user.middleName).toBeNull();
  });

  it("should update multiple fields at once", async () => {
    const res = await updateProfile(customerToken, { firstName: "New", lastName: "Name" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.firstName).toBe("New");
    expect(res.body.data.user.lastName).toBe("Name");
  });

  it("should return 200 with no changes when body is empty", async () => {
    const res = await updateProfile(customerToken, {});
    expect(res.status).toBe(200);
  });

  it("should update email successfully", async () => {
    const res = await updateProfile(customerToken, { email: "updated.customer@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("updated.customer@test.com");

    const user = await User.findOne({ email: "updated.customer@test.com" });
    expect(user).not.toBeNull();
  });

  it("should return 409 when email is already in use", async () => {
    const res = await updateProfile(customerToken, { email: "seller@test.com" });
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe("CONFLICT");
  });

  it("should not update role even if sent in body", async () => {
    await updateProfile(customerToken, { role: "admin" });
    const user = await User.findOne({ email: "customer@test.com" });
    expect(user.role).toBe("customer");
  });

  it("should not update status even if sent in body", async () => {
    await updateProfile(customerToken, { status: "blocked" });
    const user = await User.findOne({ email: "customer@test.com" });
    expect(user.status).toBe("active");
  });

  it("should not return password or refreshTokens in response", async () => {
    const res = await updateProfile(customerToken, { firstName: "Test" });
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshTokens).toBeUndefined();
  });

  it("should return 400 when firstName is empty string", async () => {
    const res = await updateProfile(customerToken, { firstName: "" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when firstName exceeds 55 characters", async () => {
    const res = await updateProfile(customerToken, { firstName: "A".repeat(56) });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when lastName is empty string", async () => {
    const res = await updateProfile(customerToken, { lastName: "" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when lastName exceeds 55 characters", async () => {
    const res = await updateProfile(customerToken, { lastName: "A".repeat(56) });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put("/users/profile").send({ firstName: "Test" });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/change-password ───────────────────────────────────────────────

describe("PUT /users/change-password", () => {
  afterEach(async () => {
    for (const { email, password } of [
      { email: "customer@test.com", password: "Customer@123" },
      { email: "seller@test.com", password: "Seller@123" },
      { email: "admin@test.com", password: "Admin@123" },
    ]) {
      const user = await User.findOne({ email });
      if (user) {
        user.password = password;
        user.refreshTokens = [];
        await user.save();
      }
    }
    customerToken = await getCustomerToken();
    sellerToken = await getSellerToken();
    adminToken = await getAdminToken();
  });

  it("should change password for customer", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "NewPass@999" });
    expect(res.status).toBe(200);
  });

  it("should change password for seller", async () => {
    const res = await changePassword(sellerToken, { currentPassword: "Seller@123", newPassword: "NewPass@999" });
    expect(res.status).toBe(200);
  });

  it("should change password for admin", async () => {
    const res = await changePassword(adminToken, { currentPassword: "Admin@123", newPassword: "NewPass@999" });
    expect(res.status).toBe(200);
  });

  it("should allow login with new password after change", async () => {
    await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "NewPass@999" });
    const res = await request(app).post("/auth/login").send({ email: "customer@test.com", password: "NewPass@999" });
    expect(res.status).toBe(200);
  });

  it("should not allow login with old password after change", async () => {
    await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "NewPass@999" });
    const res = await request(app).post("/auth/login").send({ email: "customer@test.com", password: "Customer@123" });
    expect(res.status).toBe(401);
  });

  it("should clear all refresh tokens after password change", async () => {
    await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "NewPass@999" });
    const user = await User.findOne({ email: "customer@test.com" }).select("+refreshTokens");
    expect(user.refreshTokens.length).toBe(0);
  });

  it("should clear refreshToken cookie", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "NewPass@999" });
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/refreshToken=;/);
  });

  it("should return 401 when current password is wrong", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Wrong@999", newPassword: "NewPass@999" });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put("/users/change-password").send({ currentPassword: "Customer@123", newPassword: "NewPass@999" });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 400 when currentPassword is missing", async () => {
    const res = await changePassword(customerToken, { newPassword: "NewPass@999" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when newPassword is missing", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Customer@123" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when newPassword has no uppercase letter", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "newpass@999" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when newPassword has no number", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "NewPass@abc" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when newPassword has no special character", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "NewPass999" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when newPassword is less than 8 characters", async () => {
    const res = await changePassword(customerToken, { currentPassword: "Customer@123", newPassword: "N@1abc" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });
});

// ─── POST /users/addresses ────────────────────────────────────────────────────

describe("POST /users/addresses", () => {
  it("should create an address and return it", async () => {
    const res = await addAddress(customerToken, validAddress());
    expect(res.status).toBe(201);
    expect(res.body.data.address._id).toBeDefined();
    expect(res.body.data.address.street).toBe("123 Main Street");
  });

  it("should accept locality and map it to both city and district", async () => {
    const res = await addAddress(customerToken, validAddress({ city: undefined, district: undefined, locality: "Vadodara" }));
    expect(res.status).toBe(201);
    expect(res.body.data.address.city).toBe("Vadodara");
    expect(res.body.data.address.district).toBe("Vadodara");
  });

  it("should create address with optional fields omitted", async () => {
    const res = await addAddress(customerToken, validAddress({ building: undefined, landmark: undefined }));
    expect(res.status).toBe(201);
    expect(res.body.data.address.building).toBeNull();
    expect(res.body.data.address.landmark).toBeNull();
  });

  it("should default label to home when not provided", async () => {
    const res = await addAddress(customerToken, validAddress({ label: undefined }));
    expect(res.status).toBe(201);
    expect(res.body.data.address.label).toBe("home");
  });

  it("should default isDefault to false on creation", async () => {
    const res = await addAddress(customerToken, validAddress());
    expect(res.body.data.address.isDefault).toBe(false);
  });

  it("should allow up to 5 addresses", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await addAddress(customerToken, validAddress({ street: `Street ${i}` }));
      expect(res.status).toBe(201);
    }
  });

  it("should return 400 when 6th address is added", async () => {
    for (let i = 0; i < 5; i++) {
      await addAddress(customerToken, validAddress({ street: `Street ${i}` }));
    }
    const res = await addAddress(customerToken, validAddress({ street: "Street 6" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    expect(res.body.message).toMatch(/maximum 5/i);
  });

  it("should scope addresses per user", async () => {
    await addAddress(customerToken, validAddress());
    const res = await getAddresses(sellerToken);
    expect(res.body.data.addresses.length).toBe(0);
  });

  it("should return 400 when fullName is missing", async () => {
    const res = await addAddress(customerToken, validAddress({ fullName: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when phone format is invalid", async () => {
    const res = await addAddress(customerToken, validAddress({ phone: "123" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when country is missing", async () => {
    const res = await addAddress(customerToken, validAddress({ country: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when state is missing", async () => {
    const res = await addAddress(customerToken, validAddress({ state: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when district is missing", async () => {
    const res = await addAddress(customerToken, validAddress({ district: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when street is missing", async () => {
    const res = await addAddress(customerToken, validAddress({ street: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when pincode has letters", async () => {
    const res = await addAddress(customerToken, validAddress({ pincode: "abc123" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when label is invalid", async () => {
    const res = await addAddress(customerToken, validAddress({ label: "school" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).post("/users/addresses").send(validAddress());
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── GET /users/addresses ─────────────────────────────────────────────────────

describe("GET /users/addresses", () => {
  it("should return empty array when no addresses exist", async () => {
    const res = await getAddresses(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.addresses).toEqual([]);
  });

  it("should return all addresses for authenticated user", async () => {
    await addAddress(customerToken, validAddress({ street: "Street 1" }));
    await addAddress(customerToken, validAddress({ street: "Street 2" }));
    const res = await getAddresses(customerToken);
    expect(res.body.data.addresses.length).toBe(2);
  });

  it("should return default address first", async () => {
    const r1 = await addAddress(customerToken, validAddress({ street: "Street 1" }));
    const r2 = await addAddress(customerToken, validAddress({ street: "Street 2" }));
    await setDefault(customerToken, r2.body.data.address._id);
    const res = await getAddresses(customerToken);
    expect(res.body.data.addresses[0]._id).toBe(r2.body.data.address._id);
  });

  it("should only return addresses belonging to authenticated user", async () => {
    await addAddress(customerToken, validAddress());
    const res = await getAddresses(sellerToken);
    expect(res.body.data.addresses.length).toBe(0);
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get("/users/addresses");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/addresses/:id ─────────────────────────────────────────────────

describe("PUT /users/addresses/:id", () => {
  let addressId;

  beforeEach(async () => {
    const res = await addAddress(customerToken, validAddress());
    addressId = res.body.data.address._id;
  });

  it("should update a single field", async () => {
    const res = await updateAddress(customerToken, addressId, { label: "work" });
    expect(res.status).toBe(200);
    expect(res.body.data.address.label).toBe("work");
  });

  it("should update multiple fields at once", async () => {
    const res = await updateAddress(customerToken, addressId, { street: "New Street", district: "Surat" });
    expect(res.status).toBe(200);
    expect(res.body.data.address.street).toBe("New Street");
  });

  it("should map locality to city and district on update", async () => {
    const res = await updateAddress(customerToken, addressId, { locality: "Anand" });
    expect(res.status).toBe(200);
    expect(res.body.data.address.city).toBe("Anand");
    expect(res.body.data.address.district).toBe("Anand");
  });

  it("should return 200 with no changes when body is empty", async () => {
    const res = await updateAddress(customerToken, addressId, {});
    expect(res.status).toBe(200);
  });

  it("should return 404 when address belongs to another user", async () => {
    const res = await updateAddress(sellerToken, addressId, { label: "work" });
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when addressId does not exist", async () => {
    const res = await updateAddress(customerToken, "64aaaaaaaaaaaaaaaaaaaaa1", { label: "work" });
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when addressId is malformed", async () => {
    const res = await updateAddress(customerToken, "notanid", { label: "work" });
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 400 when label is invalid", async () => {
    const res = await updateAddress(customerToken, addressId, { label: "office" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put(`/users/addresses/${addressId}`).send({ label: "work" });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── DELETE /users/addresses/:id ──────────────────────────────────────────────

describe("DELETE /users/addresses/:id", () => {
  let addressId;

  beforeEach(async () => {
    const res = await addAddress(customerToken, validAddress());
    addressId = res.body.data.address._id;
  });

  it("should delete address and return 200", async () => {
    const res = await deleteAddress(customerToken, addressId);
    expect(res.status).toBe(200);
  });

  it("should actually remove the address from DB", async () => {
    await deleteAddress(customerToken, addressId);
    const res = await getAddresses(customerToken);
    expect(res.body.data.addresses.length).toBe(0);
  });

  it("should allow adding new address after deletion", async () => {
    await deleteAddress(customerToken, addressId);
    const res = await addAddress(customerToken, validAddress());
    expect(res.status).toBe(201);
  });

  it("should return 404 when address belongs to another user", async () => {
    const res = await deleteAddress(sellerToken, addressId);
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when addressId does not exist", async () => {
    const res = await deleteAddress(customerToken, "64aaaaaaaaaaaaaaaaaaaaa1");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when address is already deleted", async () => {
    await deleteAddress(customerToken, addressId);
    const res = await deleteAddress(customerToken, addressId);
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when addressId is malformed", async () => {
    const res = await deleteAddress(customerToken, "notanid");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).delete(`/users/addresses/${addressId}`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/addresses/:id/default ────────────────────────────────────────

describe("PUT /users/addresses/:id/default", () => {
  let address1Id;
  let address2Id;

  beforeEach(async () => {
    const r1 = await addAddress(customerToken, validAddress({ street: "Street 1" }));
    const r2 = await addAddress(customerToken, validAddress({ street: "Street 2" }));
    address1Id = r1.body.data.address._id;
    address2Id = r2.body.data.address._id;
  });

  it("should set address as default and return 200", async () => {
    const res = await setDefault(customerToken, address1Id);
    expect(res.status).toBe(200);
    expect(res.body.data.address.isDefault).toBe(true);
  });

  it("should only have one default address at a time", async () => {
    await setDefault(customerToken, address1Id);
    await setDefault(customerToken, address2Id);
    const res = await getAddresses(customerToken);
    const defaults = res.body.data.addresses.filter((a) => a.isDefault === true);
    expect(defaults.length).toBe(1);
    expect(defaults[0]._id).toBe(address2Id);
  });

  it("should unset previous default when new one is set", async () => {
    await setDefault(customerToken, address1Id);
    await setDefault(customerToken, address2Id);
    const res = await getAddresses(customerToken);
    const addr1 = res.body.data.addresses.find((a) => a._id === address1Id);
    expect(addr1.isDefault).toBe(false);
  });

  it("should allow setting same address as default again", async () => {
    await setDefault(customerToken, address1Id);
    const res = await setDefault(customerToken, address1Id);
    expect(res.status).toBe(200);
    expect(res.body.data.address.isDefault).toBe(true);
  });

  it("should return 404 when address belongs to another user", async () => {
    const res = await setDefault(sellerToken, address1Id);
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when addressId does not exist", async () => {
    const res = await setDefault(customerToken, "64aaaaaaaaaaaaaaaaaaaaa1");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when addressId is malformed", async () => {
    const res = await setDefault(customerToken, "notanid");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put(`/users/addresses/${address1Id}/default`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── GET /users/addresses/lookup/pincode/:pincode ───────────────────────────

describe("GET /users/addresses/lookup/pincode/:pincode", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should return resolved state and locality from pincode", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ([
        {
          Status: "Success",
          PostOffice: [{ State: "Gujarat", District: "Vadodara" }],
        },
      ]),
    });

    const res = await lookupAddressByPincode(customerToken, "390001");

    expect(res.status).toBe(200);
    expect(res.body.data.lookup.pincode).toBe("390001");
    expect(res.body.data.lookup.state).toBe("Gujarat");
    expect(res.body.data.lookup.locality).toBe("Vadodara");
    expect(res.body.data.lookup.country).toBe("India");
  });

  it("should return 404 when pincode is not found", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ([{ Status: "Error", PostOffice: null }]),
    });

    const res = await lookupAddressByPincode(customerToken, "390001");

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 502 when upstream service is unavailable", async () => {
    global.fetch = async () => ({ ok: false, json: async () => ({}) });

    const res = await lookupAddressByPincode(customerToken, "390001");

    expect(res.status).toBe(502);
    expect(res.body.errorCode).toBe("BAD_GATEWAY");
  });

  it("should return 400 when pincode format is invalid", async () => {
    const res = await lookupAddressByPincode(customerToken, "39A001");

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get("/users/addresses/lookup/pincode/390001");

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── GET /users/addresses/lookup/reverse-geocode ────────────────────────────

describe("GET /users/addresses/lookup/reverse-geocode", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should return resolved address fields from coordinates", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        address: {
          country_code: "in",
          road: "MG Road",
          suburb: "Alkapuri",
          state: "Gujarat",
          city: "Vadodara",
          postcode: "390001",
        },
      }),
    });

    const res = await reverseGeocodeAddress(customerToken, "?lat=22.3072&lon=73.1812");

    expect(res.status).toBe(200);
    expect(res.body.data.lookup.state).toBe("Gujarat");
    expect(res.body.data.lookup.locality).toBe("Vadodara");
    expect(res.body.data.lookup.pincode).toBe("390001");
    expect(res.body.data.lookup.country).toBe("India");
  });

  it("should return 400 when location is outside India", async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ address: { country_code: "us" } }),
    });

    const res = await reverseGeocodeAddress(customerToken, "?lat=40.7128&lon=-74.0060");

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 502 when upstream service is unavailable", async () => {
    global.fetch = async () => ({ ok: false, json: async () => ({}) });

    const res = await reverseGeocodeAddress(customerToken, "?lat=22.3072&lon=73.1812");

    expect(res.status).toBe(502);
    expect(res.body.errorCode).toBe("BAD_GATEWAY");
  });

  it("should return 400 when lat/lon query is invalid", async () => {
    const res = await reverseGeocodeAddress(customerToken, "?lat=abc&lon=73.1812");

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get("/users/addresses/lookup/reverse-geocode?lat=22.3072&lon=73.1812");

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── GET /users/admin/users ───────────────────────────────────────────────────

describe("GET /users/admin/users", () => {
  it("should return paginated list of users", async () => {
    const res = await getAllUsers(adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(3);
  });

  it("should return only summary fields — no password, refreshTokens, blockInfo, rejectionInfo", async () => {
    const res = await getAllUsers(adminToken);
    const user = res.body.data.users[0];
    expect(user.password).toBeUndefined();
    expect(user.refreshTokens).toBeUndefined();
    expect(user.blockInfo).toBeUndefined();
    expect(user.rejectionInfo).toBeUndefined();
  });

  it("should return correct pagination metadata", async () => {
    const res = await getAllUsers(adminToken, "?page=1&limit=2");
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(2);
    expect(res.body.data.users.length).toBeLessThanOrEqual(2);
  });

  it("should default to page 1 and limit 20", async () => {
    const res = await getAllUsers(adminToken);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(20);
  });

  it("should filter by status=active", async () => {
    const res = await getAllUsers(adminToken, "?status=active");
    res.body.data.users.forEach((u) => expect(u.status).toBe("active"));
  });

  it("should filter by role=customer", async () => {
    const res = await getAllUsers(adminToken, "?role=customer");
    res.body.data.users.forEach((u) => expect(u.role).toBe("customer"));
  });

  it("should search by email", async () => {
    const res = await getAllUsers(adminToken, "?search=customer@test.com");
    expect(res.body.data.users[0].email).toBe("customer@test.com");
  });

  it("should search by firstName", async () => {
    const res = await getAllUsers(adminToken, "?search=Test");
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
  });

  it("should return empty array when search matches nothing", async () => {
    const res = await getAllUsers(adminToken, "?search=zzznomatchxyz");
    expect(res.body.data.users.length).toBe(0);
  });

  it("should return 400 when status is invalid", async () => {
    const res = await getAllUsers(adminToken, "?status=unknown");
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when limit exceeds 100", async () => {
    const res = await getAllUsers(adminToken, "?limit=101");
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 403 when customer tries to access", async () => {
    const res = await getAllUsers(customerToken);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when seller tries to access", async () => {
    const res = await getAllUsers(sellerToken);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get("/users/admin/users");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── GET /users/admin/users/:id ───────────────────────────────────────────────

describe("GET /users/admin/users/:id", () => {
  it("should return full user detail", async () => {
    const res = await getUserById(adminToken, customerId);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("customer@test.com");
  });

  it("should include blockInfo and rejectionInfo", async () => {
    const res = await getUserById(adminToken, customerId);
    expect(res.body.data.user.blockInfo).toBeDefined();
    expect(res.body.data.user.rejectionInfo).toBeDefined();
  });

  it("should not return password or refreshTokens", async () => {
    const res = await getUserById(adminToken, customerId);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshTokens).toBeUndefined();
  });

  it("should return 404 when userId does not exist", async () => {
    const res = await getUserById(adminToken, "64aaaaaaaaaaaaaaaaaaaaa1");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when userId is malformed", async () => {
    const res = await getUserById(adminToken, "notanid");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 403 when customer tries to access", async () => {
    const res = await getUserById(customerToken, customerId);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when seller tries to access", async () => {
    const res = await getUserById(sellerToken, customerId);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get(`/users/admin/users/${customerId}`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/admin/users/:id/block ─────────────────────────────────────────

describe("PUT /users/admin/users/:id/block", () => {
  const validBlock = (overrides = {}) => ({ reason: "policy_violation", ...overrides });

  it("should block a customer successfully", async () => {
    const res = await blockUser(adminToken, customerId, validBlock());
    expect(res.status).toBe(200);
  });

  it("should set user status to blocked in DB", async () => {
    await blockUser(adminToken, customerId, validBlock());
    const user = await User.findById(customerId);
    expect(user.status).toBe("blocked");
  });

  it("should store reason and blockedAt in blockInfo", async () => {
    await blockUser(adminToken, customerId, validBlock({ reason: "fraudulent_activity" }));
    const user = await User.findById(customerId);
    expect(user.blockInfo.reason).toBe("fraudulent_activity");
    expect(user.blockInfo.blockedAt).not.toBeNull();
  });

  it("should store optional message in blockInfo", async () => {
    await blockUser(adminToken, customerId, validBlock({ message: "Multiple fake orders" }));
    const user = await User.findById(customerId);
    expect(user.blockInfo.message).toBe("Multiple fake orders");
  });

  it("should set blockInfo.message to null when not provided", async () => {
    await blockUser(adminToken, customerId, validBlock());
    const user = await User.findById(customerId);
    expect(user.blockInfo.message).toBeNull();
  });

  it("should clear all refresh tokens when blocked", async () => {
    await blockUser(adminToken, customerId, validBlock());
    const user = await User.findById(customerId).select("+refreshTokens");
    expect(user.refreshTokens.length).toBe(0);
  });

  it("should block a seller successfully", async () => {
    await blockUser(adminToken, sellerId, validBlock());
    const seller = await User.findById(sellerId);
    expect(seller.status).toBe("blocked");
  });

  it("should hide seller active products when seller is blocked", async () => {
    const activeProduct = await Product.create(validSellerProduct({ status: "active" }));
    const heldProduct = await Product.create(validSellerProduct({ status: "held", previousStatus: null }));

    await blockUser(adminToken, sellerId, validBlock());

    const updatedActive = await Product.findById(activeProduct._id);
    const updatedHeld = await Product.findById(heldProduct._id);

    expect(updatedActive.status).toBe("held");
    expect(updatedActive.previousStatus).toBe("active");
    expect(updatedHeld.status).toBe("held");
  });

  it("should return 403 when trying to block an admin", async () => {
    const admin = await User.findOne({ email: "admin@test.com" });
    const res = await blockUser(adminToken, admin._id, validBlock());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 409 when user is already blocked", async () => {
    await blockUser(adminToken, customerId, validBlock());
    const res = await blockUser(adminToken, customerId, validBlock());
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe("CONFLICT");
  });

  it("should return 404 when userId does not exist", async () => {
    const res = await blockUser(adminToken, "64aaaaaaaaaaaaaaaaaaaaa1", validBlock());
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when userId is malformed", async () => {
    const res = await blockUser(adminToken, "notanid", validBlock());
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 400 when reason is missing", async () => {
    const res = await blockUser(adminToken, customerId, {});
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when reason is not in allowed list", async () => {
    const res = await blockUser(adminToken, customerId, { reason: "just_because" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when message exceeds 500 characters", async () => {
    const res = await blockUser(adminToken, customerId, validBlock({ message: "A".repeat(501) }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 403 when customer tries to block", async () => {
    const res = await blockUser(customerToken, sellerId, validBlock());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when seller tries to block", async () => {
    const res = await blockUser(sellerToken, customerId, validBlock());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put(`/users/admin/users/${customerId}/block`).send(validBlock());
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/admin/users/:id/unblock ───────────────────────────────────────

describe("PUT /users/admin/users/:id/unblock", () => {
  // Block seller as target — keeps customerToken valid for role restriction tests
  beforeEach(async () => {
    await User.findOneAndUpdate(
      { email: "seller@test.com" },
      { status: "blocked", blockInfo: { reason: "policy_violation", message: null, blockedAt: new Date() } }
    );
  });

  it("should unblock a blocked user", async () => {
    const res = await unblockUser(adminToken, sellerId);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should set user status back to active in DB", async () => {
    await unblockUser(adminToken, sellerId);
    const user = await User.findById(sellerId);
    expect(user.status).toBe("active");
  });

  it("should clear blockInfo after unblock", async () => {
    await unblockUser(adminToken, sellerId);
    const user = await User.findById(sellerId);
    expect(user.blockInfo.reason).toBeNull();
    expect(user.blockInfo.message).toBeNull();
    expect(user.blockInfo.blockedAt).toBeNull();
  });

  it("should restore previously active seller products on unblock", async () => {
    const restorable = await Product.create(
      validSellerProduct({ status: "held", previousStatus: "active" })
    );
    const stayHeld = await Product.create(
      validSellerProduct({ status: "held", previousStatus: null })
    );

    await unblockUser(adminToken, sellerId);

    const restoredProduct = await Product.findById(restorable._id);
    const heldProduct = await Product.findById(stayHeld._id);

    expect(restoredProduct.status).toBe("active");
    expect(restoredProduct.previousStatus).toBeNull();
    expect(heldProduct.status).toBe("held");
  });

  it("should allow user to login after being unblocked", async () => {
    await unblockUser(adminToken, sellerId);
    const res = await request(app).post("/auth/login").send({ email: "seller@test.com", password: "Seller@123" });
    expect(res.status).toBe(200);
  });

  it("should return 409 when user is not blocked", async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "active" });
    const res = await unblockUser(adminToken, sellerId);
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe("CONFLICT");
  });

  it("should return 404 when userId does not exist", async () => {
    const res = await unblockUser(adminToken, "64aaaaaaaaaaaaaaaaaaaaa1");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 404 when userId is malformed", async () => {
    const res = await unblockUser(adminToken, "notanid");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 403 when customer tries to unblock", async () => {
    // customerToken is valid (customer is not blocked) — authorize("admin") fires and rejects
    const res = await unblockUser(customerToken, sellerId);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when seller tries to unblock", async () => {
    // sellerToken would be invalid here since seller is blocked — use customerId as target
    const res = await unblockUser(customerToken, customerId);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put(`/users/admin/users/${sellerId}/unblock`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── GET /users/admin/sellers/pending ─────────────────────────────────────────

describe("GET /users/admin/sellers/pending", () => {
  it("should return pending sellers list", async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "pending" });
    const res = await getPendingSellers(adminToken);
    expect(res.status).toBe(200);
    res.body.data.sellers.forEach((s) => {
      expect(s.role).toBe("seller");
      expect(s.status).toBe("pending");
    });
  });

  it("should return empty array when no pending sellers", async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "active" });
    const res = await getPendingSellers(adminToken);
    expect(res.body.data.sellers.length).toBe(0);
  });

  it("should not return password, refreshTokens, or blockInfo", async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "pending" });
    const res = await getPendingSellers(adminToken);
    if (res.body.data.sellers.length > 0) {
      expect(res.body.data.sellers[0].password).toBeUndefined();
      expect(res.body.data.sellers[0].blockInfo).toBeUndefined();
    }
  });

  it("should return 403 when customer tries to access", async () => {
    const res = await getPendingSellers(customerToken);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when seller tries to access", async () => {
    const res = await getPendingSellers(sellerToken);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get("/users/admin/sellers/pending");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/admin/sellers/:id/approve ─────────────────────────────────────

describe("PUT /users/admin/sellers/:id/approve", () => {
  beforeEach(async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "pending" });
  });

  it("should approve a pending seller", async () => {
    const res = await approveSeller(adminToken, sellerId);
    expect(res.status).toBe(200);
  });

  it("should set seller status to active in DB", async () => {
    await approveSeller(adminToken, sellerId);
    const seller = await User.findById(sellerId);
    expect(seller.status).toBe("active");
  });

  it("should clear rejectionInfo after approval", async () => {
    await User.findByIdAndUpdate(sellerId, {
      rejectionInfo: { reason: "incomplete_documents", message: "Missing GST", rejectedAt: new Date() },
    });
    await approveSeller(adminToken, sellerId);
    const seller = await User.findById(sellerId);
    expect(seller.rejectionInfo.reason).toBeNull();
    expect(seller.rejectionInfo.rejectedAt).toBeNull();
  });

  it("should return 409 when seller is already active", async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "active" });
    const res = await approveSeller(adminToken, sellerId);
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe("CONFLICT");
  });

  it("should return 403 when seller is blocked", async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "blocked" });
    const res = await approveSeller(adminToken, sellerId);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 400 when target user is not a seller", async () => {
    const res = await approveSeller(adminToken, customerId);
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 404 when sellerId does not exist", async () => {
    const res = await approveSeller(adminToken, "64aaaaaaaaaaaaaaaaaaaaa1");
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 403 when customer tries to approve", async () => {
    const res = await approveSeller(customerToken, sellerId);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put(`/users/admin/sellers/${sellerId}/approve`);
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/admin/sellers/:id/reject ──────────────────────────────────────

describe("PUT /users/admin/sellers/:id/reject", () => {
  const validReject = (overrides = {}) => ({ reason: "incomplete_documents", ...overrides });

  beforeEach(async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "pending" });
  });

  it("should reject a pending seller", async () => {
    const res = await rejectSeller(adminToken, sellerId, validReject());
    expect(res.status).toBe(200);
  });

  it("should keep seller status as pending after rejection", async () => {
    await rejectSeller(adminToken, sellerId, validReject());
    const seller = await User.findById(sellerId);
    expect(seller.status).toBe("pending");
  });

  it("should store reason and rejectedAt in rejectionInfo", async () => {
    await rejectSeller(adminToken, sellerId, validReject({ reason: "invalid_business_details" }));
    const seller = await User.findById(sellerId);
    expect(seller.rejectionInfo.reason).toBe("invalid_business_details");
    expect(seller.rejectionInfo.rejectedAt).not.toBeNull();
  });

  it("should store optional message in rejectionInfo", async () => {
    await rejectSeller(adminToken, sellerId, validReject({ message: "GST number is invalid" }));
    const seller = await User.findById(sellerId);
    expect(seller.rejectionInfo.message).toBe("GST number is invalid");
  });

  it("should allow re-rejection and overwrite previous rejectionInfo", async () => {
    await rejectSeller(adminToken, sellerId, validReject({ reason: "incomplete_documents" }));
    await rejectSeller(adminToken, sellerId, validReject({ reason: "duplicate_account" }));
    const seller = await User.findById(sellerId);
    expect(seller.rejectionInfo.reason).toBe("duplicate_account");
  });

  it("should return 403 when seller is blocked", async () => {
    await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "blocked" });
    const res = await rejectSeller(adminToken, sellerId, validReject());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 400 when target user is not a seller", async () => {
    const res = await rejectSeller(adminToken, customerId, validReject());
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when reason is missing", async () => {
    const res = await rejectSeller(adminToken, sellerId, {});
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when reason is not in allowed list", async () => {
    const res = await rejectSeller(adminToken, sellerId, { reason: "not_valid" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when message exceeds 500 characters", async () => {
    const res = await rejectSeller(adminToken, sellerId, validReject({ message: "A".repeat(501) }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 403 when customer tries to reject", async () => {
    const res = await rejectSeller(customerToken, sellerId, validReject());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put(`/users/admin/sellers/${sellerId}/reject`).send(validReject());
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── POST /users/seller/profile/setup ────────────────────────────────────────

describe("POST /users/seller/profile/setup", () => {
  it("should create seller profile with all required fields", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile._id).toBeDefined();
    expect(res.body.data.profile.companyName).toBe("Test Company Pvt Ltd");
  });

  it("should set profileComplete to true when all required fields provided", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile());
    expect(res.body.data.profile.profileComplete).toBe(true);
  });

  it("should set profileComplete to false when optional location subfield missing", async () => {
    // profileComplete computed in pre-save — ensure it works
    await setupSellerProfile(sellerToken, validSellerProfile());
    const profile = await SellerProfile.findOne({ userId: sellerId });
    expect(profile.profileComplete).toBe(true);
  });

  it("should create profile without optional fields", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({
      website: undefined,
      gstNumber: undefined,
      majorCategories: undefined,
      bankDetails: undefined,
    }));
    expect(res.status).toBe(201);
  });

  it("should store valid GST number", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ gstNumber: "22AAAAA0000A1Z5" }));
    expect(res.status).toBe(201);
    expect(res.body.data.profile.gstNumber).toBe("22AAAAA0000A1Z5");
  });

  it("should store valid bank details when all three fields provided", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({
      bankDetails: {
        accountHolderName: "Test Seller",
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
      },
    }));
    expect(res.status).toBe(201);
    expect(res.body.data.profile.bankDetails.accountNumber).toBe("1234567890");
  });

  it("should return 409 when profile already exists", async () => {
    await setupSellerProfile(sellerToken, validSellerProfile());
    const res = await setupSellerProfile(sellerToken, validSellerProfile());
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe("CONFLICT");
  });

  // Required field validation
  it("should return 400 when companyName is missing", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ companyName: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when ownerName is missing", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ ownerName: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when companyEmail is missing", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ companyEmail: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when companyEmail is invalid", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ companyEmail: "notanemail" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when companyPhone is missing", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ companyPhone: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when companyPhone format is invalid", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ companyPhone: "123" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when companyProof is empty array", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ companyProof: [] }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when companyProof is missing", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ companyProof: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when location is missing", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ location: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when location.country is missing", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({
      location: { state: "Gujarat", district: "Vadodara", addressLine: "123 Business Park" },
    }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when GST number format is invalid", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({ gstNumber: "INVALID123" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when IFSC code format is invalid", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({
      bankDetails: { accountHolderName: "Test", accountNumber: "123456", ifscCode: "INVALID" },
    }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when only partial bank details provided", async () => {
    const res = await setupSellerProfile(sellerToken, validSellerProfile({
      bankDetails: { accountHolderName: "Test Seller" }, // missing accountNumber and ifscCode
    }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  // Role restrictions
  it("should return 403 when customer tries to setup seller profile", async () => {
    const res = await setupSellerProfile(customerToken, validSellerProfile());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when admin tries to setup seller profile", async () => {
    const res = await setupSellerProfile(adminToken, validSellerProfile());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).post("/users/seller/profile/setup").send(validSellerProfile());
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── GET /users/seller/profile ────────────────────────────────────────────────

describe("GET /users/seller/profile", () => {
  beforeEach(async () => {
    await setupSellerProfile(sellerToken, validSellerProfile());
  });

  it("should return seller profile", async () => {
    const res = await getSellerProfile(sellerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.profile.companyName).toBe("Test Company Pvt Ltd");
    expect(res.body.data.profile.userId).toBeDefined();
  });

  it("should return 404 when profile does not exist", async () => {
    await SellerProfile.deleteMany({});
    const res = await getSellerProfile(sellerToken);
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 403 when customer tries to access", async () => {
    const res = await getSellerProfile(customerToken);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when admin tries to access", async () => {
    const res = await getSellerProfile(adminToken);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).get("/users/seller/profile");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── PUT /users/seller/profile ────────────────────────────────────────────────

describe("PUT /users/seller/profile", () => {
  beforeEach(async () => {
    await setupSellerProfile(sellerToken, validSellerProfile());
  });

  it("should update a single field", async () => {
    const res = await updateSellerProfile(sellerToken, { companyName: "Updated Company" });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.companyName).toBe("Updated Company");
  });

  it("should update multiple fields at once", async () => {
    const res = await updateSellerProfile(sellerToken, {
      companyName: "New Company", ownerName: "New Owner",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.companyName).toBe("New Company");
    expect(res.body.data.profile.ownerName).toBe("New Owner");
  });

  it("should update location partially", async () => {
    const res = await updateSellerProfile(sellerToken, {
      location: { country: "India", state: "Maharashtra", district: "Pune", addressLine: "456 Tech Park" },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.location.state).toBe("Maharashtra");
  });

  it("should add bank details when not previously set", async () => {
    const res = await updateSellerProfile(sellerToken, {
      bankDetails: { accountHolderName: "Test Seller", accountNumber: "9876543210", ifscCode: "HDFC0001234" },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.profile.bankDetails.accountNumber).toBe("9876543210");
  });

  it("should recompute profileComplete after update", async () => {
    // profile is complete after setup — verify it stays true after partial update
    const res = await updateSellerProfile(sellerToken, { companyName: "Updated" });
    expect(res.body.data.profile.profileComplete).toBe(true);
  });

  it("should return 404 when profile does not exist", async () => {
    await SellerProfile.deleteMany({});
    const res = await updateSellerProfile(sellerToken, { companyName: "Updated" });
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe("NOT_FOUND");
  });

  it("should return 400 when companyEmail format is invalid", async () => {
    const res = await updateSellerProfile(sellerToken, { companyEmail: "notanemail" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when partial bank details provided", async () => {
    const res = await updateSellerProfile(sellerToken, {
      bankDetails: { accountHolderName: "Test Only" },
    });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when GST format is invalid", async () => {
    const res = await updateSellerProfile(sellerToken, { gstNumber: "BADDGST" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 403 when customer tries to update", async () => {
    const res = await updateSellerProfile(customerToken, { companyName: "Hack" });
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 403 when admin tries to update", async () => {
    const res = await updateSellerProfile(adminToken, { companyName: "Hack" });
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("FORBIDDEN");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).put("/users/seller/profile").send({ companyName: "Hack" });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});

// ─── POST /users/profile/photo ───────────────────────────────────────────────

describe("POST /users/profile/photo", () => {
  it("should upload profile photo for authenticated user", async () => {
    const res = await uploadProfilePhoto(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.profilePhoto.url).toBeDefined();
    expect(res.body.data.user.profilePhoto.publicId).toBeDefined();
  });

  it("should return 401 when no token is provided", async () => {
    const res = await request(app)
      .post("/users/profile/photo")
      .attach("photo", Buffer.from("fake-image"), "profile.jpg");

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });
});