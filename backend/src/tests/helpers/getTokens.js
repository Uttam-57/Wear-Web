import request from "supertest";
import app from "../../app.js";
import { testUsers } from "./seedUsers.js";

// ─── Get token for a specific role ───────────────────────────────────────────

const getToken = async (credentials) => {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: credentials.email, password: credentials.password });

  if (!res.body.data?.accessToken) {
    throw new Error(`Failed to get token for ${credentials.email} — ${JSON.stringify(res.body)}`);
  }

  return res.body.data.accessToken;
};

// ─── Role specific helpers ────────────────────────────────────────────────────

export const getAdminToken = () => getToken(testUsers.admin);
export const getCustomerToken = () => getToken(testUsers.customer);
export const getSellerToken = () => getToken(testUsers.seller);