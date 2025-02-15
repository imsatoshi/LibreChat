const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const { redact, deepObjectFormat } = require('./parsers');

const logDir = path.join(__dirname, '..', 'logs');

const { NODE_ENV, DEBUG_LOGGING = true, DEBUG_CONSOLE = false } = process.env;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  activity: 6,
  silly: 7,
};

winston.addColors({
  info: 'green', // fontStyle color
  warn: 'italic yellow',
  error: 'red',
  debug: 'blue',
});

const level = () => {
  const env = NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format((info) => redact(info))(),
);

const transports = [
  new winston.transports.DailyRotateFile({
    level: 'error',
    filename: `${logDir}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
  }),
  // new winston.transports.DailyRotateFile({
  //   level: 'info',
  //   filename: `${logDir}/info-%DATE%.log`,
  //   datePattern: 'YYYY-MM-DD',
  //   zippedArchive: true,
  //   maxSize: '20m',
  //   maxFiles: '14d',
  // }),
];

// if (NODE_ENV !== 'production') {
//   transports.push(
//     new winston.transports.Console({
//       format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
//     }),
//   );
// }

if (
  (typeof DEBUG_LOGGING === 'string' && DEBUG_LOGGING?.toLowerCase() === 'true') ||
  DEBUG_LOGGING === true
) {
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'debug',
      filename: `${logDir}/debug-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(fileFormat, deepObjectFormat),
    }),
  );
}

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format((info) => redact(info))(),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

if (
  (typeof DEBUG_CONSOLE === 'string' && DEBUG_CONSOLE?.toLowerCase() === 'true') ||
  DEBUG_CONSOLE === true
) {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(consoleFormat, deepObjectFormat),
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      level: 'info',
      format: consoleFormat,
    }),
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

module.exports = logger;
