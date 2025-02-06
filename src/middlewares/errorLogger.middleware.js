import logger from '../utils/logger.utils.js';

const errorLogger = (err, req, res, next) => {
  logger.error(
    `Error occurred: ${err.message} - Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}`
  );

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export default errorLogger;
