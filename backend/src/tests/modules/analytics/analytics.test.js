import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import User from '../../../modules/user/user.model.js';
import Order from '../../../modules/order/order.model.js';
import Product from '../../../modules/product/product.model.js';
import Category from '../../../modules/category/category.model.js';
import WalletTransaction from '../../../modules/wallet/walletTransaction.model.js';
import Wallet from '../../../modules/wallet/wallet.model.js';
import Review from '../../../modules/review/review.model.js';
import Payment from '../../../modules/payment/payment.model.js';
import AnalyticsSnapshot from '../../../modules/analytics/analytics.snapshot.model.js';
import seedUsers from "../../helpers/seedUsers.js";
import { getAdminToken, getCustomerToken, getSellerToken } from "../../helpers/getTokens.js";
import { runAnalyticsSnapshot } from '../../../modules/analytics/analytics.scheduler.js';
import { computeAdminAnalytics, resolveDateRange } from '../../../modules/analytics/analytics.service.js';

let adminToken, sellerToken, customerToken;
let sellerId, customerId, categoryId, productId, variantId;

beforeAll(async () => {
  await seedUsers();
  adminToken = await getAdminToken();
  customerToken = await getCustomerToken();
  sellerToken = await getSellerToken();

  const seller = await User.findOne({ email: 'seller@test.com' });
  const customer = await User.findOne({ email: 'customer@test.com' });
  sellerId = seller._id;
  customerId = customer._id;

  // seed category
  const cat = await Category.create({
    name: 'Analytics Test Cat',
    slug: 'analytics-test-cat',
    commissionRate: 10,
    image: 'http://img.test/cat.jpg',
  });
  categoryId = cat._id;

  // seed product
  const prod = await Product.create({
    sellerId,
    name: 'Analytics Product',
    slug: 'analytics-product',
    brand: 'TestBrand',
    gender: 'unisex',
    categoryId: categoryId,
    description: 'Test product for analytics',
    variants: [{ 
      size: 'M', 
      price: 1000, 
      stock: 50, 
      discount: 0,
      colorName: 'Red',
      colorCode: '#FF0000',
      baseColor: 'Red'
    }],
    images: [{ url: 'http://img.test/p.jpg', publicId: 'p1' }],
    status: 'active',
  });
  productId = prod._id;
  variantId = prod.variants[0]._id;
});

