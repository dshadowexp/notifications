export interface NotificationPayload {
    to: string | string[];
    title?: string;
    body: string;
    data?: Record<string, any>;
}

export interface NotificationResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface QueueJobData {
    payload: NotificationPayload;
    metadata?: {
        messageId: string;
        userId: string;
        timestamp?: number;
        priority?: number;
    };
}

export interface NotificationUserData {
    uid: string;
    name: string;
    email: string;
    phone_number: string;
    device_token: string;
}