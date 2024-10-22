# SaaS Startup Notifications System

## Overview

This project implements a robust notifications system designed for a SaaS startup. It leverages Express.js for the server-side implementation and Kafka for efficient data streaming, enabling real-time notifications and scalable message processing.

## Features

- Real-time notifications using Kafka streams
- RESTful API endpoints with Express.js
- Scalable architecture suitable for SaaS applications

## Notification Channels

This notification system supports multiple channels for delivering messages to users:

1. Push Notifications

   - Utilizes Firebase Cloud Messaging (FCM) for sending push notifications to mobile and web applications.
   - Enables real-time alerts and updates to users' devices.

2. Email Notifications

   - Implements Nodemailer with Gmail SMTP for sending email notifications.
   - Allows for rich, formatted content delivery to users' email inboxes.

3. SMS Notifications
   - Integrates Twilio's SMS service for sending text messages.
   - Provides a reliable channel for urgent or critical notifications.

Each channel can be configured and used independently, allowing for flexible notification strategies based on user preferences and message urgency.

## Prerequisites

- Node.js (v14 or later)
- Kafka cluster
- PostgreSQL (for storing notification and user data)
- Redis (for in-memory idempotency)
- Firebase account and project
- Gmail account setup
- Twilio account

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/dshadowexp/notifications.git
   cd notifications
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   PORT=3000
   KAFKA_BROKERS=localhost:9092
   PG_DATABASE_URI=postgresql://localhost:27017/notifications
   ```

## Usage

1. Start the Express server:

   ```
   npm start
   ```

2. The server will be running at `http://localhost:3000`

3. Use the provided API endpoints to send and manage notifications.

## API Endpoints

- `POST /notifications/send`: Send a notification to user
- `PATCH /notifications/device_token`: Update a user device token when updated by firebase

## Kafka Integration

The system uses Kafka topics to manage different types of notifications. Producers send messages to specific topics, and consumers process these messages to deliver notifications through various channels (e.g. email, SMS, push notifications).

### Consumed Kafka Topics

- `send_notification`: Stream a message to send a notification
- `create-user-notification-data`: Stream user details to store notification data once user is created in system
- `update-user-notification-data`: Stream user details to store notification data once use updated contact details

## Scaling

This architecture is designed to scale horizontally. You can add more Express server instances and Kafka consumers to handle increased load. Serve in Docker containers wrapped in K8s pods for auto-scaling.

## License

This project is licensed under the MIT License.
