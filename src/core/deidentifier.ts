import { getDetectors } from "../detectors";
import {
    DeidentifyOptions,
    DeidentifyResult,
    DetectedMatch,
    EntityType,
    SUPPORTED_ENTITIES,
    ValidationError,
} from "../types";
import { rebuildText } from "./rebuilder";
import { resolveOverlaps } from "./resolver";

const SUPPORTED_SET = new Set<string>(SUPPORTED_ENTITIES);

function validateInputs(text: unknown, entities?: unknown): asserts text is string {
    if (typeof text !== "string") {
        throw new ValidationError("Field 'text' is required and must be a string.");
    }

    if (entities !== undefined) {
        if (!Array.isArray(entities)) {
            throw new ValidationError("Field 'entities' must be an array of supported entity types.");
        }

        const unsupported = entities.filter(
            (item) => typeof item !== "string" || !SUPPORTED_SET.has(item)
        );

        if (unsupported.length > 0) {
            throw new ValidationError(
                `Unsupported entity type(s): ${unsupported.map(String).join(", ")}. Supported types: ${SUPPORTED_ENTITIES.join(", ")}.`
            );
        }
    }
}

/**
 * Detects and masks sensitive PII entities in free-form text without mutating the input.
 */
export function deidentify(text: string, options?: DeidentifyOptions): DeidentifyResult {
    validateInputs(text, options?.entities);

    if (text.length === 0) {
        return {
            deidentifiedText: "",
            entitiesDetected: {},
        };
    }

    const detectors = getDetectors(options?.entities as EntityType[] | undefined);

    // Stage 1: Run all active detectors independently against the untouched original text
    const rawMatches: DetectedMatch[] = [];
    for (const detector of detectors) {
        rawMatches.push(...detector.detect(text));
    }

    // Stage 2: Resolve overlapping or duplicate spans using rule priority
    const resolvedMatches = resolveOverlaps(rawMatches);

    // Stage 3: Build de-identified text and count occurrences in a single pass
    return rebuildText(text, resolvedMatches);
}