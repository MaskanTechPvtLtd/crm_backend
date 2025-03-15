import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";
import Employee from "./employee.model.js";
import jwt from "jsonwebtoken";

const UserAuth = sequelize.define(
  "UserAuth",
  {
    user_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Employee,
        key: "employee_id",
      },
      onDelete: "CASCADE",
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.STRING(500), // Store refresh token securely
      allowNull: true,
    },
  },
  {
    tableName: "userauth",
    timestamps: false,
  }
);

// Define association
// UserAuth.belongsTo(Employee, { foreignKey: "employee_id", onDelete: "CASCADE", onUpdate: "CASCADE" });

// Generate Access Token
UserAuth.prototype.generateAccessToken = function (Employee) {
  return jwt.sign(
    {
      user_id: this.user_id,
      username: this.username,
      employee_id: Employee.employee_id,
      email: Employee.email,
      role: Employee.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "1h",
    }
  );
};

// Generate Refresh Token
UserAuth.prototype.generateRefreshToken = function () {
  return jwt.sign(
    {
      user_id: this.user_id,
      employee_id: Employee.employee_id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    }
  );
};

export default UserAuth;
