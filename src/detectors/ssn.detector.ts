import { DetectedMatch, EntityDetector } from "../types";
import { isValidSsn } from "../validators/ssn";

export class SsnDetector implements EntityDetector {
    readonly type = "SSN" as const;
    readonly priority = 100;

    private readonly pattern = /(?<![\d-])\d{3}-\d{2}-\d{4}(?![\d-])/g;

    detect(text: string): DetectedMatch[] {
        const matches: DetectedMatch[] = [];
        this.pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = this.pattern.exec(text)) !== null) {
            const value = match[0];

            if (!isValidSsn(value)) {
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