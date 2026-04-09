import request from 'supertest';
import Stripe from 'stripe';
import app from '../../../app.js';
import seedUsers from '../../helpers/seedUsers.js';
import { getCustomerToken, getAdminToken } from '../../helpers/getTokens.js';
import Purchase from '../../../modules/payment/purchase.model.js';
import Payment from '../../../modules/payment/payment.model.js';
import Order from '../../../modules/order/order.model.js';
import User from '../../../modules/user/user.model.js';
import Address from '../../../modules/user/address.model.js';
import Category from '../../../modules/category/category.model.js';
import CategoryTemplate from '../../../modules/category/categoryTemplate.model.js';
import Product from '../../../modules/product/product.model.js';
import SellerProfile from '../../../modules/user/sellerProfile.model.js';
import Cart from '../../../modules/cart/cart.model.js';

// ─── Token Variables ─────────────────────────────────────────────────────────
let customerToken, adminToken;
let customerId, sellerId, addressId;
let productId, variantId;
let secondaryVariantId;
let categoryId;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const placeOrder = (token, data) =>
  request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(data);

const initiatePayment = (token, data) =>
  request(app)
    .post('/payment/initiate')
    .set('Authorization', `Bearer ${token}`)
    .send(data);

const getHistory = (token) =>
  request(app)
    .get('/payment/history')
    .set('Authorization', `Bearer ${token}`);

const getAdminPayments = (token) =>
  request(app)
    .get('/payment/admin/payments')
    .set('Authorization', `Bearer ${token}`);

