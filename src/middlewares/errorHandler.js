export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 501;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
