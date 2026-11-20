import { DetectedMatch, EntityDetector } from "../types";

export class DateOfBirthDetector implements EntityDetector {
    readonly type = "DATE_OF_BIRTH" as const;
    readonly priority = 70;

    // Group 1: Explicit DOB label (preserved in output)
    // Group 2: Date value in YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, or Month DD, YYYY format (masked)
    private readonly pattern =
        /\b((?:date[ \t]+of[ \t]+birth|birth[ \t]*date|dob)[ \t]*[:=-]?[ \t]*)(\d{4}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|[12]\d|3[01])[-/.](?:19|20)\d{2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[ \t]+(?:0?[1-9]|[12]\d|3[01]),?[ \t]+(?:19|20)\d{2})(?![\d])/gi;

    detect(text: string): DetectedMatch[] {
        const matches: DetectedMatch[] = [];
        this.pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = this.pattern.exec(text)) !== null) {
            const prefix = match[1];
            const dateValue = match[2];

            if (prefix === undefined || dateValue === undefined) {
                continue;
            }

            const dateStart = match.index + prefix.length;
            const dateEnd = dateStart + dateValue.length;

            matches.push({
                entityType: this.type,
                start: dateStart,
                end: dateEnd,
                value: dateValue,
                priority: this.priority,
            });
        }

        return matches;
    }
}