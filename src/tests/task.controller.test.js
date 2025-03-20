import request from "supertest";
import app from "../app.js";
import Task from "../models/task.model.js";
import Status from "../models/statuses.model.js";
import UserAuth from "../models/userauth.model.js";
import Employee from "../models/employee.model.js";
import { sequelize } from "../db/index.js";

describe("Task API Endpoints", () => {
  let token;
  let employee;
  let status;
  let task;

  beforeAll(async () => {
    await sequelize.sync({ alter: true });

    // Create test employee
    employee = await Employee.create({
      first_name: "Test",
      role: "Admin",
    });

    // Create test user
    await UserAuth.create({
      user_id: 1,
      employee_id: employee.employee_id,
    });

    // Create test status
    status = await Status.create({
      status_name: "Pending",
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("POST /api/v1/tasks", () => {
    it("should create a new task", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .send({
          title: "Test Task",
          description: "Test Description",
          status_id: status.status_id,
          due_date: "2025-12-31",
        })
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Test Task");
    });
  });

  describe("GET /api/v1/tasks", () => {
    it("should fetch tasks", async () => {
      const res = await request(app)
        .get(`/api/v1/tasks?created_by=${employee.employee_id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("PUT /api/v1/tasks/:task_id", () => {
    beforeAll(async () => {
      task = await Task.create({
        title: "Old Task",
        description: "Old Description",
        status_id: status.status_id,
        due_date: "2025-12-31",
        created_by: employee.employee_id,
      });
    });

    it("should update a task", async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${task.task_id}`)
        .send({ title: "Updated Task" })
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Updated Task");
    });
  });

  describe("DELETE /api/v1/tasks/:task_id", () => {
    it("should delete a task", async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${task.task_id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
