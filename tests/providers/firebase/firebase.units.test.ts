import admin from 'firebase-admin';
import { FirebaseMessagingProvider } from "../../../src/providers/firebase";
import { NotificationPayload } from '../../../src/types/notifications';

jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn(),
    },
    messaging: jest.fn(),
}));

describe('FirebaseMessagingProvider - Unit Tests', () => {
    let firebaseProvider: FirebaseMessagingProvider;

    const mockMessaging = {
        send: jest.fn(),
        sendEachForMulticast: jest.fn(),
    };

    const mockConfig = {
        projectId: 'test-project',
        clientEmail: 'test@test.com',
        privateKey: 'test-key'
    };
  
    beforeEach(async () => {
        jest.clearAllMocks();
        (admin.initializeApp as jest.Mock).mockReturnValue({
            messaging: () => mockMessaging
        });

        firebaseProvider = new FirebaseMessagingProvider(mockConfig);
        await firebaseProvider.initialize();
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    describe('initialize', () => {
        it('should initialize Firebase app successfully', async () => {
            await firebaseProvider.initialize();
          
            expect(admin.credential.cert).toHaveBeenCalledWith(mockConfig);
            expect(admin.initializeApp).toHaveBeenCalledWith({
                credential: undefined,
            });
        });
    
        it('should throw error when initialization fails', async () => {
            const error = new Error('Init failed');
            (admin.initializeApp as jest.Mock).mockImplementation(() => {
                throw error;
            });
        
            await expect(firebaseProvider.initialize()).rejects.toThrow('Failed to initialize Firebase');
        });
    });

    describe('validatePayload', () => {
        it('should return true for valid payload', () => {
            const payload: NotificationPayload = {
                to: 'device-token',
                title: 'Test Title',
                body: 'Test Body',
                data: { key: 'value' }
            };
        
            expect(firebaseProvider.validatePayload(payload)).toBe(true);
        });
    
        it('should return false when "to" is missing', () => {
            const payload = {
                title: 'Test Title',
                body: 'Test Body'
            } as NotificationPayload;
        
            expect(firebaseProvider.validatePayload(payload)).toBe(false);
        });
    
        it('should return false when "body" is missing', () => {
            const payload = {
                to: 'device-token',
                title: 'Test Title'
            } as NotificationPayload;
        
            expect(firebaseProvider.validatePayload(payload)).toBe(false);
        });
    });

    describe('send', () => {
        const validPayload: NotificationPayload = {
            to: 'device-token',
            title: 'Test Title',
            body: 'Test Body',
            data: { key: 'value' }
        };

        beforeEach(async () => {
            await firebaseProvider.initialize();
        });
    
        it('should send message to single device successfully', async () => {
            const messageId = 'test-message-id';
            mockMessaging.send.mockResolvedValue(messageId);
        
            const result = await firebaseProvider.send(validPayload);
        
            expect(result).toEqual({
                success: true,
                messageId
            });
            expect(mockMessaging.send).toHaveBeenCalledWith({
                notification: {
                    title: validPayload.title,
                    body: validPayload.body,
                },
                data: validPayload.data,
                android: {
                    priority: 'high',
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
                token: validPayload.to
            });
        });
    
        it('should send message to multiple devices successfully', async () => {
            const multicastPayload = {
                ...validPayload,
                to: ['device-1', 'device-2']
            };
        
            const mockResponse = {
                responses: [
                    { messageId: 'msg-1', success: true },
                    { messageId: 'msg-2', success: true }
                ]
            };

            mockMessaging.sendEachForMulticast.mockResolvedValue(mockResponse);
        
            const result = await firebaseProvider.send(multicastPayload);
        
            expect(result).toEqual({
                success: true,
                messageId: 'msg-1,msg-2'
            });
            expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith({
                notification: {
                    title: multicastPayload.title,
                    body: multicastPayload.body,
                },
                data: multicastPayload.data,
                android: {
                    priority: 'high',
                },
                apns: {
                    payload: {
                        aps: {
                        sound: 'default',
                        },
                    },
                },
                tokens: multicastPayload.to
            });
        });
    
        it('should handle invalid payload', async () => {
            const invalidPayload = {
                title: 'Test Title'
            } as NotificationPayload;
        
            const result = await firebaseProvider.send(invalidPayload);
        
            expect(result.success).toBe(false);
            expect(mockMessaging.send).not.toHaveBeenCalled();
            expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
        });
    
        it('should handle messaging error', async () => {
            const error = new Error('Sending failed');
            mockMessaging.send.mockRejectedValue(error);
        
            const result = await firebaseProvider.send(validPayload);
        
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});