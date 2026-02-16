const crypto = require('crypto');

/**
 * Hash a value with SHA-256 using the system-wide secret salt.
 * Same input always produces the same hash (deterministic).
 */
const hashWithSalt = (value) => {
    const salt = process.env.HASH_SECRET_SALT;
    if (!salt) throw new Error('HASH_SECRET_SALT is not defined in environment');
    return crypto.createHmac('sha256', salt).update(value).digest('hex');
};

/**
 * Hash file buffer to generate integrity fingerprint.
 */
const hashFileBuffer = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Generate a random OTP of given length.
 */
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % 10];
    }
    return otp;
};

/**
 * Generate a nullifier for duplicate vote prevention.
 * nullifier = hash(secret_key + election_id)
 */
const generateNullifier = (secretKey, electionId) => {
    return crypto.createHmac('sha256', secretKey).update(electionId).digest('hex');
};

module.exports = { hashWithSalt, hashFileBuffer, generateOTP, generateNullifier };
