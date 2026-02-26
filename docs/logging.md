# Structured Logging Guidelines

To ensure our logs are searchable, clean, and secure in systems like ELK or Datadog, we mandate the use of the centralized `pino` logger (`apps/backend/src/utils/logger.ts`) instead of standard `console.*` methods.

## 1. Action Naming Convention `[module]_[action]_[status/result]`

Whenever emitting a customized log event, you should attach an `action` property to the JSON payload. Action properties must strictly follow the format: `[module]_[action]_[status/result]`.

### Good Examples
- `payment_confirm_init`
- `payment_confirm_success`
- `order_create_error`
- `order_not_found`
- `gemini_api_error`
- `instagram_publish_success`

### Bad Examples
- `Init-Payment` (Wrong case, wrong delimiter)
- `paymentStart` (Camel case)
- `error_in_db` (Doesn't specify module or specific action)

### Usage Example
```typescript
import { logger } from '../utils/logger';

logger.info({ action: 'payment_confirm_success', orderId: 101 }, 'Payment processed successfully');
logger.error({ action: 'payment_gateway_error', err: error }, 'Failed to communicate with LinePay API');
```

## 2. Personal Identifiable Information (PII) Redaction

We must never log sensitive data. The Pino configuration is strictly set up with automated redaction for sensitive keys.

Keys that are automatically censored `[REDACTED]`:
- `password`, `newPassword`
- `resetPasswordToken`
- `creditCardNumber`, `cvv`
- `.cookie`, `.authorization` (HTTP Headers)

This mechanism recursively covers properties regardless of nesting depth (e.g. `body.password` or `user.password`). However, **you must still remain cautious and avoid deliberately stringifying secrets into log message strings**.

## 3. Correlation IDs (Tracing)

All requests entering the application are assigned a unique Request ID (Correlation ID). 

We employ **`AsyncLocalStorage`** to inject this Context ID into all downstream service-level logs and `Prisma` database queries natively. 
You do **NOT** need to pass the `req.id` continuously down the function chain. Simply import and use `logger` in your Controller, Service, or Utils, and the `reqId` will automatically append to the final JSON log payload if the code is executing within the lifecycle context of an HTTP request.
