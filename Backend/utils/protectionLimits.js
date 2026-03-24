/**
 * Configuration for Protection CT Accuracy Classes.
 * Defines Current Error Limit, Phase Error Limit, and Composite Error Limit for varying classes.
 */

const PROTECTION_CLASS_LIMITS = {
    "5P": {
        maxCurrentError: 1.0,     // ±1%
        maxPhaseError: 60,        // ±60 minutes
        maxCompositeError: 5.0    // ≤ 5%
    },
    "10P": {
        maxCurrentError: 3.0,     // ±3%
        maxPhaseError: null,      // Not applicable
        maxCompositeError: 10.0   // ≤ 10%
    },
    "15P": {
        maxCurrentError: 5.0,     // ±5%
        maxPhaseError: null,      // Not applicable
        maxCompositeError: 15.0   // ≤ 15%
    }
};

/**
 * Validates a given reading against the protection class configuration.
 * @param {string} accClass - e.g., "5P", "10P", "15P"
 * @param {string|number} currentError - Current Error (%) / Ratio Error
 * @param {string|number} phaseError - Phase Error (minutes)
 * @param {string|number} compositeError - Composite Error (%)
 * @returns {object} { isPass: boolean, reason: string | null }
 */
const validateProtectionReading = (accClass, currentError, phaseError, compositeError) => {
    // If accuracy class string contains "5P" (e.g. "5P20", "0.5S/5P20")
    // we need to extract the exact protection class (5P, 10P, 15P).
    // The strict parsing is expected to be done before calling this, passing pure "5P", "10P", "15P"
    const parsedClass = accClass ? accClass.toUpperCase() : null;
    let limitConfig = PROTECTION_CLASS_LIMITS[parsedClass];

    // Fuzzy matching fallback if it contains the substring
    if (!limitConfig && parsedClass) {
        if (parsedClass.includes("5P")) limitConfig = PROTECTION_CLASS_LIMITS["5P"];
        else if (parsedClass.includes("10P")) limitConfig = PROTECTION_CLASS_LIMITS["10P"];
        else if (parsedClass.includes("15P")) limitConfig = PROTECTION_CLASS_LIMITS["15P"];
    }

    if (!limitConfig) return { isPass: true, reason: null }; // Default Pass if unknown class

    let isPass = true;
    const reasons = [];

    // Current Error Validation
    if (currentError !== undefined && currentError !== null && currentError !== "") {
        const currentNum = parseFloat(currentError);
        if (!isNaN(currentNum)) {
            if (Math.abs(currentNum) >= limitConfig.maxCurrentError) {
                isPass = false;
                reasons.push(`Current Error (${currentError}%) exceeds ±${limitConfig.maxCurrentError}%`);
            }
        }
    }

    // Phase Error Validation (only if applicable)
    if (limitConfig.maxPhaseError !== null && phaseError !== undefined && phaseError !== null && phaseError !== "") {
        const phaseNum = parseFloat(phaseError);
        if (!isNaN(phaseNum)) {
            if (Math.abs(phaseNum) >= limitConfig.maxPhaseError) {
                isPass = false;
                reasons.push(`Phase Error (${phaseError}m) exceeds ±${limitConfig.maxPhaseError}m`);
            }
        }
    }

    // Composite Error Validation
    if (compositeError !== undefined && compositeError !== null && compositeError !== "") {
        // Strip trailing % if present to parse cleanly from frontend string payload
        const compClean = String(compositeError).replace('%', '');
        const compNum = parseFloat(compClean);
        if (!isNaN(compNum)) {
            if (Math.abs(compNum) >= limitConfig.maxCompositeError) {
                isPass = false;
                reasons.push(`Composite Error (${compositeError}%) exceeds ≤${limitConfig.maxCompositeError}%`);
            }
        }
    }

    return {
        isPass,
        reason: reasons.length > 0 ? reasons.join('; ') : null
    };
};

module.exports = { PROTECTION_CLASS_LIMITS, validateProtectionReading };
