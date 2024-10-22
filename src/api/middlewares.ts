import config from "../config";
import cors from "cors";
import { Application, json, urlencoded } from 'express';
import { initializeRoutes } from './routes';
import { error, notFound } from "@tuller/lib";

/**
 * Configures security middleware for the Express application.
 * 
 * @param app - The Express application instance.
 */
export function securityMiddleware(app: Application) {
    app.use(cors({ 
        origin: [config.GATEWAY_URL], 
        credentials: true, 
        methods: ['GET', 'PUT', 'POST', 'OPTIONS'] 
    }));
}

/**
 * Configures standard middleware for the Express application.
 * 
 * @param app - The Express application instance.
 */
export function standardMiddleware(app: Application) {
    app.use(json({ limit: '200mb'}));
    app.use(urlencoded({ extended: true, limit: '200mb' }));
}

/**
 * Configures error handling middleware for the Express application.
 * 
 * @param app - The Express application instance.
 */
export function errorsMiddleware(app: Application) {
    app.use(notFound);
    app.use(error);
}
