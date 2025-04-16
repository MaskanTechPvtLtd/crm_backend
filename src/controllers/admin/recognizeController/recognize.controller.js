import fs from 'fs';
import { faceapi, canvas } from '../../../utils/faceapi-config.utils.js';
import Employee from '../../../models/employee.model.js';
import { ApiResponse } from '../../../utils/ApiResponse.utils.js';
import { ApiError } from '../../../utils/ApiError.utils.js';

const { createCanvas, loadImage } = canvas;

export async function recognizeFace(req, res, next) {
  const imagePath = req.file?.path;
  const { employee_id } = req.body;

  try {
    // 🔍 Validate Inputs
    if (!employee_id || isNaN(Number(employee_id))) {
      if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      throw new ApiError(400, "Invalid or missing employee_id");
    }


    // 📦 Fetch Employee
    const employee = await Employee.findOne({
      attributes: ['employee_id', 'first_name', 'last_name', 'email', 'profile_picture'],
      where: { employee_id },
    });

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    if (!employee.profile_picture) {
      throw new ApiError(404, "Profile picture not available for this employee");
    }

    // 🖼 Load Profile Image
    const profileImg = await loadImage(employee.profile_picture);
    const profileCanvas = createCanvas(profileImg.width, profileImg.height);
    profileCanvas.getContext('2d').drawImage(profileImg, 0, 0);

    const profileDetection = await faceapi
      .detectSingleFace(profileCanvas)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!profileDetection) {
      throw new ApiError(400, "No face detected in employee's profile picture");
    }

    // 📷 Load Captured Image
    const liveImg = await loadImage(imagePath);
    const liveCanvas = createCanvas(liveImg.width, liveImg.height);
    liveCanvas.getContext('2d').drawImage(liveImg, 0, 0);

    const liveDetection = await faceapi
      .detectSingleFace(liveCanvas)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!liveDetection) {
      throw new ApiError(400, "No face detected in captured image");
    }

    // 🎯 Compare Faces
    const distance = faceapi.euclideanDistance(
      profileDetection.descriptor,
      liveDetection.descriptor
    );

    const threshold = 0.6;
    if (distance > threshold) {
      throw new ApiError(400, "Face does not match employee's profile picture");
    }

    // ✅ Match Successful
    return res.status(200).json(
      new ApiResponse(200, { employee }, "Face matched successfully")
    );

  } catch (error) {
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); // Cleanup
    }

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error.toJSON());
    }

    // Fallback for unexpected errors
    console.error("Unexpected Error:", error);
    return res.status(500).json(
      new ApiError(500, "Internal server error", [], null, null, null, error).toJSON()
    );
  }
}
