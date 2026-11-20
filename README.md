# Rule-Based Text De-identification Service

A lightweight, self-contained Node.js and TypeScript service that detects and masks Personally Identifiable Information (PII) in free-form text using regular expressions and deterministic validation rules—with zero external API calls, cloud dependencies, or third-party PII libraries.

---

## Features

- **100% Local & Privacy-First:** Input text never leaves the process.
- **6 Built-in Entity Detectors:** `EMAIL`, `PHONE`, `SSN`, `DATE_OF_BIRTH`, `CREDIT_CARD`, and `IP_ADDRESS`.
- **Two-Stage Detection & Validation:** Pairs regular expressions with domain/mathematical checks (Luhn checksum, IPv4 octet bounds, SSA SSN allocation rules) to minimize false positives.
- **Clean Separation of Concerns:** Detection (`src/detectors`), conflict resolution (`src/core/resolver.ts`), and single-pass text reconstruction (`src/core/rebuilder.ts`) are fully decoupled.
- **Dual Usage:** Import `deidentify()` directly as a TypeScript/JavaScript library function or run it as an Express REST API (`POST /deidentify`).

---

## Project Structure

```text
pii-deidentifier/
├── src/
│   ├── types/          # Shared TypeScript interfaces, entity constants, and error types
│   ├── validators/     # Secondary validators (Luhn checksum, IPv4 bounds, SSN rules)
│   ├── detectors/      # Individual entity detectors and Rule Registry
│   ├── core/           # Overlap resolver, single-pass text rebuilder, and main orchestrator
│   ├── api/            # Express app, request validation, routes, and error middleware
│   ├── index.ts        # Public library entry point
│   └── server.ts       # HTTP server entry point
├── tests/              # Jest unit and Supertest integration test suites
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## Setup & Running Instructions

### Prerequisites
- Node.js `v18+`
- npm `v9+`

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (with hot reload)
```bash
npm run dev
```
The server starts at `http://localhost:3000` (configurable via the `PORT` environment variable).

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build & Run for Production
```bash
npm run build
npm start
```

---

## Usage Examples

### REST API (`POST /deidentify`)

**Request:**
```bash
curl -X POST http://localhost:3000/deidentify \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient John Doe can be contacted at john.doe@example.com or +1-415-555-0134. DOB: 1990-05-12.",
    "entities": ["EMAIL", "PHONE", "DATE_OF_BIRTH"]
  }'
```

**Response (`200 OK`):**
```json
{
  "deidentifiedText": "Patient John Doe can be contacted at [EMAIL] or [PHONE]. DOB: [DATE_OF_BIRTH].",
  "entitiesDetected": {
    "EMAIL": 1,
    "PHONE": 1,
    "DATE_OF_BIRTH": 1
  }
}
```

#### Default Entity Behavior
If the `entities` field is omitted from the request body, the service defaults to scanning for **all 6 supported entity types**:
`["EMAIL", "PHONE", "SSN", "DATE_OF_BIRTH", "CREDIT_CARD", "IP_ADDRESS"]`.

If an unsupported entity type is supplied (e.g., `["PASSPORT"]`), the API fails fast with `400 Bad Request` to avoid giving callers a false sense of security that unsupported fields were scrubbed.

---

### Programmatic Library Usage

```typescript
import { deidentify } from "./src";

const result = deidentify(
  "Server 192.168.1.1 reported user admin@example.com (SSN: 123-45-6789).",
  { entities: ["EMAIL", "SSN", "IP_ADDRESS"] }
);

console.log(result.deidentifiedText);
// -> "Server [IP_ADDRESS] reported user [EMAIL] (SSN: [SSN])."

console.log(result.entitiesDetected);
// -> { IP_ADDRESS: 1, EMAIL: 1, SSN: 1 }
```

---

## Supported Entities, Rules & Known Limitations

