import { SMTPServer } from "smtp-server";
import { MailerProvider } from "../../../src/providers/mailer";
import { TestUtils } from "./utils";

describe('EmailService - Load Tests', () => {
    let smtpServer: SMTPServer
    let emailService: MailerProvider;
    const TEST_PORT = 2525;
    
    beforeAll((done) => {
        // Create a test SMTP server
        const createdSMTP = TestUtils.createSMTPServer();
        smtpServer = createdSMTP.smtpServer;
        smtpServer.listen(TEST_PORT, done);
    });

    beforeEach(() => {
        emailService = new MailerProvider(TestUtils.smtpTestConfig(TEST_PORT));
        emailService.initialize();
    })

    afterAll((done) => {
        smtpServer.close(done);
    });
  
    test('should handle multiple concurrent emails', async () => {
        const numberOfEmails = 10;
        const payload = TestUtils.createMockEmailPayload();
        
        const promises = Array(numberOfEmails)
            .fill(null)
            .map(() => emailService.send(payload));
        
        const results = await Promise.all(promises);
        
        results.forEach(result => {
            expect(result.messageId).toBeDefined();
            expect(result.success).toBeTruthy();
        });
    });
  });