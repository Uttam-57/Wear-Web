import cron from 'node-cron';
import { creditEligibleOrdersService } from '../modules/wallet/wallet.service.js';
import logger from './logger.js';

// Runs every day at midnight: 0 0 * * *
// Skipped entirely in test environment — cron must not fire during Jest runs
export const startScheduler = () => {
  if (process.env.NODE_ENV === 'test') return;

  cron.schedule('0 0 * * *', async () => {
    logger.info('[Scheduler] Running nightly wallet credit job');
    try {
      const { credited } = await creditEligibleOrdersService();
      logger.info(`[Scheduler] Wallet credit job complete — ${credited} order(s) credited`);
    } catch (err) {
      logger.error('[Scheduler] Wallet credit job failed', { error: err.message });
    }
  });

  logger.info('[Scheduler] Nightly wallet credit job scheduled (0 0 * * *)');
};