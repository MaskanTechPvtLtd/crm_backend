// import Redis from "ioredis";

// // Create a Redis client connected to the Redis Cloud instance
// const redisClient = new Redis({
//   host: process.env.REDIS_HOST,
//   port: process.env.REDIS_PORT,
//   password: process.env.REDIS_PASSWORD, // If your Redis Cloud instance has a password
//   ttl: 3600, // Time-to-live in seconds (optional, depending on your setup)
// });

// // Test Redis connection
// redisClient.ping((err, result) => {
//   if (err) {
//     console.error("Error connecting to Redis:", err);
//     process.exit(1); // Exit the application if connection fails
//   } else {
//     console.log("Redis connection successful:", result); // Should print "PONG" if connected successfully
//   }
// });

// // Use the Redis client in your rate limiting logic
import rateLimit from "express-rate-limit";
// import RedisStore from "rate-limit-redis";

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // maximum number of requests allowed in the windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true, // Send rate limit info in X-RateLimit-* headers
  legacyHeaders: false, // Disable the legacy X-RateLimit-* headers

  // Store rate limiting data in Redis
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.call(...args), // Connect Redis client to the rate limit store
  // }),

  // keyGenerator: (req) =>
  //   req.headers["x-forwarded-for"] || req.connection.remoteAddress, // Use real client IP

  // Skip rate-limiting in development environment (optional)
  skip: (req) => process.env.NODE_ENV === "development",
});

export default limiter;

