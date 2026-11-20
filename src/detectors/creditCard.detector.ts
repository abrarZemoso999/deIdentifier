import { DetectedMatch, EntityDetector } from "../types";
import { isValidCreditCard } from "../validators/luhn";

export class CreditCardDetector implements EntityDetector {
    readonly type = "CREDIT_CARD" as const;
    readonly priority = 90;

    // Matches 13-19 digits continuous or separated by spaces/hyphens (e.g. 4-4-4-4 or 4-6-5 Amex)
    private readonly pattern = /(?<![\d-])\d{4}(?:[ -]?\d{3,6}){2,4}(?![\d-])/g;

    detect(text: string): DetectedMatch[] {
        const matches: DetectedMatch[] = [];
        this.pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = this.pattern.exec(text)) !== null) {
            const value = match[0];

            if (!isValidCreditCard(value)) {
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