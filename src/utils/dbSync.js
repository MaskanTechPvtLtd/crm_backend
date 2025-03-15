import { sequelize } from "../db/index.js"; // Ensure correct DB connection import

// Import and apply associations after models
import { applyAllAssociations } from "../associations/index.js";

// Sync database function
const syncDatabase = async (alter = true) => {
  try {
    console.log("🔄 Initializing Database Sync...");

    // Apply all associations after models are imported
    applyAllAssociations();

    // Sync the database (Ensure tables exist first)
    await sequelize.sync({ alter }); // Use `{ force: true }` for a fresh DB reset
    console.log("✅ Database synced successfully.");
  } catch (error) {
    console.error("❌ Database sync failed:", error);
  }
};

export default syncDatabase;