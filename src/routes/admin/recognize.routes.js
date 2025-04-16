import express from 'express';
import multer from 'multer';
import { recognizeFace } from '../../controllers/admin/recognizeController/recognize.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/recognize', upload.single('image'), recognizeFace);

export default router;
