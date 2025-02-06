import logger from '../utils/logger.utils.js';

const requestLogger = (req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.url}`);
  next();
};

export default requestLogger;
