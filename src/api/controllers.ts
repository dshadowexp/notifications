import { Request, Response } from "express";
import { 
    validateSendNotificationRequest, 
    validateUpdateDeviceTokenRequest
} from "../lib/validations";
import { UserDataRepository } from "../repository/userData";
import { KafkaClient, KafkaProducer } from "@tuller/lib";
import { KafkaTopics } from "../config";

const userDataRepository = new UserDataRepository();

/**
 * Sends a notification to a specific user.
 * 
 * @param req - Express Request object containing the notification details.
 * @param res - Express Response object used to send the response.
 * @returns A Promise resolving to the Response object.
 */
export const sendNotification = async (req: Request, res: Response): Promise<Response> => {
    // Validate the request body
    const { error, value } = validateSendNotificationRequest(req.body);
    if (error) {
        // If validation fails, return a 400 Bad Request response
        return res.status(400).send({ message: error.details[0].message });
    }

    // Produce the message to the Kafka
    const kafkaProducer = new KafkaProducer(KafkaClient.getInstance().client);
    await kafkaProducer.sendMessage(KafkaTopics.SEND_NOTIFICATION, value);

    // Return a 201 Created response with a success message
    return res.status(201).send({ success: true, message: `notification queued` });
}

/**
 * Updates the user information for a specific user.
 * Only the fields whatsapp and deviceToken can be updated.
 * 
 * @param req - Express Request object containing the user ID and the user information.
 * @param res - Express Response object used to send the response.
 * @returns A Promise resolving to the Response object.
 */
export const updateDeviceToken = async (req: Request, res: Response): Promise<Response> => {
    const { uid } = req.user;
    
    // Validate the request body
    const { error, value } = validateUpdateDeviceTokenRequest(req.body);
    if (error) {
        // If validation fails, return a 400 Bad Request response
        return res.status(400).send({ message: error.details[0].message });
    }

    // Extract the whatsapp and deviceToken from the validated request body
    const { deviceToken } = value;
    await userDataRepository.updateByUid(uid, { device_token: deviceToken });

    // Return a 200 OK response with a success message
    return res.status(200).send({ success: true, message: 'user info updated' });
}   