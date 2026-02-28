/**
 * Configuration for Metering CT Accuracy Classes.
 * Defines allowed load percentages and their Ratio/Phase Error Limits.
 * The UI and Validation logic read from this configuration.
 */

const ACCURACY_CLASS_LIMITS = {
    "0.1": [
        { load: "120%", ratioLimit: 0.1, phaseLimit: 5 },
        { load: "100%", ratioLimit: 0.1, phaseLimit: 5 },
        { load: "20%", ratioLimit: 0.2, phaseLimit: 8 },
        { load: "5%", ratioLimit: 0.4, phaseLimit: 15 }
    ],
    "0.2": [
        { load: "120%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "100%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "20%", ratioLimit: 0.35, phaseLimit: 15 },
        { load: "5%", ratioLimit: 0.75, phaseLimit: 30 }
    ],
    "0.5": [
        { load: "120%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "100%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "20%", ratioLimit: 0.75, phaseLimit: 45 },
        { load: "5%", ratioLimit: 1.5, phaseLimit: 90 }
    ],
    "1": [
        { load: "120%", ratioLimit: 1.0, phaseLimit: 60 },
        { load: "100%", ratioLimit: 1.0, phaseLimit: 60 },
        { load: "20%", ratioLimit: 1.5, phaseLimit: 90 },
        { load: "5%", ratioLimit: 3.0, phaseLimit: 180 }
    ],
    "3": [
        { load: "120%", ratioLimit: 3.0, phaseLimit: null },
        { load: "50%", ratioLimit: 3.0, phaseLimit: null }
    ],
    "5": [
        { load: "120%", ratioLimit: 5.0, phaseLimit: null },
        { load: "50%", ratioLimit: 5.0, phaseLimit: null }
    ],
    "0.2S": [
        { load: "120%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "100%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "20%", ratioLimit: 0.2, phaseLimit: 10 },
        { load: "5%", ratioLimit: 0.35, phaseLimit: 15 },
        { load: "1%", ratioLimit: 0.75, phaseLimit: 30 }
    ],
    "0.5S": [
        { load: "120%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "100%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "20%", ratioLimit: 0.5, phaseLimit: 30 },
        { load: "5%", ratioLimit: 0.75, phaseLimit: 45 },
        { load: "1%", ratioLimit: 1.5, phaseLimit: 90 }
    ]
};

/**
 * Validates a given reading against the accuracy class configuration.
 * @param {string} accClass - e.g., "0.5S"
 * @param {string} load - e.g., "120%"
 * @param {string|number} ratioValue - User inputted ratio error reading
 * @param {string|number} phaseValue - User inputted phase error reading
 * @returns {object} { isPass: boolean, reason: string | null }
 */
const validateMeteringReading = (accClass, load, ratioValue, phaseValue) => {
    const normalizedClass = accClass ? accClass.toUpperCase() : "0.5";
    const classLimits = ACCURACY_CLASS_LIMITS[normalizedClass] || ACCURACY_CLASS_LIMITS["0.5"];
    if (!classLimits) return { isPass: true, reason: null }; // Default Pass if unknown class

    const limitConfig = classLimits.find(c => c.load === load);
    if (!limitConfig) return { isPass: false, reason: `Unknown load %: ${load}` };

    let isPass = true;
    const reasons = [];

    // Ratio Validation
    if (ratioValue !== undefined && ratioValue !== null && ratioValue !== "") {
        const ratioNum = parseFloat(ratioValue);
        if (!isNaN(ratioNum) && limitConfig.ratioLimit !== null) {
            if (Math.abs(ratioNum) >= limitConfig.ratioLimit) {
                isPass = false;
                reasons.push(`Ratio Error (${ratioValue}%) exceeds ±${limitConfig.ratioLimit}%`);
            }
        }
    }

    // Phase Validation
    if (phaseValue !== undefined && phaseValue !== null && phaseValue !== "") {
        const phaseNum = parseFloat(phaseValue);
        if (!isNaN(phaseNum) && limitConfig.phaseLimit !== null) {
            if (Math.abs(phaseNum) >= limitConfig.phaseLimit) {
                isPass = false;
                reasons.push(`Phase Error (${phaseValue}m) exceeds ±${limitConfig.phaseLimit}m`);
            }
        }
    }

    return {
        isPass,
        reason: reasons.length > 0 ? reasons.join('; ') : null
    };
};

module.exports = { ACCURACY_CLASS_LIMITS, validateMeteringReading };
