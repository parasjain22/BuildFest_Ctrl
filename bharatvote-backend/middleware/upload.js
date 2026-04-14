const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

/**
 * Multer storage for Aadhaar card images.
 */
const aadhaarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'aadhaar'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `aadhaar-${uuidv4()}${ext}`);
    },
});

/**
 * Multer storage for user photos.
 */
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'photos'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `photo-${uuidv4()}${ext}`);
    },
});

/**
 * File filter: only JPEG/PNG allowed.
 */
const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
};

/**
 * Upload middleware for registration (Aadhaar card + user photo).
 */
const uploadRegistration = multer({
    storage: aadhaarStorage,
    fileFilter,
    limits: { fileSize: MAX_SIZE },
}).fields([
    { name: 'aadhaar_image', maxCount: 1 },
    { name: 'user_image', maxCount: 1 },
]);

/**
 * Upload middleware for face verification (single live photo).
 */
const uploadFaceVerify = multer({
    storage: photoStorage,
    fileFilter,
    limits: { fileSize: MAX_SIZE },
}).single('live_image');

/**
 * Upload middleware for complaint attachments.
 */
const uploadComplaintAttachment = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, '..', 'uploads'));
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `complaint-${uuidv4()}${ext}`);
        },
    }),
    fileFilter,
    limits: { fileSize: MAX_SIZE },
}).single('attachment');

module.exports = { uploadRegistration, uploadFaceVerify, uploadComplaintAttachment };
