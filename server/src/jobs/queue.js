const { Queue } = require('bullmq');
const logger = require('../config/logger');

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

let emailQueue, pdfQueue, importQueue;

try {
  emailQueue  = new Queue('emails',          { connection });
  pdfQueue    = new Queue('pdf-generation',  { connection });
  importQueue = new Queue('data-import',     { connection });

  emailQueue.on('error',  err => logger.warn(`Email queue: ${err.message}`));
  pdfQueue.on('error',    err => logger.warn(`PDF queue: ${err.message}`));
  importQueue.on('error', err => logger.warn(`Import queue: ${err.message}`));

  logger.info('BullMQ queues initialised');
} catch (err) {
  logger.warn(`Redis not available — job queues disabled: ${err.message}`);
}

// Safe wrapper so controllers don't crash when Redis is down
async function safeAdd(queue, name, data) {
  try {
    if (queue) await queue.add(name, data);
  } catch (err) {
    logger.warn(`Job queue unavailable, skipping job "${name}": ${err.message}`);
  }
}

module.exports = { emailQueue, pdfQueue, importQueue, safeAdd };