beforeEach(async () => {
  // seed orders (delivered)
  await Order.insertMany([
    {
      customerId,
      sellerId,
      items: [{
        productId,
        variantId,
        sellerId,
        snapshot: {
          productName: 'Analytics Product',
          images: [{ url: 'http://img.test/p.jpg' }],
          size: 'M',
          colorName: 'Red',
          colorCode: '#FF0000',
          price: 1000,
          effectivePrice: 1000,
        },
        quantity: 2,
        subtotal: 2000
      }],
      totalAmount: 2000,
      addressSnapshot: { fullName: 'Test', phone: '9999999999', street: '1 St', district: 'District', city: 'City', state: 'State', pincode: '390001', country: 'India' },
      status: 'delivered',
    },
    {
      customerId,
      sellerId,
      items: [{
        productId,
        variantId,
        sellerId,
        snapshot: {
          productName: 'Analytics Product',
          images: [{ url: 'http://img.test/p.jpg' }],
          size: 'M',
          colorName: 'Red',
          colorCode: '#FF0000',
          price: 1000,
          effectivePrice: 1000,
        },
        quantity: 1,
        subtotal: 1000
      }],
      totalAmount: 1000,
      addressSnapshot: { fullName: 'Test', phone: '9999999999', street: '1 St', district: 'District', city: 'City', state: 'State', pincode: '390001', country: 'India' },
      status: 'cancelled',
    },
  ]);

  // seed wallet + transactions
  await Wallet.create({ sellerId, balance: 3600 });
  const now = new Date();
  await WalletTransaction.collection.insertMany([
    {
      transactionId: `ATX-C-${Date.now()}-1`,
      sellerId,
      type: 'credit',
      amount: 1800,
      description: 'Order credit',
      orderId: new mongoose.Types.ObjectId(),
      balanceBefore: 0,
      balanceAfter: 1800,
      payoutStatus: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      transactionId: `ATX-C-${Date.now()}-2`,
      sellerId,
      type: 'credit',
      amount: 1800,
      description: 'Order credit',
      orderId: new mongoose.Types.ObjectId(),
      balanceBefore: 1800,
      balanceAfter: 3600,
      payoutStatus: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      transactionId: `ATX-W-${Date.now()}-1`,
      sellerId,
      type: 'withdrawal',
      amount: 1000,
      description: 'Withdrawal',
      orderId: null,
      balanceBefore: 3600,
      balanceAfter: 2600,
      payoutStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // seed review
  await Review.create({
    productId,
    customerId,
    sellerId,
    orderId: new mongoose.Types.ObjectId(),
    rating: 4,
    comment: 'Good product',
    status: 'approved',
  });

  // seed payment
  await Payment.create({
    purchaseId: new mongoose.Types.ObjectId(),
    customerId,
    amount: 2000,
    currency: 'inr',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_test_analytics',
  });
});

// ── resolveDateRange utility ──────────────────────────────────────────────────

describe('resolveDateRange utility', () => {
  it('returns 30-day window for default period', () => {
    const { start, end } = resolveDateRange({ period: '30d' });
    const diffDays = Math.floor((end - start) / 864e5);
    expect(diffDays).toBe(30);
  });

  it('returns 7-day window for 7d period', () => {
    const { start, end } = resolveDateRange({ period: '7d' });
    const diffDays = Math.floor((end - start) / 864e5);
    expect(diffDays).toBe(7);
  });

  it('returns full range for all period', () => {
    const { start } = resolveDateRange({ period: 'all' });
    expect(start.getTime()).toBe(new Date(0).getTime());
  });

  it('uses from/to override when provided', () => {
    const { start, end } = resolveDateRange({ from: '2024-01-01', to: '2024-01-31' });
    expect(start.toISOString().slice(0, 10)).toBe('2024-01-01');
    expect(end.toISOString().slice(0, 10)).toBe('2024-01-31');
  });
});

// ── GET /seller/analytics ─────────────────────────────────────────────────────

describe('GET /seller/analytics', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/seller/analytics');
    expect(res.status).toBe(401);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for admin', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 with full analytics payload for seller', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('orders');
    expect(res.body.data).toHaveProperty('revenue');
    expect(res.body.data).toHaveProperty('wallet');
    expect(res.body.data).toHaveProperty('products');
    expect(res.body.data).toHaveProperty('reviews');
    expect(res.body.data).toHaveProperty('customers');
  });

  it('returns correct order totals', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    const { orders } = res.body.data;
    expect(orders.total).toBeGreaterThanOrEqual(2);
    expect(orders.byStatus.delivered).toBeGreaterThanOrEqual(1);
    expect(orders.byStatus.cancelled).toBeGreaterThanOrEqual(1);
  });

  it('returns wallet summary with balance and withdrawals', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    const { wallet } = res.body.data;
    expect(wallet.currentBalance).toBe(3600);
    expect(wallet.pendingWithdrawalCount).toBe(0);
    expect(wallet.pendingWithdrawalAmount).toBe(0);
    expect(wallet.totalWithdrawnInWindow).toBeGreaterThanOrEqual(1000);
    expect(wallet.totalCreditedInWindow).toBeGreaterThanOrEqual(3600);
  });

  it('returns review stats with rating distribution', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    const { reviews } = res.body.data;
    expect(reviews.totalReviews).toBeGreaterThanOrEqual(1);
    expect(reviews.averageRating).toBe(4);
    expect(reviews.ratingDistribution).toHaveProperty('4');
    expect(reviews.ratingDistribution['4']).toBeGreaterThanOrEqual(1);
  });

  it('returns revenue over time as array of date+amount objects', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    const { overTime } = res.body.data.revenue;
    expect(Array.isArray(overTime)).toBe(true);
    expect(overTime[0]).toHaveProperty('date');
    expect(overTime[0]).toHaveProperty('amount');
  });

  it('accepts 7d period param and returns shorter window', async () => {
    const res = await request(app)
      .get('/seller/analytics?period=7d')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    const { overTime } = res.body.data.revenue;
    expect(overTime.length).toBeLessThanOrEqual(8); // 7 days + today
  });

  it('accepts from/to params and scopes data correctly', async () => {
    const from = new Date();
    from.setDate(from.getDate() - 5);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = new Date().toISOString().slice(0, 10);

    const res = await request(app)
      .get(`/seller/analytics?from=${fromStr}&to=${toStr}`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 400 when from is after to', async () => {
    const res = await request(app)
      .get('/seller/analytics?from=2024-12-31&to=2024-01-01')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(400);
  });

  it('returns products section with low stock and no-sales arrays', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    const { products } = res.body.data;
    expect(products).toHaveProperty('lowStock');
    expect(products).toHaveProperty('noSalesInWindow');
    expect(Array.isArray(products.lowStock)).toBe(true);
    expect(Array.isArray(products.noSalesInWindow)).toBe(true);
  });

  it('returns customer stats with unique and repeat counts', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    const { customers } = res.body.data;
    expect(customers).toHaveProperty('uniqueCustomers');
    expect(customers).toHaveProperty('repeatCustomers');
    expect(typeof customers.uniqueCustomers).toBe('number');
  });

  it('returns fulfilmentRate cancellationRate returnRate as numbers', async () => {
    const res = await request(app)
      .get('/seller/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    const { orders } = res.body.data;
    expect(typeof orders.fulfilmentRate).toBe('number');
    expect(typeof orders.cancellationRate).toBe('number');
    expect(typeof orders.returnRate).toBe('number');
  });
});

// ── GET /admin/analytics ──────────────────────────────────────────────────────

