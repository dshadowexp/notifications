import { logger } from "../lib/utils";
import { NotificationPayload, NotificationResponse } from "../types/notifications";

export abstract class NotificationProvider {
    protected constructor(protected readonly config: Record<string, any>) {}
  
    abstract send(payload: NotificationPayload): Promise<NotificationResponse>;
    abstract initialize(): Promise<void>;
    abstract validatePayload(payload: NotificationPayload): boolean;
  
    protected handleError(error: any): NotificationResponse {
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
}