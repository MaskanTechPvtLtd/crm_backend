import { Sequelize } from "sequelize";
import { database, username, password, host, dialect } from "../constants.js";

const sequelize = new Sequelize(database, username, password, {
  host: host,
  dialect: dialect,
  logging: false, // Disable logging

});


const connectSequelize = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected via Sequelize!");
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export { sequelize, connectSequelize };
