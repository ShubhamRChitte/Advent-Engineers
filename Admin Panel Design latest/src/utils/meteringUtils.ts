export function extractAccuracyClass(fullClass: string | undefined): string {
    if (!fullClass || fullClass === 'N/A') return '0.5';

    // Order matters: check more specific classes first (e.g., 0.2S before 0.2)
    const classes = ['0.2S', '0.5S', '0.1', '0.2', '0.5', '1', '3', '5'];
    const upper = fullClass.toUpperCase();

    for (const cls of classes) {
        if (upper.includes(cls)) return cls;
    }

    return '0.5';
}

export function getInitialData(accClass: string | undefined = '0.5') {
    const normalizedClass = extractAccuracyClass(accClass);
    let loads = ['120%', '100%', '20%', '5%']; // Default for 0.1, 0.2, 0.5, 1

    if (normalizedClass === '0.2S' || normalizedClass === '0.5S') {
        loads = ['120%', '100%', '20%', '5%', '1%'];
    } else if (normalizedClass === '3' || normalizedClass === '5') {
        loads = ['120%', '50%'];
    }

    return loads.map(load => ({
        current: load,
        r100: '',
        p100: '',
        r25: '',
        p25: ''
    }));
}

export function validateMeteringUI(
    accClass: string | undefined,
    loadStr: string,
    ratioErrorStr: string,
    phaseErrorStr: string,
    dynamicLimits: any[] = []
) {
    if ((!ratioErrorStr || String(ratioErrorStr).trim() === '') && (!phaseErrorStr || String(phaseErrorStr).trim() === '')) {
        return { isPass: undefined, reason: null };
    }

    const normalizedClass = extractAccuracyClass(accClass);

    // First check dynamic limits from DB, then fallback to empty
    const classLimits = dynamicLimits.length > 0
        ? dynamicLimits.filter(limit => limit.accuracyClass === normalizedClass)
        : [];

    // Default to empty if not found, frontend will just pass it if no limit defined
    const limitsToUse = classLimits.length > 0 ? classLimits[0].limits : [];
    const limitConfig = limitsToUse.find((c: any) => c.load === loadStr);

    if (!limitConfig) return { isPass: true, reason: null };

    let isPass = true;
    let reasons: string[] = [];

    if (ratioErrorStr && String(ratioErrorStr).trim() !== '') {
        const rVal = parseFloat(String(ratioErrorStr));
        if (!isNaN(rVal) && limitConfig.ratioLimit !== undefined && limitConfig.ratioLimit !== null && Math.abs(rVal) >= limitConfig.ratioLimit) {
            isPass = false;
            reasons.push(`Ratio Error (${rVal}%) exceeds ±${limitConfig.ratioLimit}%`);
        }
    }

    if (limitConfig.phaseLimit !== null && limitConfig.phaseLimit !== undefined && phaseErrorStr && String(phaseErrorStr).trim() !== '') {
        const pVal = parseFloat(String(phaseErrorStr));
        if (!isNaN(pVal) && Math.abs(pVal) >= limitConfig.phaseLimit) {
            isPass = false;
            reasons.push(`Phase Error (${pVal}m) exceeds ±${limitConfig.phaseLimit}m`);
        }
    }

    return { isPass, reason: reasons.length > 0 ? reasons.join('; ') : null };
}
