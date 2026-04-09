import request from "supertest";
import app from "../../../app.js";
import seedUsers from "../../helpers/seedUsers.js";
import {
    getAdminToken,
    getCustomerToken,
    getSellerToken,
} from "../../helpers/getTokens.js";
import Product from "../../../modules/product/product.model.js";
import Category from "../../../modules/category/category.model.js";
import CategoryTemplate from "../../../modules/category/categoryTemplate.model.js";
import SellerProfile from "../../../modules/user/sellerProfile.model.js";
import User from "../../../modules/user/user.model.js";

// ─── Token Variables ──────────────────────────────────────────────────────────

let adminToken;
let customerToken;
let sellerToken;

// ─── Shared Test Data ─────────────────────────────────────────────────────────

let categoryId;
let templateId;
let sellerUserId;

// ─── Global Setup ─────────────────────────────────────────────────────────────

beforeAll(async () => {
    await seedUsers();
    adminToken = await getAdminToken();
    customerToken = await getCustomerToken();
    sellerToken = await getSellerToken();

    const seller = await User.findOne({ email: "seller@test.com" });
    sellerUserId = seller._id;

    await request(app)
        .put(`/admin/sellers/${sellerUserId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`);

    await SellerProfile.create({
        userId: sellerUserId,
        companyName: "Test Company Ltd",
        ownerName: "Test Owner",
        companyEmail: "company@test.com",
        companyPhone: "9876543210",
        companyProof: ["https://example.com/proof1.jpg"],
        location: {
            country: "India",
            state: "Gujarat",
            district: "Vadodara",
            addressLine: "123 Test Street",
        },
    });

    sellerToken = await getSellerToken();

    const category = await Category.create({
        name: "Test Shirts",
        slug: "test-shirts",
        image: "https://example.com/shirts.jpg",
        status: "active",
    });
    categoryId = category._id.toString();

    const template = await CategoryTemplate.create({
        categoryId,
        sizeOptions: ["S", "M", "L", "XL"],
        specFields: [
            { label: "Material", key: "material", filterOptions: ["Cotton", "Polyester", "Linen"] },
            { label: "Fit", key: "fit", filterOptions: ["Slim", "Regular", "Oversized"] },
        ],
    });
    templateId = template._id.toString();
});

