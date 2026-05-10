require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { createLogger } = require('./config/logger');
const cron = require('node-cron');

const logger = createLogger('server');
const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();

  if (process.env.USE_MEMORY_DB === 'true') {
    const User = require('./models/User');
    const userCount = await User.estimatedDocumentCount();
    if (userCount === 0) {
      logger.info('In-memory DB is empty — auto-seeding demo data...');
      const { runSeed } = require('./seeds/seed');
      await runSeed();
    }
  }

  const server = app.listen(PORT, () => {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`  AlgeriaSchool Platform running at:`);
    logger.info(`  → http://localhost:${PORT}`);
    logger.info(`  Mode: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`${'='.repeat(60)}\n`);
  });

  // Scheduled jobs
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily billing reminder job');
    try {
      const { sendBillingReminders } = require('./scripts/billing-reminders');
      await sendBillingReminders();
    } catch (e) { logger.error('Billing reminder error', e); }
  });

  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily subscription check');
    try {
      const { checkSubscriptions } = require('./scripts/subscription-check');
      await checkSubscriptions();
    } catch (e) { logger.error('Subscription check error', e); }
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => process.exit(0));
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });
}

start();
