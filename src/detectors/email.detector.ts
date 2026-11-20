import { DetectedMatch, EntityDetector } from "../types";

export class EmailDetector implements EntityDetector {
    readonly type = "EMAIL" as const;
    readonly priority = 80;

    // Matches local@domain.tld without swallowing trailing sentence punctuation
    private readonly pattern =
        /(?<![a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?![a-zA-Z0-9_%+-])/g;

    detect(text: string): DetectedMatch[] {
        const matches: DetectedMatch[] = [];
        this.pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = this.pattern.exec(text)) !== null) {
            matches.push({
                entityType: this.type,
                start: match.index,
                end: match.index + match[0].length,
                value: match[0],
                priority: this.priority,
            });
        }

        return matches;
    }
}