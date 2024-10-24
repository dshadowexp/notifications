class Config {
    public NODE_ENV: string;
    public APP_ID: string;
    public API_PORT: number;
    public GATEWAY_URL: string;
    public GATEWAY_JWT_SECRET: string;
    public ELASTIC_SEARCH_URL: string;
    public KAFKA_BROKER: string;
    public MAILER_SERVICE: string;
    public MAILER_HOST: string;
    public MAILER_PORT: string;
    public MAILER_USER: string;
    public MAILER_PASSWORD: string;
    public MAILER_NAME: string;
    public FIREBASE_PROJECT_ID: string;
    public FIREBASE_CLIENT_EMAIL: string;
    public FIREBASE_PRIVATE_KEY: string;
    public TWILIO_ACCOUNT_SID: string;
    public TWILIO_AUTH_TOKEN: string;
    public TWILIO_PHONE_NUMBER: string;
    public TWILIO_WHATSAPP_NUMBER: string;
    public REDIS_DB_URI: string;
    public REDIS_DB_PORT: number;
    public REDIS_DB_PASSWORD: string;
    public REDIS_QUEUE_URI: string;
    public REDIS_QUEUE_PORT: number;
    public REDIS_QUEUE_PASSWORD: string;
    public EMAILQUEUENAME: string;
    public PUSHQUEUENAME: string;
    public SMSQUEUENAME: string;
    public WHATSAPPQUEUENAME: string;

    constructor() {
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.APP_ID = process.env.APP_ID || '';
        this.API_PORT = parseInt(process.env.API_PORT || '');
        this.GATEWAY_URL = process.env.GATEWAY_URL || '';
        this.GATEWAY_JWT_SECRET = process.env.GATEWAY_JWT_SECRET || '';
        this.KAFKA_BROKER = process.env.KAFKA_BROKER || '';
        this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
        this.MAILER_SERVICE = process.env.MAILER_SERVICE || '';
        this.MAILER_HOST = process.env.MAILER_HOST || '';
        this.MAILER_PORT = process.env.MAILER_PORT || '';
        this.MAILER_USER = process.env.MAILER_USER || '';
        this.MAILER_PASSWORD = process.env.MAILER_PASSWORD || '';
        this.MAILER_NAME = process.env.MAILER_NAME || '';
        this.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';
        this.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || '';
        this.FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n') || '';
        this.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
        this.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
        this.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
        this.TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '';
        this.REDIS_DB_URI = process.env.REDIS_DB_URI || '';
        this.REDIS_DB_PORT = parseInt(process.env.REDIS_DB_PORT || '');
        this.REDIS_DB_PASSWORD = process.env.REDIS_DB_PASSWORD || '';
        this.REDIS_QUEUE_URI = process.env.REDIS_QUEUE_URI || '';
        this.REDIS_QUEUE_PORT = parseInt(process.env.REDIS_QUEUE_PORT || '');
        this.REDIS_QUEUE_PASSWORD = process.env.REDIS_QUEUE_PASSWORD || '';
        this.EMAILQUEUENAME = process.env.NOTQUEUENAME || '';
        this.PUSHQUEUENAME = process.env.PUSHQUEUENAME || '';
        this.SMSQUEUENAME = process.env.SMSQUEUENAME || '';
        this.WHATSAPPQUEUENAME = process.env.WHATSAPPQUEUENAME || '';
    }
}

const config: Config = new Config();

export default config;

export const redisConnectionOptions = { 
    port: config.REDIS_DB_PORT, // Redis port
    host: config.REDIS_DB_URI,
    password: config.REDIS_DB_PASSWORD,
};
export const mailerOptions = {
    sender: {
        name: config.MAILER_NAME,
        address: config.MAILER_USER
    },
    transportOptions: {
        service: config.MAILER_SERVICE, 
        host: config.MAILER_HOST, 
        auth: {
            user: config.MAILER_USER, 
            pass: config.MAILER_PASSWORD,
        }
    }
};
export const firebaseOptions = {
    projectId: config.FIREBASE_PROJECT_ID,
    clientEmail: config.FIREBASE_CLIENT_EMAIL,
    privateKey: config.FIREBASE_PRIVATE_KEY
};
export const twilioOptions = {
    accountSid: config.TWILIO_ACCOUNT_SID,
    authToken: config.TWILIO_AUTH_TOKEN,
    fromNumber: config.TWILIO_PHONE_NUMBER,
}

export enum KafkaTopics {
    // producing topics
    SEND_NOTIFICATION = 'send-notification',

    // consuming topics
    CREATE_USER_NOTIFICATION_DATA = 'create-user-notification-data',
    UPDATE_USER_NOTIFICATION_DATA = 'update-user-notification-data'
}