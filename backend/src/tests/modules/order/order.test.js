import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import seedUsers from '../../helpers/seedUsers.js';
import { getCustomerToken, getSellerToken, getAdminToken } from '../../helpers/getTokens.js';
import Category from '../../../modules/category/category.model.js';
import CategoryTemplate from '../../../modules/category/categoryTemplate.model.js';
import Product from '../../../modules/product/product.model.js';
import Cart from '../../../modules/cart/cart.model.js';
import Order from '../../../modules/order/order.model.js';
import Address from '../../../modules/user/address.model.js';
import User from '../../../modules/user/user.model.js';
import SellerProfile from '../../../modules/user/sellerProfile.model.js';


let customerToken, sellerToken, adminToken;
let product, variant, categoryId;

// ─── Seed ─────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await seedUsers();
  customerToken = await getCustomerToken();
  sellerToken = await getSellerToken();
  adminToken = await getAdminToken();

  const sellerUser = await User.findOne({ role: 'seller' });
  const customerUser = await User.findOne({ role: 'customer' });

  // Seed seller profile so requireSellerProfileComplete passes
  await SellerProfile.create({
    userId: sellerUser._id,
    companyName: 'Test Store',
    ownerName: 'Test Owner',
    companyEmail: 'seller@teststore.com',
    companyPhone: '9876543210',
    companyProof: ['https://example.com/proof.jpg'],
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Vadodara',
      addressLine: '123 Seller Street',
    },
    profileComplete: true,
  });

  // Category
  const category = await Category.create({
    name: 'Shirts',
    slug: 'shirts',
    image: 'https://example.com/shirts.jpg',
    isActive: true,
  });
  categoryId = category._id;

  // CategoryTemplate
  await CategoryTemplate.create({
    categoryId,
    sizeOptions: ['S', 'M', 'L', 'XL'],
    specFields: [{ label: 'Material', key: 'material', filterOptions: ['Cotton', 'Polyester'] }],
  });

  // Product
  product = await Product.create({
    sellerId: sellerUser._id,
    categoryId,
    name: 'Classic White Shirt',
    slug: 'classic-white-shirt',
    brand: 'WearCo',
    gender: 'Men',
    description: 'A clean white shirt for all occasions.',
    images: [{ url: 'https://example.com/shirt.jpg', publicId: null }],
    variants: [
      {
        colorName: 'White',
        colorCode: '#FFFFFF',
        baseColor: 'White',
        size: 'M',
        price: 1000,
        discount: 10,
        stock: 50,
      },
    ],
    specifications: [{ key: 'material', value: 'Cotton' }],
    status: 'active',
    colorNames: ['White'],
    baseColors: ['White'],
  });

  variant = product.variants[0];

  // Seed customer address
  await Address.create({
    userId: customerUser._id,
    fullName: 'Test Customer',
    phone: '9876543210',
    street: '123 Main Street',
    district: 'Ankleshwar',
    city: 'Ankleshwar',
    state: 'Gujarat',
    pincode: '393010',
    country: 'India',
    label: 'home',
    isDefault: true,
  });
});

afterEach(async () => {
  await Cart.deleteMany({});
  await Order.deleteMany({});
});

// ─── Helper: Add item to cart ─────────────────────────────────────────────────
const addToCart = async () => {
  // Reset stock before each placement to keep tests independent
  await Product.findByIdAndUpdate(product._id, { $set: { 'variants.0.stock': 50 } });
  await request(app)
    .post('/cart')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ productId: product._id.toString(), variantId: variant._id.toString(), quantity: 2 });
};

const getAddressId = async () => {
  const customerUser = await User.findOne({ role: 'customer' });
  const address = await Address.findOne({ userId: customerUser._id });
  return address._id.toString();
};

