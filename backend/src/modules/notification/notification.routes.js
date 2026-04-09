import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { rateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { listNotificationsSchema } from './notification.validation.js';
import {
  listNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  clearAllNotifications,
} from './notification.controller.js';

const router = Router();

router.use(authenticate);
router.use(rateLimiter('general'));

router.get('/', validate(listNotificationsSchema, 'query'), listNotifications);

// unread-count and read-all must be registered BEFORE /:id to prevent
// Express matching the literal strings as the :id param
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.delete('/', clearAllNotifications);
router.put('/:id/read', markOneRead);

export default router;