import { messaging } from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NotificationPayload } from "../../../src/types/notifications";

export class MockFirebaseMessaging implements Partial<messaging.Messaging> {
    send(message: Message): Promise<string> {
        return Promise.resolve('mock-message-id');
    }
  
    sendMulticast(
      message: messaging.MulticastMessage
    ): Promise<messaging.BatchResponse> {
        return Promise.resolve({
                successCount: message.tokens!.length,
                failureCount: 0,
                responses: message.tokens!.map(() => ({
                success: true,
                messageId: 'mock-message-id',
            })),
        });
    }
  }
  
  // Test Utilities
export class FirebaseTestUtils {
    static createMockNotification(): NotificationPayload {
        return {
            to: 'mock-device-token',
            title: 'Test Notification',
            body: 'This is a test notification',
            data: {
                key1: 'value1',
                key2: 'value2',
            }
        };
    }
  
    static createMockTokens(count: number): string[] {
      return Array(count)
        .fill(null)
        .map((_, index) => `mock-token-${index}`);
    }
}

test('firebase utils', () => {
    expect(true).toBeTruthy();
})