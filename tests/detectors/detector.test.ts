import { CreditCardDetector } from "../../src/detectors/creditCard.detector";
import { DateOfBirthDetector } from "../../src/detectors/dob.detector";
import { EmailDetector } from "../../src/detectors/email.detector";
import { IpAddressDetector } from "../../src/detectors/ipAddress.detector";
import { PhoneDetector } from "../../src/detectors/phone.detector";
import { SsnDetector } from "../../src/detectors/ssn.detector";

describe("Entity Detectors", () => {
    describe("EmailDetector", () => {
        const detector = new EmailDetector();

        it("detects standard, plus-aliased, and subdomain emails", () => {
            const text =
                "Contact john.doe@example.com, jane+billing@sub.company.co.uk, or ADMIN_1@ORG.IO.";
            const matches = detector.detect(text);

            expect(matches.map((m) => m.value)).toEqual([
                "john.doe@example.com",
                "jane+billing@sub.company.co.uk",
                "ADMIN_1@ORG.IO",
            ]);
        });

        it("ignores invalid email-like strings", () => {
            const text = "Invalid: user@, @domain.com, user@domain, plain-text";
            expect(detector.detect(text)).toHaveLength(0);
        });
    });

    describe("PhoneDetector", () => {
        const detector = new PhoneDetector();

        it("detects international, parenthesized, dashed, and dotted formats", () => {
            const text =
                "Call +1-415-555-0134, (415) 555-0199, 415.555.0122, or +91 98765 43210.";
            const matches = detector.detect(text);

            expect(matches.map((m) => m.value)).toEqual([
                "+1-415-555-0134",
                "(415) 555-0199",
                "415.555.0122",
                "+91 98765 43210",
            ]);
        });

        it("ignores ordinary numbers, order IDs, and Unix timestamps", () => {
            const text = "Order ID: 8492019482 | Timestamp: 1732098123 | Tracking: 99123456789011";
            expect(detector.detect(text)).toHaveLength(0);
        });
    });

    describe("SsnDetector", () => {
        const detector = new SsnDetector();

        it("detects valid XXX-XX-XXXX Social Security numbers", () => {
            const text = "Primary SSN: 123-45-6789, Secondary: 456-78-9012.";
            const matches = detector.detect(text);

            expect(matches.map((m) => m.value)).toEqual(["123-45-6789", "456-78-9012"]);
        });

        it("rejects SSA-invalid area, group, or serial numbers", () => {
            const text = "Invalid SSNs: 000-12-3456, 666-12-3456, 901-12-3456, 123-00-4567, 123-45-0000";
            expect(detector.detect(text)).toHaveLength(0);
        });
    });

    describe("DateOfBirthDetector", () => {
        const detector = new DateOfBirthDetector();

        it("detects dates in explicit DOB contexts and captures only the date span", () => {
            const text =
                "DOB: 1990-05-12 | Date of Birth: 05/12/1990 | Birthdate: May 12, 1990";
            const matches = detector.detect(text);

            expect(matches.map((m) => m.value)).toEqual([
                "1990-05-12",
                "05/12/1990",
                "May 12, 1990",
            ]);
        });

        it("ignores non-DOB dates and does not match across line breaks", () => {
            const text = "Invoice Date: 2026-11-20\nDOB:\n1990-05-12";
            expect(detector.detect(text)).toHaveLength(0);
        });
    });

    describe("CreditCardDetector", () => {
        const detector = new CreditCardDetector();

        it("detects Luhn-valid Visa, Mastercard, and Amex numbers across formats", () => {
            const text =
                "Visa: 4532-0151-1283-0366, Continuous: 4532015112830366, Amex: 3782 822463 10005";
            const matches = detector.detect(text);

            expect(matches.map((m) => m.value)).toEqual([
                "4532-0151-1283-0366",
                "4532015112830366",
                "3782 822463 10005",
            ]);
        });

        it("rejects 16-digit numbers that fail Luhn validation or are all zeros", () => {
            const text =
                "Serial: 1234-5678-9012-3456 | Bad Checksum: 4532-0151-1283-0367 | Zeros: 0000-0000-0000-0000";
            expect(detector.detect(text)).toHaveLength(0);
        });
    });

    describe("IpAddressDetector", () => {
        const detector = new IpAddressDetector();

        it("detects valid IPv4 addresses", () => {
            const text = "Server 192.168.1.1 connected to gateway 10.0.0.255 and loopback 127.0.0.1.";
            const matches = detector.detect(text);

            expect(matches.map((m) => m.value)).toEqual([
                "192.168.1.1",
                "10.0.0.255",
                "127.0.0.1",
            ]);
        });

        it("rejects out-of-range octets, leading zeros, and version strings", () => {
            const text = "Bad IP: 999.888.777.666 | Leading zero: 192.168.01.1 | Version: v1.2.3.4";
            expect(detector.detect(text)).toHaveLength(0);
        });
    });
});