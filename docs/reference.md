# Best Practices Reference Guide

This document explains the best practices applied in this project, why they exist, and how they were implemented.

---

## 1. Environment Configuration Management

### What It Is
Centralized configuration that validates required environment variables at startup and throws clear errors if missing.

### Why It Exists
- **Fail Fast Principle**: It's better to crash immediately on startup than to fail silently at runtime with cryptic errors.
- **Single Source of Truth**: All config access goes through one file, so changes only happen in one place.
- **Security**: Sensitive values (JWT secrets, DB URIs) should be in environment variables, never hardcoded.

### Implementation

```typescript
// src/config/index.ts
export const config = {
  get jwtSecret() {
    const secret = env["JWT_SECRET"];
    if (!secret) {
      logger.fatal("JWT_SECRET environment variable is not set");
      throw new Error("JWT_SECRET is required");
    }
    return secret;
  },
  // ...
};
```

### Usage in Code
```typescript
// Before
const secret = process.env["JWT_SECRET"];
if (!secret) throw new Error("JWT_SECRET is not defined");

// After
const token = jwt.sign(payload, config.jwtSecret);
```

### Key Concepts
- **Getter functions** (`get jwtSecret()`) run validation lazily, after `dotenv` is loaded.
- **Throwing on missing required vars** ensures the app won't run in a broken state.
- **Logging before throwing** gives visibility in deployment logs (e.g., Docker, CI).

---

## 2. Structured Logging with Pino

### What It Is
A production-grade logger that outputs JSON in production (machine-readable) and human-readable format in development.

### Why Pino?

| Feature | Benefit |
|---------|---------|
| JSON output | Parseable by log aggregation tools (Datadog, ELK, Splunk) |
| Log levels | Filter by severity (debug, info, warn, error, fatal) |
| Performance | 10x faster than console.log |
| Child loggers | Attach context (request ID, user ID) automatically |

### Why Not Console.log?

```typescript
// Bad - unstructured, no levels, no context
console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

// Good - structured, timestamped, parsable
logger.info({ method: req.method, path: req.path, ip: req.ip }, "incoming request");
```

### Development vs Production

```typescript
// src/config/index.ts
const isDev = env["NODE_ENV"] !== "production";

const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty", // Human-readable in dev
          options: { colorize: true },
        },
      }
    : {}), // JSON output in production
});
```

### How to Use

```typescript
import { logger } from "./config/index.js";

logger.info({ userId: "123" }, "User logged in");
logger.error({ err }, "Failed to process request");
logger.fatal({ err }, "Cannot start server - missing config");
```

### Log Levels Explained

| Level | When to Use |
|-------|-------------|
| `debug` | Development details, variable values |
| `info` | Normal operation (server started, request processed) |
| `warn` | Unexpected but handled (validation error, rate limit hit) |
| `error` | Something went wrong but the app continues |
| `fatal` | App cannot continue (missing required config) |

---

## 3. Schema Validation with Zod

### What It Is
Runtime validation of request bodies against defined schemas, with automatic error messages.

### Why It Exists

1. **Defense in Depth**: Even if client-side validation fails, your API is protected.
2. **Fail Fast**: Invalid input is rejected before it reaches your controller.
3. **Documentation by Example**: Schemas serve as living documentation of expected input.
4. **Type Safety**: Zod infers TypeScript types from schemas, eliminating duplication.

### Implementation

```typescript
// src/schemas/auth.schema.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

### Validation Middleware

```typescript
// src/middleware/validate.ts
export const validate = (schema: z.ZodSchema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(", ");
      res.status(400).json({ message: errors });
      return;
    }
    req.body = result.data;
    next();
  };
};
```

### Usage in Routes

```typescript
// src/routes/auth.routes.ts
authRouter.post("/register", validate(registerSchema), register);
```

### Why Zod Over Joi or express-validator?

| Library | Pros | Cons |
|---------|------|------|
| **Zod** | TypeScript-native, inference, composable | Newer, smaller community |
| Joi | Battle-tested, mature | No TypeScript inference |
| express-validator | Express integration | Less powerful than Zod |

---

## 4. Rate Limiting

### What It Is
Protection against brute-force attacks by limiting how many requests a client can make within a time window.

### Why It Exists
- **Brute Force Prevention**: Without rate limiting, an attacker can try millions of password combinations.
- **DoS Protection**: Prevents a single client from overwhelming your server.
- **Resource Management**: Ensures fair usage among legitimate users.

### What We Implemented

```typescript
// src/routes/auth.routes.ts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: "Too many login attempts, please try again after 15 minutes" },
});

