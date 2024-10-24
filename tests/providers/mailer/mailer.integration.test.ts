import { MailerProvider } from "../../../src/providers/mailer";
import { SMTPServer } from 'smtp-server';
import { TestUtils } from "./utils";

describe('MailerProvider - Integration Tests', () => {
    let mailerProvider: MailerProvider;
    let smtpServer: SMTPServer;
    let receivedEmails: string[] = [];
    const TEST_PORT = 2525;
  
    beforeAll((done) => {
        // Create a test SMTP server
        smtpServer = new SMTPServer({
            authOptional: true,
            onAuth(auth, session, callback) {
                callback(null, { user: 123 });
            },
            onData(stream, session, callback) {
                let emailData = '';
                stream.on('data', (chunk) => {
                    emailData += chunk;
                });
                stream.on('end', () => {
                    receivedEmails.push(emailData);
                    callback();
                });
            }
        });

        smtpServer.listen(TEST_PORT, done);
    });
  
    beforeEach(() => {
        const config = TestUtils.smtpTestConfig(TEST_PORT);
        mailerProvider = new MailerProvider(config);
        mailerProvider.initialize();
        receivedEmails = [];
    });
  
    afterAll((done) => {
        smtpServer.close(done);
    });
  
    test('should send email through SMTP server', async () => {
        const payload = TestUtils.createMockEmailPayload();
        
        const result = await mailerProvider.send(payload);
        
        expect(result.success).toBeTruthy();
        expect(receivedEmails.length).toBe(1);
        expect(receivedEmails[0]).toContain(payload.title);
        expect(receivedEmails[0]).toContain(payload.body);
    });
  
    test('should handle HTML content', async () => {
        const payload = {
            ...TestUtils.createMockEmailPayload(),
            body: '<h1>Test HTML</h1>'
        };
    
        await mailerProvider.send(payload);
    
        expect(receivedEmails.length).toBe(1);
        expect(receivedEmails[0]).toContain('Content-Type: text/html');
        expect(receivedEmails[0]).toContain(payload.body);
    });
});