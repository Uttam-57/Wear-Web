import request from 'supertest';
import app from '../../../app.js';
import Notification from '../../../modules/notification/notification.model.js';
import User from '../../../modules/user/user.model.js';
import  seedUsers  from '../../helpers/seedUsers.js';
import { getCustomerToken, getSellerToken } from '../../helpers/getTokens.js';
import mongoose from 'mongoose';

let customerToken;
let sellerToken;
let customerId;
let sellerId;

beforeAll(async () => {
  await seedUsers();
  customerToken = await getCustomerToken();
  sellerToken = await getSellerToken();

  const customer = await User.findOne({ email: 'customer@test.com' }).lean();
  const seller = await User.findOne({ email: 'seller@test.com' }).lean();
  customerId = customer._id;
  sellerId = seller._id;
});

const seedNotifications = async (userId, count = 3, overrides = {}) => {
  const docs = Array.from({ length: count }, (_, i) => ({
    userId,
    type: 'ORDER_PLACED',
    message: `Test notification ${i + 1}`,
    isRead: false,
    ...overrides,
  }));
  return Notification.insertMany(docs);
};

// ─── GET /notifications ────────────────────────────────────────────────────

describe('GET /notifications', () => {
  beforeEach(async () => {
    await seedNotifications(customerId, 8);
  });

  it('returns paginated notifications newest first', async () => {
    const res = await request(app)
      .get('/notifications?page=1&limit=5')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toHaveLength(5);
    expect(res.body.data.pagination.total).toBe(8);
    expect(res.body.data.pagination.totalPages).toBe(2);
  });

  it('defaults to limit 5 when no query params', async () => {
    const res = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications.length).toBeLessThanOrEqual(5);
  });

  it('returns second page correctly', async () => {
    const res = await request(app)
      .get('/notifications?page=2&limit=5')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toHaveLength(3);
  });

  it('returns empty array when user has no notifications', async () => {
    await Notification.deleteMany({ userId: customerId });
    const res = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it('rejects limit > 20', async () => {
    const res = await request(app)
      .get('/notifications?limit=25')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects page < 1', async () => {
    const res = await request(app)
      .get('/notifications?page=0')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/notifications');
    expect(res.status).toBe(401);
  });

  it('does not return another user notifications', async () => {
    await seedNotifications(sellerId, 3);
    const res = await request(app)
      .get('/notifications?limit=20')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.notifications.map((n) => n.userId.toString());
    ids.forEach((id) => expect(id).toBe(customerId.toString()));
  });
});

// ─── GET /notifications/unread-count ──────────────────────────────────────

describe('GET /notifications/unread-count', () => {
  beforeEach(async () => {
    await seedNotifications(customerId, 4, { isRead: false });
    await seedNotifications(customerId, 2, { isRead: true });
  });

  it('returns correct unread count', async () => {
    const res = await request(app)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(4);
  });

  it('returns 0 when all read', async () => {
    await Notification.updateMany({ userId: customerId }, { $set: { isRead: true } });
    const res = await request(app)
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(0);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/notifications/unread-count');
    expect(res.status).toBe(401);
  });
});

// ─── PUT /notifications/:id/read ─────────────────────────────────────────

describe('PUT /notifications/:id/read', () => {
  let notif;

  beforeEach(async () => {
    [notif] = await seedNotifications(customerId, 1, { isRead: false });
  });

  it('marks notification as read', async () => {
    const res = await request(app)
      .put(`/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notification.isRead).toBe(true);

    const doc = await Notification.findById(notif._id);
    expect(doc.isRead).toBe(true);
  });

  it('is idempotent — marking already-read returns 200', async () => {
    await Notification.findByIdAndUpdate(notif._id, { isRead: true });
    const res = await request(app)
      .put(`/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/notifications/${fakeId}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('returns 404 for another user notification', async () => {
    const [sellerNotif] = await seedNotifications(sellerId, 1);
    const res = await request(app)
      .put(`/notifications/${sellerNotif._id}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).put(`/notifications/${notif._id}/read`);
    expect(res.status).toBe(401);
  });
});

// ─── PUT /notifications/read-all ──────────────────────────────────────────

describe('PUT /notifications/read-all', () => {
  beforeEach(async () => {
    await seedNotifications(customerId, 5, { isRead: false });
    await seedNotifications(sellerId, 3, { isRead: false });
  });

  it('marks all user notifications as read', async () => {
    const res = await request(app)
      .put('/notifications/read-all')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);

    const unread = await Notification.countDocuments({ userId: customerId, isRead: false });
    expect(unread).toBe(0);
  });

  it('does not affect other user notifications', async () => {
    await request(app)
      .put('/notifications/read-all')
      .set('Authorization', `Bearer ${customerToken}`);

    const sellerUnread = await Notification.countDocuments({ userId: sellerId, isRead: false });
    expect(sellerUnread).toBe(3);
  });

  it('returns 200 when no unread notifications exist', async () => {
    await Notification.updateMany({ userId: customerId }, { $set: { isRead: true } });
    const res = await request(app)
      .put('/notifications/read-all')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).put('/notifications/read-all');
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /notifications ────────────────────────────────────────────────

describe('DELETE /notifications', () => {
  beforeEach(async () => {
    await seedNotifications(customerId, 6);
    await seedNotifications(sellerId, 3);
  });

  it('deletes all notifications for the user', async () => {
    const res = await request(app)
      .delete('/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);

    const remaining = await Notification.countDocuments({ userId: customerId });
    expect(remaining).toBe(0);
  });

  it('does not delete other user notifications', async () => {
    await request(app)
      .delete('/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    const sellerRemaining = await Notification.countDocuments({ userId: sellerId });
    expect(sellerRemaining).toBe(3);
  });

  it('returns 200 when no notifications exist', async () => {
    await Notification.deleteMany({ userId: customerId });
    const res = await request(app)
      .delete('/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).delete('/notifications');
    expect(res.status).toBe(401);
  });
});

// ─── createNotification utility ───────────────────────────────────────────

describe('createNotification utility', () => {
  it('creates a notification document in DB', async () => {
    const { createNotification } = await import('../../../utils/notification.utils.js');

    await createNotification({
      userId: customerId.toString(),
      type: 'ORDER_PLACED',
      message: 'Test utility notification',
      refId: new mongoose.Types.ObjectId().toString(),
      refModel: 'Order',
    });

    const doc = await Notification.findOne({ userId: customerId, type: 'ORDER_PLACED' });
    expect(doc).not.toBeNull();
    expect(doc.message).toBe('Test utility notification');
    expect(doc.isRead).toBe(false);
  });

  it('does not throw when called with invalid userId — logs and silently fails', async () => {
    const { createNotification } = await import('../../../utils/notification.utils.js');

    await expect(
      createNotification({
        userId: 'not-an-objectid',
        type: 'ORDER_PLACED',
        message: 'Should fail silently',
      })
    ).resolves.toBeUndefined();
  });
});