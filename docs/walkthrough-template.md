# Code Walkthrough Template

Use this template during your review. Start at the top and move down.

---

## Step 1: Project Overview (30 seconds)

> "This is a task manager REST API built with Node.js, Express, TypeScript, and MongoDB. It handles authentication, task CRUD operations, and role-based authorization."

**Then show the folder structure:**
```
src/
├── config/        → Environment and logger setup
├── controllers/   → Request handlers (business logic)
├── middleware/    → Reusable middleware (auth, validation, etc.)
├── models/        → Mongoose schemas (data structure)
├── routes/        → API route definitions
├── schemas/       → Zod validation schemas
├── types/         → TypeScript type definitions
├── utils/         → Shared helper functions
├── app.ts         → Entry point, middleware setup
└── scripts/       → Standalone scripts (seed, utilities)
```

**What to say:**
> "I organized the code by concern — routes define the API surface, controllers handle logic, models define data, and middleware provides reusable cross-cutting functionality."

---

## Step 2: Entry Point (app.ts) — 1 minute

**Open:** `src/app.ts`

> "The app starts here. I load environment config, set up Express middleware (JSON parsing, request logging), define routes, and then start the server after connecting to the database."

**Key points to mention:**
- `/health` endpoint for infrastructure checks
- Middleware order matters (logging before routes)
- `try/catch` wraps startup so DB failure is caught before server listens

**If asked about middleware order:**
> "Request logging happens first so every request is captured. Error handlers are last so any unhandled error is caught. Routes are in the middle."

---

## Step 3: Configuration (src/config/) — 30 seconds

**Show:** `src/config/index.ts`

> "I centralized all environment variable access here. This file validates required variables at startup and fails immediately if something is missing."

**What to highlight:**
- Getter functions (`get jwtSecret()`) run validation lazily after dotenv loads
- Logging before throwing gives clear error messages in deployment logs
- `pino` logger is configured here with dev/prod conditional formatting

**Defense:** "Why not just use `process.env` directly?"
> "If I use `process.env` in 10 places and need to change how secrets are loaded, I change 10 places. Here I change one. Also, this validates early — I know immediately if something is misconfigured."

---

## Step 4: Database Models (src/models/) — 1 minute

**Show:** `src/models/user.model.ts` and `src/models/task.model.ts`

> "These define the data structure. User has name, email, password hash, and role. Task has title, description, completion status, priority, and a reference to the user who created it."

**Key points:**
- `timestamps: true` — adds `createdAt` and `updatedAt` automatically
- `enum` on role and priority — prevents invalid values at DB level
- `ref: "User"` on `createdBy` — enables population if needed

**If asked about password being stored as plain text:**
> "It's hashed by bcrypt before saving — the model stores the hash, not the raw password. You'll see this in the register controller."

---

## Step 5: Authentication Flow (src/controllers/auth.controller.ts) — 2 minutes

**Show:** `src/controllers/auth.controller.ts`

> "The auth controller handles registration and login. On registration, I check if the user already exists, hash the password with bcrypt, and save. On login, I find the user, compare the password with bcrypt, and issue a JWT."

**Key decisions to mention:**
- **Password hashing:** `bcrypt` with 10 salt rounds — industry standard
- **JWT expiry:** `"7d"` — user choice, configurable
- **Same error message** for wrong email vs wrong password — prevents user enumeration attacks

**Defense:** "Why same error for email vs password?"
> "If I say 'user not found' for wrong email and 'wrong password' for wrong password, an attacker knows which emails exist in the system. Same message for both prevents enumeration."

---

## Step 6: Route Definitions (src/routes/) — 1 minute

**Show:** `src/routes/auth.routes.ts` and `src/routes/tasks.routes.ts`

> "Routes define the API surface. Auth routes handle registration and login. Task routes handle CRUD operations and admin-only endpoints."

**Key patterns to explain:**

```typescript
// Middleware chain — runs left to right
taskRouter.post("/", validate(createTaskSchema), createTask);
//                          ↑                    ↑
//                    validation           controller
//                    runs first            runs second
```

> "Every POST/PUT goes through the validation middleware first. This means invalid input is rejected before it hits the controller."

**Rate limiting explained:**
> "Auth routes have rate limiting — 5 login attempts per 15 minutes, 10 registrations. This prevents brute-force attacks."

---

## Step 7: Schema Validation (src/schemas/) — 1 minute

**Show:** `src/schemas/auth.schema.ts` and `src/schemas/task.schema.ts`

