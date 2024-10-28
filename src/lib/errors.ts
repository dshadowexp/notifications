export class NotificationError extends Error {
    constructor(
      message: string,
      public code: string,
      public details?: Record<string, any>
    ) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
}
  
export class ValidationError extends NotificationError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 'VALIDATION_ERROR', details);
    }
}
  