// ─── POST /orders ─────────────────────────────────────────────────────────────
describe('POST /orders', () => {
  it('places order successfully and keeps item in cart until payment succeeds', async () => {
    await addToCart();
    const addressId = await getAddressId();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.orders[0].status).toBe('placed');
    expect(res.body.data.orders[0].totalAmount).toBe(1800); // 900 * 2

    // Cart should still contain the selected item until payment succeeds.
    const customerUser = await User.findOne({ role: 'customer' });
    const cart = await Cart.findOne({ userId: customerUser._id });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].variantId.toString()).toBe(variant._id.toString());
  });

  it('deducts stock from variant', async () => {
    await addToCart();
    const addressId = await getAddressId();

    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(48); // 50 - 2
  });

  it('returns 400 if cart is empty', async () => {
    const addressId = await getAddressId();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    expect(res.status).toBe(400);
  });

  it('returns 400 if selected variantIds not in cart', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [fakeId], addressId });

    expect(res.status).toBe(400);
  });

  it('returns 400 if variantIds is empty array', async () => {
    const addressId = await getAddressId();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [], addressId });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns 404 if addressId not found', async () => {
    await addToCart();
    const fakeAddressId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId: fakeAddressId });

    expect(res.status).toBe(404);
  });

  it('returns 410 if product is held', async () => {
    await addToCart();
    const addressId = await getAddressId();
    await Product.findByIdAndUpdate(product._id, { status: 'held' });

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    await Product.findByIdAndUpdate(product._id, { status: 'active' });
    expect(res.status).toBe(410);
    expect(res.body.errorCode).toBe('PRODUCT_UNAVAILABLE');
  });

  it('returns 403 if seller tries to place order', async () => {
    const addressId = await getAddressId();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    expect(res.status).toBe(403);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app)
      .post('/orders')
      .send({ variantIds: [variant._id.toString()], addressId: 'abc' });

    expect(res.status).toBe(401);
  });
});

// ─── GET /orders ──────────────────────────────────────────────────────────────
describe('GET /orders', () => {
  it('returns customer order list', async () => {
    await addToCart();
    const addressId = await getAddressId();
    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    // Restore stock for next tests
    await Product.findByIdAndUpdate(
      product._id,
      { $set: { 'variants.0.stock': 50 } }
    );

    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
  });

  it('returns empty array if no orders', async () => {
    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(0);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/orders');
    expect(res.status).toBe(401);
  });
});

// ─── GET /orders/:id ──────────────────────────────────────────────────────────
describe('GET /orders/:id', () => {
  it('returns single order detail', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });


    const orderId = placeRes.body.data.orders[0]._id;

    const res = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.order._id).toBe(orderId);
  });

  it('returns 404 for another customer order', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/orders/${fakeId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── PUT /orders/:id/cancel ───────────────────────────────────────────────────
describe('PUT /orders/:id/cancel', () => {
  const placeTestOrder = async () => {
    await addToCart();
    const addressId = await getAddressId();
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    return res.body.data.orders[0]._id;
  };

  it('cancels a placed order and restores stock', async () => {
    const orderId = await placeTestOrder();

    const res = await request(app)
      .put(`/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Changed my mind' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('cancelled');
    expect(res.body.data.order.cancelledBy).toBe('customer');

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(50);
  });

  it('returns 400 if order is already shipped', async () => {
    const orderId = await placeTestOrder();
    await Order.findByIdAndUpdate(orderId, { status: 'shipped' });

    const res = await request(app)
      .put(`/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Changed my mind' });

    expect(res.status).toBe(400);
  });

  it('returns 400 if reason is too short', async () => {
    const orderId = await placeTestOrder();

    const res = await request(app)
      .put(`/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'No' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });
});

// ─── POST /orders/:id/confirm-delivery ───────────────────────────────────────
describe('POST /orders/:id/confirm-delivery', () => {
  it('confirms delivery with valid OTP', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, { status: 'out_for_delivery' });

    // Request OTP — returns plain OTP in test env
    const otpRes = await request(app)
      .post(`/orders/${orderId}/confirm-delivery/request-otp`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(otpRes.status).toBe(200);
    const { otp } = otpRes.body.data;

    // Confirm delivery with OTP
    const res = await request(app)
      .post(`/orders/${orderId}/confirm-delivery`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ otp });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('delivered');
  });

  it('returns 400 with wrong OTP', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, { status: 'out_for_delivery' });

    await request(app)
      .post(`/orders/${orderId}/confirm-delivery/request-otp`)
      .set('Authorization', `Bearer ${customerToken}`);

    const res = await request(app)
      .post(`/orders/${orderId}/confirm-delivery`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ otp: '000000' });

    expect(res.status).toBe(400);
  });

  it('returns 400 if OTP not requested first', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, { status: 'out_for_delivery' });

    const res = await request(app)
      .post(`/orders/${orderId}/confirm-delivery`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ otp: '123456' });

    expect(res.status).toBe(400);
  });

  it('returns 400 if order is not out_for_delivery', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const orderId = placeRes.body.data.orders[0]._id;

    const res = await request(app)
      .post(`/orders/${orderId}/confirm-delivery`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ otp: '123456' });

    expect(res.status).toBe(400);
  });
});

// ─── POST /orders/:id/return ──────────────────────────────────────────────────
describe('POST /orders/:id/return', () => {
  it('submits a return request for a delivered order', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, { status: 'delivered' });

    const res = await request(app)
      .post(`/orders/${orderId}/return`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'The product arrived damaged and does not match description' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.returnRequest.status).toBe('requested');
  });

  it('returns 400 if order is not delivered', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const orderId = placeRes.body.data.orders[0]._id;

    const res = await request(app)
      .post(`/orders/${orderId}/return`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'The product arrived damaged and does not match description' });

    expect(res.status).toBe(400);
  });

  it('returns 400 if reason is too short', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, { status: 'delivered' });

    const res = await request(app)
      .post(`/orders/${orderId}/return`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Bad' });

    expect(res.status).toBe(400);
  });
});

// ─── GET /seller/orders ───────────────────────────────────────────────────────
describe('GET /seller/orders', () => {
  it('returns seller order list', async () => {
    await addToCart();
    const addressId = await getAddressId();
    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const res = await request(app)
      .get('/seller/orders')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThan(0);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .get('/seller/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PUT /seller/orders/:id/status ───────────────────────────────────────────
describe('PUT /seller/orders/:id/status', () => {
  const placeAndGetOrder = async () => {
    await addToCart();
    const addressId = await getAddressId();
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    return res.body.data.orders[0]._id;
  };

  it('seller accepts a placed order', async () => {
    const orderId = await placeAndGetOrder();

    const res = await request(app)
      .put(`/seller/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'accepted' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('accepted');
  });

  it('returns 400 for invalid transition (placed → shipped)', async () => {
    const orderId = await placeAndGetOrder();

    const res = await request(app)
      .put(`/seller/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'shipped' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid status value', async () => {
    const orderId = await placeAndGetOrder();

    const res = await request(app)
      .put(`/seller/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'delivered' }); // seller cannot set delivered

    expect(res.status).toBe(400);
  });
});

// ─── PUT /seller/orders/:id/reject ───────────────────────────────────────────
describe('PUT /seller/orders/:id/reject', () => {
  it('seller rejects a placed order and restores stock', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    const orderId = placeRes.body.data.orders[0]._id;

    // Stock was deducted — set it to 48 to simulate
    await Product.findByIdAndUpdate(product._id, { $set: { 'variants.0.stock': 48 } });

    const res = await request(app)
      .put(`/seller/orders/${orderId}/reject`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ reason: 'Product is out of stock at our warehouse' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('rejected');

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.variants[0].stock).toBe(50); // restored
  });

  it('returns 400 if order is already accepted', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, { status: 'accepted' });

    const res = await request(app)
      .put(`/seller/orders/${orderId}/reject`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ reason: 'Product is out of stock at our warehouse' });

    expect(res.status).toBe(400);
  });
});