> "I use Zod for input validation. These schemas define what valid input looks like — required fields, email format, password minimum length."

**Example to show:**
```typescript
// src/schemas/auth.schema.ts
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

**What to say:**
> "Zod gives me free TypeScript types from the schema — I don't maintain separate type definitions. The schema is the single source of truth."

**Defense:** "Why not just check `if (!email)` in the controller?"
> "That works for simple checks, but it doesn't handle email format validation, password complexity, or nested objects cleanly. Zod handles all of this, and the error messages are user-friendly automatically."

---

## Step 8: Middleware (src/middleware/) — 2 minutes

**Walk through each one:**

### verifyToken.ts
> "This extracts and verifies the JWT from the Authorization header. It attaches the decoded user info to `req.user` for use in controllers."

### authorizeRole.ts
> "This checks if the user has the required role. Used for admin-only endpoints."

### authorizeOwner.ts
> "This checks if the user owns the resource. The task is loaded by `attachTask` middleware before this runs."

### validate.ts
> "This is a factory — it takes a Zod schema and returns a middleware that validates `req.body`. If validation fails, it returns a 400 with clear error messages."

### errorHandler.ts
> "This is the global error handler. It catches all errors and returns appropriate responses. It handles custom `AppError` instances, mongoose validation errors, and duplicate key errors."

### logger.ts
> "This logs every incoming request using pino — structured logging with log levels. In dev, output is colorized. In prod, it's JSON for log aggregation tools."

---

## Step 9: DRY Refactor (src/utils/) — 1 minute

**Show:** `src/utils/getTaskOrFail.ts`

> "I extracted the task lookup logic into a reusable helper. It validates the ID format, fetches the task, and throws an `AppError` if not found. This is used by get, update, and delete endpoints."

**Why this matters:**
> "If I need to add caching or change the lookup logic, I change one file — not three. If I had copy-pasted the code, a bug fix would need to happen in three places."

---

## Step 10: Response Standardization (src/utils/response.ts) — 30 seconds

**Show:** `src/utils/response.ts`

> "I created helper functions for consistent API responses. Every endpoint returns the same shape: `success: true/false`, `data`, and optionally `message`."

**Example:**
```typescript
return success(res, user, "User created successfully", 201);
// vs manually writing:
// res.status(201).json({ success: true, data: user, message: "..." })
```

**Why this matters:**
> "Clients can always expect the same structure. If I need to add `requestId` or `timestamp` to every response, I change one file."

---

## Step 11: Key Files to Highlight

### `/health` endpoint
> "Standard endpoint for load balancers and monitoring tools to check if the server is alive."

### Custom AppError class
> "I created a custom error class with status codes. This makes error handling consistent — throw an `AppError` anywhere and the error handler knows how to respond."

### Magic number replacement
> "Changed `60 * 60 * 24 * 7` to `"7d"` — immediately readable without mental math."

---

## Common Questions & Quick Answers

| Question | Short Answer |
|----------|-------------|
| "Why Express 5?" | Modern async/await support, no callback API |
| "Why MongoDB?" | Flexible schema, works well with JS/Node |
| "Why JWT instead of sessions?" | Stateless — scales better, no server-side storage needed |
| "Why bcrypt instead of argon2?" | Both are good; bcrypt is more widely supported in Node ecosystem |
| "Why not use an ORM like Prisma?" | Mongoose is fine for this scale; Prisma adds complexity |
| "Why Zod instead of Joi?" | TypeScript-native, inference, modern |
| "Why pino instead of winston?" | Faster, better TypeScript support |

---

## Closing Statement

> "That's the full picture. The architecture follows standard Express patterns — separation of concerns between routes, controllers, and middleware. Security practices include input validation, rate limiting, password hashing, and JWT authentication. Code organization follows DRY principles with shared utilities. I'm happy to go deeper on any section."

---

## If They Say "Walk me through how a request flows"

Use this flow:

```
POST /api/tasks/ (with JWT)
    ↓
rate limiter (checks request count)
    ↓
verifyToken (extracts & verifies JWT)
    ↓
validate(createTaskSchema) (checks body)
    ↓
createTask controller (creates task)
    ↓
success() helper (formats response)
    ↓
{ success: true, data: task, message: "..." }
```

---

## Final Reminder

You don't need to memorize this word-for-word. Know:

1. **Folder structure** — where things are
2. **Request flow** — middleware chain from request to response
3. **3-4 key decisions** — why you made specific choices

Everything else is explaining your code naturally. If you blank, it's okay to say "let me look at that" and reference the file.