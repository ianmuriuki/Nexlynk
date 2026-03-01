const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const msg = stack || (typeof message === 'object' ? JSON.stringify(message) : message);
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}]: ${msg} ${metaStr}`;
    })
  ),
  transports: [new transports.Console()],
});

module.exports = logger;