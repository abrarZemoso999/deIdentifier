import express, { NextFunction, Request, Response } from "express";
import { ValidationError } from "../types";
import { createRoutes } from "./routes";

export function createApp() {
    const app = express();

    app.use(express.json());
    app.use(createRoutes());

    // Centralized error-handling middleware
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        // Handle malformed JSON bodies thrown by express.json()
        if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
            res.status(400).json({ error: "Malformed JSON in request body." });
            return;
        }

        // Handle domain & input validation errors
        if (err instanceof ValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }

        // Fallback for unexpected server errors
        console.error("Unexpected error:", err);
        res.status(500).json({ error: "Internal server error." });
    });

    return app;
}