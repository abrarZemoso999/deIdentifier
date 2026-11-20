import { deidentify } from "../../src/core/deidentifier";
import { ValidationError } from "../../src/types";

describe("Core deidentify() Engine", () => {
    it("matches the exact specification example (leaving person names untouched)", () => {
        const input =
            "Patient John Doe can be contacted at john.doe@example.com or +1-415-555-0134. DOB: 1990-05-12.";
        const result = deidentify(input);

        expect(result).toEqual({
            deidentifiedText:
                "Patient John Doe can be contacted at [EMAIL] or [PHONE]. DOB: [DATE_OF_BIRTH].",
            entitiesDetected: {
                EMAIL: 1,
                PHONE: 1,
                DATE_OF_BIRTH: 1,
            },
        });
    });

    it("handles multiple occurrences of the same entity and counts accurately", () => {
        const input =
            "Email support@company.com or sales@company.com, or re-send to support@company.com.";
        const result = deidentify(input);

        expect(result).toEqual({
            deidentifiedText: "Email [EMAIL] or [EMAIL], or re-send to [EMAIL].",
            entitiesDetected: {
                EMAIL: 3,
            },
        });
    });

    it("resolves overlapping rules by priority without duplicate replacements", () => {
        const input = "SSN: 123-45-6789 | Card: 4532-0151-1283-0366 | Phone: +1-415-555-0134";
        const result = deidentify(input);

        expect(result).toEqual({
            deidentifiedText: "SSN: [SSN] | Card: [CREDIT_CARD] | Phone: [PHONE]",
            entitiesDetected: {
                SSN: 1,
                CREDIT_CARD: 1,
                PHONE: 1,
            },
        });
    });

    it("filters detection when specific entities are requested", () => {
        const input = "Email john@example.com, phone +1-415-555-0134, IP 10.0.0.5";
        const result = deidentify(input, { entities: ["EMAIL", "IP_ADDRESS"] });

        expect(result).toEqual({
            deidentifiedText: "Email [EMAIL], phone +1-415-555-0134, IP [IP_ADDRESS]",
            entitiesDetected: {
                EMAIL: 1,
                IP_ADDRESS: 1,
            },
        });
    });

    it("preserves punctuation, line breaks, and multi-byte Unicode/emojis cleanly", () => {
        const input =
            "Patient José García 👨‍⚕️\nEmail: jose@example.com,\r\nPhone: (415) 555-0134!\nNotes: All good 🌟";
        const result = deidentify(input);

        expect(result).toEqual({
            deidentifiedText:
                "Patient José García 👨‍⚕️\nEmail: [EMAIL],\r\nPhone: [PHONE]!\nNotes: All good 🌟",
            entitiesDetected: {
                EMAIL: 1,
                PHONE: 1,
            },
        });
    });

    it("returns empty string and empty counts when input text is empty", () => {
        expect(deidentify("")).toEqual({
            deidentifiedText: "",
            entitiesDetected: {},
        });
    });

    it("throws ValidationError for non-string text or unsupported entity types", () => {
        expect(() => deidentify(null as unknown as string)).toThrow(ValidationError);
        expect(() =>
            deidentify("hello", { entities: ["UNKNOWN_TYPE" as never] })
        ).toThrow(ValidationError);
    });
});