| Entity Type | Priority | Detection Rule & Secondary Validation | Known Limitations |
| :--- | :---: | :--- | :--- |
| **`SSN`** | `100` | Matches `XXX-XX-XXXX` and validates against US Social Security Administration rules (rejects area `000`, `666`, `900–999`, group `00`, and serial `0000`). | Only detects hyphenated `XXX-XX-XXXX` format per specification; unformatted 9-digit strings (`123456789`) or space-separated SSNs are intentionally ignored to avoid colliding with ordinary numbers. |
| **`CREDIT_CARD`** | `90` | Matches 13–19 digit sequences (continuous, space-separated, or hyphen-separated) and verifies the **Luhn (mod-10) checksum**, rejecting all-zero sequences. | Any non-card 13–19 digit identifier that happens to satisfy the Luhn checksum will be flagged; card numbers split across line breaks are not matched. |
| **`EMAIL`** | `80` | Matches standard `local@domain.tld` addresses with subdomains, dots, underscores, hyphens, and `+` tags while preserving trailing sentence punctuation. | Does not cover rarely used RFC 5322 edge cases such as quoted local parts (`"john doe"@example.com`), IP-literal domains (`user@[127.0.0.1]`), or emails glued without whitespace directly to a `+` token. |
| **`DATE_OF_BIRTH`** | `70` | Context-anchored regex requiring an explicit prefix (`DOB:`, `Date of Birth:`, `Birthdate:`, `Birth Date:`) followed by `YYYY-MM-DD`, `MM/DD/YYYY`, `DD-MM-YYYY`, or `Month DD, YYYY`. Captures and masks **only** the date value, preserving the label. | Dates without an explicit DOB keyword (e.g., `"Born on 1990-05-12"`) or spelled-out ordinal dates (`"12th of May 1990"`) are not matched. Does not validate calendar leap-year bounds (e.g., `Feb 30`). |
| **`IP_ADDRESS`** | `60` | Matches dotted-quad IPv4 patterns while excluding version prefixes (`v1.2.3.4`), and validates that all 4 octets are integers in `0–255` without leading zeros. | Supports IPv4 only (IPv6 addresses are not detected). Unprefixed 4-part software version numbers whose segments all fall within `0–255` (e.g., `1.2.3.4`) will match as IPv4 addresses. |
| **`PHONE`** | `50` | Matches international `+` country codes (`+1-415-555-0134`, `+91 98765 43210`), parenthesized area codes (`(415) 555-0134`), and grouped `3-3-4` formats (`415-555-0134`, `415.555.0134`), enforcing `8–15` total digits (ITU-T E.164). | Bare unformatted 10-digit strings (`4155550134`) and short local 7-digit numbers (`555-0134`) are excluded to prevent false positives on order IDs, tracking numbers, and Unix timestamps. |

*Note on Person Names:* Free-form person names (e.g., `John Doe`) are intentionally excluded from the core detectors because regex alone cannot reliably distinguish names from capitalized nouns or places without high false-positive rates.

---

## Design Decisions, Trade-Offs & Future Improvements

### Key Design Decisions & Trade-Offs
1. **3-Stage Immutable Pipeline (`Detect` $\rightarrow$ `Resolve` $\rightarrow$ `Rebuild`):**
   - Rather than chaining sequential `.replace()` calls on intermediate strings (which shifts character indices and risks re-matching inserted `[PLACEHOLDER]` tags), all active detectors scan the **original untouched text** to produce `{ start, end, entityType, priority }` spans.
   - **Trade-off:** Requires storing match spans in memory before rebuilding the output, which is negligible for typical text payloads and guarantees deterministic, corruption-free replacements—even around multi-byte Unicode characters and emojis.
2. **Priority-Based Overlap Resolution:**
   - Numeric identifiers frequently share character patterns (e.g., an SSN `123-45-6789` or a slice of a credit card can resemble a phone number). Assigning explicit priority ranks (`SSN > CREDIT_CARD > EMAIL > DATE_OF_BIRTH > IP_ADDRESS > PHONE`) ensures high-specificity patterns claim their spans first.
3. **Precision Over Recall for Unformatted Numbers:**
   - For `PHONE` and `SSN`, requiring delimiters or country prefixes avoids corrupting order IDs, timestamps, and serial numbers in downstream AI datasets, trading off detection of unformatted digit blobs.
4. **Fail-Fast Validation (`400 Bad Request`):**
   - Passing an unknown entity type returns `400 Bad Request` rather than silently ignoring it, ensuring callers never mistakenly assume unsupported PII categories were sanitized.

### Potential Improvements
- **Context-Anchored Name Detection:** Add an optional rule matching capitalized name tokens immediately following explicit labels such as `Patient Name:` or `Full Name:`.
- **Batch Processing Endpoint:** Add `POST /deidentify/batch` accepting an array of strings and reusing the core `deidentify()` function.
- **Externalized Rule Configuration:** Allow callers to register custom regex detectors (with custom priorities and placeholder labels) via configuration without modifying core engine files.
- **Streaming Support:** For multi-megabyte log files, process text in overlapping line chunks to bound memory usage.