authRouter.post("/login", loginLimiter, validate(loginSchema), login);
```

### Why These Limits?

| Endpoint | Limit | Reasoning |
|----------|-------|----------|
| Login | 5 per 15 min | Legitimate user won't fail 5 times. 15 min delay is frustrating but not breaking. |
| Register | 10 per 15 min | Account creation is heavier operation. 10 allows testing while preventing spam. |

### Attackers Will...

1. **Try common passwords** — Rate limiting slows this down dramatically.
2. **Use credential stuffing** — 5 attempts per 15 min makes this impractical.
3. **Bot registration** — 10 attempts per 15 min makes bulk account creation useless.

---

## 5. DRY (Don't Repeat Yourself)

### What It Is
Eliminating code duplication by extracting common logic into reusable functions.

### Why It Matters

1. **Single Source of Truth**: Bug fixes only need to happen in one place.
2. **Consistency**: All parts behave the same way.
3. **Maintainability**: New features only need changes in one location.
4. **Readability**: Functions do one thing, making code easier to understand.

### The Problem (Before)

```typescript
// tasks.controller.ts - repeated in updateTask and deleteTask
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ message: "Invalid ID" });
}
const task = await TaskModel.findById(id);
if (!task) {
  return res.status(404).json({ message: "Task not found" });
}
```

### The Solution (After)

```typescript
// src/utils/getTaskOrFail.ts
export const getTaskOrFail = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid ID", 400);
  }
  const task = await TaskModel.findById(id);
  if (!task) {
    throw new AppError("Task not found", 404);
  }
  return task;
};
```

### Usage

```typescript
// In controllers
const task = await getTaskOrFail(id);
```

---

## 6. Middleware Composition / Single Responsibility

### What It Is
Each middleware does one job. Complex operations are composed from simple pieces.

### Why This Design?

| Traditional | Middleware Composition |
|-------------|----------------------|
| One middleware has 100 lines | Each middleware has 5-10 lines |
| Hard to test individual parts | Each part is independently testable |
| Changing one thing affects everything | Change one piece without touching others |

### Example: Task Operations

```typescript
// src/routes/tasks.routes.ts
taskRouter.get("/:id", attachTask, getTaskById);
taskRouter.put("/:id", attachTask, validate(updateTaskSchema), updateTask);
taskRouter.delete("/:id", attachTask, authorizeOwner, deleteTask);
```

Each middleware has one job:
- `attachTask` — Load task from DB
- `validate` — Check input
- `authorizeOwner` — Check permissions

### Why `attachTask` Before `validate`?

`attachTask` runs first because:
1. If the ID is invalid (not a valid ObjectId), we fail before validating the body
2. If the task doesn't exist, we fail before checking the body
3. We only validate input for existing, valid resources

---

## 7. Custom Error Class (AppError)

### What It Is
A structured error class with status code, enabling consistent error handling.

### Why Not Just Use `Error`?

```typescript
// Bad - status code is lost
throw new Error("Task not found"); // 500 Internal Server Error

// Good - status code is preserved
throw new AppError("Task not found", 404); // 404 Not Found
```

### Implementation

```typescript
// src/types/types.ts
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

### Error Handler

```typescript
// src/middleware/errorHandler.ts
if (err instanceof AppError) {
  return res.status(err.statusCode).json({ message: err.message });
}
```

---

## 8. Standardized API Response Shape

### What It Is
Consistent structure for all API responses, making client code predictable.

### Why Consistency Matters

```typescript
// Bad - different shapes
res.json({ user: { ... }, message: "..." }); // auth
res.json({ task: { ... } }); // tasks
res.json(tasks); // admin route - array directly!

// Good - same shape everywhere
res.json({ success: true, data: { ... }, message: "..." });
res.json({ success: true, data: tasks });
res.json({ success: true, data: null });
```

### Implementation

```typescript
// src/utils/response.ts
export const success = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  extra?: { total?: number; page?: number; limit?: number },
): void => {
  const response = {
    success: true,
    data,
  };
  if (message) response.message = message;
  if (extra?.total) response.total = extra.total;
  // ...
  res.status(statusCode).json(response);
};
```

