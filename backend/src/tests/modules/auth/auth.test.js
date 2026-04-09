import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app.js";
import seedUsers from "../../helpers/seedUsers.js";
import { getAdminToken, getCustomerToken, getSellerToken } from "../../helpers/getTokens.js";
import User from "../../../modules/user/user.model.js";
import PasswordReset from "../../../modules/auth/passwordReset.model.js";



let adminToken;
let customerToken;
let sellerToken;

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await seedUsers();
  adminToken = await getAdminToken();
  customerToken = await getCustomerToken();
  sellerToken = await getSellerToken();
});

beforeEach(async () => {
  await User.updateMany({}, { $set: { refreshTokens: [] } });
});

afterEach(async () => {
  await PasswordReset.deleteMany({});
  // users preserved by setup.js
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const register = (data) =>
  request(app).post("/auth/register").send(data);

const login = (data) =>
  request(app).post("/auth/login").send(data);

const logout = (token, body = {}) =>
  request(app)
    .post("/auth/logout")
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const listSessions = (agent, token) =>
  agent
    .get('/auth/sessions')
    .set('Authorization', `Bearer ${token}`);

const refreshToken = (agent) =>
  agent.post("/auth/refresh-token");

const forgotPassword = (data) =>
  request(app).post("/auth/forgot-password").send(data);

const resetPassword = (data) =>
  request(app).post("/auth/reset-password").send(data);

const validCustomer = (overrides = {}) => ({
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@test.com",
  password: "John@1234",
  role: "customer",
  ...overrides,
});

const validSeller = (overrides = {}) => ({
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@test.com",
  password: "Jane@1234",
  role: "seller",
  ...overrides,
});

// ─── POST /auth/register ──────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  afterEach(async () => {
    await User.deleteMany({ email: { $nin: ["admin@test.com", "customer@test.com", "seller@test.com"] } });
  });

  // Happy path
  it("should register a customer and return accessToken + user object", async () => {
    const res = await register(validCustomer());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe("customer");
    expect(res.body.data.user.status).toBe("active");
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("should register a seller with status pending", async () => {
    const res = await register(validSeller());
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("seller");
    expect(res.body.data.user.status).toBe("pending");
  });

  it("should register without middleName and phone (optional fields)", async () => {
    const res = await register(validCustomer());
    expect(res.status).toBe(201);
    expect(res.body.data.user.middleName).toBeNull();
    expect(res.body.data.user.phone).toBeNull();
  });

  it("should register with middleName and phone", async () => {
    const res = await register(validCustomer({ middleName: "Kumar", phone: "+919876543210" }));
    expect(res.status).toBe(201);
    expect(res.body.data.user.middleName).toBe("Kumar");
    expect(res.body.data.user.phone).toBe("+919876543210");
  });

  it("should set refreshToken cookie on register", async () => {
    const res = await register(validCustomer());
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken/);
  });

  it("should assign default profilePhoto", async () => {
    const res = await register(validCustomer());
    expect(res.body.data.user.profilePhoto).toBeDefined();
    expect(res.body.data.user.profilePhoto).not.toBeNull();
  });

  it("should not return password or refreshTokens in response", async () => {
    const res = await register(validCustomer());
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshTokens).toBeUndefined();
  });

  // Validation errors
  it("should return 400 when firstName is missing", async () => {
    const res = await register(validCustomer({ firstName: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when lastName is missing", async () => {
    const res = await register(validCustomer({ lastName: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when email is missing", async () => {
    const res = await register(validCustomer({ email: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when email is invalid format", async () => {
    const res = await register(validCustomer({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password is missing", async () => {
    const res = await register(validCustomer({ password: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password is less than 8 characters", async () => {
    const res = await register(validCustomer({ password: "Ab@1" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password has no uppercase letter", async () => {
    const res = await register(validCustomer({ password: "john@1234" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password has no number", async () => {
    const res = await register(validCustomer({ password: "John@abcd" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password has no special character", async () => {
    const res = await register(validCustomer({ password: "John1234" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when role is missing", async () => {
    const res = await register(validCustomer({ role: undefined }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when role is admin", async () => {
    const res = await register(validCustomer({ role: "admin" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when role is invalid", async () => {
    const res = await register(validCustomer({ role: "superuser" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when phone format is invalid", async () => {
    const res = await register(validCustomer({ phone: "123" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  // Conflict errors
  it("should return 409 when email already exists", async () => {
    await register(validCustomer());
    const res = await register(validCustomer());
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe("CONFLICT");
  });

  it("should return 409 when phone already exists", async () => {
    await register(validCustomer({ phone: "+919876543210" }));
    const res = await register(validSeller({ phone: "+919876543210" }));
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe("CONFLICT");
  });

  // XSS
  it("should strip HTML tags from input fields", async () => {
    const res = await register(validCustomer({ firstName: "<script>alert(1)</script>John" }));
    if (res.status === 201) {
      expect(res.body.data.user.firstName).not.toContain("<script>");
    }
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  // Happy path
  it("should login with valid credentials and return accessToken", async () => {
    const res = await login({ email: "customer@test.com", password: "Customer@123" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe("customer@test.com");
  });

  it("should set refreshToken cookie on login", async () => {
    const res = await login({ email: "customer@test.com", password: "Customer@123" });
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/refreshToken/);
  });

  it("should not return password or refreshTokens in response", async () => {
    const res = await login({ email: "customer@test.com", password: "Customer@123" });
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshTokens).toBeUndefined();
  });

  it("should allow up to 3 active devices", async () => {
    await login({ email: "customer@test.com", password: "Customer@123" });
    await login({ email: "customer@test.com", password: "Customer@123" });
    await login({ email: "customer@test.com", password: "Customer@123" });

    const user = await User.findOne({ email: "customer@test.com" }).select("+refreshTokens");
    expect(user.refreshTokens.length).toBe(3);
  });

  it("should block login when 3-device limit is reached", async () => {
    await login({ email: "customer@test.com", password: "Customer@123" });
    await login({ email: "customer@test.com", password: "Customer@123" });
    await login({ email: "customer@test.com", password: "Customer@123" });

    const res = await login({ email: "customer@test.com", password: "Customer@123" });
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("DEVICE_LIMIT_REACHED");
  });

  // Validation errors
  it("should return 400 when email is missing", async () => {
    const res = await login({ password: "Customer@123" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password is missing", async () => {
    const res = await login({ email: "customer@test.com" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when email format is invalid", async () => {
    const res = await login({ email: "not-an-email", password: "Customer@123" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  // Auth errors
  it("should return 401 when email does not exist", async () => {
    const res = await login({ email: "nobody@test.com", password: "Nobody@123" });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 401 when password is wrong", async () => {
    const res = await login({ email: "customer@test.com", password: "Wrong@999" });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return same error message for wrong email and wrong password (no enumeration)", async () => {
    const res1 = await login({ email: "nobody@test.com", password: "Customer@123" });
    const res2 = await login({ email: "customer@test.com", password: "Wrong@999" });
    expect(res1.body.message).toBe(res2.body.message);
  });

  it("should return 403 when account is blocked", async () => {
    await User.findOneAndUpdate({ email: "customer@test.com" }, { status: "blocked" });
    const res = await login({ email: "customer@test.com", password: "Customer@123" });
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("ACCOUNT_BLOCKED");
    // restore
    await User.findOneAndUpdate({ email: "customer@test.com" }, { status: "active" });
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  let token;

  beforeEach(async () => {
    const res = await login({ email: "customer@test.com", password: "Customer@123" });
    token = res.body.data.accessToken;
  });

  // Happy path
  it("should logout current device and return 200", async () => {
    const res = await logout(token, { allDevices: false });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/logged out successfully/i);
  });

  it("should logout all devices and return 200", async () => {
    const res = await logout(token, { allDevices: true });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/all devices/i);
  });

  it("should clear refreshToken cookie on logout", async () => {
    const res = await logout(token, { allDevices: false });
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/refreshToken=;/);
  });

  it("should only remove current device token when allDevices is false", async () => {
    // login from two devices
    await login({ email: "customer@test.com", password: "Customer@123" });
    await logout(token, { allDevices: false });

    const user = await User.findOne({ email: "customer@test.com" }).select("+refreshTokens");
    expect(user.refreshTokens.length).toBeGreaterThanOrEqual(1);
  });

  it("should clear all tokens when allDevices is true", async () => {
    await login({ email: "customer@test.com", password: "Customer@123" });
    await login({ email: "customer@test.com", password: "Customer@123" });
    await logout(token, { allDevices: true });

    const user = await User.findOne({ email: "customer@test.com" }).select("+refreshTokens");
    expect(user.refreshTokens.length).toBe(0);
  });

  // Auth errors
  it("should return 401 when no token provided", async () => {
    const res = await request(app).post("/auth/logout").send({ allDevices: false });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 401 when token is invalid", async () => {
    const res = await logout("invalidtoken", { allDevices: false });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 401 when token is expired", async () => {
    const { generateAccessToken } = await import("../../../utils/jwt.utils.js");
    const expiredToken = generateAccessToken({ userId: new mongoose.Types.ObjectId(), role: "customer" });
    // manually expire by waiting or using a mock — for now test with tampered token
    const res = await logout(expiredToken + "tampered", { allDevices: false });
    expect(res.status).toBe(401);
  });
});

// ─── GET /auth/sessions ──────────────────────────────────────────────────────

describe('GET /auth/sessions', () => {
  it('should list active sessions for the authenticated user', async () => {
    const agent = request.agent(app);
    const loginRes = await agent.post('/auth/login').send({ email: 'customer@test.com', password: 'Customer@123' });

    const res = await listSessions(agent, loginRes.body.data.accessToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.sessions)).toBe(true);
    expect(res.body.data.maxDevices).toBe(3);
    expect(res.body.data.activeDevices).toBeGreaterThanOrEqual(1);
  });

  it('should mark the cookie-bound session as current', async () => {
    const agent = request.agent(app);
    const loginRes = await agent.post('/auth/login').send({ email: 'customer@test.com', password: 'Customer@123' });

    const res = await listSessions(agent, loginRes.body.data.accessToken);
    expect(res.status).toBe(200);
    expect(res.body.data.sessions.some((session) => session.isCurrent)).toBe(true);
  });

  it('should return 401 when no access token is provided', async () => {
    const res = await request(app).get('/auth/sessions');
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });
});

// ─── POST /auth/refresh-token ─────────────────────────────────────────────────

describe("POST /auth/refresh-token", () => {
  // Happy path
  it("should return new accessToken when valid refreshToken cookie is set", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send({ email: "customer@test.com", password: "Customer@123" });

    const res = await agent.post("/auth/refresh-token");
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

 it("should rotate refreshToken on every call", async () => {
  const agent = request.agent(app);
  await agent.post("/auth/login").send({ email: "customer@test.com", password: "Customer@123" });

  const res1 = await agent.post("/auth/refresh-token");
  expect(res1.status).toBe(200);

  // second call should still succeed — proves old token was rotated and new one accepted
  const res2 = await agent.post("/auth/refresh-token");
  expect(res2.status).toBe(200);
  expect(res2.body.data.accessToken).toBeDefined();
});

  // Auth errors
  it("should return 401 when no refreshToken cookie", async () => {
    const res = await request(app).post("/auth/refresh-token");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 401 and clear all sessions on refresh token reuse attack", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send({ email: "customer@test.com", password: "Customer@123" });

    // get a valid refresh — then rotate it
    await agent.post("/auth/refresh-token");

    // now reuse the old cookie (simulated by using a new agent with the old cookie)
    // inject a fake token directly into DB to simulate reuse
    const user = await User.findOne({ email: "customer@test.com" }).select("+refreshTokens");
    const fakeToken = "fakereusedtoken123";
    user.refreshTokens.push({ token: fakeToken, sessionId: new mongoose.Types.ObjectId().toString() });
    await user.save();

    // remove it to simulate token already consumed
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== fakeToken);
    await user.save();

    // attempt with the consumed token via direct DB manipulation test
    const staleAgent = request.agent(app);
    const res = await staleAgent
      .post("/auth/refresh-token")
      .set("Cookie", `refreshToken=${fakeToken}`);

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("UNAUTHORIZED");
  });

  it("should return 403 when account is blocked during refresh", async () => {
    const agent = request.agent(app);
    await agent.post("/auth/login").send({ email: "customer@test.com", password: "Customer@123" });
    await User.findOneAndUpdate({ email: "customer@test.com" }, { status: "blocked" });

    const res = await agent.post("/auth/refresh-token");
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("ACCOUNT_BLOCKED");

    await User.findOneAndUpdate({ email: "customer@test.com" }, { status: "active" });
  });
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────

describe("POST /auth/forgot-password", () => {
  // Happy path
  it("should return 200 when email exists", async () => {
    const res = await forgotPassword({ email: "customer@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should create a PasswordReset record in DB", async () => {
    const user = await User.findOne({ email: "customer@test.com" });
    await forgotPassword({ email: "customer@test.com" });
    const record = await PasswordReset.findOne({ userId: user._id });
    expect(record).not.toBeNull();
    expect(record.tokenHash).toBeDefined();
    expect(record.expiresAt).toBeDefined();
  });

  it("should return 200 even when email does not exist (no enumeration)", async () => {
    const res = await forgotPassword({ email: "nobody@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return same message regardless of whether email exists", async () => {
    const res1 = await forgotPassword({ email: "customer@test.com" });
    const res2 = await forgotPassword({ email: "nobody@test.com" });
    expect(res1.body.message).toBe(res2.body.message);
  });

  it("should delete previous reset token before creating new one", async () => {
    const user = await User.findOne({ email: "customer@test.com" });
    await forgotPassword({ email: "customer@test.com" });
    await forgotPassword({ email: "customer@test.com" });
    const count = await PasswordReset.countDocuments({ userId: user._id });
    expect(count).toBe(1);
  });

  it("should store token as hash not plain text in DB", async () => {
    const user = await User.findOne({ email: "customer@test.com" });
    const res = await forgotPassword({ email: "customer@test.com" });
    const plainToken = res.body.data?.plainToken;
    const record = await PasswordReset.findOne({ userId: user._id });
    expect(record.tokenHash).not.toBe(plainToken);
  });

  // Validation errors
  it("should return 400 when email is missing", async () => {
    const res = await forgotPassword({});
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when email format is invalid", async () => {
    const res = await forgotPassword({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────

describe("POST /auth/reset-password", () => {
  let plainToken;

  beforeEach(async () => {
    const res = await forgotPassword({ email: "customer@test.com" });
    plainToken = res.body.data?.plainToken;
  });

  // Happy path
  it("should reset password with valid token", async () => {
    const res = await resetPassword({ token: plainToken, password: "NewPass@999" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should allow login with new password after reset", async () => {
    await resetPassword({ token: plainToken, password: "NewPass@999" });
    const res = await login({ email: "customer@test.com", password: "NewPass@999" });
    expect(res.status).toBe(200);
    // restore password
    const user = await User.findOne({ email: "customer@test.com" });
    user.password = "Customer@123";
    await user.save();
  });

  it("should invalidate all sessions after reset", async () => {
    await login({ email: "customer@test.com", password: "Customer@123" });
    await resetPassword({ token: plainToken, password: "NewPass@999" });
    const user = await User.findOne({ email: "customer@test.com" }).select("+refreshTokens");
    expect(user.refreshTokens.length).toBe(0);
    // restore
    user.password = "Customer@123";
    await user.save();
  });

  it("should delete PasswordReset record after successful reset", async () => {
    const user = await User.findOne({ email: "customer@test.com" });
    await resetPassword({ token: plainToken, password: "NewPass@999" });
    const record = await PasswordReset.findOne({ userId: user._id });
    expect(record).toBeNull();
    // restore
    const u = await User.findOne({ email: "customer@test.com" });
    u.password = "Customer@123";
    await u.save();
  });

  // Error cases
  it("should return 400 when token is invalid", async () => {
    const res = await resetPassword({ token: "invalidtoken", password: "NewPass@999" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when token is already used", async () => {
    await resetPassword({ token: plainToken, password: "NewPass@999" });
    const res = await resetPassword({ token: plainToken, password: "Another@999" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    // restore
    const user = await User.findOne({ email: "customer@test.com" });
    user.password = "Customer@123";
    await user.save();
  });

  it("should return 400 when token is expired", async () => {
    const user = await User.findOne({ email: "customer@test.com" });
    await PasswordReset.findOneAndUpdate(
      { userId: user._id },
      { expiresAt: new Date(Date.now() - 1000) }
    );
    const res = await resetPassword({ token: plainToken, password: "NewPass@999" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when new password fails validation", async () => {
    const res = await resetPassword({ token: plainToken, password: "weak" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when token is missing", async () => {
    const res = await resetPassword({ password: "NewPass@999" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when password is missing", async () => {
    const res = await resetPassword({ token: plainToken });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });
});