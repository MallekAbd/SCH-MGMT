const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

function createLogger(label) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.label({ label }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, label: lbl, timestamp, stack }) => {
        return `${timestamp} [${lbl}] ${level.toUpperCase()}: ${stack || message}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, label: lbl, timestamp }) => {
            return `${timestamp} [${lbl}] ${level}: ${message}`;
          })
        ),
      }),
      new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
    ],
    silent: process.env.NODE_ENV === 'test',
  });
}

module.exports = { createLogger };
