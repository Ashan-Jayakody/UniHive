const multer = require('multer');
const requireCloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

requireCloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: requireCloudinary,
  params: {
    folder: 'unihive_resources',
    resource_type: 'auto',
    public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, '_').split('.')[0]}`,
  },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});

module.exports = upload;