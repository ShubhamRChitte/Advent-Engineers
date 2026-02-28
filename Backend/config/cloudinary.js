const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'advent_orders', // Cloudinary folder name
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'], // Allowed file formats
        // format: async (req, file) => 'png', // supports promises as well
        public_id: (req, file) => {
            // Remove original extension if any and prepend timestamp
            const name = file.originalname.split('.')[0];
            return `${Date.now()}-${name}`;
        },
    },
});

const upload = multer({ storage: storage });

module.exports = {
    cloudinary,
    upload
};
