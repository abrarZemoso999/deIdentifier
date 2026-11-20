import { DetectedMatch, EntityDetector } from "../types";

export class PhoneDetector implements EntityDetector {
    readonly type = "PHONE" as const;
    readonly priority = 50;

    // Branch 1: International format starting with +countryCode (e.g. +1-415-555-0134, +91 98765 43210)
    // Branch 2: Parenthesized area code (e.g. (415) 555-0134)
    // Branch 3: Grouped 3-3-4 format with separators (e.g. 415-555-0134, 1-800-555-0199)
    private readonly pattern =
        /(?<![\d+])(?:\+\d{1,3}(?:[ .-]?\(?\d{1,4}\)?){1,4}|\(\d{2,4}\)[ .-]?\d{3,4}[ .-]?\d{4}|(?:\d{1,3}[ .-])?\d{3}[ .-]\d{3}[ .-]\d{4})(?!\d)/g;

    detect(text: string): DetectedMatch[] {
        const matches: DetectedMatch[] = [];
        this.pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = this.pattern.exec(text)) !== null) {
            const value = match[0];
            const digitCount = value.replace(/\D/g, "").length;

            // ITU-T E.164 international phone numbers contain between 8 and 15 digits
            if (digitCount < 8 || digitCount > 15) {
                continue;
            }

            matches.push({
                entityType: this.type,
                start: match.index,
                end: match.index + value.length,
                value,
                priority: this.priority,
            });
        }

        return matches;
    }
}