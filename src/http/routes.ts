import { Application, Router } from "express";
import { asyncHandler, authenticate, verifyJWT } from "@tuller/lib";
import { metricsEndPoint, sendNotification, updateDeviceToken } from "./controllers";

import config from "../config";

const notificationRouter = Router();

notificationRouter
    .patch('/device_token', authenticate(verifyJWT(config.GATEWAY_JWT_SECRET)), asyncHandler(updateDeviceToken))
    .post('/send', authenticate(verifyJWT(config.GATEWAY_JWT_SECRET)), asyncHandler(sendNotification));

export function initializeRoutes (app: Application) {
    app.use('/', notificationRouter);
    app.use('/metrics', metricsEndPoint)
}
