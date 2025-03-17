import request from "supertest";
import app from "../app";
import Employee from "../models/employee.model.js";
import Properties from "../models/properties.model.js";
import PropertyMedia from "../models/propertymedia.model.js";
import PropertyType from "../models/propertytypes.model.js";
import Leads from "../models/leads.model.js";

describe("GET /api/agent/:agent_id/team-details", () => {
    const validAgentId = 1;
    const managerId = 10;
    let mockEmployeeData;
    let mockPropertiesData;
    let mockLeadsData;

    // Setup mock data
    beforeAll(() => {
        mockEmployeeData = [
            { 
                employee_id: 2, 
                first_name: "John", 
                last_name: "Doe", 
                email: "john@example.com", 
                phone: "1234567890", 
                role: "Agent" 
            }
        ];
        mockPropertiesData = [{
            property_id: 1,
            assign_to: 2,
            propertyType: { property_type_id: 1, type_name: "Apartment" },
            propertyMedia: [{ media_type: "image", file_url: "url-to-image" }]
        }];
        mockLeadsData = [{
            lead_id: 1,
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
            phone: "9876543210",
            budget_min: 50000,
            budget_max: 100000,
            status_id_fk: 1,
            assigned_to_fk: 2
        }];
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("Success Cases", () => {
        test("returns team details with employees, properties, and leads", async () => {
            Employee.findOne.mockResolvedValue({ employee_id: validAgentId, manager_id: managerId });
            Employee.findAll.mockResolvedValue(mockEmployeeData);
            Properties.findAll.mockResolvedValue(mockPropertiesData);
            Leads.findAll.mockResolvedValue(mockLeadsData);

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 200,
                message: "Employees, properties, and leads retrieved successfully.",
                data: {
                    manager_id: managerId,
                    employees: expect.arrayContaining(mockEmployeeData),
                    properties: expect.arrayContaining(mockPropertiesData),
                    leads: expect.arrayContaining(mockLeadsData)
                }
            });
            expect(response.body.data.employees).toHaveLength(1);
            expect(response.body.data.properties[0]).toHaveProperty("propertyType");
            expect(response.body.data.leads[0]).toHaveProperty("budget_min");
        });

        test("returns empty arrays when no properties or leads exist", async () => {
            Employee.findOne.mockResolvedValue({ employee_id: validAgentId, manager_id: managerId });
            Employee.findAll.mockResolvedValue(mockEmployeeData);
            Properties.findAll.mockResolvedValue([]);
            Leads.findAll.mockResolvedValue([]);

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("employees", expect.any(Array));
            expect(response.body.data.properties).toEqual([]);
            expect(response.body.data.leads).toEqual([]);
        });
    });

    describe("Validation Errors", () => {
        test.each([
            ["invalid", "non-numeric ID"],
            ["", "empty ID"],
            ["-1", "negative ID"]
        ])("returns 400 for invalid agent_id: %s (%s)", async (agentId, description) => {
            const response = await request(app).get(`/api/agent/${agentId}/team-details`);
            
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                status: 400,
                message: "Invalid agent ID."
            });
        });
    });

    describe("Not Found Errors", () => {
        test("returns 404 when agent doesn't exist", async () => {
            Employee.findOne.mockResolvedValue(null);

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Agent not found.");
        });

        test("returns 404 when no team members found", async () => {
            Employee.findOne.mockResolvedValue({ employee_id: validAgentId, manager_id: managerId });
            Employee.findAll.mockResolvedValue([]);

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("No employees found under this manager.");
        });

        test("returns 404 when manager_id is null", async () => {
            Employee.findOne.mockResolvedValue({ employee_id: validAgentId, manager_id: null });

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Agent does not have a valid manager assigned.");
        });
    });

    describe("Authentication & Authorization", () => {
        test("returns 401 when no authentication provided", async () => {
            const response = await request(app)
                .get(`/api/agent/${validAgentId}/team-details`)
                .set("Authorization", "");

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Unauthorized access.");
        });

        test("returns 403 when user lacks permission", async () => {
            const response = await request(app)
                .get(`/api/agent/${validAgentId}/team-details`)
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Forbidden: You do not have access to this resource.");
        });
    });

    describe("Server Errors", () => {
        test("returns 500 when database query fails", async () => {
            Employee.findOne.mockRejectedValue(new Error("Database connection failed"));

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Something went wrong while fetching employee details.");
        });
    });

    describe("Edge Cases", () => {
        test("handles multiple team members correctly", async () => {
            const multipleEmployees = [
                ...mockEmployeeData,
                { 
                    employee_id: 3, 
                    first_name: "Alice", 
                    last_name: "Brown", 
                    email: "alice@example.com", 
                    phone: "9876543210", 
                    role: "Manager" 
                }
            ];
            Employee.findOne.mockResolvedValue({ employee_id: validAgentId, manager_id: managerId });
            Employee.findAll.mockResolvedValue(multipleEmployees);
            Properties.findAll.mockResolvedValue([]);
            Leads.findAll.mockResolvedValue([]);

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);

            expect(response.status).toBe(200);
            expect(response.body.data.employees).toHaveLength(2);
            expect(response.body.data.employees).toContainEqual(
                expect.objectContaining({ first_name: "John" })
            );
            expect(response.body.data.employees).toContainEqual(
                expect.objectContaining({ first_name: "Alice" })
            );
        });

        test("handles large dataset efficiently", async () => {
            const largeEmployeeSet = Array(100).fill().map((_, i) => ({
                ...mockEmployeeData[0],
                employee_id: i + 2,
                email: `employee${i}@example.com`
            }));
            Employee.findOne.mockResolvedValue({ employee_id: validAgentId, manager_id: managerId });
            Employee.findAll.mockResolvedValue(largeEmployeeSet);
            Properties.findAll.mockResolvedValue([]);
            Leads.findAll.mockResolvedValue([]);

            const response = await request(app).get(`/api/agent/${validAgentId}/team-details`);
            
            expect(response.status).toBe(200);
            expect(response.body.data.employees).toHaveLength(100);
        });
    });
});