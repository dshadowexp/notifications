export interface MessageMetadata {
    messageId: string;
    timestamp: number;
    priority?: number;
}

export interface NativeMessageUser {
    id: string
}

export interface ForeignMessageUser {
    name?: string,
    email?: string, 
    phone_number?: string, 
    whatsapp?: string
}

export interface MessageUser {
    native?: NativeMessageUser,
    foreign?: ForeignMessageUser
}

export interface EmailMessage {
    subject: string;
    body: string;
}
  
export interface SMSMessage {
    body: string;
}

export interface WhatsappMessage {
    body: string;
}
  
export interface PushMessage {
    title: string;
    body: string;
    data: Record<string, string>;
}

export interface WhatsAppMessage {
    body: string;
}

export interface NotificationMessage {
    metadata: MessageMetadata;
    user: MessageUser;
    channels: {
        email?: EmailMessage;
        sms?: SMSMessage;
        push?: PushMessage;
        whatsapp?: WhatsAppMessage
    };
}
