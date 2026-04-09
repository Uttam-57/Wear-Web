import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import seedUsers from '../../helpers/seedUsers.js';
import { getCustomerToken, getSellerToken, getAdminToken } from '../../helpers/getTokens.js';
import Cart from '../../../modules/cart/cart.model.js';
import Product from '../../../modules/product/product.model.js';
import Category from '../../../modules/category/category.model.js';
import CategoryTemplate from '../../../modules/category/categoryTemplate.model.js';
import User from '../../../modules/user/user.model.js';

let customerToken;
let sellerToken;
let adminToken;
let testProduct;
let testVariantId;
let secondVariantId;
let sellerId;

// ─── Request Helpers ─────────────────────────────────────────────────────────
const addToCart = (token, data) =>
  request(app).post('/cart').set('Authorization', `Bearer ${token}`).send(data);

const getCart = (token) =>
  request(app).get('/cart').set('Authorization', `Bearer ${token}`);

const updateCartItem = (token, variantId, data) =>
  request(app)
    .put(`/cart/${variantId}`)
    .set('Authorization', `Bearer ${token}`)
    .send(data);

const removeCartItem = (token, variantId) =>
  request(app).delete(`/cart/${variantId}`).set('Authorization', `Bearer ${token}`);

const clearCart = (token) =>
  request(app).delete('/cart').set('Authorization', `Bearer ${token}`);

// ─── Valid Data Factory ───────────────────────────────────────────────────────
const validAddItem = (overrides = {}) => ({
  productId: testProduct._id.toString(),
  variantId: testVariantId.toString(),
  quantity: 1,
  ...overrides,
});

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await seedUsers();
  customerToken = await getCustomerToken();
  sellerToken = await getSellerToken();
  adminToken = await getAdminToken();

  const sellerUser = await User.findOne({ role: 'seller' });
  sellerId = sellerUser._id;

  // Seed category and template
  const category = await Category.create({
    name: 'Test Shirts',
    slug: 'test-shirts',
    commissionRate: 10,
    image: 'https://example.com/category.jpg',
  });

  await CategoryTemplate.create({
    categoryId: category._id,
    sizeOptions: ['S', 'M', 'L'],
    specFields: [
      { label: 'Material', key: 'material', filterOptions: ['Cotton', 'Polyester'] },
    ],
  });

  // Seed a product with two variants
  testProduct = await Product.create({
    sellerId,
    categoryId: category._id,
    name: 'Plain Test Shirt',
    slug: 'plain-test-shirt-abc12',
    brand: 'TestBrand',
    gender: 'Men',
    description: 'A plain shirt for testing cart functionality.',
    images: ['https://example.com/img1.jpg'],
    status: 'active',
    colorNames: ['White', 'Black'],
    baseColors: ['White', 'Black'],
    variants: [
      {
        colorName: 'White',
        colorCode: '#FFFFFF',
        baseColor: 'White',
        size: 'M',
        price: 1000,
        stock: 10,
        discount: 10,
      },
      {
        colorName: 'Black',
        colorCode: '#000000',
        baseColor: 'Black',
        size: 'L',
        price: 1200,
        stock: 5,
        discount: 0,
      },
    ],
    specifications: [{ key: 'material', value: 'Cotton' }],
    manufacturer: {
      name: 'Test Mfg',
      address: '123 Test St',
      countryOfOrigin: 'India',
    },
  });

  testVariantId = testProduct.variants[0]._id;
  secondVariantId = testProduct.variants[1]._id;
});

afterEach(async () => {
  await Cart.deleteMany({});
});

