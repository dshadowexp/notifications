import twilio, { Twilio } from "twilio";
import { NotificationProvider } from "./base";
import { NotificationPayload, NotificationResponse } from "../types/notifications";
import { NotificationError, ValidationError } from "../lib/errors";
import { validateTwilioPayload } from "../validations/providers";

export interface TwilioConfig {
    accountSid: string;
    authToken: string;
    smsFromNumber?: string;
    whatsappFromNumber?: string
}

export class TwilioProvider extends NotificationProvider {
    private client: Twilio | undefined;
  
    constructor(config: TwilioConfig) {
      super('twilio', config);
    }
  
    async initialize(): Promise<void> {
        try {
            this.client = twilio(
                this.config.accountSid, 
                this.config.authToken
            );
        } catch (error) {
            throw new Error(`Failed to initialize Twilio client: ${error}`);
        }
    }
  
    validatePayload(payload: NotificationPayload) {
        const { error } = validateTwilioPayload(payload);

        if (error) {
            throw new ValidationError(error.details[0].message);
        }
    }
  
    async send(payload: NotificationPayload): Promise<NotificationResponse> {
        try {
            this.validatePayload(payload);
    
            const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
            const responses = await Promise.all(
                recipients.map(to => this.client!.messages.create({
                    to,
                    body: payload.body,
                    from: to.startsWith('whatsapp') ? this.config.whatsappFromNumber : this.config.smsFromNumber,
                }))
            );
    
            return {
                success: true,
                messageId: responses.map(r => r.sid).join(',')
            };
        } catch (error: any) {
            return this.handleError(error);
        }
    }
}