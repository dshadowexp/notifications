import { TestUtils } from "./utils";
import { createTransport } from "nodemailer";
import { MailerProvider } from "../../../src/providers/mailer";
import { NotificationPayload } from "../../../src/types/notifications";

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn()
}));

describe('MailerProvider - Unit Tests', () => {
    let mailerProvider: MailerProvider;
    let mockTransporter: any;

    const mockConfig = {
        sender: TestUtils.smtpTestConfig().sender,
        transportOptions: {
            host: 'test.smtp.server',
            port: 587
        }
    }
  
    beforeEach(async () => {
        jest.clearAllMocks();
        // Mock nodemailer's createTransport
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({
                messageId: 'test-message-id',
                response: 'OK'
            }),
            verify: jest.fn(),
            close: jest.fn(),
        };
    
        // jest.spyOn(require('nodemailer'), 'createTransport')
        //     .mockReturnValue(mockTransporter);
        (createTransport as jest.Mock).mockReturnValue(mockTransporter);
    
        mailerProvider = new MailerProvider(mockConfig);
    });

    describe('initialize', () => {
        it('should initialize mail transporter successfully', async () => {
            await mailerProvider.initialize();
            
            expect(createTransport).toHaveBeenCalledWith(mockConfig.transportOptions);
        });
    
        it('should throw error when initialization fails', async () => {
            (createTransport as jest.Mock).mockImplementation(() => {
                throw new Error('Init failed');
            });
        
            await expect(mailerProvider.initialize()).rejects.toThrow('Failed to initialize Mailer client');
        });
    });

    describe('validatePayload', () => {
        it('should return true for valid payload', () => {
            const payload: NotificationPayload = {
                to: 'recipient@example.com',
                title: 'Test Email',
                body: '<p>Test content</p>'
            };
        
            expect(mailerProvider.validatePayload(payload)).toBe(true);
        });
    
        it('should return false when "to" is missing', () => {
            const payload = {
                title: 'Test Email',
                body: '<p>Test content</p>'
            } as NotificationPayload;
        
            expect(mailerProvider.validatePayload(payload)).toBe(false);
        });
    
        it('should return false when "title" is missing', () => {
            const payload = {
                to: 'recipient@example.com',
                body: '<p>Test content</p>'
            } as NotificationPayload;
        
            expect(mailerProvider.validatePayload(payload)).toBe(false);
        });
    
        it('should return false when "body" is missing', () => {
            const payload = {
                to: 'recipient@example.com',
                title: 'Test Email'
            } as NotificationPayload;
        
            expect(mailerProvider.validatePayload(payload)).toBe(false);
        });
    });

    describe('send', () => {
        const validPayload: NotificationPayload = {
            to: 'recipient@example.com',
            title: 'Test Email',
            body: '<p>Test content</p>'
        };
    
        beforeEach(async () => {
            await mailerProvider.initialize();
        });
    
        it('should send email to single recipient successfully', async () => {
            const mockMessageId = '<123@example.com>';
            mockTransporter.sendMail.mockResolvedValue({ messageId: mockMessageId });
        
            const result = await mailerProvider.send(validPayload);
        
            expect(result).toEqual({
                success: true,
                messageId: mockMessageId
            });

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from:  TestUtils.smtpTestConfig().sender,
                to: validPayload.to,
                subject: validPayload.title,
                html: validPayload.body
            });
        });
    
        it('should send email to multiple recipients successfully', async () => {
          const multipleRecipients: NotificationPayload = {
                to: ['recipient1@example.com', 'recipient2@example.com'],
                title: 'Test Email',
                body: '<p>Test content</p>'
          };
    
          const mockMessageId = '<123@example.com>';
          mockTransporter.sendMail.mockResolvedValue({ messageId: mockMessageId });
    
          const result = await mailerProvider.send(multipleRecipients);
    
          expect(result).toEqual({
                success: true,
                messageId: mockMessageId
          });
          expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from:  TestUtils.smtpTestConfig().sender,
                to: 'recipient1@example.com,recipient2@example.com',
                subject: multipleRecipients.title,
                html: multipleRecipients.body
          });
        });
    
        it('should handle invalid payload', async () => {
          const invalidPayload = {
            title: 'Test Email',
            body: '<p>Test content</p>'
          } as NotificationPayload;
    
          const result = await mailerProvider.send(invalidPayload);
    
          expect(result.success).toBe(false);
          expect(mockTransporter.sendMail).not.toHaveBeenCalled();
        });
    
        it('should handle nodemailer error', async () => {
            const error = new Error('Failed to send email');
            mockTransporter.sendMail.mockRejectedValue(error);
        
            const result = await mailerProvider.send(validPayload);
        
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    
        it('should handle SMTP connection errors', async () => {
            const smtpError = {
                code: 'ECONNECTION',
                command: 'CONN',
                message: 'Connection refused'
            };
            mockTransporter.sendMail.mockRejectedValue(smtpError);
        
            const result = await mailerProvider.send(validPayload);
        
            expect(result.success).toBe(false);
            expect(result.error).toContain('Connection refused');
        });
    });    
});



  