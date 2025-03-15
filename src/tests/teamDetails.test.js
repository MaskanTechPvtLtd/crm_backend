import request from "supertest";
import app from "../app";
import Employee from "../models/employee.model.js";
import Properties from "../models/properties.model.js";
import PropertyMedia from "../models/propertymedia.model.js";
import PropertyType from "../models/propertytypes.model.js";
import Leads from "../models/leads.model.js";

describe("GET /api/agent/:agent_id/team-details", () => {
    const agent_id = 1;
    const manager_id = 10;

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("should return employees, properties, and leads successfully", async () => {
        Employee.findOne.mockResolvedValue({ employee_id: agent_id, manager_id });
        Employee.findAll.mockResolvedValue([
            { employee_id: 2, first_name: "John", last_name: "Doe", email: "john@example.com", phone: "1234567890", role: "Agent" },
        ]);
        Properties.findAll.mockResolvedValue([
            {
                property_id: 1,
                assign_to: 2,
                propertyType: { property_type_id: 1, type_name: "Apartment" },
                propertyMedia: [{ media_type: "image", file_url: "url-to-image" }],
            },
        ]);
        Leads.findAll.mockResolvedValue([
            { lead_id: 1, first_name: "Jane", last_name: "Smith", email: "jane@example.com", phone: "9876543210", budget_min: 50000, budget_max: 100000, status_id_fk: 1, assigned_to_fk: 2 },
        ]);
 
        const response = await request(app).get(`/api/agent/${agent_id}/team-details`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            status: 200,
            message: "Employees, properties, and leads retrieved successfully.",
            data: {
                manager_id: expect.any(Number),
                employees: expect.any(Array),
                properties: expect.any(Array),
                leads: expect.any(Array),
            },
        });
        expect(response.body.data.employees.length).toBeGreaterThan(0);
        expect(response.body.data.properties.length).toBeGreaterThan(0);
        expect(response.body.data.leads.length).toBeGreaterThan(0);
    });

    test("should return 400 for missing or invalid agent_id", async () => {
        const response = await request(app).get(`/api/agent/invalid/team-details`);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
            status: 400,
            message: "Invalid agent ID.",
        });
    });

    test("should return 404 if agent is not found", async () => {
        Employee.findOne.mockResolvedValue(null);
        const response = await request(app).get(`/api/agent/${agent_id}/team-details`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            status: 404,
            message: "Agent not found.",
        });
    });

    test("should return 404 if no employees found under manager", async () => {
        Employee.findOne.mockResolvedValue({ employee_id: agent_id, manager_id });
        Employee.findAll.mockResolvedValue([]);

        const response = await request(app).get(`/api/agent/${agent_id}/team-details`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            status: 404,
            message: "No employees found under this manager.",
        });
    });

    test("should return empty properties and leads if none exist", async () => {
        Employee.findOne.mockResolvedValue({ employee_id: agent_id, manager_id });
        Employee.findAll.mockResolvedValue([
            { employee_id: 2, first_name: "John", last_name: "Doe", email: "john@example.com", phone: "1234567890", role: "Agent" },
        ]);
        Properties.findAll.mockResolvedValue([]);
        Leads.findAll.mockResolvedValue([]);

        const response = await request(app).get(`/api/agent/${agent_id}/team-details`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            status: 200,
            message: "Employees, properties, and leads retrieved successfully.",
            data: {
                manager_id: expect.any(Number),
                employees: expect.any(Array),
                properties: [],
                leads: [],
            },
        });
        expect(response.body.data.employees.length).toBeGreaterThan(0);
    });

    test("should return 500 if database error occurs", async () => {
        Employee.findOne.mockRejectedValue(new Error("Database error"));

        const response = await request(app).get(`/api/agent/${agent_id}/team-details`);

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            status: 500,
            message: "Something went wrong while fetching employee details.",
        });
    });

    test("should return 401 if authentication is required and user is not logged in", async () => {
        const response = await request(app).get(`/api/agent/${agent_id}/team-details`).set("Authorization", "");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
            status: 401,
            message: "Unauthorized access.",
        });
    });

    test("should return 403 if user does not have permission", async () => {
        // Assuming the middleware sends a 403 response for unauthorized users
        const response = await request(app)
            .get(`/api/agent/${agent_id}/team-details`)
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
            status: 403,
            message: "Forbidden: You do not have access to this resource.",
        });
    });

    test("should return 404 if manager_id is null (data corruption case)", async () => {
        Employee.findOne.mockResolvedValue({ employee_id: agent_id, manager_id: null });

        const response = await request(app).get(`/api/agent/${agent_id}/team-details`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            status: 404,
            message: "Agent does not have a valid manager assigned.",
        });
    });

    test("should handle multiple employees under the same manager", async () => {
        Employee.findOne.mockResolvedValue({ employee_id: agent_id, manager_id });
        Employee.findAll.mockResolvedValue([
            { employee_id: 2, first_name: "John", last_name: "Doe", email: "john@example.com", phone: "1234567890", role: "Agent" },
            { employee_id: 3, first_name: "Alice", last_name: "Brown", email: "alice@example.com", phone: "9876543210", role: "Manager" },
        ]);
        Properties.findAll.mockResolvedValue([]);
        Leads.findAll.mockResolvedValue([]);

        const response = await request(app).get(`/api/agent/${agent_id}/team-details`);

        expect(response.status).toBe(200);
        expect(response.body.data.employees.length).toBe(2);
        expect(response.body.data.employees[0]).toHaveProperty("first_name", "John");
        expect(response.body.data.employees[1]).toHaveProperty("first_name", "Alice");
    });
});
