import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary.js";

describe("Cloudinary Utils", () => {
  const previousEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    process.env.NODE_ENV = previousEnv;
  });

  it("should return synthetic upload response in test environment", async () => {
    const result = await uploadToCloudinary("data:image/jpeg;base64,ZmFrZQ==", "products");

    expect(result.url).toContain("res.cloudinary.com/test");
    expect(result.publicId).toContain("wearweb/products");
  });

  it("should no-op delete in test environment", async () => {
    await expect(deleteFromCloudinary("wearweb/products/fake")).resolves.toBeUndefined();
  });
});
