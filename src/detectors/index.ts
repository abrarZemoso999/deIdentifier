import { EntityDetector, EntityType, SUPPORTED_ENTITIES } from "../types";
import { CreditCardDetector } from "./creditCard.detector";
import { DateOfBirthDetector } from "./dob.detector";
import { EmailDetector } from "./email.detector";
import { IpAddressDetector } from "./ipAddress.detector";
import { PhoneDetector } from "./phone.detector";
import { SsnDetector } from "./ssn.detector";

const DETECTOR_REGISTRY: Record<EntityType, EntityDetector> = {
    EMAIL: new EmailDetector(),
    PHONE: new PhoneDetector(),
    SSN: new SsnDetector(),
    DATE_OF_BIRTH: new DateOfBirthDetector(),
    CREDIT_CARD: new CreditCardDetector(),
    IP_ADDRESS: new IpAddressDetector(),
};

/**
 * Sensible default when caller omits the `entities` parameter:
 * scan and de-identify all supported PII types.
 */
export const DEFAULT_ENTITIES: readonly EntityType[] = SUPPORTED_ENTITIES;

/**
 * Returns the active detector instances for the requested entity types.
 * Deduplicates entity types in case the caller passes duplicates like ["EMAIL", "EMAIL"].
 */
export function getDetectors(entities?: readonly EntityType[]): EntityDetector[] {
    const targetEntities = entities ?? DEFAULT_ENTITIES;
    const uniqueEntities = Array.from(new Set(targetEntities));

    return uniqueEntities.map((entity) => DETECTOR_REGISTRY[entity]);
}