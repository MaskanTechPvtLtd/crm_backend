import winston from 'winston';
import 'winston-daily-rotate-file'; // For log rotation

const { LOG_LEVEL, LOG_FILE, LOG_CONSOLE, NODE_ENV } = process.env;

// Set default log level to 'info' in production, 'debug' in development
const logLevel = LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');

// Define log file location (defaults to 'logs/app.log')
const logFile = LOG_FILE || 'logs/app.log';

// Only log to the console if LOG_CONSOLE is explicitly 'true' or if not in production
const logToConsole = LOG_CONSOLE === 'true' || NODE_ENV !== 'production';

// Winston Transport Configuration
const transports = [];

// File Transport (with daily rotation in production)
if (NODE_ENV === 'production') {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: logFile, // Log file path
      datePattern: 'YYYY-MM-DD', // Daily log rotation pattern
      zippedArchive: true, // Compress old logs to save space
      maxSize: '20m', // Max file size before rotating (e.g., 20MB)
      maxFiles: '14d', // Retain logs for the last 14 days
      level: logLevel, // Log level for file transport
      format: winston.format.combine(
        winston.format.timestamp(), // Timestamp for each log
        winston.format.json() // Structured logs in JSON format for easy parsing
      )
    })
  );
} else {
  // In non-production environments, use a simple file log (e.g., for development or staging)
  transports.push(
    new winston.transports.File({
      filename: logFile,
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          if (stack) {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
          }
          return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
      )
    })
  );
}

// Console Transport (only in development or if explicitly enabled)
if (logToConsole) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Add color to console logs
        winston.format.simple() // Simple log format
      )
    })
  );
}

// Create the Winston Logger Instance
const logger = winston.createLogger({
  level: logLevel, // Set global log level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      if (stack) {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
      }
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports,
});

// Handle uncaught exceptions (log to console and file)
logger.exceptions.handle(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
  new winston.transports.File({
    filename: logFile, // Log uncaught exceptions to the same file
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally, process the rejection reason (e.g., exit the process or notify the team)
});

export default logger;



























// import winston from 'winston';

// const { LOG_LEVEL, LOG_FILE, LOG_CONSOLE, NODE_ENV } = process.env;

// // Winston Logger Configuration
// const transports = [];

// // Log to file
// transports.push(
//   new winston.transports.File({
//     filename: LOG_FILE || 'logs/app.log',
//     level: LOG_LEVEL || 'info',
//   })
// );

// // Log to console (for development or optional in production)
// if (LOG_CONSOLE === 'true' || NODE_ENV !== 'production') {
//   transports.push(
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       ),
//     })
//   );
// }

// // Create the logger
// const logger = winston.createLogger({
//   level: LOG_LEVEL || 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.printf(({ timestamp, level, message }) => {
//       return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
//     })
//   ),
//   transports,
// });

// export default logger;
