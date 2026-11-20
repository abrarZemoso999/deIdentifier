/**
 * Validates a US Social Security Number in XXX-XX-XXXX format against SSA allocation rules.
 */
export function isValidSsn(candidate: string): boolean {
    const parts = candidate.split("-");
    if (parts.length !== 3) {
        return false;
    }

    const [area, group, serial] = parts;
    if (!area || !group || !serial) {
        return false;
    }

    if (!/^\d{3}$/.test(area) || !/^\d{2}$/.test(group) || !/^\d{4}$/.test(serial)) {
        return false;
    }

    const areaNum = Number(area);
    const groupNum = Number(group);
    const serialNum = Number(serial);

    // SSA never issues area numbers 000, 666, or 900-999
    if (areaNum === 0 || areaNum === 666 || areaNum >= 900) {
        return false;
    }

    // Group and serial numbers cannot be all zeros
    if (groupNum === 0 || serialNum === 0) {
        return false;
    }

    return true;
}