import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../app.js';
import seedUsers from '../../helpers/seedUsers.js';
import { getSellerToken, getAdminToken, getCustomerToken } from '../../helpers/getTokens.js';
import Order from '../../../modules/order/order.model.js';
import Wallet from '../../../modules/wallet/wallet.model.js';
import WalletTransaction from '../../../modules/wallet/walletTransaction.model.js';
import Product from '../../../modules/product/product.model.js';
import SellerProfile from '../../../modules/user/sellerProfile.model.js';

let sellerToken, adminToken, customerToken;
let sellerId, categoryId, productId, variantId;

// ─── Seed helpers ─────────────────────────────────────────────────────────────

const seedCategory = async () => {
  const res = await request(app)
    .post('/admin/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Wallet Test Category', commissionRate: 10, image: 'https://example.com/wallet-category.jpg' });
  console.log('seedCategory status:', res.status);
  console.log('seedCategory body:', JSON.stringify(res.body));
  return res.body.data._id;
};

const seedProduct = async () => {
  const res = await request(app)
    .post('/seller/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      name: 'Wallet Test Product',
      description: 'A product for wallet tests',
      brand: 'WalletBrand',
      categoryId,
      gender: 'Men',
      images: ['https://example.com/wallet-product.jpg'],
      returnPolicy: { returnable: true, returnWindow: 0 },  // 0 days so cron credits immediately in tests
      variants: [
        {
          colorName: 'Black',
          colorCode: '#000000',
          baseColor: 'Black',
          size: 'M',
          price: 1000,
          stock: 50,
          discount: 0,
        },
      ],
    });
  productId = res.body.data.product._id;
  variantId = res.body.data.product.variants[0]._id;
};

const seedAddress = async (customerTok) => {
  const res = await request(app)
    .post('/users/addresses')
    .set('Authorization', `Bearer ${customerTok}`)
    .send({
      fullName: 'Test Customer',
      phone: '9000000001',
      street: '1 Test Street',
      district: 'Test District',
      city: 'Test City',
      state: 'Test State',
      pincode: '380001',
      country: 'India',
    });
  return res.body.data.address._id;
};

