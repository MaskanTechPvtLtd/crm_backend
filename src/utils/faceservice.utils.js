import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { faceapi, canvas } from '../utils/faceapi-config.utils.js';
import Employee from '../models/employee.model.js'; // Adjust path if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { createCanvas, loadImage } = canvas;

export async function loadKnownFaces() {
    const employees = await Employee.findAll({
        attributes: ['first_name', 'employee_id', 'profile_picture'],
        where: {
            is_active: true,
            role: 'Sales Agent',
        },
    });

    const descriptors = [];

    for (const emp of employees) {
        const imageUrl = emp.profile_picture;

        try {
            if (!imageUrl || imageUrl.trim().toLowerCase() === 'null' || imageUrl.trim() === '') {
                console.warn(`Skipping employee ${emp.first_name} (${emp.employee_id}): profile_picture is empty or null.`);
                continue;
            }

            let img;
            if (imageUrl.startsWith('http')) {
                const res = await fetch(imageUrl);
                if (!res.ok) {
                    console.warn(`Failed to fetch image for ${emp.first_name} from URL: ${imageUrl}`);
                    continue;
                }
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                img = await loadImage(buffer);
            } else {
                const imgPath = path.join(__dirname, `../../uploads/employees/${imageUrl}`);
                if (!fs.existsSync(imgPath)) {
                    console.warn(`Local image not found for ${emp.first_name}: ${imgPath}`);
                    continue;
                }
                img = await loadImage(imgPath);
            }

            const cnv = createCanvas(img.width, img.height);
            cnv.getContext('2d').drawImage(img, 0, 0);

            const detection = await faceapi
                .detectSingleFace(cnv)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                descriptors.push(new faceapi.LabeledFaceDescriptors(
                    String(emp.employee_id),
                    [detection.descriptor]
                ));
            } else {
                console.warn(`⚠️ No face detected for employee_id ${emp.employee_id} (${emp.first_name})`);
            }
        } catch (err) {
            console.error(`❌ Error processing image for employee_id ${emp.employee_id} (${emp.first_name}): ${err.message}`);
        }
    }


    return new faceapi.FaceMatcher(descriptors, 0.6);
}
