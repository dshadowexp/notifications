import { SMTPServer } from "smtp-server";
import { NotificationPayload } from "../../../src/types/notifications";

export class TestUtils {  
    static createSMTPServer() {
        let receivedEmails: string[] = [];

        const smtpServer = new SMTPServer({
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
    
        return { smtpServer, receivedEmails };
    }
    
    static smtpTestConfig(port?: 2525) {
        return {
            sender: { 
                name: 'Test User',
                address: 'testuser@example.com'
            },
            transportOptions: {
                host: 'localhost',
                port: port,
                auth: {
                    user: 'test@example.com',
                    pass: 'testpass'
                },
                secure: false,
                requireTLS: false,
                tls: {
                    rejectUnauthorized: false
                }
            }
        };
    }

    static createMockEmailPayload(): NotificationPayload {
        return {
            to: 'recipient@example.com',
            title: 'Test Email',
            body: '<p>This is a test email</p>'
        };
    }
}

test('mailer utils', () => {
    expect(true).toBeTruthy();
})