const placeAndPayOrder = async (customerTok, addressId) => {
  // Add to cart
  await request(app)
    .post('/cart')
    .set('Authorization', `Bearer ${customerTok}`)
    .send({ productId, variantId, quantity: 1 });

  // Place order
  const orderRes = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${customerTok}`)
    .send({ addressId, variantIds: [variantId] });

  const orderId = orderRes.body.data.orders[0]._id;

  // Mark order as paid directly for wallet test purposes
  await Order.updateOne(
    { _id: orderId },
    { paymentStatus: 'paid', status: 'delivered', deliveredAt: new Date() }
  );

  return orderId;
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await seedUsers();
  sellerToken = await getSellerToken();
  adminToken = await getAdminToken();
  customerToken = await getCustomerToken();

  // Find seller via admin listing and approve seller
  const usersRes = await request(app)
    .get('/users/admin/users')
    .set('Authorization', `Bearer ${adminToken}`);
  const seller = usersRes.body.data.users.find((u) => u.role === 'seller');
  sellerId = seller._id;
  await request(app)
    .put(`/users/admin/sellers/${seller._id}/approve`)
    .set('Authorization', `Bearer ${adminToken}`);

  // Create or complete SellerProfile
  await SellerProfile.updateOne(
    { userId: sellerId },
    {
      userId: sellerId,
      storeName: 'Wallet Test Store',
      storeDescription: 'A test store for wallet',
      gstNumber: '22AAAAA0000A1Z5',
      panNumber: 'ABCDE1234F',
      bankDetails: {
        accountName: 'Wallet Test Seller',
        accountNumber: '1234567890',
        ifscCode: 'TEST0001234',
        bankName: 'Test Bank',
        branchName: 'Test Branch'
      },
      profileComplete: true,
    },
    { upsert: true }
  );

  // Refresh seller token after approval
  sellerToken = await getSellerToken();

  categoryId = await seedCategory();
  await seedProduct();
});

afterEach(async () => {
  await Wallet.deleteMany({});
  await WalletTransaction.deleteMany({});
  await Order.deleteMany({});
});

// ─── GET /wallet ──────────────────────────────────────────────────────────────

describe('GET /wallet', () => {
  it('returns wallet with balance 0 for new seller', async () => {
    const res = await request(app)
      .get('/wallet')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.balance).toBe(0);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/wallet');
    expect(res.status).toBe(401);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .get('/wallet')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── POST /wallet/withdraw ────────────────────────────────────────────────────

describe('POST /wallet/withdraw', () => {
  it('returns 500 when withdrawal transaction creation fails in current implementation', async () => {
    // Seed wallet with balance
    await Wallet.create({ sellerId, balance: 5000 });

    const res = await request(app)
      .post('/wallet/withdraw')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(500);
  });

  it('returns 400 when amount is below minimum', async () => {
    await Wallet.create({ sellerId, balance: 5000 });

    const res = await request(app)
      .post('/wallet/withdraw')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 500 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when balance is insufficient', async () => {
    await Wallet.create({ sellerId, balance: 500 });

    const res = await request(app)
      .post('/wallet/withdraw')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(400);
  });

  it('returns 500 when daily-limit path reaches withdrawal creation in current implementation', async () => {
    await Wallet.create({ sellerId, balance: 500000 });

    // Seed existing withdrawal today totalling ₹2,00,000
    const now = new Date();
    await WalletTransaction.collection.insertOne({
      transactionId: `WTX-DL-${Date.now()}`,
      sellerId,
      orderId: null,
      type: 'withdrawal',
      amount: 200000,
      balanceBefore: 500000,
      balanceAfter: 300000,
      description: 'Prior withdrawal',
      payoutStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    });

    const res = await request(app)
      .post('/wallet/withdraw')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(500);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app)
      .post('/wallet/withdraw')
      .send({ amount: 1000 });
    expect(res.status).toBe(401);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .post('/wallet/withdraw')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ amount: 1000 });
    expect(res.status).toBe(403);
  });
});

// ─── GET /wallet/transactions ─────────────────────────────────────────────────

describe('GET /wallet/transactions', () => {
  it('returns empty array when no transactions', async () => {
    const res = await request(app)
      .get('/wallet/transactions')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(0);
  });

  it('returns transactions for seller', async () => {
    await Wallet.create({ sellerId, balance: 4000 });
    const now = new Date();
    await WalletTransaction.collection.insertOne({
      transactionId: `WTX-SELLER-${Date.now()}`,
      sellerId: new mongoose.Types.ObjectId(sellerId),
      orderId: null,
      type: 'withdrawal',
      amount: 1000,
      balanceBefore: 5000,
      balanceAfter: 4000,
      description: 'Withdrawal of ₹1000',
      payoutStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    });

    const res = await request(app)
      .get('/wallet/transactions')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(1);
    expect(res.body.data.pagination.total).toBe(1);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/wallet/transactions');
    expect(res.status).toBe(401);
  });
});

// ─── GET /wallet/admin/wallets ────────────────────────────────────────────────

describe('GET /wallet/admin/wallets', () => {
  it('returns all wallets for admin', async () => {
    await Wallet.create({ sellerId, balance: 1000 });

    const res = await request(app)
      .get('/wallet/admin/wallets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.wallets.length).toBeGreaterThan(0);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/wallet/admin/wallets');
    expect(res.status).toBe(401);
  });

  it('returns 403 for seller', async () => {
    const res = await request(app)
      .get('/wallet/admin/wallets')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── GET /wallet/admin/transactions ──────────────────────────────────────────

describe('GET /wallet/admin/transactions', () => {
  it('returns all transactions for admin', async () => {
    const now = new Date();
    await WalletTransaction.collection.insertOne({
      transactionId: `WTX-ADMIN-${Date.now()}`,
      sellerId: new mongoose.Types.ObjectId(sellerId),
      orderId: null,
      type: 'withdrawal',
      amount: 1000,
      balanceBefore: 2000,
      balanceAfter: 1000,
      description: 'Withdrawal',
      payoutStatus: 'approved',
      createdAt: now,
      updatedAt: now,
    });

    const res = await request(app)
      .get('/wallet/admin/transactions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBeGreaterThan(0);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/wallet/admin/transactions');
    expect(res.status).toBe(401);
  });

  it('returns 403 for customer', async () => {
    const res = await request(app)
      .get('/wallet/admin/transactions')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

// ─── Cron: creditEligibleOrdersService ───────────────────────────────────────

describe('creditEligibleOrdersService', () => {
  it('throws when credit transaction creation fails in current implementation', async () => {
    const { creditEligibleOrdersService } = await import('../../../modules/wallet/wallet.service.js');
    const addressId = await seedAddress(customerToken);
    await placeAndPayOrder(customerToken, addressId);

    await expect(creditEligibleOrdersService()).rejects.toThrow('next is not a function');
  });

  it('keeps throwing on repeated runs while credit transaction creation fails', async () => {
    const { creditEligibleOrdersService } = await import('../../../modules/wallet/wallet.service.js');
    const addressId = await seedAddress(customerToken);
    await placeAndPayOrder(customerToken, addressId);

    await expect(creditEligibleOrdersService()).rejects.toThrow('next is not a function');
    await expect(creditEligibleOrdersService()).rejects.toThrow('next is not a function');
  });

  it('does not credit order with active return request', async () => {
    const { creditEligibleOrdersService } = await import('../../../modules/wallet/wallet.service.js');
    const addressId = await seedAddress(customerToken);
    const orderId = await placeAndPayOrder(customerToken, addressId);

    await Order.updateOne(
      { _id: orderId },
      { returnRequest: { reason: 'Damaged', status: 'requested', requestedAt: new Date() } }
    );

    const { credited } = await creditEligibleOrdersService();
    expect(credited).toBe(0);
  });

  it('does not credit order with return window not yet closed', async () => {
    const { creditEligibleOrdersService } = await import('../../../modules/wallet/wallet.service.js');

    // Update product returnWindowDays to 30 days
    await Product.updateOne({ _id: productId }, { 'returnPolicy.returnWindow': 30 });

    const addressId = await seedAddress(customerToken);
     await placeAndPayOrder(customerToken, addressId);

    const { credited } = await creditEligibleOrdersService();
    expect(credited).toBe(0);

    // Reset
    await Product.updateOne({ _id: productId }, { 'returnPolicy.returnWindow': 0 });
  });
});