import request from "supertest";
import { createApp } from "../../src/api/app";

describe("REST API Endpoints", () => {
    const app = createApp();

    it("GET /health returns 200 OK", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: "ok" });
    });

    it("POST /deidentify scrubs requested entities and returns counts", async () => {
        const res = await request(app)
            .post("/deidentify")
            .send({
                text: "Contact john.doe@example.com at +1-415-555-0134",
                entities: ["EMAIL", "PHONE"],
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            deidentifiedText: "Contact [EMAIL] at [PHONE]",
            entitiesDetected: {
                EMAIL: 1,
                PHONE: 1,
            },
        });
    });

    it("POST /deidentify uses all default entities when entities array is omitted", async () => {
        const res = await request(app)
            .post("/deidentify")
            .send({
                text: "IP 192.168.0.1 | SSN 123-45-6789 | DOB: 1985-04-22",
            });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            deidentifiedText: "IP [IP_ADDRESS] | SSN [SSN] | DOB: [DATE_OF_BIRTH]",
            entitiesDetected: {
                IP_ADDRESS: 1,
                SSN: 1,
                DATE_OF_BIRTH: 1,
            },
        });
    });

    it("POST /deidentify returns 400 when text is missing or not a string", async () => {
        const missingText = await request(app).post("/deidentify").send({});
        expect(missingText.status).toBe(400);
        expect(missingText.body.error).toMatch(/text/i);

        const numericText = await request(app).post("/deidentify").send({ text: 12345 });
        expect(numericText.status).toBe(400);
    });

    it("POST /deidentify returns 400 when an unsupported entity is supplied", async () => {
        const res = await request(app)
            .post("/deidentify")
            .send({
                text: "Hello world",
                entities: ["EMAIL", "PASSPORT"],
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain("PASSPORT");
    });

    it("POST /deidentify returns 400 on malformed JSON", async () => {
        const res = await request(app)
            .post("/deidentify")
            .set("Content-Type", "application/json")
            .send('{"text": "broken json"');

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/malformed json/i);
    });
});