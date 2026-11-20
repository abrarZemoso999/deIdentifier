import { NextFunction, Request, Response, Router } from "express";
import { deidentify } from "../core/deidentifier";
import { parseDeidentifyRequest } from "./validator";

export function createRoutes(): Router {
    const router = Router();

    router.get("/health", (_req: Request, res: Response) => {
        res.status(200).json({ status: "ok" });
    });

    router.post("/deidentify", (req: Request, res: Response, next: NextFunction) => {
        try {
            const { text, options } = parseDeidentifyRequest(req.body);
            const result = deidentify(text, options);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    });

    return router;
}