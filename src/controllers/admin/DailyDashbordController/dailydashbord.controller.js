import { Op, Sequelize } from "sequelize";
import Lead from "../../../models/leads.model.js";
import Employee from "../../../models/employee.model.js";
import Status from "../../../models/statuses.model.js";
import LeadSource from "../../../models/leadsources.model.js";
import Interaction from "../../../models/interactions.model.js";
import Property from "../../../models/properties.model.js";
import Task from "../../../models/task.model.js";
import LeadStatus from "../../../models/leadstatus.model.js";

export const getAdminDailyDetailedReport = async (req, res, next) => {
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
        const totalPropertyListed = await Property.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } });
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
        // const propertyStatuses = await Property.findAll({
        //     attributes: ["status_id", [Sequelize.fn("COUNT", "status_id"), "count"]],
        //     group: ["status_id"],
        //     include: [{ model: Status, attributes: ["status_name"] }],
        // });

        // const propertyStatusData = propertyStatuses.map((s) => ({
        //     status: s.Status.status_name,
        //     count: s.get("count"),
        // }));

        // /** 📊 4. Pie Chart Data - Tasks by Status */
        // const taskStatuses = await Task.findAll({
        //     attributes: ["status_id", [Sequelize.fn("COUNT", "status_id"), "count"]],
        //     group: ["status_id"],
        //     include: [{ model: Status, attributes: ["status_name"] }],
        // });

        // const taskStatusData = taskStatuses.map((s) => ({
        //     status: s.Status.status_name,
        //     count: s.get("count"),
        // }));

        // /** 📊 5. Bar Chart Data - Leads by Source */
        // const leadSources = await Lead.findAll({
        //     attributes: ["source_id_fk", [Sequelize.fn("COUNT", "source_id_fk"), "count"]],
        //     group: ["source_id_fk"],
        //     include: [{ model: LeadSource, attributes: ["source_name"] }],
        // });

        // const leadSourceData = leadSources.map((s) => ({
        //     source: s.LeadSource.source_name,
        //     count: s.get("count"),
        // }));

        // /** 📊 6. Bar Chart Data - Employee Interactions */
        // const employeeInteractions = await Interaction.findAll({
        //     attributes: ["employee_id", [Sequelize.fn("COUNT", "employee_id"), "count"]],
        //     group: ["employee_id"],
        //     include: [{ model: Employee, attributes: ["first_name", "last_name"] }],
        // });

        // const employeeInteractionData = employeeInteractions.map((e) => ({
        //     employee: `${e.Employee.first_name} ${e.Employee.last_name}`,
        //     count: e.get("count"),
        // }));

        return res.status(200).json({
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
                //   propertyStatusData,
                //   taskStatusData,
                },
            //     bar: {
            //       leadSourceData,
            //       employeeInteractionData,
            //     },
              },
        });
    } catch (error) {
        console.error("Error fetching daily detailed report:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
