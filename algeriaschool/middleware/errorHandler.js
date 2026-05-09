const { createLogger } = require('../config/logger');
const logger = createLogger('errorHandler');

function notFound(req, res, next) {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  logger.error(err.message, { stack: err.stack, url: req.originalUrl });

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ success: false, message: err.message });
  }

  res.status(status).render('errors/error', {
    title: `Error ${status}`,
    status,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
}

module.exports = { notFound, errorHandler };
