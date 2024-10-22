import { Application, Router } from "express";
import { sendNotification, updateDeviceToken } from "./controllers";
import { asyncHandler, authenticate, authorize } from "@tuller/lib";
import { verifyJWT } from "../lib/utils";

const notificationRouter = Router();

notificationRouter
    .patch('/data/:id', authenticate(verifyJWT), asyncHandler(updateDeviceToken))
    .post('/send', authenticate(verifyJWT), authorize(['admin']), asyncHandler(sendNotification));

export function initializeRoutes (app: Application) {
    app.use('/', notificationRouter);
}
