import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import limiter from "./middlewares/rateLimiter.middleware.js";
import adminRoutes from "./routes/admin/admin.routes.js";
import manageEmployeeRoutes from "./routes/admin/manageEmployee.routes.js";
import propertyListingRoutes from "./routes/admin/propertylisting.routes.js";
import HelperDataRoutes from "./routes/admin/helper.routes.js"
import LeadsRoutes from "./routes/admin/Leads.routes.js"
import TaskRoutes from "./routes/admin/task.routes.js"
import validateAndSanitize from "./middlewares/validateAndSanitize.middleware.js";
import requestLogger from './middlewares/requestLogger.middleware.js';
import errorLogger from "./middlewares/errorLogger.middleware.js";
import helmetMiddleware from "./middlewares/helmet.Middleware.js";
const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(requestLogger);
app.use(limiter) // Enhance security by adding request rate capping for APIs
app.use(validateAndSanitize)  // Middleware to validate and sanitize query parameters for the API
// Middleware for logging requests

// Handle CSP Violation Reports
app.post('/report-violation', express.json(), (req, res) => {
  console.log('CSP Violation:', req.body); // Log or store the violation report
  res.status(204).end(); // Respond with HTTP 204 (No Content)
});

// Use the custom Helmet middleware globally
app.use(helmetMiddleware);
// app.use(errorHandler);
// Admin routes
app.use("/api/v1", adminRoutes);
app.use("/api/v1/manageEmployee", manageEmployeeRoutes);
app.use("/api/v1/property", propertyListingRoutes);
app.use("/api/v1/metadata", HelperDataRoutes)
app.use("/api/v1/leads", LeadsRoutes)
app.use("/api/v1/tasks", TaskRoutes)



// Error logger middleware (should be after all other middlewares and routes)
app.use(errorLogger);

export { app };
