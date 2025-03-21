import { asyncHandler } from "../../utils/asyncHandler.utils.js";
import { ApiError } from "../../utils/ApiError.utils.js";
import { ApiResponse } from "../../utils/ApiResponse.utils.js";
import Attendance from "../../models/attendance.model.js";
import Employee from "../../models/employee.model.js";
import { Op } from "sequelize";
import dayjs from "dayjs";

//  Employee Check-in
export const checkInEmployee = asyncHandler(async (req, res, next) => {
    const { employee_id } = req.body;

    if (!employee_id) {
        return next(new ApiError(400, "Employee ID is required"));
    }

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
        return next(new ApiError(404, "Employee not found"));
    }

    const today = dayjs().format("YYYY-MM-DD");
    const existingAttendance = await Attendance.findOne({
        where: { employee_id, attendance_date: today },
    });

    if (existingAttendance) {
        return next(new ApiError(400, "Employee already checked in today"));
    }

    const checkInTime = dayjs();
    const status = checkInTime.isBefore(dayjs().hour(10).minute(0)) ? "Present" : "Late";

    const attendance = await Attendance.create({
        employee_id,
        attendance_date: today,
        check_in: checkInTime.toDate(),
        status,
    });

    return res.status(201).json(new ApiResponse(201, attendance, `Check-in successful, Status: ${status}`));
});

//  Employee Check-out
export const checkOutEmployee = asyncHandler(async (req, res, next) => {
    const { employee_id } = req.body;

    // Validate input
    if (!employee_id) {
        return next(new ApiError(400, "Employee ID is required"));
    }

    // Find today's attendance record
    const today = dayjs().format("YYYY-MM-DD");
    const attendance = await Attendance.findOne({
        where: {
            employee_id,
            attendance_date: today,
        },
    });

    if (!attendance) {
        return next(new ApiError(400, "Employee has not checked in today"));
    }

    if (attendance.check_out) {
        return next(new ApiError(400, "Employee already checked out today"));
    }

    // Calculate hours worked
    const checkInTime = dayjs(attendance.check_in);
    const checkOutTime = dayjs();
    const hoursWorked = checkOutTime.diff(checkInTime, "hour", true);

    // Update check-out time and hours worked
    await attendance.update({
        check_out: checkOutTime.toDate(),
        hours_worked: hoursWorked.toFixed(2),
    });

    return res.status(200).json(new ApiResponse(200, attendance, "Check-out successful"));
});


//funtion for marking absent if employee did not check in before 06:00 PM
const markAbsentees = async () => {
    const today = dayjs().format("YYYY-MM-DD");

    // Get all employees who have NOT checked in today
    const employees = await Employee.findAll({
        where: {
            employee_id: {
                [Op.notIn]: Sequelize.literal(
                    `(SELECT employee_id FROM attendance WHERE attendance_date = '${today}')`
                ),
            },
        },
    });

    for (const employee of employees) {
        await Attendance.create({
            employee_id: employee.employee_id,
            attendance_date: today,
            status: "Absent",
        });
    }

    console.log(`Marked ${employees.length} employees as Absent`);
};

// Run this function daily at 6:00 PM (use node-cron)

//function for marking absent with leave check
const markAbsenteesWithLeaveCheck = async () => {
    const today = dayjs().format("YYYY-MM-DD");

    const employees = await Employee.findAll({
        where: {
            employee_id: {
                [Op.notIn]: Sequelize.literal(
                    `(SELECT employee_id FROM attendance WHERE attendance_date = '${today}')`
                ),
            },
        },
    });

    for (const employee of employees) {
        const hasLeave = await LeaveRequest.findOne({
            where: {
                employee_id: employee.employee_id,
                leave_date: today,
                status: "Approved",
            },
        });

        await Attendance.create({
            employee_id: employee.employee_id,
            attendance_date: today,
            status: hasLeave ? "On Leave" : "Absent",
        });
    }

    console.log(`Marked employees as Absent/On Leave`);
};


export const CheckAttendanceStatus = asyncHandler(async (req, res, next) => {
    const { employee_id } = req.body;

    if (!employee_id) {
        return next(new ApiError(400, "Employee ID is required"));
    }

    const today = dayjs().format("YYYY-MM-DD");
    const attendance = await Attendance.findOne({
        where: { employee_id, attendance_date: today },
    });

    if (!attendance) {
        return next(new ApiError(404, "No attendance record found for today"));
    }

    return res.status(200).json(new ApiResponse(200, attendance, "Attendance status retrieved successfully"));
});