// Build a fake Stripe webhook event signed with the test secret
const buildWebhookEvent = (type, paymentIntentData) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}`,
    type,
    data: { object: paymentIntentData },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
  return { payload, signature };
};

// ─── Global Setup ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await seedUsers();
  customerToken = await getCustomerToken();
  adminToken = await getAdminToken();

  // Get IDs
  const customer = await User.findOne({ email: 'customer@test.com' });
  const seller = await User.findOne({ email: 'seller@test.com' });
  customerId = customer._id;
  sellerId = seller._id;

  // Ensure seller is approved and has a complete seller profile.
  await User.findByIdAndUpdate(sellerId, { status: 'active' });
  await SellerProfile.deleteMany({ userId: sellerId });
  await SellerProfile.create({
    userId: sellerId,
    companyName: 'Payment Test Store',
    ownerName: 'Payment Seller',
    companyEmail: 'payment-seller@test.com',
    companyPhone: '9876543210',
    companyProof: ['https://example.com/proof.jpg'],
    location: {
      country: 'India',
      state: 'Gujarat',
      district: 'Vadodara',
      addressLine: '123 Business Street',
    },
    profileComplete: true,
  });

  // Create category + template directly (stable seed setup for payment tests).
  const category = await Category.create({
    name: 'Payment Test Category',
    slug: 'payment-test-category',
    image: 'https://example.com/payment-category.jpg',
    commissionRate: 10,
  });
  categoryId = category._id;

  await CategoryTemplate.create({
    categoryId,
    sizeOptions: ['S', 'M', 'L', 'XL'],
    specFields: [{ label: 'Material', key: 'material', filterOptions: ['Cotton'] }],
  });

  // Create product directly with schema-compliant variant/snapshot fields.
  const product = await Product.create({
    sellerId,
    categoryId,
    name: 'Test Shirt',
    slug: `test-shirt-${Date.now()}`,
    brand: 'WearCo',
    gender: 'men',
    description: 'A test shirt for payment tests',
    images: [{ url: 'https://res.cloudinary.com/test/image/upload/test.jpg', publicId: null }],
    variants: [
      {
        colorName: 'Red',
        colorCode: '#FF0000',
        baseColor: 'Red',
        size: 'L',
        price: 999,
        stock: 50,
      },
      {
        colorName: 'Blue',
        colorCode: '#0000FF',
        baseColor: 'Blue',
        size: 'M',
        price: 899,
        stock: 50,
      },
    ],
    specifications: [{ key: 'material', value: 'Cotton' }],
    status: 'active',
    colorNames: ['Red'],
    baseColors: ['Red'],
  });
  productId = product._id;
  variantId = product.variants[0]._id;
  secondaryVariantId = product.variants[1]._id;

  // Add customer address directly.
  const address = await Address.create({
    userId: customerId,
    fullName: 'Payment Customer',
    phone: '9876543210',
    street: '123 Test St',
    district: 'Test District',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
    country: 'India',
    label: 'home',
    isDefault: true,
  });
  addressId = address._id;

  // Add product to cart
  await request(app)
    .post('/cart')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ productId, variantId, quantity: 2 });
});

afterEach(async () => {
  await Purchase.deleteMany({});
  await Payment.deleteMany({});
  await Order.deleteMany({});
  // Reset cart
  await request(app)
    .delete('/cart')
    .set('Authorization', `Bearer ${customerToken}`);
  // Re-add to cart for next test
  await request(app)
    .post('/cart')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ productId, variantId, quantity: 2 });
});

// ─── Helper: place an order and return orderId ────────────────────────────────
const placeTestOrder = async () => {
  const res = await placeOrder(customerToken, {
    variantIds: [variantId.toString()],
    addressId,
  });
  return res.body.data?.orders?.[0]?._id || res.body.data?.order?._id;
};

// ─── POST /payment/initiate ───────────────────────────────────────────────────
describe('POST /payment/initiate', () => {
  it('should initiate payment and return clientSecret', async () => {
    const orderId = await placeTestOrder();
    const res = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.clientSecret).toBeDefined();
    expect(res.body.data.purchaseId).toBeDefined();
    expect(res.body.data.amount).toBeGreaterThan(0);
    expect(res.body.data.currency).toBe('inr');
  });

  it('should return 400 when orderIds is empty', async () => {
    const res = await initiatePayment(customerToken, {
      orderIds: [],
      addressId,
    });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when addressId is missing', async () => {
    const orderId = await placeTestOrder();
    const res = await initiatePayment(customerToken, { orderIds: [orderId] });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 404 when address does not belong to customer', async () => {
    const orderId = await placeTestOrder();
    const fakeAddressId = '507f1f77bcf86cd799439011';
    const res = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId: fakeAddressId,
    });
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('should return 400 when order does not belong to customer', async () => {
    const fakeOrderId = '507f1f77bcf86cd799439011';
    const res = await initiatePayment(customerToken, {
      orderIds: [fakeOrderId],
      addressId,
    });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when no token', async () => {
    const res = await request(app)
      .post('/payment/initiate')
      .send({ orderIds: ['507f1f77bcf86cd799439011'], addressId });
    expect(res.status).toBe(401);
  });

  it('should return 403 when non-customer calls initiate', async () => {
    const orderId = await placeTestOrder();
    const res = await initiatePayment(adminToken, {
      orderIds: [orderId],
      addressId,
    });
    expect(res.status).toBe(403);
  });
});

// ─── POST /payment/webhook ────────────────────────────────────────────────────
describe('POST /payment/webhook', () => {
  it('should mark purchase as paid on payment_intent.succeeded', async () => {
    const orderId = await placeTestOrder();

    // Initiate payment to create Purchase record
    const initRes = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId,
    });
    const { purchaseId } = initRes.body.data;

    const purchase = await Purchase.findById(purchaseId);

    const fakePaymentIntent = {
      id: purchase.stripePaymentIntentId,
      amount: purchase.amount,
      currency: 'inr',
      metadata: {
        customerId: customerId.toString(),
        orderIds: orderId,
        addressId: addressId.toString(),
      },
    };

    const { payload, signature } = buildWebhookEvent(
      'payment_intent.succeeded',
      fakePaymentIntent
    );

    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    const updatedPurchase = await Purchase.findById(purchaseId);
    expect(updatedPurchase.status).toBe('paid');

    const payment = await Payment.findOne({ purchaseId });
    expect(payment).toBeTruthy();
    expect(payment.status).toBe('succeeded');

    const updatedOrder = await Order.findById(orderId);
    expect(updatedOrder.paymentStatus).toBe('paid');

    const updatedCart = await Cart.findOne({ userId: customerId });
    expect(updatedCart.items).toHaveLength(0);
  });

  it('should remove only ordered checkout variants from cart on payment_intent.succeeded', async () => {
    await request(app)
      .post('/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, variantId: secondaryVariantId, quantity: 1 });

    const orderId = await placeTestOrder();

    const initRes = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId,
    });
    const { purchaseId } = initRes.body.data;
    const purchase = await Purchase.findById(purchaseId);

    const fakePaymentIntent = {
      id: purchase.stripePaymentIntentId,
      amount: purchase.amount,
      currency: 'inr',
    };

    const { payload, signature } = buildWebhookEvent(
      'payment_intent.succeeded',
      fakePaymentIntent
    );

    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);

    const updatedCart = await Cart.findOne({ userId: customerId });
    const remainingVariantIds = updatedCart.items.map((item) => item.variantId.toString());

    expect(remainingVariantIds).toContain(secondaryVariantId.toString());
    expect(remainingVariantIds).not.toContain(variantId.toString());
  });

  it('should cancel orders and restore stock on payment_intent.payment_failed', async () => {
    const orderId = await placeTestOrder();

    const cartBeforeFailure = await Cart.findOne({ userId: customerId });
    const beforeVariantIds = cartBeforeFailure.items.map((item) => item.variantId.toString());
    expect(beforeVariantIds).toContain(variantId.toString());

    const initRes = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId,
    });
    const { purchaseId } = initRes.body.data;
    const purchase = await Purchase.findById(purchaseId);

    const stockBefore = await Product.findById(productId);
    const variantBefore = stockBefore.variants.id(variantId);

    const fakePaymentIntent = {
      id: purchase.stripePaymentIntentId,
      amount: purchase.amount,
      currency: 'inr',
    };

    const { payload, signature } = buildWebhookEvent(
      'payment_intent.payment_failed',
      fakePaymentIntent
    );

    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);

    const updatedPurchase = await Purchase.findById(purchaseId);
    expect(updatedPurchase.status).toBe('failed');

    const updatedOrder = await Order.findById(orderId);
    expect(updatedOrder.status).toBe('cancelled');

    const stockAfter = await Product.findById(productId);
    const variantAfter = stockAfter.variants.id(variantId);
    expect(variantAfter.stock).toBe(variantBefore.stock + 2);

    const cartAfterFailure = await Cart.findOne({ userId: customerId });
    const afterVariantIds = cartAfterFailure.items.map((item) => item.variantId.toString());
    expect(afterVariantIds).toContain(variantId.toString());
  });

  it('should return 400 on invalid webhook signature', async () => {
    const res = await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'invalid_signature')
      .send(JSON.stringify({ type: 'payment_intent.succeeded', data: { object: {} } }));

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should be idempotent — second succeeded webhook does not duplicate Payment', async () => {
    const orderId = await placeTestOrder();
    const initRes = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId,
    });
    const { purchaseId } = initRes.body.data;
    const purchase = await Purchase.findById(purchaseId);

    const fakePaymentIntent = {
      id: purchase.stripePaymentIntentId,
      amount: purchase.amount,
      currency: 'inr',
    };

    const { payload, signature } = buildWebhookEvent(
      'payment_intent.succeeded',
      fakePaymentIntent
    );

    // Send twice
    await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    const { payload: p2, signature: s2 } = buildWebhookEvent(
      'payment_intent.succeeded',
      fakePaymentIntent
    );
    await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', s2)
      .send(p2);

    const paymentCount = await Payment.countDocuments({ purchaseId });
    expect(paymentCount).toBe(1);
  });
});

// ─── POST /payment/refund/:orderId ────────────────────────────────────────────
describe('POST /payment/refund/:orderId', () => {
  it('should process refund for a paid order', async () => {
    const orderId = await placeTestOrder();
    const initRes = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId,
    });
    const { purchaseId } = initRes.body.data;
    const purchase = await Purchase.findById(purchaseId);

    // Simulate payment success via webhook
    const fakePI = { id: purchase.stripePaymentIntentId, amount: purchase.amount, currency: 'inr' };
    const { payload, signature } = buildWebhookEvent('payment_intent.succeeded', fakePI);
    await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    const res = await request(app)
      .post(`/payment/refund/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Changed my mind' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.refundId).toBeDefined();
    expect(res.body.data.refundedAmount).toBeGreaterThan(0);

    const updatedOrder = await Order.findById(orderId);
    expect(updatedOrder.paymentStatus).toBe('refunded');
  });

  it('should return 400 when order has not been paid', async () => {
    const orderId = await placeTestOrder();
    const res = await request(app)
      .post(`/payment/refund/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should return 404 when orderId does not exist', async () => {
    const res = await request(app)
      .post('/payment/refund/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Test' });

    expect(res.status).toBe(404);
  });

  it('should return 401 when no token', async () => {
    const res = await request(app)
      .post('/payment/refund/507f1f77bcf86cd799439011')
      .send({ reason: 'Test' });
    expect(res.status).toBe(401);
  });
});

// ─── GET /payment/history ─────────────────────────────────────────────────────
describe('GET /payment/history', () => {
  it('should return payment history with aggregated line items', async () => {
    const orderId = await placeTestOrder();
    const initRes = await initiatePayment(customerToken, {
      orderIds: [orderId],
      addressId,
    });
    const { purchaseId } = initRes.body.data;
    const purchase = await Purchase.findById(purchaseId);

    const fakePI = { id: purchase.stripePaymentIntentId, amount: purchase.amount, currency: 'inr' };
    const { payload, signature } = buildWebhookEvent('payment_intent.succeeded', fakePI);
    await request(app)
      .post('/payment/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    const res = await getHistory(customerToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const record = res.body.data[0];
    expect(record.items).toBeDefined();
    expect(Array.isArray(record.items)).toBe(true);
    expect(record.items[0]).toHaveProperty('productName');
    expect(record.items[0]).toHaveProperty('color');
    expect(record.items[0]).toHaveProperty('size');
    expect(record.items[0]).toHaveProperty('quantity');
    expect(record.items[0]).toHaveProperty('unitPrice');
  });

  it('should return empty array when no payments exist', async () => {
    const res = await getHistory(customerToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 401 when no token', async () => {
    const res = await request(app).get('/payment/history');
    expect(res.status).toBe(401);
  });

  it('should return 403 when admin calls customer history route', async () => {
    const res = await getHistory(adminToken);
    expect(res.status).toBe(403);
  });
});

// ─── GET /payment/admin/payments ─────────────────────────────────────────────
describe('GET /payment/admin/payments', () => {
  it('should return all payments for admin', async () => {
    const res = await getAdminPayments(adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payments).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
  });

  it('should return 401 when no token', async () => {
    const res = await request(app).get('/payment/admin/payments');
    expect(res.status).toBe(401);
  });

  it('should return 403 when customer calls admin route', async () => {
    const res = await getAdminPayments(customerToken);
    expect(res.status).toBe(403);
  });
});