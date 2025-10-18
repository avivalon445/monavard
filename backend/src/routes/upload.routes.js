const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../services/upload.service');
const { uploadLimiter } = require('../middleware/rateLimiter');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(protect, uploadLimiter);

// POST /api/v1/upload/request - Upload request files
router.post('/request', upload.array('files', 10), asyncHandler(async (req, res) => {
  const files = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype
  }));

  ApiResponse.success('Files uploaded successfully', { files }).send(res);
}));

// POST /api/v1/upload/profile - Upload profile picture
router.post('/profile', upload.single('file'), asyncHandler(async (req, res) => {
  const file = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype
  };

  ApiResponse.success('Profile picture uploaded successfully', { file }).send(res);
}));

// POST /api/v1/upload/document - Upload document
router.post('/document', upload.single('file'), asyncHandler(async (req, res) => {
  const file = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype
  };

  ApiResponse.success('Document uploaded successfully', { file }).send(res);
}));

module.exports = router;

