import { DetectedMatch, EntityDetector } from "../types";
import { isValidIpv4 } from "../validators/ip";

export class IpAddressDetector implements EntityDetector {
    readonly type = "IP_ADDRESS" as const;
    readonly priority = 60;

    // Negative lookbehind blocks version prefixes like "v1.2.3.4".
    // Negative lookahead blocks 5-octet chains like "1.2.3.4.5" while allowing a trailing sentence period ("127.0.0.1.").
    private readonly pattern =
        /(?<![\d.a-zA-Z])(?:\d{1,3}\.){3}\d{1,3}(?!\d|\.\d|\.[a-zA-Z])/g;

    detect(text: string): DetectedMatch[] {
        const matches: DetectedMatch[] = [];
        this.pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = this.pattern.exec(text)) !== null) {
            const value = match[0];

            if (!isValidIpv4(value)) {
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