import { createTransport, Transporter } from "nodemailer";
import { NotificationClient } from "./base";
import { NotificationPayload, NotificationResponse } from "../types/notifications";

interface GmailConfig {
    service: string, 
    host: string, 
    user: string, 
    password: string,
}

export class MailerClient extends NotificationClient {
    private transporter: Transporter | undefined;

    constructor(config: GmailConfig) {
        super(config);
    }

    async initialize(): Promise<void> {
        try {
            this.transporter = createTransport({
                service: this.config.service, 
                host: this.config.host, 
                port: 465,
                secure: true,
                auth: {
                    user: this.config.user, 
                    pass: this.config.password,
                },
            });
        } catch (error) {
            throw new Error(`Failed to initialize Mailer client: ${error}`);
        }
    }

    validatePayload(payload: NotificationPayload): boolean {
        if (!payload.to) return false;
        // Add phone number validation
        if (!payload.title) return false;
        if (!payload.body) return false;
        return true;
    }

    async send(payload: NotificationPayload): Promise<NotificationResponse> {
        try {
            if (!this.validatePayload(payload)) {
                throw new Error('Invalid payload');
            }

            const mailOptions = {
                from: this.config.email,
                to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
                subject: payload.title,
                html: payload.body,
            };

            const info = await this.transporter!.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}