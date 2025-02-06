import Import from "../../../models/admin/importModel/import.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.utils.js";
import { ApiError } from "../../../utils/ApiError.utils.js";
import csvParser from "csv-parser";
import fs from "fs";
import path from "path";

// Import CSV Data
export const importCSV = asyncHandler(async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No CSV file uploaded" });

    const data = [];
    const filePath = path.resolve(file.path);

    // Parse the CSV file
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        console.log("Raw Row Data:", row);

        const columnName = row.ColumnName ? row.ColumnName.trim() : null;
        const value = row.Value ? row.Value.trim() : null;
        const description = row.Description ? row.Description.trim() : null;

        if (!columnName || !value) {
          console.error("Skipping invalid row:", row);
          return; // Skip rows with missing required fields
        }

        data.push({
          ColumnName: columnName,
          Value: value,
          Description: description || "",
        });
      })
      .on("end", async () => {
        try {
          console.log("Final Parsed Data:", data); // Debugging log to check final data

          // If no valid rows were parsed, return an error
          if (data.length === 0) {
            return res.status(400).json({ error: "No valid data to import" });
          }

          // Insert the parsed data into the database (bulk insert if needed)
          await Import.bulkCreate(data);

          // Send success response
          res.status(201).json({
            message: "Data imported successfully",
            data,
          });
        } catch (dbError) {
          // Handle any database errors
          console.error("Database Error:", dbError);
          res.status(500).json({ error: dbError.message });
        }
      })
      .on("error", (fileError) => {
        // Handle file parsing errors
        console.error("File Parsing Error:", fileError);
        res.status(500).json({ error: "Error reading CSV file" });
      });
  } catch (error) {
    // Handle unexpected errors
    console.error("Unexpected Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Other CRUD functions (unchanged)
export const createImport = asyncHandler(async (req, res) => {
  try {
    const entry = await Import.create(req.body);
    res.status(201).json(entry);
  } catch (error) {
    throw new ApiError(500, error.message); // Consistent error handling
  }
});

export const getImports = asyncHandler(async (req, res) => {
  try {
    const entries = await Import.findAll();
    res.status(200).json(entries);
  } catch (error) {
    throw new ApiError(500, error.message); // Consistent error handling
  }
});

export const updateImport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Import.update(req.body, { where: { id } });
    if (updated) {
      const updatedEntry = await Import.findOne({ where: { id } });
      res.status(200).json(updatedEntry);
    } else {
      throw new ApiError(404, "Entry not found");
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

export const deleteImport = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the entry exists
    const entry = await Import.findByPk(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    await entry.destroy();
    res.status(200).json({
      message: "Entry deleted successfully",
      deletedEntry: entry,
    });
  } catch (error) {
    console.error("Error deleting entry:", error.message);
    res.status(500).json({
      error: "An error occurred while deleting the entry",
      details: error.message,
    });
  }
});
