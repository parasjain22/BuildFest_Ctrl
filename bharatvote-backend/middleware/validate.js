const { body, param, validationResult } = require('express-validator');

/**
 * Handle validation errors from express-validator.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const fieldErrors = errors.array().map((e) => ({ field: e.path, message: e.msg }));
        console.log(`❌ [validate] Validation failed on ${req.originalUrl}:`);
        console.log(`❌ [validate]   Body keys present: [${Object.keys(req.body || {}).join(', ')}]`);
        fieldErrors.forEach(e => console.log(`❌ [validate]   ✗ ${e.field}: ${e.message}`));
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: fieldErrors,
        });
    }
    next();
};

/**
 * Registration validation rules.
 */
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('mobile')
        .matches(/^\d{10}$/)
        .withMessage('Mobile must be 10-digit numeric'),
    body('aadhaar')
        .matches(/^\d{12}$/)
        .withMessage('Aadhaar must be 12-digit numeric'),
    body('voter_id')
        .trim()
        .notEmpty()
        .withMessage('Voter ID is required')
        .matches(/^[A-Z]{3}\d{7}$/)
        .withMessage('Voter ID must match pattern: 3 uppercase letters + 7 digits (e.g., ABC1234567)'),
    body('email')
        .optional({ values: 'falsy' })
        .isEmail()
        .withMessage('Invalid email format'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('constituency').trim().notEmpty().withMessage('Constituency is required'),
    body('declaration_accepted')
        .isBoolean()
        .custom((v) => v === true || v === 'true')
        .withMessage('Declaration must be accepted'),
    handleValidationErrors,
];

/**
 * Login initiation validation.
 */
const loginInitiateValidation = [
    body('aadhaar')
        .matches(/^\d{12}$/)
        .withMessage('Aadhaar must be 12-digit numeric'),
    handleValidationErrors,
];

/**
 * OTP verification validation.
 */
const otpVerifyValidation = [
    body('aadhaar')
        .matches(/^\d{12}$/)
        .withMessage('Aadhaar must be 12-digit numeric'),
    body('otp')
        .matches(/^\d{6}$/)
        .withMessage('OTP must be 6-digit numeric'),
    handleValidationErrors,
];

/**
 * Vote casting validation.
 */
const castVoteValidation = [
    body('candidate_id').notEmpty().withMessage('Candidate selection is required'),
    body('session_id').notEmpty().withMessage('Session ID is required'),
    body('election_id').notEmpty().withMessage('Election ID is required'),
    handleValidationErrors,
];

/**
 * Complaint validation.
 */
const complaintValidation = [
    body('category')
        .isIn(['voting', 'aadhaar', 'technical', 'coercion', 'other'])
        .withMessage('Invalid complaint category'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    handleValidationErrors,
];

/**
 * Election creation validation.
 */
const electionValidation = [
    body('name').trim().notEmpty().withMessage('Election name is required'),
    handleValidationErrors,
];

/**
 * Candidate creation validation.
 */
const candidateValidation = [
    body('name').trim().notEmpty().withMessage('Candidate name is required'),
    body('party').trim().notEmpty().withMessage('Party name is required'),
    body('symbol').notEmpty().withMessage('Party symbol is required'),
    body('constituency').trim().notEmpty().withMessage('Constituency is required'),
    body('election_id').notEmpty().withMessage('Election ID is required'),
    handleValidationErrors,
];

module.exports = {
    handleValidationErrors,
    registerValidation,
    loginInitiateValidation,
    otpVerifyValidation,
    castVoteValidation,
    complaintValidation,
    electionValidation,
    candidateValidation,
};