// ─── GET /admin/orders ────────────────────────────────────────────────────────
describe('GET /admin/orders', () => {
  it('admin gets all orders', async () => {
    await addToCart();
    const addressId = await getAddressId();
    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });

    const res = await request(app)
      .get('/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThan(0);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .get('/admin/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PUT /admin/orders/:id/status ─────────────────────────────────────────────
describe('PUT /admin/orders/:id/status', () => {
  it('admin overrides order status', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    const orderId = placeRes.body.data.orders[0]._id;

    const res = await request(app)
      .put(`/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('delivered');
  });
});

// ─── GET /admin/returns ───────────────────────────────────────────────────────
describe('GET /admin/returns', () => {
  it('admin gets all return requests', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, {
      status: 'delivered',
      returnRequest: { reason: 'Product arrived damaged and not as described', status: 'requested', requestedAt: new Date() },
    });

    const res = await request(app)
      .get('/admin/returns')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeGreaterThan(0);
  });
});

// ─── PUT /admin/returns/:id ───────────────────────────────────────────────────
describe('PUT /admin/returns/:id', () => {
  it('admin approves a return request', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, {
      status: 'delivered',
      returnRequest: { reason: 'Product arrived damaged and not as described', status: 'requested', requestedAt: new Date() },
    });

    const res = await request(app)
      .put(`/admin/returns/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'accepted', adminNote: 'Return accepted, pickup OTP sent' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.returnRequest.status).toBe('accepted');
  });

  it('returns 400 if return already resolved', async () => {
    await addToCart();
    const addressId = await getAddressId();
    const placeRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantIds: [variant._id.toString()], addressId });
    const orderId = placeRes.body.data.orders[0]._id;
    await Order.findByIdAndUpdate(orderId, {
      status: 'delivered',
      returnRequest: { reason: 'Product arrived damaged and not as described', status: 'rejected', requestedAt: new Date(), resolvedAt: new Date() },
    });

    const res = await request(app)
      .put(`/admin/returns/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(400);
  });
});