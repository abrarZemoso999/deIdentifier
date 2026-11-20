/**
 * Single source of truth for all supported PII entity types.
 */
export const SUPPORTED_ENTITIES = [
    "EMAIL",
    "PHONE",
    "SSN",
    "DATE_OF_BIRTH",
    "CREDIT_CARD",
    "IP_ADDRESS",
] as const;

export type EntityType = (typeof SUPPORTED_ENTITIES)[number];

/**
 * Represents a single detected PII occurrence in the original text.
 * `start` and `end` are UTF-16 code unit indices compatible with String.prototype.slice().
 */
export interface DetectedMatch {
    entityType: EntityType;
    start: number;
    end: number;
    value: string;
    priority: number;
}

/**
 * Contract that every entity detector must implement.
 * Makes the engine easy to extend with new rules without touching replacement logic.
 */
export interface EntityDetector {
    readonly type: EntityType;
    readonly priority: number;
    detect(text: string): DetectedMatch[];
}

/**
 * Optional configuration passed to the core deidentify() function.
 */
export interface DeidentifyOptions {
    entities?: EntityType[];
}

/**
 * Output returned by both the core library function and the REST endpoint.
 */
export interface DeidentifyResult {
    deidentifiedText: string;
    entitiesDetected: Partial<Record<EntityType, number>>;
}

/**
 * Domain error thrown when caller input fails validation (maps to HTTP 400).
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}