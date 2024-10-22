import twilio, { Twilio } from "twilio";
import { NotificationClient } from "./base";
import { NotificationPayload, NotificationResponse } from "../types/notifications";

interface TwilioConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
}

export class TwilioClient extends NotificationClient {
    private client: Twilio | undefined;
  
    constructor(config: TwilioConfig) {
      super(config);
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
  
    validatePayload(payload: NotificationPayload): boolean {
        if (!payload.to) return false;
        if (!payload.body) return false;
        // Add phone number format validation if needed
        return true;
    }
  
    async send(payload: NotificationPayload): Promise<NotificationResponse> {
        try {
            if (!this.validatePayload(payload)) {
                throw new Error('Invalid payload');
            }
    
            const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
            const responses = await Promise.all(
                recipients.map(to =>
                    this.client!.messages.create({
                        to,
                        body: payload.body,
                        from: this.config.fromNumber,
                    })
                )
            );
    
            return {
                success: true,
                messageId: responses.map(r => r.sid).join(',')
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}