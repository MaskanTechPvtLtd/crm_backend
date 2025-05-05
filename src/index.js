import dotenv from "dotenv";
import { connectSequelize } from "./db/index.js";
import { app } from "./app.js";
import { PORT } from "./constants.js";
import  syncDatabase  from "./utils/dbSync.js";
import { applyAllAssociations } from "./associations/index.js";

dotenv.config({
  path: "./.env",
});

connectSequelize()
  .then(() => {
    app.on("error", (err) => {
      console.error(`Run up with some error: ${err}`);
    });
    // if (process.env.NODE_ENV === 'development') {
      // syncDatabase();
    // }
        applyAllAssociations();
  
    app.listen(PORT, () => {
      console.log(`🔥 Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`❌ Sequelize Connection Failed: ${err.message}`);
    process.exit(1); // Exit the process if the database connection fails
  });


  