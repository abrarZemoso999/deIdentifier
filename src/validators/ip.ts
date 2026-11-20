/**
 * Validates that a dot-separated string is a valid IPv4 address (4 octets, each 0-255, no leading zeros).
 */
export function isValidIpv4(candidate: string): boolean {
    const octets = candidate.split(".");

    if (octets.length !== 4) {
        return false;
    }

    for (const octet of octets) {
        if (!/^\d{1,3}$/.test(octet)) {
            return false;
        }

        // Disallow leading zeros like "01" or "00"
        if (octet.length > 1 && octet.startsWith("0")) {
            return false;
        }

        const value = Number(octet);
        if (value < 0 || value > 255) {
            return false;
        }
    }

    return true;
}