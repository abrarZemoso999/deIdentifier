/**
 * Validates a candidate credit card string using the Luhn (mod-10) algorithm.
 * Strips spaces and hyphens before checking digits.
 */
export function isValidCreditCard(candidate: string): boolean {
    const digitsOnly = candidate.replace(/[\s-]/g, "");

    // Standard ISO/IEC 7812 payment card lengths are 13 to 19 digits
    if (!/^\d{13,19}$/.test(digitsOnly)) {
        return false;
    }

    // Reject all-zero sequences (e.g., "0000000000000000"), which pass mod-10 mathematically
    if (/^0+$/.test(digitsOnly)) {
        return false;
    }

    let sum = 0;
    let shouldDouble = false;

    for (let i = digitsOnly.length - 1; i >= 0; i--) {
        const ch = digitsOnly[i];
        if (ch === undefined) {
            return false;
        }

        let digit = Number(ch);

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}