// ─── POST /cart ───────────────────────────────────────────────────────────────
describe('POST /cart', () => {
  it('should add item to cart successfully', async () => {
    const res = await addToCart(customerToken, validAddItem());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cart.items).toHaveLength(1);
  });

  it('should snapshot correct fields on add', async () => {
    const res = await addToCart(customerToken, validAddItem());
    const item = res.body.data.cart.items[0];
    expect(item.snapshot.productName).toBe('Plain Test Shirt');
    expect(item.snapshot.size).toBe('M');
    expect(item.snapshot.colorName).toBe('White');
    expect(item.snapshot.colorCode).toBe('#FFFFFF');
    expect(item.snapshot.price).toBe(1000);
    expect(item.snapshot.effectivePrice).toBe(900); // 10% off
    expect(item.snapshot.images).toEqual(['https://example.com/img1.jpg']);
  });

  it('should increment quantity when same productId + variantId added again', async () => {
    await addToCart(customerToken, validAddItem({ quantity: 2 }));
    const res = await addToCart(customerToken, validAddItem({ quantity: 3 }));
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.items[0].quantity).toBe(5);
  });

  it('should add two different variants as separate items', async () => {
    await addToCart(customerToken, validAddItem());
    const res = await addToCart(customerToken, validAddItem({ variantId: secondVariantId.toString() }));
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(2);
  });

  it('should return 410 OUT_OF_STOCK when quantity exceeds stock', async () => {
    const res = await addToCart(customerToken, validAddItem({ quantity: 999 }));
    expect(res.status).toBe(410);
    expect(res.body.errorCode).toBe('OUT_OF_STOCK');
  });

  it('should return 410 OUT_OF_STOCK when increment exceeds stock', async () => {
    await addToCart(customerToken, validAddItem({ quantity: 8 }));
    const res = await addToCart(customerToken, validAddItem({ quantity: 5 })); // 8+5=13 > stock(10)
    expect(res.status).toBe(410);
    expect(res.body.errorCode).toBe('OUT_OF_STOCK');
  });

  it('should return 410 PRODUCT_UNAVAILABLE when product is held', async () => {
    await Product.findByIdAndUpdate(testProduct._id, { status: 'held' });
    const res = await addToCart(customerToken, validAddItem());
    expect(res.status).toBe(410);
    expect(res.body.errorCode).toBe('PRODUCT_UNAVAILABLE');
    await Product.findByIdAndUpdate(testProduct._id, { status: 'active' });
  });

  it('should return 404 when product does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await addToCart(customerToken, validAddItem({ productId: fakeId.toString() }));
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('should return 404 when variantId does not exist on product', async () => {
    const fakeVariantId = new mongoose.Types.ObjectId();
    const res = await addToCart(customerToken, validAddItem({ variantId: fakeVariantId.toString() }));
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('should return 400 VALIDATION_ERROR when cart reaches 20 items', async () => {
    // Add 20 different products by manipulating the cart directly
    const items = Array.from({ length: 20 }, (_, i) => ({
      productId: new mongoose.Types.ObjectId(),
      variantId: new mongoose.Types.ObjectId(),
      sellerId,
      snapshot: {
        productName: `Product ${i}`,
        images: ['https://example.com/img.jpg'],
        size: 'M',
        colorName: 'White',
        colorCode: '#FFFFFF',
        price: 500,
        effectivePrice: 500,
      },
      quantity: 1,
    }));

    const customerUser = await User.findOne({ role: 'customer' });
    await Cart.create({ userId: customerUser._id, items });

    const res = await addToCart(customerToken, validAddItem());
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 400 VALIDATION_ERROR when quantity is missing', async () => {
    const res = await addToCart(customerToken, { productId: testProduct._id.toString(), variantId: testVariantId.toString() });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 400 VALIDATION_ERROR when quantity is 0', async () => {
    const res = await addToCart(customerToken, validAddItem({ quantity: 0 }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 400 VALIDATION_ERROR when productId is invalid ObjectId', async () => {
    const res = await addToCart(customerToken, validAddItem({ productId: 'not-an-id' }));
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).post('/cart').send(validAddItem());
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('should return 403 when seller tries to use cart', async () => {
    const res = await addToCart(sellerToken, validAddItem());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  it('should return 403 when admin tries to use cart', async () => {
    const res = await addToCart(adminToken, validAddItem());
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });
});

// ─── GET /cart ────────────────────────────────────────────────────────────────
describe('GET /cart', () => {
  it('should return cart with items', async () => {
    await addToCart(customerToken, validAddItem());
    const res = await getCart(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cart.items).toHaveLength(1);
  });

  it('should return empty cart with 200 when no cart exists', async () => {
    const res = await getCart(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toEqual([]);
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).get('/cart');
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });
});

// ─── PUT /cart/:variantId ─────────────────────────────────────────────────────
describe('PUT /cart/:variantId', () => {
  it('should update quantity successfully', async () => {
    await addToCart(customerToken, validAddItem({ quantity: 1 }));
    const res = await updateCartItem(customerToken, testVariantId.toString(), { quantity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].quantity).toBe(3);
  });

  it('should return 410 OUT_OF_STOCK when new quantity exceeds stock', async () => {
    await addToCart(customerToken, validAddItem({ quantity: 1 }));
    const res = await updateCartItem(customerToken, testVariantId.toString(), { quantity: 999 });
    expect(res.status).toBe(410);
    expect(res.body.errorCode).toBe('OUT_OF_STOCK');
  });

  it('should return 404 when variantId not in cart', async () => {
    await addToCart(customerToken, validAddItem());
    const fakeVariantId = new mongoose.Types.ObjectId();
    const res = await updateCartItem(customerToken, fakeVariantId.toString(), { quantity: 2 });
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('should return 400 when quantity is 0', async () => {
    await addToCart(customerToken, validAddItem());
    const res = await updateCartItem(customerToken, testVariantId.toString(), { quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when quantity is missing', async () => {
    await addToCart(customerToken, validAddItem());
    const res = await updateCartItem(customerToken, testVariantId.toString(), {});
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app)
      .put(`/cart/${testVariantId}`)
      .send({ quantity: 2 });
    expect(res.status).toBe(401);
  });

  it('should return 403 when seller tries to update cart', async () => {
    const res = await updateCartItem(sellerToken, testVariantId.toString(), { quantity: 2 });
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /cart/:variantId ──────────────────────────────────────────────────
describe('DELETE /cart/:variantId', () => {
  it('should remove item successfully', async () => {
    await addToCart(customerToken, validAddItem());
    const res = await removeCartItem(customerToken, testVariantId.toString());
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(0);
  });

  it('should return 404 when variantId not in cart', async () => {
    await addToCart(customerToken, validAddItem());
    const fakeVariantId = new mongoose.Types.ObjectId();
    const res = await removeCartItem(customerToken, fakeVariantId.toString());
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).delete(`/cart/${testVariantId}`);
    expect(res.status).toBe(401);
  });

  it('should return 403 when seller tries to remove cart item', async () => {
    const res = await removeCartItem(sellerToken, testVariantId.toString());
    expect(res.status).toBe(403);
  });
});

// ─── DELETE /cart ─────────────────────────────────────────────────────────────
describe('DELETE /cart', () => {
  it('should clear all items from cart', async () => {
    await addToCart(customerToken, validAddItem());
    await addToCart(customerToken, validAddItem({ variantId: secondVariantId.toString() }));
    const res = await clearCart(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(0);
  });

  it('should return 200 when cart is already empty (idempotent)', async () => {
    const res = await clearCart(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toEqual([]);
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).delete('/cart');
    expect(res.status).toBe(401);
  });

  it('should return 403 when admin tries to clear cart', async () => {
    const res = await clearCart(adminToken);
    expect(res.status).toBe(403);
  });
});