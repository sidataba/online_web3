import express from 'express';
import { uploadFile, uploadMetadata, getIPFSContent } from '../controllers/ipfsController.js';

const router = express.Router();

router.post('/upload', uploadFile);
router.post('/upload-metadata', uploadMetadata);
router.get('/content/:cid', getIPFSContent);

export default router;
