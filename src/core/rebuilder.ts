import { DeidentifyResult, DetectedMatch, EntityType } from "../types";

/**
 * Replaces non-overlapping, start-sorted spans in a single pass and tallies detected entities.
 */
export function rebuildText(
    originalText: string,
    resolvedMatches: readonly DetectedMatch[]
): DeidentifyResult {
    const chunks: string[] = [];
    const entitiesDetected: Partial<Record<EntityType, number>> = {};
    let cursor = 0;

    for (const match of resolvedMatches) {
        // Append untouched text before this match
        chunks.push(originalText.slice(cursor, match.start));

        // Append the entity placeholder
        chunks.push(`[${match.entityType}]`);

        // Advance cursor past the matched span
        cursor = match.end;

        // Increment count for this entity type
        entitiesDetected[match.entityType] = (entitiesDetected[match.entityType] ?? 0) + 1;
    }

    // Append any remaining untouched text after the last match
    chunks.push(originalText.slice(cursor));

    return {
        deidentifiedText: chunks.join(""),
        entitiesDetected,
    };
}