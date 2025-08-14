import express from 'express';
const router = express.Router();
import { uploadFile, deleteFile } from '../controller/StorageController.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:key', deleteFile);

export default router;
