import multer from "multer";
import path from "path";
import * as XLSX from "xlsx";

// Set storage configuration
const storage = multer.memoryStorage(); // Use memory storage to avoid saving the file on disk

// Configure multer for accepting multiple Excel formats
const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  // Accept all common Excel file formats
  const allowedExtensions = [".xls", ".xlsx", ".xlsm", ".xltx", ".xlt"];

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only Excel files are allowed!"), false); // Reject the file
  }
};

// Reusable upload middleware
export const excel_uploader = multer({
  storage: storage,
  fileFilter: fileFilter,
}).single("excelFile"); // Ensure this matches the key used in the form-data

// Middleware to read the Excel data
export const readExcelData = (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    // Parse the Excel file content using XLSX
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    // Log the sheet names and the raw sheet content for debugging
    // console.log("Sheet Names:", workbook.SheetNames); // Log sheet names
    const sheetName = workbook.SheetNames[0]; // Get the first sheet name
    const worksheet = workbook.Sheets[sheetName]; // Get the first worksheet

    // Log the raw worksheet to debug
    // console.log("Raw Worksheet Data:", worksheet);

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Convert sheet to JSON (array of arrays)

    // Log the parsed data to check what is being returned
    // console.log("Parsed Data:", data);

    // Attach the data to the request object for further use
    req.excelData = data;

    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    res
      .status(500)
      .send(ApiError(500, "getting error while uploading the file"));
  }
};