describe('GET /admin/analytics', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/admin/analytics');
    expect(res.status).toBe(401);
  });

  it('returns 403 for seller', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 200 with full admin analytics payload', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d).toHaveProperty('users');
    expect(d).toHaveProperty('revenue');
    expect(d).toHaveProperty('orders');
    expect(d).toHaveProperty('payments');
    expect(d).toHaveProperty('withdrawals');
    expect(d).toHaveProperty('products');
    expect(d).toHaveProperty('sellers');
    expect(d).toHaveProperty('reviews');
  });

  it('returns isLive true when no snapshot exists', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    // in test env snapshot was never run, so fallback to live
    expect(res.body.data.isLive).toBe(true);
  });

  it('returns user breakdown by role', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const { users } = res.body.data;
    expect(users.byRole).toHaveProperty('customer');
    expect(users.byRole).toHaveProperty('seller');
    expect(users.byRole).toHaveProperty('admin');
    expect(users.total).toBeGreaterThan(0);
  });

  it('returns seller status breakdown', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const { sellerStatus } = res.body.data.users;
    expect(sellerStatus).toHaveProperty('pending');
    expect(sellerStatus).toHaveProperty('active');
    expect(sellerStatus).toHaveProperty('blocked');
  });

  it('returns revenue with grossGMV commissionEarned sellerPayouts', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const { revenue } = res.body.data;
    expect(revenue).toHaveProperty('grossGMV');
    expect(revenue).toHaveProperty('commissionEarned');
    expect(revenue).toHaveProperty('sellerPayouts');
    expect(typeof revenue.grossGMV).toBe('number');
  });

  it('returns revenue by category array', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(Array.isArray(res.body.data.revenue.byCategory)).toBe(true);
  });

  it('returns top sellers by revenue and order count', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const { sellers } = res.body.data;
    expect(Array.isArray(sellers.topByRevenue)).toBe(true);
    expect(Array.isArray(sellers.topByOrderCount)).toBe(true);
  });

  it('returns withdrawal stats', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    const { withdrawals } = res.body.data;
    expect(withdrawals.pendingCount).toBe(0);
    expect(withdrawals.pendingAmount).toBe(0);
  });

  it('returns new products over time array', async () => {
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(Array.isArray(res.body.data.products.newOverTime)).toBe(true);
  });

  it('accepts period param', async () => {
    const res = await request(app)
      .get('/admin/analytics?period=7d')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid period value', async () => {
    const res = await request(app)
      .get('/admin/analytics?period=invalid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});

// ── Snapshot (scheduler) ──────────────────────────────────────────────────────

describe('runAnalyticsSnapshot (scheduler)', () => {
  it('creates a snapshot document in DB', async () => {
    await runAnalyticsSnapshot();
    const snapshot = await AnalyticsSnapshot.findOne().sort({ date: -1 }).lean();
    expect(snapshot).not.toBeNull();
    expect(snapshot).toHaveProperty('users');
    expect(snapshot).toHaveProperty('revenue');
    expect(snapshot).toHaveProperty('orders');
  });

  it('upserts — running twice does not create duplicate for same date', async () => {
    await runAnalyticsSnapshot();
    await runAnalyticsSnapshot();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await AnalyticsSnapshot.countDocuments({ date: today });
    expect(count).toBe(1);
  });

  it('returns snapshot from DB on next admin analytics call after snapshot exists', async () => {
    await runAnalyticsSnapshot();
    const res = await request(app)
      .get('/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    // snapshot was just created so it should be fresh — isLive false
    expect(res.body.data.isLive).toBe(false);
  });

  it('snapshot contains windowDays of 30', async () => {
    await runAnalyticsSnapshot();
    const snapshot = await AnalyticsSnapshot.findOne().sort({ date: -1 }).lean();
    expect(snapshot.windowDays).toBe(30);
  });
});

// ── computeAdminAnalytics direct ─────────────────────────────────────────────

describe('computeAdminAnalytics service function', () => {
  it('returns all required top-level keys', async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const result = await computeAdminAnalytics(start, end);
    expect(result).toHaveProperty('users');
    expect(result).toHaveProperty('revenue');
    expect(result).toHaveProperty('orders');
    expect(result).toHaveProperty('payments');
    expect(result).toHaveProperty('withdrawals');
    expect(result).toHaveProperty('products');
    expect(result).toHaveProperty('sellers');
    expect(result).toHaveProperty('reviews');
  });

  it('newRegistrationsOverTime has one entry per day in window', async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const result = await computeAdminAnalytics(start, end);
    expect(result.users.newRegistrationsOverTime.length).toBe(7);
  });

  it('order rates are numeric and between 0 and 100', async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const result = await computeAdminAnalytics(start, end);
    const { fulfilmentRate, cancellationRate, rejectionRate, returnRate } = result.orders;
    [fulfilmentRate, cancellationRate, rejectionRate, returnRate].forEach((rate) => {
      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });
});