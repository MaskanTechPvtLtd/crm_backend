import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";
// Assuming sequelize instance is already defined
// Define the CustomerFeedback model
const CustomerFeedback = sequelize.define('CustomerFeedback', {
  feedback_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Customer name cannot be empty' },
    },
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employee', // References the Employee table
      key: 'employee_id',
    },
    onDelete: 'SET NULL', // If the employee is deleted, set agent_id to NULL
  },
  body_text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Feedback body text cannot be empty' },
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Rating must be at least 1',
      },
      max: {
        args: [5],
        msg: 'Rating cannot be more than 5',
      },
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'CustomerFeedback',
  timestamps: false, // We're manually handling created_at
});


export default CustomerFeedback;