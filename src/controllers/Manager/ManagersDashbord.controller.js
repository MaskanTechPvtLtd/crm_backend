import { Op, Sequelize } from "sequelize";
import Lead from "../../models/leads.model.js";
import Employee from "../../models/employee.model.js";
import Status from "../../models/statuses.model.js";
import LeadSource from "../../models/leadsources.model.js";
import Interaction from "../../models/interactions.model.js";
import Properties from "../../models/properties.model.js";
import Task from "../../models/task.model.js";
import LeadStatus from "../../models/leadstatus.model.js";
import Customerfeedback from "../../models/customerfeedback.model.js";
import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";

export const GetManagerDailyDetailedReport = asyncHandler(async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        const { manager_id } = req.params;

        if (!manager_id) {
            return next(new ApiError(403, "Access denied. Manager ID is required."));
        }

        const reportDate = new Date();
        const startDate = start_date ? new Date(start_date) : new Date();
        const endDate = end_date ? new Date(end_date) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Get employees under the manager
        const managedEmployees = await Employee.findAll({
            where: { manager_id },
            attributes: ["employee_id"],
        });
        const employeeIds = managedEmployees.map(e => e.employee_id);

        /** 📊 1. Total Counts */
        const totalNewLeads = await Lead.count({ where: { assigned_to_fk: employeeIds, created_at: { [Op.between]: [startDate, endDate] } } });
        const closedStatus = await LeadStatus.findOne({ where: { status_name: 'closed' } });
        const totalClosedDeals = await Lead.count({ where: { assigned_to_fk: employeeIds, status_id_fk: closedStatus.status_id, created_at: { [Op.between]: [startDate, endDate] } } });
        const totalPropertyListed = await Properties.count({ where: { listed_by: employeeIds, created_at: { [Op.between]: [startDate, endDate] } } });
        const totalEmployees = employeeIds.length;
        const totalActiveEmployees = await Employee.count({ where: { employee_id: employeeIds, is_active: true } });
        const activePercentage = ((totalActiveEmployees / totalEmployees) * 100).toFixed(2);

        /** 📊 2. Pie Chart Data - Leads by Status */
        const leadStatuses = await Lead.findAll({
            attributes: ["status_id_fk", [Sequelize.fn("COUNT", Sequelize.col("status_id_fk")), "count"]],
            where: { assigned_to_fk: employeeIds, created_at: { [Op.between]: [startDate, endDate] } },
            include: [{ model: LeadStatus, attributes: ["status_name"] }],
            group: ["Lead.status_id_fk", "LeadStatus.status_id", "LeadStatus.status_name"],
        });
        const leadStatusData = leadStatuses.map(s => ({ status: s.LeadStatus.status_name, count: s.get("count") }));

        /** 📊 3. Pie Chart Data - Properties by Status */
        const propertyStatuses = await Properties.findAll({
            attributes: [
                "status_id",
                [Sequelize.fn("COUNT", Sequelize.col("Properties.status_id")), "count"]
            ],
            where: { listed_by: employeeIds },
            group: ["Properties.status_id", "status.status_id", "status.status_name"],
            include: [{ model: Status, as: "status", attributes: ["status_name"] }],
        });

        const propertyStatusData = propertyStatuses.map(s => ({ status: s.status.status_name, count: s.get("count") }));

        /** 📊 4. Pie Chart Data - Tasks by Status */
        const taskStatuses = await Task.findAll({
            attributes: ["status_id", [Sequelize.fn("COUNT", Sequelize.col("Task.status_id")), "count"]],
            where: { created_by: employeeIds },
            group: ["Task.status_id", "Status.status_id", "Status.status_name"],
            include: [{ model: Status, attributes: ["status_name"] }],
        });
        const taskStatusData = taskStatuses.map(s => ({ status: s.Status.status_name, count: s.get("count") }));

        /** 📊 5. Bar Chart Data - Leads by Source */
        const leadSources = await Lead.findAll({
            attributes: ["source_id_fk", [Sequelize.fn("COUNT", Sequelize.col("Lead.source_id_fk")), "count"]],
            where: { assigned_to_fk: employeeIds },
            group: ["Lead.source_id_fk", "LeadSource.source_id", "LeadSource.source_name"],
            include: [{ model: LeadSource, attributes: ["source_name"] }],
        });
        const leadSourceData = leadSources.map(s => ({ source: s.LeadSource.source_name, count: s.get("count") }));

        /** 📊 6. Bar Chart Data - Employee Interactions */
        const employeeInteractions = await Interaction.findAll({
            attributes: ["employee_id", [Sequelize.fn("COUNT", Sequelize.col("Interaction.employee_id")), "count"]],
            where: { employee_id: employeeIds },
            group: ["Interaction.employee_id", "Employee.employee_id", "Employee.first_name", "Employee.last_name"],
            include: [{ model: Employee, attributes: ["first_name", "last_name"] }],
        });
        const employeeInteractionData = employeeInteractions.map(e => ({ employee: `${e.Employee.first_name} ${e.Employee.last_name}`, count: e.get("count") }));

        res.status(200).json(new ApiResponse(200, {
            date: reportDate.toISOString().split("T")[0],
            totalNewLeads,
            totalClosedDeals,
            totalPropertyListed,
            totalEmployees: {
                activeEmployees: totalActiveEmployees,
                totalEmployees,
                activePercentage,
            },
            charts: {
                pie: {
                    leadStatusData,
                    propertyStatusData,
                    taskStatusData,
                },
                bar: {
                    leadSourceData,
                    employeeInteractionData,
                },
            },
        }));
    } catch (err) {
        console.error("Error fetching manager daily detailed report:", err);
        next(new ApiError(500, "Something went wrong while fetching the report."));
    }
});


export const GetManagerDashbordCounts = asyncHandler(async (req, res, next) => {
    try {
        const { manager_id } = req.params; // Extract manager_id from path parameters

        // Fetch manager details
        const manager = await Employee.findOne({
            where: { employee_id: manager_id, role: "Manager" }, // Ensure the user is a Manager
            attributes: ["employee_id", "first_name", "last_name"],
        });

        if (!manager) {
            return next(new ApiError(404, "Manager not found"));
        }

        // Get all employees under the manager (including manager)
        const teamIds = [manager_id]; // Start with manager ID

        // Fetch all sales agents under this manager
        const salesAgents = await Employee.findAll({
            where: { manager_id: manager_id, role: "Sales Agent" },
            attributes: ["employee_id"],
        });

        // Add sales agent IDs to the list
        salesAgents.forEach(agent => teamIds.push(agent.employee_id));

        // Get total leads & properties assigned to the manager and sales agents
        const totalLeads = await Lead.count({ where: { assigned_to_fk: { [Op.in]: teamIds } } });
        const totalProperties = await Properties.count({ where: { assign_to: { [Op.in]: teamIds } } });
        const totalFeedbacks = await Customerfeedback.count({ where: { agent_id: { [
            Op.in]: teamIds } } });

        // 🏷️ Response
        const response = {
            total_sales_agents: salesAgents.length,
            total_leads: totalLeads,
            total_properties: totalProperties,
            total_feedbacks: totalFeedbacks,
        };

        res.status(200).json(new ApiResponse(200, response, "Manager dashboard counts fetched successfully."));
    } catch (error) {
        console.error("Error fetching counts:", error);
        next(new ApiError(500, "Something went wrong while fetching counts."));
    }
});


