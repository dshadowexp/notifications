import { NotificationProvider } from "./base";
import { createTransport, Transporter } from "nodemailer";
import { NotificationPayload, NotificationResponse } from "../types/notifications";

interface TransportConfig {
    service?: string, 
    host: string, 
    port?: number,
    secure?: boolean,
    requireTLS?: boolean,
    auth?: {
        user: string, 
        pass: string,
    },
    tls?: {
        rejectUnauthorized: boolean
    }
}

interface SenderDetails {
    name?: string,
    address: string, 
}

export interface MailerConfig {
    sender: SenderDetails,
    transportOptions: TransportConfig,
}

export class MailerProvider extends NotificationProvider {
    private transporter: Transporter | undefined;

    constructor(config: MailerConfig) {
        super(config);
    }

    async initialize(): Promise<void> {
        try {
            this.transporter = createTransport(this.config.transportOptions);
        } catch (error) {
            throw new Error(`Failed to initialize Mailer client: ${error}`);
        }
    }

    validatePayload(payload: NotificationPayload): boolean {
        if (!payload.to) return false;
        // Add email validation
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
                from: this.config.sender,
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