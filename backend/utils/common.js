// backend/utils/common.js

/**
 * Generates a unique DAF ID based on user type.
 * Note: This ID is currently simple and non-sequential.
 * @param {string} type - The user type (fencer, coach, referee, school, club).
 * @returns {string} The generated DAF ID.
 */
const generateDAFId = (type) => {
    const prefix = {
        'fencer': 'DAF-F',
        'coach': 'DAF-C',
        'referee': 'DAF-R',
        'school': 'DAF-S',
        'club': 'DAF-CL'
    }[type];
    
    // Generates a random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000); 
    // Uses the last 4 digits of the current timestamp
    const timestampSuffix = Date.now().toString().slice(-4); 
    
    return `${prefix}${randomNum}${timestampSuffix}`;
};

module.exports = {
    generateDAFId,
    // Add other common utilities here if needed later
};
