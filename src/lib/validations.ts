import Joi, { ValidationResult } from 'joi';
import { NotificationUserData } from '../types';
import { NotificationMessage } from '../types/messages';

/**
 * Validates the request payload for sending a notification.
 * 
 * @param payload - The request payload to validate.
 * @returns The validation result.
 */
export const validateSendNotificationRequest = (payload: object): ValidationResult<NotificationMessage> => {    
    const schema = Joi.object({
        metadata: Joi.object({
            messageId: Joi.string().required(),
            timestamp: Joi.number().required(),
            priority: Joi.number().optional(),
        }).required(),
        user: Joi.object({
            id: Joi.string().required()
        }).required(),
        channels: Joi.object({
            email: Joi.object({
                    subject: Joi.string().required(),
                    body: Joi.string().required()
                }).optional(),
            sms: Joi.object({
                    body: Joi.string().required()
                }).optional(),
            push: Joi.object({
                    title: Joi.string().required(),
                    body: Joi.string().required(),
                    data: Joi.object().pattern(Joi.string(), Joi.string()).required()
                }).optional()
        }).required().min(1)
    });

    return schema.validate(payload);
}

/**
 * Validates the event payload for creating user information.
 * 
 * @param payload - The event payload to validate.
 * @returns The validation result.
 */
export const validateCreateUserDataEvent = (payload: object): ValidationResult<NotificationUserData & { uid: string }> => {
    const schema = Joi.object({
        uid: Joi.string().required(),
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        deviceToken: Joi.string().optional(),
    });
    
    return schema.validate(payload);
}

/**
 * Validates the event payload for updating user information.
 * 
 * @param payload - The event payload to validate.
 * @returns The validation result.
 */
export const validateUpdateUserDataEvent = (payload: object): ValidationResult<Omit<NotificationUserData, 'whatsapp' | 'deviceToken'>> => {
    const schema = Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        phone_number: Joi.string().optional(),
        device_token: Joi.string().optional()
    });

    return schema.validate(payload);
}

/**
 * Validates the request payload for updating user information.
 * 
 * @param payload - The request payload to validate.
 * @returns The validation result.
 */
export const validateUpdateDeviceTokenRequest = (payload: object): ValidationResult<{ deviceToken: string }> => {
    const schema = Joi.object({
        deviceToken: Joi.string().optional(),
    });

    return schema.validate(payload);
}