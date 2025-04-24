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
import NotificationRoutes from "./routes/notification/notifications.routes.js"
import DailyDashbordRoutes from "./routes/admin/dailydashbord.routes.js"
import FieldAgentRoutes from "./routes/admin/feildagenttracking.routes.js"
import AttendanceRoutes from "./routes/sales_agent/attendance.routes.js"
import AgentLeadsRoutes from "./routes/sales_agent/allLeads.routes.js"
import AgentPropertiesRoutes from "./routes/sales_agent/agentproperties.routes.js"
import TeamDetailsRoutes from "./routes/sales_agent/teamDetails.routes.js"
import ManagerLeadsRoutes from "./routes/manager/managersleads.router.js"
import ManagersEmployeesRoutes from "./routes/manager/ManagersEmployee.router.js"
import ManagerspreoperitesRoutes from "./routes/manager/ManagersProperties.router.js"
import ManagersFieldAgentsRoutes from "./routes/manager/ManagersFieldAgents.router.js"
import ManagersDashbordroutes from "./routes/manager/ManagersDashbord.router.js"
import FaceRecognationRoutes from "./routes/admin/recognize.routes.js";
import validateAndSanitize from "./middlewares/validateAndSanitize.middleware.js";
import requestLogger from './middlewares/requestLogger.middleware.js';
import errorLogger from "./middlewares/errorLogger.middleware.js";
import helmetMiddleware from "./middlewares/helmet.Middleware.js";
const app = express();


import { loadModels } from './utils/faceapi-config.utils.js';
import { loadKnownFaces } from './utils/faceservice.utils.js';
// import { setFaceMatcher } from './controllers/admin/recognizeController/recognize.controller.js';

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
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running in production 🚀" });
});
app.use("/api/v1", adminRoutes);
app.use("/api/v1/manageEmployee", manageEmployeeRoutes);
app.use("/api/v1/property", propertyListingRoutes);
app.use("/api/v1/metadata", HelperDataRoutes)
app.use("/api/v1/leads", LeadsRoutes)
app.use("/api/v1/tasks", TaskRoutes)
app.use("/api/v1/admin", DailyDashbordRoutes)
app.use("/api/v1/Notifications", NotificationRoutes)
app.use("/api/v1/agent", FieldAgentRoutes)


//sales agent routes
app.use("/api/v1/sales-agent", AttendanceRoutes);
app.use("/api/v1/Agentleads", AgentLeadsRoutes);
app.use("/api/v1/Agentproperties", AgentPropertiesRoutes)
app.use("/api/v1/team", TeamDetailsRoutes)

//manager routes
app.use("/api/v1/manager", ManagerLeadsRoutes);
app.use("/api/v1/manager", ManagersEmployeesRoutes);
app.use("/api/v1/manager", ManagerspreoperitesRoutes);
app.use("/api/v1/manager", ManagersFieldAgentsRoutes);
app.use("/api/v1/manager", ManagersDashbordroutes);

//face recognition routes
app.use("/api/v1/face", FaceRecognationRoutes); // Assuming you have a route for face recognition
// await loadModels();
// const matcher = await loadKnownFaces();
// setFaceMatcher(matcher);
// Error logger middleware (should be after all other middlewares and routes)
app.use(errorLogger);

export { app };
