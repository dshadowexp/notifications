import dotenv from 'dotenv';
dotenv.config();

import { MailerClient } from "../../src/clients/mailer"; // Your EmailClient
import nodemailer, { Transporter } from 'nodemailer';
import sinon from 'sinon';
import { describe, before, after, it } from "node:test";
import assert from "node:assert";
import { mailerOptions } from "../../src/config";

describe('EmailClient', () => {
    let emailClient: MailerClient;
    let transportStub: sinon.SinonStub;

    before(() => {
        const transport = {
            sendMail: (data: any, callback: any) => {
              const err = new Error('some error');
              callback(err, null);
            }
        };
        transportStub = sinon.stub(nodemailer, 'createTransport').returns(transport as Transporter);
        emailClient = new MailerClient(mailerOptions);
        emailClient.initialize();

        
    });

  after(() => {
    sinon.restore();
  });

  it('should send an email successfully', async () => {
    const result = await emailClient.send({
      title: 'Test',
      body: 'Test body',
      to: 'test@example.com',
    });

    assert.deepEqual(result, { success: true, messageId: '12345' });
    assert.equal(transportStub.calledOnce, true);
  });

  it('should fail to send an email', async () => {
    transportStub.returns({
      sendMail: sinon.stub().rejects(new Error('Failed to send email')),
    });

    assert.throws( () => {
        emailClient.send({
            title: 'Test',
            body: 'Test body',
            to: 'test@example.com',
          })
    }, 'Failed to send email')
  });
});