### Usage

```typescript
// Everywhere looks the same
return success(res, user, "User created successfully", 201);
return success(res, tasks, undefined, 200, { total, page, limit });
return error(res, "Invalid credentials", 401);
```

---

## 9. Request/Response Utility Helpers

### What It Is
Helper functions that wrap common response patterns, reducing boilerplate and ensuring consistency.

### Why Helpers?

| Without | With |
|---------|------|
| `res.status(200).json({ success: true, data: tasks })` | `success(res, tasks)` |
| Easy to forget `success: true` | Always included |
| Mixing response styles | Consistent everywhere |

### Cost/Benefit Tradeoff

**Critics say**: It's extra abstraction that hides `res` calls.

**We say**: The abstraction is thin, documented, and provides:
- Consistency
- Built-in `success: true/false` flag for clients
- Easy to add global features later (logging, metrics)

---

## 10. Health Check Endpoint

### What It Is
A lightweight endpoint (`/health`) that returns server status.

### Why It Exists

| Use Case | Why It Matters |
|----------|----------------|
| Load balancers | Check if server is alive before routing traffic |
| Kubernetes | Liveness/readiness probes |
| Monitoring | Alert if server goes down |
| Deployment | Smoke test after deploy |

### Implementation

```typescript
// src/app.ts
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
```

### What to Include

- `status: "ok"` — tells monitoring the server is responding
- `timestamp` — useful for debugging if requests get delayed
- Optional: `version`, `uptime`, `dbConnected` — for deeper diagnostics

---

## 11. Fail-Fast Startup Validation

### What It Is
Checking required configurations at startup, not when they're first needed.

### Why Fail at Startup?

```
# Good: Server doesn't start, error is clear
$ node app.js
[fatal] JWT_SECRET environment variable is not set
Error: JWT_SECRET is required

# Bad: Server starts, error appears 2 hours later
$ node app.js
Server running on port 3000
...
$ curl localhost:3000/api/auth/login
{"message": "Invalid token"}  # Cryptic - was actually "secret missing"
```

### Implementation

```typescript
// src/config/index.ts
get jwtSecret() {
  const secret = env["JWT_SECRET"];
  if (!secret) {
    logger.fatal("JWT_SECRET environment variable is not set");
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}
```

---

## 12. Type-Only Imports (verbatimModuleSyntax)

### What It Is
Using `import type` for types that are erased at runtime.

### Why It Matters

```typescript
// This imports the actual module (runtime)
import { z } from "zod";

// This is compile-time only (erased) - preferred for types
import type { RegisterInput } from "../schemas/auth.schema.ts";
```

### When to Use Which

```typescript
import { z } from "zod";           // Using class/function at runtime
import type { SomeType } from "x";  // Only using type, never runtime value

// Common case: Zod schemas need both
import { z } from "zod";           // Need .object(), .email(), etc.
import type { RegisterInput } from "x";  // Type alias is compile-time only
```

### TypeScript Strictness

`verbatimModuleSyntax` in tsconfig.json enforces this distinction. It's a best practice because:
- Faster compilation (types are erased)
- Clearer code intent
- Prevents accidentally importing runtime values when you only needed types

---

## Summary of Changes Made

| Practice | File | What Changed |
|----------|------|---------------|
| Config management | `src/config/index.ts` | New centralized config with validation |
| Structured logging | `src/config/index.ts`, all middleware | Replaced `console.log` with `pino` |
| Schema validation | `src/schemas/*.ts`, `src/middleware/validate.ts` | Added `zod` for all inputs |
| Rate limiting | `src/routes/auth.routes.ts` | Added `express-rate-limit` |
| DRY | `src/utils/getTaskOrFail.ts`, `src/middleware/authorizeOwner.ts` | Extracted duplicated logic |
| Response helpers | `src/utils/response.ts` | Standardized API responses |
| Health check | `src/app.ts` | Added `/health` endpoint |

---

## Further Improvements to Consider

1. **Input Sanitization**: Add sanitization to prevent XSS in task titles/descriptions rendered in frontend.
2. **Request ID Tracing**: Add unique ID to each request for distributed tracing.
3. **Metrics**: Add Prometheus metrics for monitoring.
4. **CORS Configuration**: Configure CORS if frontend is on different origin.
5. **Helmet**: Add security headers with `helmet` middleware.