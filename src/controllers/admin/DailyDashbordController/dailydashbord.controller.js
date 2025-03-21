import { Op, Sequelize } from "sequelize";
import Lead from "../../../models/leads.model.js";
import Employee from "../../../models/employee.model.js";
import Status from "../../../models/statuses.model.js";
import LeadSource from "../../../models/leadsources.model.js";
import Interaction from "../../../models/interactions.model.js";
import Properties from "../../../models/properties.model.js";
import Task from "../../../models/task.model.js";
import LeadStatus from "../../../models/leadstatus.model.js";
import CustomerFeedback from "../../../models/customerfeedback.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiResponse } from "../../../utils/ApiResponse.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";

export const getAdminDailyDetailedReport = asyncHandler(async (req, res, next) => {
    try {

        const { start_date, end_date } = req.query;
        const reportDate = new Date();
        const startDate = start_date ? new Date(start_date) : new Date();
        const endDate = end_date ? new Date(end_date) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        // Ensure user is admin
        // if (req.user.role !== "Admin") {
        //     return res.status(403).json({ message: "Access denied. Admins only." });
        // }

        /** 📊 1. Total Counts */
        const totalNewLeads = await Lead.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } });
        const closedStatus = await LeadStatus.findOne({ where: { status_name: 'closed' } });
        const totalClosedDeals = await Lead.count({
            where: {
                status_id_fk: closedStatus.status_id, // Ensure it filters only closed leads
                created_at: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });
        const totalPropertyListed = await Properties.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } });
        const totalEmployees = await Employee.count(); // Count all employees
        const totalActiveEmployees = await Employee.count({ where: { is_active: true } }); // Count active employees
        const activePercentage = ((totalActiveEmployees / totalEmployees) * 100).toFixed(2); // Optional: Get percentage

        /** 📊 2. Pie Chart Data - Leads by Status */
        const leadStatuses = await Lead.findAll({
            attributes: [
                "status_id_fk",
                [Sequelize.fn("COUNT", Sequelize.col("status_id_fk")), "count"]
            ],
            where: {
                created_at: { [Op.between]: [startDate, endDate] }
            },
            include: [
                {
                    model: LeadStatus,
                    attributes: ["status_name"]
                }
            ],
            group: ["Lead.status_id_fk", "LeadStatus.status_id", "LeadStatus.status_name"], // ✅ Added status_id
        });

        const leadStatusData = leadStatuses.map((s) => ({
            status: s.LeadStatus.status_name,
            count: s.get("count"),
        }));



        // /** 📊 3. Pie Chart Data - Properties by Status */
        const propertyStatuses = await Properties.findAll({
            attributes: [
                "status_id",
                [Sequelize.fn("COUNT", Sequelize.col("Properties.status_id")), "count"]], // Explicitly reference Properties.status_id
            group: ["Properties.status_id", "status.status_id", "status.status_name"], // Ensure all selected fields are in GROUP BY
            include: [
                {
                    model: Status,
                    as: "status",
                    attributes: ["status_name"]
                }
            ],
        });

        const propertyStatusData = propertyStatuses.map((s) => ({
            status: s.status.status_name,
            count: s.get("count"),
        }));


        // /** 📊 4. Pie Chart Data - Tasks by Status */
        const taskStatuses = await Task.findAll({
            attributes: [
                "status_id",
                [Sequelize.fn("COUNT", Sequelize.col("Task.status_id")), "count"]], // Explicitly refer to Task.status_id
            group: ["Task.status_id", "Status.status_id", "Status.status_name"], // Add all grouped columns
            include: [{ model: Status, attributes: ["status_name"] }],
        });

        const taskStatusData = taskStatuses.map((s) => ({
            status: s.Status.status_name,
            count: s.get("count"),
        }));


        // /** 📊 5. Bar Chart Data - Leads by Source */
        const leadSources = await Lead.findAll({
            attributes: [
                "source_id_fk",
                [Sequelize.fn("COUNT", Sequelize.col("Lead.source_id_fk")), "count"], // Specify table alias
            ],
            group: ["Lead.source_id_fk", "LeadSource.source_id", "LeadSource.source_name"], // Ensure all non-aggregated columns are grouped
            include: [{ model: LeadSource, attributes: ["source_name"] }],
        });

        const leadSourceData = leadSources.map((s) => ({
            source: s.LeadSource.source_name,
            count: s.get("count"),
        }));

        // /** 📊 6. Bar Chart Data - Employee Interactions */
        const employeeInteractions = await Interaction.findAll({
            attributes: [
                "employee_id",
                [Sequelize.fn("COUNT", Sequelize.col("Interaction.employee_id")), "count"], // Explicitly reference table alias
            ],
            group: ["Interaction.employee_id","Employee.employee_id", "Employee.first_name", "Employee.last_name"], // Include all non-aggregated columns
            include: [{ model: Employee, attributes: ["first_name", "last_name"] }],
        });

        const employeeInteractionData = employeeInteractions.map((e) => ({
            employee: `${e.Employee.first_name} ${e.Employee.last_name}`,
            count: e.get("count"),
        }));

        res.status(200).json(
            new ApiResponse(200, {
                date: reportDate.toISOString().split("T")[0], // Fixed syntax issue
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
            })
        );        
    } catch (err) {
        console.error("Error fetching daily detailed report:", err);
        next(new ApiError(500, "Something went wrong while fetching Dashbord Details."));
    }
});

export const GetDashbordCounts = asyncHandler(async (req, res, next) => {
    try {
        const totalLeads = await Lead.count();
        const totalProperties = await Properties.count();
        const totalTasks = await Task.count();
        const totalEmployees = await Employee.count();
        const totalInteractions = await Interaction.count();
        const totalfeedbacks = await CustomerFeedback.count();
        const salesAgent = await Employee.count({ where: { role: 'Sales Agent' } });

        res.status(200).json(
            new ApiResponse(200, {
                totalLeads,
                totalProperties,
                totalTasks,
                totalEmployees,
                totalInteractions,
                totalfeedbacks,
                salesAgent
            })
        );
    } catch (err) {
        console.error("Error fetching daily detailed report:", err);
        next(new ApiError(500, "Something went wrong while fetching Dashbord Counts."));
    }
}
);