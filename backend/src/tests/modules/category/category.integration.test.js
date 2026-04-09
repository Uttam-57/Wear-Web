import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app.js";
import seedUsers from "../../helpers/seedUsers.js";
import { getAdminToken, getCustomerToken, getSellerToken } from "../../helpers/getTokens.js";
import Category from "../../../modules/category/category.model.js";
import CategoryTemplate from "../../../modules/category/categoryTemplate.model.js";

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

afterEach(async () => {
  // wipe only categories and templates between tests, keep users and tokens valid
  await Category.deleteMany({});
  await CategoryTemplate.deleteMany({});
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createCategory = (data, token) =>
  request(app)
    .post("/admin/categories")
    .set("Authorization", `Bearer ${token || adminToken}`)
    .send(data);

const validCategory = (overrides = {}) => ({
  name: "Clothing",
  image: "https://example.com/clothing.jpg",
  ...overrides,
});

// ─── POST /admin/categories ───────────────────────────────────────────────────

describe("POST /admin/categories", () => {
  it("should create a root category with valid data", async () => {
    const res = await createCategory(validCategory());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Clothing");
    expect(res.body.data.slug).toBe("clothing");
    expect(res.body.data.parentId).toBeNull();
    expect(res.body.data.status).toBe("active");
  });

  it("should auto-generate slug from name", async () => {
    const res = await createCategory(validCategory({ name: "Men's Clothing" }));
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe("mens-clothing");
  });

  it("should create a child category with valid parentId", async () => {
    const parent = await createCategory(validCategory());
    const parentId = parent.body.data._id;
    const res = await createCategory(validCategory({ name: "Men's Clothing", parentId }));
    expect(res.status).toBe(201);
    expect(res.body.data.parentId).toBe(parentId);
  });

  it("should create category with commissionRate", async () => {
    const res = await createCategory(validCategory({ commissionRate: 15 }));
    expect(res.status).toBe(201);
    expect(res.body.data.commissionRate).toBe(15);
  });

  it("should create category with null commissionRate (inherits from parent)", async () => {
    const res = await createCategory(validCategory({ commissionRate: null }));
    expect(res.status).toBe(201);
    expect(res.body.data.commissionRate).toBeNull();
  });

  it("should handle duplicate name by generating unique slug", async () => {
    await createCategory(validCategory());
    const res = await createCategory(validCategory());
    expect(res.status).toBe(201);
    expect(res.body.data.slug).not.toBe("clothing");
  });

  it("should return 400 when name is missing", async () => {
    const res = await createCategory({ image: "https://example.com/img.jpg" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when image is missing", async () => {
    const res = await createCategory({ name: "Clothing" });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when image is not a valid URL", async () => {
    const res = await createCategory(validCategory({ image: "not-a-url" }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when commissionRate exceeds 100", async () => {
    const res = await createCategory(validCategory({ commissionRate: 150 }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 400 when commissionRate is negative", async () => {
    const res = await createCategory(validCategory({ commissionRate: -5 }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 401 when no token provided", async () => {
    const res = await request(app).post("/admin/categories").send(validCategory());
    expect(res.status).toBe(401);
  });

  it("should return 403 when customer token used", async () => {
    const res = await createCategory(validCategory(), customerToken);
    expect(res.status).toBe(403);
  });

  it("should return 403 when seller token used", async () => {
    const res = await createCategory(validCategory(), sellerToken);
    expect(res.status).toBe(403);
  });
});

// ─── GET /categories ──────────────────────────────────────────────────────────

describe("GET /categories", () => {
  it("should return empty array when no categories exist", async () => {
    const res = await request(app).get("/categories");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("should return full nested tree", async () => {
    const root = await createCategory(validCategory());
    const rootId = root.body.data._id;
    await createCategory(validCategory({ name: "Men's Clothing", parentId: rootId }));

    const res = await request(app).get("/categories");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].children).toHaveLength(1);
  });

  it("should not include blocked categories", async () => {
    const cat = await createCategory(validCategory());
    const categoryId = cat.body.data._id;

    await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    const res = await request(app).get("/categories");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("should not require auth token", async () => {
    const res = await request(app).get("/categories");
    expect(res.status).toBe(200);
  });
});

// ─── PUT /admin/categories/:id ────────────────────────────────────────────────

describe("PUT /admin/categories/:id", () => {
  let categoryId;

  beforeEach(async () => {
    const res = await createCategory(validCategory());
    categoryId = res.body.data._id;
  });

  it("should update category name and regenerate slug", async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Apparel" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Apparel");
    expect(res.body.data.slug).toBe("apparel");
  });

  it("should update commissionRate", async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ commissionRate: 20 });

    expect(res.status).toBe(200);
    expect(res.body.data.commissionRate).toBe(20);
  });

  it("should set commissionRate to null", async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ commissionRate: null });

    expect(res.status).toBe(200);
    expect(res.body.data.commissionRate).toBeNull();
  });

  it("should return 400 when updating a blocked category", async () => {
    await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    const res = await request(app)
      .put(`/admin/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 404 for non-existent category", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/admin/categories/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test" });

    expect(res.status).toBe(404);
  });

  it("should return 404 for invalid ObjectId", async () => {
    const res = await request(app)
      .put("/admin/categories/invalid_id")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test" });

    expect(res.status).toBe(404);
  });

  it("should return 403 when customer token used", async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Test" });

    expect(res.status).toBe(403);
  });
});

// ─── POST /admin/categories/block ────────────────────────────────────────────

describe("POST /admin/categories/block", () => {
  let categoryId;

  beforeEach(async () => {
    const res = await createCategory(validCategory());
    categoryId = res.body.data._id;
  });

  it("should block a single category", async () => {
    const res = await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(200);
    expect(res.body.data.blocked).toBe(1);

    const cat = await Category.findById(categoryId);
    expect(cat.status).toBe("blocked");
    expect(cat.blockedAt).not.toBeNull();
  });

  it("should block multiple categories at once", async () => {
    const res2 = await createCategory(validCategory({ name: "Footwear" }));
    const categoryId2 = res2.body.data._id;

    const res = await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId, categoryId2] });

    expect(res.status).toBe(200);
    expect(res.body.data.blocked).toBe(2);
  });

  it("should return 400 when categoryIds is empty array", async () => {
    const res = await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should return 404 when all provided IDs are already blocked", async () => {
    await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    const res = await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(404);
  });

  it("should return 403 when customer token used", async () => {
    const res = await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(403);
  });
});

// ─── POST /admin/categories/delete-preview ────────────────────────────────────

describe("POST /admin/categories/delete-preview", () => {
  let categoryId;

  beforeEach(async () => {
    const res = await createCategory(validCategory());
    categoryId = res.body.data._id;

    await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });
  });

  it("should return preview with eligibleForDeletion false before 30 days", async () => {
    const res = await request(app)
      .post("/admin/categories/delete-preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(200);
    expect(res.body.data[0].eligibleForDeletion).toBe(false);
    expect(res.body.data[0].childCount).toBe(0);
  });

  it("should return eligibleForDeletion true after 30 days", async () => {
    await Category.findByIdAndUpdate(categoryId, {
      blockedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post("/admin/categories/delete-preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(200);
    expect(res.body.data[0].eligibleForDeletion).toBe(true);
  });

  it("should return correct childCount", async () => {
    await createCategory(validCategory({ name: "Men's Clothing", parentId: categoryId }));

    const res = await request(app)
      .post("/admin/categories/delete-preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(200);
    expect(res.body.data[0].childCount).toBe(1);
  });

  it("should return 404 for non-existent category", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post("/admin/categories/delete-preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [fakeId] });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /admin/categories ─────────────────────────────────────────────────

describe("DELETE /admin/categories", () => {
  let categoryId;
  let childCategoryId;

  beforeEach(async () => {
    const root = await createCategory(validCategory());
    categoryId = root.body.data._id;

    const child = await createCategory(
      validCategory({ name: "Men's Clothing", parentId: categoryId })
    );
    childCategoryId = child.body.data._id;

    await request(app)
      .post("/admin/categories/block")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });
  });

  it("should return 400 when 30 days have not passed", async () => {
    const res = await request(app)
      .delete("/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });

  it("should delete category after 30 days and move children up", async () => {
    await Category.findByIdAndUpdate(categoryId, {
      blockedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .delete("/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(1);

    const deleted = await Category.findById(categoryId);
    expect(deleted).toBeNull();

    const child = await Category.findById(childCategoryId);
    expect(child.parentId).toBeNull();
  });

  it("should return 400 when categoryIds is empty", async () => {
    const res = await request(app)
      .delete("/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ categoryIds: [] });

    expect(res.status).toBe(400);
  });

  it("should return 403 when customer token used", async () => {
    const res = await request(app)
      .delete("/admin/categories")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ categoryIds: [categoryId] });

    expect(res.status).toBe(403);
  });
});

// ─── PUT /admin/categories/:id/template ──────────────────────────────────────

describe("PUT /admin/categories/:id/template", () => {
  let categoryId;

  beforeEach(async () => {
    const res = await createCategory(validCategory());
    categoryId = res.body.data._id;
  });

  it("should create template for a category", async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sizeOptions: ["S", "M", "L", "XL"],
        specFields: [
          { label: "Material", key: "material" },
          { label: "Fit Type", key: "fit_type" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sizeOptions).toHaveLength(4);
    expect(res.body.data.specFields).toHaveLength(2);
  });

  it("should update existing template (upsert)", async () => {
    await request(app)
      .put(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sizeOptions: ["S", "M", "L"], specFields: [] });

    const res = await request(app)
      .put(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sizeOptions: ["XS", "S"], specFields: [] });

    expect(res.status).toBe(200);
    expect(res.body.data.sizeOptions).toEqual(["XS", "S"]);

    const count = await CategoryTemplate.countDocuments({ categoryId });
    expect(count).toBe(1);
  });

  it("should create template with empty sizeOptions and specFields", async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sizeOptions: [], specFields: [] });

    expect(res.status).toBe(200);
  });

  it("should return 404 for non-existent category", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/admin/categories/${fakeId}/template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sizeOptions: [], specFields: [] });

    expect(res.status).toBe(404);
  });

  it("should return 403 when customer token used", async () => {
    const res = await request(app)
      .put(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ sizeOptions: [], specFields: [] });

    expect(res.status).toBe(403);
  });
});

// ─── GET /admin/categories/:id/template ──────────────────────────────────────

describe("GET /admin/categories/:id/template", () => {
  let categoryId;

  beforeEach(async () => {
    const res = await createCategory(validCategory());
    categoryId = res.body.data._id;
  });

  it("should fetch existing template", async () => {
    await request(app)
      .put(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sizeOptions: ["S", "M"], specFields: [] });

    const res = await request(app)
      .get(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sizeOptions).toEqual(["S", "M"]);
  });

  it("should return 404 when no template exists for category", async () => {
    const res = await request(app)
      .get(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("should return 403 when customer token used", async () => {
    const res = await request(app)
      .get(`/admin/categories/${categoryId}/template`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── Commission Inheritance ───────────────────────────────────────────────────

describe("Commission inheritance", () => {
  it("child with null commissionRate should inherit from parent", async () => {
    const root = await createCategory(validCategory({ commissionRate: 10 }));
    const rootId = root.body.data._id;

    const child = await createCategory(
      validCategory({ name: "Men's Clothing", parentId: rootId, commissionRate: null })
    );
    const childId = child.body.data._id;

    const grandchild = await createCategory(
      validCategory({ name: "Men's Shirts", parentId: childId, commissionRate: null })
    );
    const grandchildId = grandchild.body.data._id;

    const { getEffectiveCommissionService } = await import(
      "../../../modules/category/category.service.js"
    );

    const result = await getEffectiveCommissionService(grandchildId);
    expect(result.effectiveCommissionRate).toBe(10);
  });

  it("child with own commissionRate should not inherit from parent", async () => {
    const root = await createCategory(validCategory({ commissionRate: 10 }));
    const rootId = root.body.data._id;

    const child = await createCategory(
      validCategory({ name: "Luxury Watches", parentId: rootId, commissionRate: 20 })
    );
    const childId = child.body.data._id;

    const { getEffectiveCommissionService } = await import(
      "../../../modules/category/category.service.js"
    );

    const result = await getEffectiveCommissionService(childId);
    expect(result.effectiveCommissionRate).toBe(20);
  });
});