import cron from 'node-cron';
import AnalyticsSnapshot from './analytics.snapshot.model.js';
import { computeAdminAnalytics } from './analytics.service.js';
import logger from '../../utils/logger.js';

// compute window: last 30 days by default for the nightly snapshot
function getSnapshotWindow() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function runAnalyticsSnapshot() {
  logger.info('[AnalyticsScheduler] Starting nightly analytics snapshot computation');

  try {
    const { start, end } = getSnapshotWindow();
    const computed = await computeAdminAnalytics(start, end);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await AnalyticsSnapshot.findOneAndUpdate(
      { date: today },
      {
        $set: {
          ...computed,
          date: today,
          windowDays: 30,
          isLive: false,
          computedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    logger.info('[AnalyticsScheduler] Snapshot saved successfully');
  } catch (err) {
    logger.error('[AnalyticsScheduler] Snapshot computation failed', { error: err.message });
  }
}

export function startAnalyticsScheduler() {
  // runs every night at 01:30 AM (after wallet cron at 00:00)
  cron.schedule('30 1 * * *', runAnalyticsSnapshot, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('[AnalyticsScheduler] Nightly analytics scheduler registered (01:30 IST)');
}