import { NotificationPayload, NotificationResponse } from "../types/notifications";

export abstract class NotificationProvider {
    protected constructor(public providerName: string, protected readonly config: Record<string, any>) {}

    get name(): string {
        return this.providerName;
    }
  
    abstract send(payload: NotificationPayload): Promise<NotificationResponse>;
    abstract initialize(): Promise<void>;
    abstract validatePayload(payload: NotificationPayload): void;
  
    protected handleError(error: any): NotificationResponse {
        // Log detailed error
        // Maybe retry error
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
}