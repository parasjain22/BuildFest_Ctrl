const express = require('express');
const router = express.Router();
const { adminLogin, register, loginInitiate, verifyOTP, faceVerify, logout } = require('../controllers/authController');
const { uploadRegistration, uploadFaceVerify } = require('../middleware/upload');
const { registerValidation, loginInitiateValidation, otpVerifyValidation } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// Admin login (email + password)
router.post('/admin-login', authLimiter, adminLogin);

// Registration (multipart/form-data with Aadhaar + photo)
router.post('/register', authLimiter, uploadRegistration, registerValidation, register);

// Login Step 1: Send OTP
router.post('/login/initiate', authLimiter, loginInitiateValidation, loginInitiate);

// Login Step 2: Verify OTP
router.post('/login/verify-otp', authLimiter, otpVerifyValidation, verifyOTP);

// Login Step 3: Face verification
router.post('/login/face-verify', authLimiter, uploadFaceVerify, faceVerify);

// Logout (blacklist token)
router.post('/logout', logout);

module.exports = router;
