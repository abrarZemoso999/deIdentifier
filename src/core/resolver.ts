import { DetectedMatch } from "../types";

/**
 * Checks whether two half-open intervals [a.start, a.end) and [b.start, b.end) overlap.
 */
function overlaps(a: DetectedMatch, b: DetectedMatch): boolean {
    return a.start < b.end && b.start < a.end;
}

/**
 * Resolves overlapping and duplicate detections across multiple rules:
 * 1. Ranks candidates by priority (descending), then match length (descending), then start index (ascending).
 * 2. Greedily accepts non-overlapping matches so higher-priority rules always win.
 * 3. Returns accepted matches sorted by start index (ascending) for single-pass replacement.
 */
export function resolveOverlaps(matches: readonly DetectedMatch[]): DetectedMatch[] {
    if (matches.length === 0) {
        return [];
    }

    const ranked = [...matches].sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }

        const lengthA = a.end - a.start;
        const lengthB = b.end - b.start;
        if (lengthB !== lengthA) {
            return lengthB - lengthA;
        }

        return a.start - b.start;
    });

    const accepted: DetectedMatch[] = [];

    for (const candidate of ranked) {
        const hasConflict = accepted.some((existing) => overlaps(existing, candidate));
        if (!hasConflict) {
            accepted.push(candidate);
        }
    }

    return accepted.sort((a, b) => a.start - b.start);
}