afterEach(async () => {
    await Product.deleteMany({});
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Image object for HTTP request bodies (goes through Zod validation)
const img = (url = "https://example.com/shirt.jpg") => ({ url, publicId: null });

// Seed images for direct Product.create() calls (bypasses Zod)
const seedImages = [
    { url: "https://example.com/shirt1.jpg", publicId: null },
    { url: "https://example.com/shirt2.jpg", publicId: null },
];

// ─── Request Helpers ──────────────────────────────────────────────────────────

const createProduct = (token, data) =>
    request(app)
        .post("/seller/products")
        .set("Authorization", `Bearer ${token}`)
        .send(data);

const createMultipartProduct = (token, data, files = []) => {
    const req = request(app)
        .post("/seller/products")
        .set("Authorization", `Bearer ${token}`);

    for (const [key, value] of Object.entries(data)) {
        req.field(key, typeof value === "string" ? value : JSON.stringify(value));
    }

    for (const file of files) {
        req.attach("files", file.buffer, file.filename);
    }

    return req;
};

const uploadProductMedia = (token) =>
    request(app)
        .post("/seller/products/media/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("files", Buffer.from("img-1"), "one.jpg")
        .attach("files", Buffer.from("img-2"), "two.jpg");

const getSellerProducts = (token, query = "") =>
    request(app)
        .get(`/seller/products${query}`)
        .set("Authorization", `Bearer ${token}`);

const updateProduct = (token, id, data) =>
    request(app)
        .put(`/seller/products/${id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(data);

const deleteProduct = (token, id) =>
    request(app)
        .delete(`/seller/products/${id}`)
        .set("Authorization", `Bearer ${token}`);

const browseProducts = (query = "") =>
    request(app).get(`/products${query}`);

const searchProducts = (query) =>
    request(app).get(`/products/search?q=${query}`);

const getProductById = (id) =>
    request(app).get(`/products/${id}`);

const adminGetProducts = (token, query = "") =>
    request(app)
        .get(`/admin/products${query}`)
        .set("Authorization", `Bearer ${token}`);

const holdProduct = (token, id) =>
    request(app)
        .put(`/admin/products/${id}/hold`)
        .set("Authorization", `Bearer ${token}`);

const adminRemoveProduct = (token, id) =>
    request(app)
        .delete(`/admin/products/${id}`)
        .set("Authorization", `Bearer ${token}`);

// ─── Valid Data Factory ───────────────────────────────────────────────────────

const validProduct = (overrides = {}) => ({
    categoryId,
    name: "Classic Cotton Shirt",
    brand: "TestBrand",
    gender: "men",
    description: "A comfortable everyday shirt made from pure cotton.",
    images: [
        img("https://example.com/shirt1.jpg"),
        img("https://example.com/shirt2.jpg"),
    ],
    variants: [
        {
            colorName: "Navy Blue",
            colorCode: "#000080",
            baseColor: "Blue",
            size: "M",
            price: 999,
            stock: 50,
            discount: 10,
            minOrderQty: 1,
        },
        {
            colorName: "Navy Blue",
            colorCode: "#000080",
            baseColor: "Blue",
            size: "L",
            price: 999,
            stock: 30,
            discount: 10,
            minOrderQty: 1,
        },
    ],
    colorImages: [
        {
            colorName: "Navy Blue",
            images: [img("https://example.com/navy1.jpg")],
            usePrimary: false,
        },
    ],
    specifications: [
        { key: "material", value: "Cotton" },
        { key: "fit", value: "Regular" },
    ],
    highlights: ["100% Cotton", "Machine Washable"],
    tags: ["casual", "summer"],
    returnPolicy: { returnable: true, returnWindow: 7 },
    isCODAvailable: true,
    ...overrides,
});

// ─── requireSellerProfileComplete middleware ───────────────────────────────────

describe("requireSellerProfileComplete middleware", () => {
    it("should block seller from creating product when profile does not exist", async () => {
        await SellerProfile.deleteOne({ userId: sellerUserId });

        const res = await createProduct(sellerToken, validProduct());
        expect(res.status).toBe(403);
        expect(res.body.errorCode).toBe("SELLER_PROFILE_INCOMPLETE");

        await SellerProfile.create({
            userId: sellerUserId,
            companyName: "Test Company Ltd",
            ownerName: "Test Owner",
            companyEmail: "company@test.com",
            companyPhone: "9876543210",
            companyProof: ["https://example.com/proof1.jpg"],
            location: {
                country: "India",
                state: "Gujarat",
                district: "Vadodara",
                addressLine: "123 Test Street",
            },
        });
    });

    it("should allow seller to create product when profile is complete", async () => {
        const res = await createProduct(sellerToken, validProduct());
        expect(res.status).toBe(201);
    });
});

// ─── POST /users/seller/profile/setup ────────────────────────────────────────

describe("POST /users/seller/profile/setup", () => {
    it("should return 409 when profile already exists", async () => {
        const res = await request(app)
            .post("/users/seller/profile/setup")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({
                companyName: "Duplicate Company",
                ownerName: "Owner",
                companyEmail: "dup@test.com",
                companyPhone: "9876543210",
                companyProof: ["https://example.com/proof.jpg"],
                location: {
                    country: "India",
                    state: "Gujarat",
                    district: "Vadodara",
                    addressLine: "123 Street",
                },
            });
        expect(res.status).toBe(409);
        expect(res.body.errorCode).toBe("CONFLICT");
    });

    it("should return 400 when required fields are missing", async () => {
        await SellerProfile.deleteOne({ userId: sellerUserId });

        const res = await request(app)
            .post("/users/seller/profile/setup")
            .set("Authorization", `Bearer ${sellerToken}`)
            .send({ companyName: "Only Name" });
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");

        await SellerProfile.create({
            userId: sellerUserId,
            companyName: "Test Company Ltd",
            ownerName: "Test Owner",
            companyEmail: "company@test.com",
            companyPhone: "9876543210",
            companyProof: ["https://example.com/proof1.jpg"],
            location: {
                country: "India",
                state: "Gujarat",
                district: "Vadodara",
                addressLine: "123 Test Street",
            },
        });
    });

    it("should return 403 when customer tries to access setup", async () => {
        const res = await request(app)
            .post("/users/seller/profile/setup")
            .set("Authorization", `Bearer ${customerToken}`)
            .send({});
        expect(res.status).toBe(403);
    });

    it("should return 403 when admin tries to access setup", async () => {
        const res = await request(app)
            .post("/users/seller/profile/setup")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({});
        expect(res.status).toBe(403);
    });

    it("should return 401 when no token provided", async () => {
        const res = await request(app).post("/users/seller/profile/setup").send({});
        expect(res.status).toBe(401);
    });
});

// ─── POST /seller/products ────────────────────────────────────────────────────

describe("POST /seller/products", () => {
    it("should create a product and return 201", async () => {
        const res = await createProduct(sellerToken, validProduct());
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.product).toHaveProperty("_id");
        expect(res.body.data.product.name).toBe("Classic Cotton Shirt");
    });

    it("should store images as objects with url and publicId", async () => {
        const res = await createProduct(sellerToken, validProduct());
        expect(res.status).toBe(201);
        expect(res.body.data.product.images[0]).toHaveProperty("url");
        expect(res.body.data.product.images[0]).toHaveProperty("publicId");
    });

    it("should accept remote image URLs as plain strings and normalize them", async () => {
        const res = await createProduct(sellerToken, validProduct({
            images: [
                "https://example.com/plain-1.jpg",
                "https://example.com/plain-2.jpg",
            ],
        }));

        expect(res.status).toBe(201);
        expect(res.body.data.product.images).toHaveLength(2);
        expect(res.body.data.product.images[0]).toHaveProperty("url");
        expect(res.body.data.product.images[0]).toHaveProperty("publicId");
    });

    it("should accept multipart file uploads during product creation", async () => {
        const multipartData = validProduct({ images: [] });
        const res = await createMultipartProduct(sellerToken, multipartData, [
            { buffer: Buffer.from("img-1"), filename: "one.jpg" },
            { buffer: Buffer.from("img-2"), filename: "two.jpg" },
        ]);

        expect(res.status).toBe(201);
        expect(res.body.data.product.images).toHaveLength(2);
        expect(res.body.data.product.images[0]).toHaveProperty("url");
        expect(res.body.data.product.images[0]).toHaveProperty("publicId");
    });

    it("should reject private or local remote image URLs", async () => {
        const res = await createProduct(sellerToken, validProduct({
            images: ["http://127.0.0.1:3000/private.jpg"],
        }));

        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should auto-generate slug on creation", async () => {
        const res = await createProduct(sellerToken, validProduct());
        expect(res.status).toBe(201);
        expect(res.body.data.product).toHaveProperty("slug");
        expect(res.body.data.product.slug).toMatch(/classic-cotton-shirt/);
    });

    it("should set status to active by default", async () => {
        const res = await createProduct(sellerToken, validProduct());
        expect(res.status).toBe(201);
        expect(res.body.data.product.status).toBe("active");
    });

    it("should derive colorNames and baseColors from variants", async () => {
        const res = await createProduct(sellerToken, validProduct());
        expect(res.status).toBe(201);
        expect(res.body.data.product.colorNames).toContain("Navy Blue");
        expect(res.body.data.product.baseColors).toContain("Blue");
    });

    it("should accept gender in any case and normalize to lowercase", async () => {
        const res = await createProduct(sellerToken, validProduct({ gender: "MEN" }));
        expect(res.status).toBe(201);
        expect(res.body.data.product.gender).toBe("men");
    });

    it("should return 400 when name is missing", async () => {
        const res = await createProduct(sellerToken, validProduct({ name: undefined }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when brand is missing", async () => {
        const res = await createProduct(sellerToken, validProduct({ brand: undefined }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when gender is missing", async () => {
        const res = await createProduct(sellerToken, validProduct({ gender: undefined }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when gender is invalid", async () => {
        const res = await createProduct(sellerToken, validProduct({ gender: "Alien" }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when images array is empty", async () => {
        const res = await createProduct(sellerToken, validProduct({ images: [] }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when more than 5 images provided", async () => {
        const res = await createProduct(sellerToken, validProduct({
            images: Array(6).fill(img()),
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when variants array is empty", async () => {
        const res = await createProduct(sellerToken, validProduct({ variants: [] }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when variant has invalid size for category", async () => {
        const res = await createProduct(sellerToken, validProduct({
            variants: [{ colorName: "Red", colorCode: "#FF0000", baseColor: "Red", size: "XXL", price: 999, stock: 10 }],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when variant has invalid baseColor", async () => {
        const res = await createProduct(sellerToken, validProduct({
            variants: [{ colorName: "Red", colorCode: "#FF0000", baseColor: "InvalidColor", size: "M", price: 999, stock: 10 }],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when variant has invalid hex colorCode", async () => {
        const res = await createProduct(sellerToken, validProduct({
            variants: [{ colorName: "Red", colorCode: "notahex", baseColor: "Red", size: "M", price: 999, stock: 10 }],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 on duplicate color and size combination in variants", async () => {
        const res = await createProduct(sellerToken, validProduct({
            variants: [
                { colorName: "Navy Blue", colorCode: "#000080", baseColor: "Blue", size: "M", price: 999, stock: 10 },
                { colorName: "Navy Blue", colorCode: "#000080", baseColor: "Blue", size: "M", price: 999, stock: 10 },
            ],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when specification key is invalid for category", async () => {
        const res = await createProduct(sellerToken, validProduct({
            specifications: [{ key: "invalid_key", value: "Cotton" }],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when specification value is not in filterOptions", async () => {
        const res = await createProduct(sellerToken, validProduct({
            specifications: [{ key: "material", value: "InvalidMaterial" }],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when colorImages colorName does not match any variant", async () => {
        const res = await createProduct(sellerToken, validProduct({
            colorImages: [{ colorName: "NonExistentColor", images: [img()], usePrimary: false }],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when highlights exceed 5", async () => {
        const res = await createProduct(sellerToken, validProduct({
            highlights: ["a", "b", "c", "d", "e", "f"],
        }));
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when categoryId does not exist", async () => {
        const res = await createProduct(sellerToken, validProduct({ categoryId: "64f1a2b3c4d5e6f7a8b9c0d1" }));
        expect(res.status).toBe(404);
        expect(res.body.errorCode).toBe("NOT_FOUND");
    });

    it("should return 401 when no token provided", async () => {
        const res = await request(app).post("/seller/products").send(validProduct());
        expect(res.status).toBe(401);
        expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("should return 403 when customer tries to create product", async () => {
        const res = await createProduct(customerToken, validProduct());
        expect(res.status).toBe(403);
        expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should return 403 when admin tries to create product", async () => {
        const res = await createProduct(adminToken, validProduct());
        expect(res.status).toBe(403);
        expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should return 403 when seller is not approved", async () => {
        await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "pending" });
        const pendingToken = await getSellerToken();
        const res = await createProduct(pendingToken, validProduct());
        expect(res.status).toBe(403);
        expect(res.body.errorCode).toBe("SELLER_NOT_APPROVED");
        await User.findOneAndUpdate({ email: "seller@test.com" }, { status: "active" });
    });
});

// ─── GET /products ────────────────────────────────────────────────────────────

describe("GET /products", () => {
    it("should return empty array when no products exist", async () => {
        const res = await browseProducts();
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(0);
        expect(res.body.data.total).toBe(0);
    });

    it("should return only active products", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-1", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-2", status: "held", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-3", status: "removed", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
        ]);
        const res = await browseProducts();
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(1);
        expect(res.body.data.products[0].status).toBe("active");
    });

    it("should filter by gender", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-men", gender: "men", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-women", gender: "women", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
        ]);
        const res = await browseProducts("?gender=men");
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(1);
        expect(res.body.data.products[0].gender).toBe("men");
    });

    it("should filter by baseColor", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-blue", images: seedImages, baseColors: ["Blue"], colorNames: ["Navy Blue"], status: "active" },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-red", images: seedImages, baseColors: ["Red"], colorNames: ["Scarlet Red"], status: "active" },
        ]);
        const res = await browseProducts("?baseColor=Blue");
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(1);
    });

    it("should return paginated results", async () => {
        const products = Array.from({ length: 5 }, (_, i) => ({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: `slug-page-${i}`,
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        }));
        await Product.create(products);
        const res = await browseProducts("?page=1&limit=3");
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(3);
        expect(res.body.data.total).toBe(5);
    });

    it("should filter by dynamic spec filter", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-spec-1", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"], specifications: [{ key: "material", value: "Cotton" }] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-spec-2", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"], specifications: [{ key: "material", value: "Polyester" }] },
        ]);
        const res = await browseProducts("?material=Cotton");
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(1);
    });
});

// ─── GET /products/search ─────────────────────────────────────────────────────

describe("GET /products/search", () => {
    it("should return 500 when Atlas search is unavailable in local test environment", async () => {
        await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-search-1",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await searchProducts("Cotton");
        expect(res.status).toBe(500);
    });

    it("should return 500 when Atlas search is unavailable even for no-match queries", async () => {
        const res = await searchProducts("xyznonexistentterm");
        expect(res.status).toBe(500);
    });

    it("should return 400 when search query is missing", async () => {
        const res = await request(app).get("/products/search");
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 500 before filtering held or removed products when Atlas search is unavailable", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-search-held", name: "Shirt Hidden", status: "held", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-search-removed", name: "Shirt Removed", status: "removed", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
        ]);
        const res = await searchProducts("Shirt");
        expect(res.status).toBe(500);
    });
});

// ─── GET /products/:id ────────────────────────────────────────────────────────

describe("GET /products/:id", () => {
    it("should return product when active", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-single",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await getProductById(product._id.toString());
        expect(res.status).toBe(200);
        expect(res.body.data.product._id).toBe(product._id.toString());
    });

    it("should return 404 when product is held", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-held-single",
            status: "held",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await getProductById(product._id.toString());
        expect(res.status).toBe(404);
        expect(res.body.errorCode).toBe("NOT_FOUND");
    });

    it("should return 404 when product is removed", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-removed-single",
            status: "removed",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await getProductById(product._id.toString());
        expect(res.status).toBe(404);
        expect(res.body.errorCode).toBe("NOT_FOUND");
    });

    it("should return 404 for invalid ObjectId", async () => {
        const res = await getProductById("notanobjectid");
        expect(res.status).toBe(404);
        expect(res.body.errorCode).toBe("NOT_FOUND");
    });
});

// ─── GET /seller/products ─────────────────────────────────────────────────────

describe("GET /seller/products", () => {
    it("should return only the authenticated seller's products", async () => {
        await createProduct(sellerToken, validProduct());
        const res = await getSellerProducts(sellerToken);
        expect(res.status).toBe(200);
        res.body.data.products.forEach(p => {
            expect(p.sellerId).toBe(sellerUserId.toString());
        });
    });

    it("should return empty array when seller has no products", async () => {
        const res = await getSellerProducts(sellerToken);
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(0);
    });

    it("should filter by status", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-active", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-held-seller", status: "held", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
        ]);
        const res = await getSellerProducts(sellerToken, "?status=held");
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(1);
        expect(res.body.data.products[0].status).toBe("held");
    });

    it("should return 401 when no token provided", async () => {
        const res = await request(app).get("/seller/products");
        expect(res.status).toBe(401);
        expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });
});

// ─── PUT /seller/products/:id ─────────────────────────────────────────────────

describe("PUT /seller/products/:id", () => {
    it("should update own product successfully", async () => {
        const created = await createProduct(sellerToken, validProduct());
        const productId = created.body.data.product._id;
        const res = await updateProduct(sellerToken, productId, { name: "Updated Shirt Name" });
        expect(res.status).toBe(200);
        expect(res.body.data.product.name).toBe("Updated Shirt Name");
    });

    it("should regenerate slug when name is updated", async () => {
        const created = await createProduct(sellerToken, validProduct());
        const productId = created.body.data.product._id;
        const oldSlug = created.body.data.product.slug;
        const res = await updateProduct(sellerToken, productId, { name: "Completely New Name" });
        expect(res.status).toBe(200);
        expect(res.body.data.product.slug).not.toBe(oldSlug);
    });

    it("should update images and store as objects with url and publicId", async () => {
        const created = await createProduct(sellerToken, validProduct());
        const productId = created.body.data.product._id;
        const newImages = [img("https://example.com/new1.jpg"), img("https://example.com/new2.jpg")];
        const res = await updateProduct(sellerToken, productId, { images: newImages });
        expect(res.status).toBe(200);
        expect(res.body.data.product.images[0]).toHaveProperty("url");
        expect(res.body.data.product.images[0]).toHaveProperty("publicId");
    });

    it("should return 404 when product belongs to another seller", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: new (await import("mongoose")).default.Types.ObjectId(),
            slug: "slug-other-seller",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await updateProduct(sellerToken, product._id.toString(), { name: "Hack" });
        expect(res.status).toBe(404);
        expect(res.body.errorCode).toBe("NOT_FOUND");
    });

    it("should return 400 when trying to update a removed product", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-removed-update",
            status: "removed",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await updateProduct(sellerToken, product._id.toString(), { name: "Updated" });
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when no fields provided", async () => {
        const created = await createProduct(sellerToken, validProduct());
        const productId = created.body.data.product._id;
        const res = await updateProduct(sellerToken, productId, {});
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 401 when no token provided", async () => {
        const res = await request(app).put("/seller/products/someid").send({ name: "test" });
        expect(res.status).toBe(401);
    });

    it("should return 403 when customer tries to update", async () => {
        const created = await createProduct(sellerToken, validProduct());
        const productId = created.body.data.product._id;
        const res = await updateProduct(customerToken, productId, { name: "Hack" });
        expect(res.status).toBe(403);
    });
});

// ─── DELETE /seller/products/:id ──────────────────────────────────────────────

describe("DELETE /seller/products/:id", () => {
    it("should delete own product successfully", async () => {
        const created = await createProduct(sellerToken, validProduct());
        const productId = created.body.data.product._id;
        const res = await deleteProduct(sellerToken, productId);
        expect(res.status).toBe(200);
        const inDb = await Product.findById(productId);
        expect(inDb).toBeNull();
    });

    it("should return 404 when product belongs to another seller", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: new (await import("mongoose")).default.Types.ObjectId(),
            slug: "slug-other-delete",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await deleteProduct(sellerToken, product._id.toString());
        expect(res.status).toBe(404);
    });

    it("should return 401 when no token", async () => {
        const res = await request(app).delete("/seller/products/someid");
        expect(res.status).toBe(401);
    });

    it("should return 403 when customer tries to delete", async () => {
        const created = await createProduct(sellerToken, validProduct());
        const productId = created.body.data.product._id;
        const res = await deleteProduct(customerToken, productId);
        expect(res.status).toBe(403);
    });
});

// ─── GET /admin/products ──────────────────────────────────────────────────────

describe("GET /admin/products", () => {
    it("should return all products regardless of status", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-a1", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-a2", status: "held", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-a3", status: "removed", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
        ]);
        const res = await adminGetProducts(adminToken);
        expect(res.status).toBe(200);
        expect(res.body.data.total).toBe(3);
    });

    it("should filter by status", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-b1", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-b2", status: "held", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
        ]);
        const res = await adminGetProducts(adminToken, "?status=held");
        expect(res.status).toBe(200);
        expect(res.body.data.products).toHaveLength(1);
    });

    it("should return 403 when seller tries to access", async () => {
        const res = await adminGetProducts(sellerToken);
        expect(res.status).toBe(403);
    });
});

// ─── PUT /admin/products/:id/hold ─────────────────────────────────────────────

describe("PUT /admin/products/:id/hold", () => {
    it("should hold an active product and set heldAt", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-hold-1",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await holdProduct(adminToken, product._id.toString());
        expect(res.status).toBe(200);
        expect(res.body.data.product.status).toBe("held");
        expect(res.body.data.product.previousStatus).toBe("active");
        expect(res.body.data.product.heldAt).not.toBeNull();
    });

    it("should return 400 when product is already held", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-hold-2",
            status: "held",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await holdProduct(adminToken, product._id.toString());
        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when product is removed", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-hold-3",
            status: "removed",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await holdProduct(adminToken, product._id.toString());
        expect(res.status).toBe(400);
    });

    it("should return 404 when product not found", async () => {
        const res = await holdProduct(adminToken, "64f1a2b3c4d5e6f7a8b9c0d1");
        expect(res.status).toBe(404);
    });

    it("should return 403 when seller tries to hold", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-hold-4",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await holdProduct(sellerToken, product._id.toString());
        expect(res.status).toBe(403);
    });
});

// ─── DELETE /admin/products/:id ───────────────────────────────────────────────

describe("DELETE /admin/products/:id", () => {
    it("should remove an active product permanently", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-remove-1",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await adminRemoveProduct(adminToken, product._id.toString());
        expect(res.status).toBe(200);
        expect(res.body.data.product.status).toBe("removed");
    });

    it("should return 400 when product is already removed", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-remove-2",
            status: "removed",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await adminRemoveProduct(adminToken, product._id.toString());
        expect(res.status).toBe(400);
    });

    it("should return 404 when product not found", async () => {
        const res = await adminRemoveProduct(adminToken, "64f1a2b3c4d5e6f7a8b9c0d1");
        expect(res.status).toBe(404);
    });

    it("should return 403 when customer tries to remove", async () => {
        const product = await Product.create({
            ...validProduct(),
            sellerId: sellerUserId,
            slug: "slug-remove-3",
            status: "active",
            images: seedImages,
            colorNames: ["Navy Blue"],
            baseColors: ["Blue"],
        });
        const res = await adminRemoveProduct(customerToken, product._id.toString());
        expect(res.status).toBe(403);
    });
});

// ─── Seller Block / Unblock — Product Visibility ──────────────────────────────

describe("Seller block/unblock — product visibility", () => {
    it("should hide only active products when seller is blocked", async () => {
        await Product.create([
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-vis-1", status: "active", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
            { ...validProduct(), sellerId: sellerUserId, slug: "slug-vis-2", status: "held", images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"] },
        ]);

        const { hideSellerProductsService } = await import("../../../modules/product/product.service.js");
        await hideSellerProductsService(sellerUserId);

        const active = await Product.find({ sellerId: sellerUserId, status: "active" });
        const held = await Product.find({ sellerId: sellerUserId, status: "held" });
        expect(active).toHaveLength(0);
        expect(held).toHaveLength(2);
    });

    it("should restore only previously active products when seller is unblocked", async () => {
        await Product.create([
            {
                ...validProduct(), sellerId: sellerUserId, slug: "slug-restore-1",
                status: "held", previousStatus: "active",
                images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"],
            },
            {
                ...validProduct(), sellerId: sellerUserId, slug: "slug-restore-2",
                status: "held", previousStatus: "held",
                images: seedImages, colorNames: ["Navy Blue"], baseColors: ["Blue"],
            },
        ]);

        const { restoreSellerProductsService } = await import("../../../modules/product/product.service.js");
        await restoreSellerProductsService(sellerUserId);

        const active = await Product.find({ sellerId: sellerUserId, status: "active" });
        const held = await Product.find({ sellerId: sellerUserId, status: "held" });
        expect(active).toHaveLength(1);
        expect(held).toHaveLength(1);
    });
});

// ─── POST /seller/products/media/upload ─────────────────────────────────────

describe("POST /seller/products/media/upload", () => {
    it("should upload seller product media and return cloudinary file metadata", async () => {
        const res = await uploadProductMedia(sellerToken);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.files)).toBe(true);
        expect(res.body.data.files.length).toBe(2);
        expect(res.body.data.files[0]).toHaveProperty("url");
        expect(res.body.data.files[0]).toHaveProperty("publicId");
    });

    it("should return 403 when customer tries to upload seller media", async () => {
        const res = await uploadProductMedia(customerToken);
        expect(res.status).toBe(403);
        expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should return 401 when no token is provided", async () => {
        const res = await request(app)
            .post("/seller/products/media/upload")
            .attach("files", Buffer.from("img-1"), "one.jpg");

        expect(res.status).toBe(401);
        expect(res.body.errorCode).toBe("UNAUTHORIZED");
    });

    it("should reject unsupported file types", async () => {
        const res = await request(app)
            .post("/seller/products/media/upload")
            .set("Authorization", `Bearer ${sellerToken}`)
            .attach("files", Buffer.from("not-an-image"), "malware.txt");

        expect(res.status).toBe(400);
        expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });
});
