import { DeidentifyOptions, EntityType, ValidationError } from "../types";

export interface DeidentifyRequestBody {
    text: string;
    options?: DeidentifyOptions;
}

/**
 * Validates the raw HTTP request body for POST /deidentify.
 */
export function parseDeidentifyRequest(body: unknown): DeidentifyRequestBody {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new ValidationError("Request body must be a JSON object.");
    }

    const record = body as Record<string, unknown>;

    if (typeof record.text !== "string") {
        throw new ValidationError("Field 'text' is required and must be a string.");
    }

    if (record.entities !== undefined) {
        if (!Array.isArray(record.entities)) {
            throw new ValidationError("Field 'entities' must be an array of strings.");
        }

        return {
            text: record.text,
            options: { entities: record.entities as EntityType[] },
        };
    }

    return { text: record.text };
}