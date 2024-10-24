import { TwilioProvider } from '../../../src/providers/twilio';
import { NotificationPayload } from '../../../src/types/notifications';
import twilio, { Twilio } from 'twilio';

// Mock twilio
// Create proper mock type
type MockTwilio = {
    messages: {
        create: jest.Mock;
    };
};
  
  // Mock the twilio module
jest.mock('twilio', () => {
    // Mock constructor function
    const mockTwilioConstructor = jest.fn(() => ({
        messages: {
            create: jest.fn()
        }
    }));
    
    return {
        __esModule: true,
        default: mockTwilioConstructor
    };
});

describe('TwilioProvider', () => {
    let provider: TwilioProvider;
    let mockTwilioClient: MockTwilio;

    const mockConfig = {
        accountSid: 'test-account-sid',
        authToken: 'test-auth-token',
        fromNumber: '+1234567890'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create new mock client for each test
        mockTwilioClient = {
            messages: {
                create: jest.fn()
            }
        };
        
        // Cast the mock constructor to any to avoid type errors
        (twilio as unknown as jest.Mock).mockImplementation(() => mockTwilioClient);
        
        provider = new TwilioProvider(mockConfig);
    });

    describe('initialize', () => {
        it('should initialize Twilio client successfully', async () => {
            await provider.initialize();
            
            expect(twilio).toHaveBeenCalledWith(
                mockConfig.accountSid,
                mockConfig.authToken
            );
        });
    
        it('should throw error when initialization fails', async () => {
            (twilio as unknown as jest.Mock).mockImplementation(() => {
                throw new Error('Init failed');
            });
        
            await expect(provider.initialize()).rejects.toThrow('Failed to initialize Twilio client');
        });
    });

    describe('validatePayload', () => {
        it('should return true for valid payload', () => {
            const payload: NotificationPayload = {
                to: '+1234567890',
                body: 'Test message'
            };

            expect(provider.validatePayload(payload)).toBe(true);
        });

        it('should return false when "to" is missing', () => {
            const payload = {
                body: 'Test message'
            } as NotificationPayload;

            expect(provider.validatePayload(payload)).toBe(false);
        });

        it('should return false when "body" is missing', () => {
            const payload = {
                to: '+1234567890'
            } as NotificationPayload;

            expect(provider.validatePayload(payload)).toBe(false);
        });
    });

    describe('send', () => {
        const validPayload: NotificationPayload = {
            to: '+1234567890',
            body: 'Test message'
        };

        beforeEach(async () => {
            await provider.initialize();
        });

        it('should send message to single recipient successfully', async () => {
            const mockMessageResponse = { sid: 'MSG123' };
            mockTwilioClient.messages.create.mockResolvedValue(mockMessageResponse);

            const result = await provider.send(validPayload);

            expect(result).toEqual({
                success: true,
                messageId: 'MSG123'
            });
            expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
                to: validPayload.to,
                body: validPayload.body,
                from: mockConfig.fromNumber
            });
        });

        it('should send messages to multiple recipients successfully', async () => {
            const multipleRecipients = {
                to: ['+1234567890', '+0987654321'],
                body: 'Test message'
            };

            const mockResponses = [
                { sid: 'MSG123' },
                { sid: 'MSG456' }
            ];

            mockTwilioClient.messages.create
                .mockResolvedValueOnce(mockResponses[0])
                .mockResolvedValueOnce(mockResponses[1]);

            const result = await provider.send(multipleRecipients);

            expect(result).toEqual({
                success: true,
                messageId: 'MSG123,MSG456'
            });
            expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
        });

        it('should handle invalid payload', async () => {
            const invalidPayload = {
                body: 'Test message'
            } as NotificationPayload;

            const result = await provider.send(invalidPayload);

            expect(result.success).toBe(false);
            expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
        });

        it('should handle Twilio error', async () => {
            const twilioError = new Error('Failed to send message');
            mockTwilioClient.messages.create.mockRejectedValue(twilioError);

            const result = await provider.send(validPayload);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });
});