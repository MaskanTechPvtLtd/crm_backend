// middlewares/multer.middleware.js
import multer from "multer";
import path from "path";

// Set storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Destination folder for uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname); // Get file extension
    cb(null, uniqueSuffix + fileExtension); // Save with unique filename
  },
});

// Reusable upload middleware with `.fields()`
export const upload = multer({
  storage: storage,
});
