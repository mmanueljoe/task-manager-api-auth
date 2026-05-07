# Task Manager API

A RESTful API for managing tasks, built with Node.js, Express, and TypeScript. Data is persisted in MongoDB via Mongoose. Includes JWT-based authentication and role-based access control.

## Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Auth:** JSON Web Tokens (`jsonwebtoken`) + password hashing (`bcryptjs`)
- **Dev Runner:** tsx
- **Auto-restart:** nodemon
- **Environment:** dotenv
- **Package Manager:** Yarn

## Project Structure

```
task-manager-api-auth/
├── src/
│   ├── app.ts
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── tasks.controller.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── tasks.routes.ts
│   ├── middleware/
│   │   ├── authorizeRole.ts
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   ├── notFound.ts
│   │   └── verifyToken.ts
│   ├── models/
│   │   ├── task.model.ts
│   │   └── user.model.ts
│   ├── scripts/
│   │   └── seed.ts
│   └── types/
│       ├── express.d.ts
│       └── types.ts
├── .env
├── tsconfig.json
├── tsconfig.dev.json
├── nodemon.json
└── package.json
```

- `src/app.ts` — entry point, Express setup, middleware registration, route mounting, and server start
- `src/config/db.ts` — MongoDB connection function using Mongoose
- `src/controllers/auth.controller.ts` — register and login logic
- `src/controllers/tasks.controller.ts` — business logic for all task operations
- `src/routes/auth.routes.ts` — maps auth endpoints to controller functions
- `src/routes/tasks.routes.ts` — maps task endpoints to controller functions, applies `verifyToken` to all routes
- `src/middleware/verifyToken.ts` — validates the JWT from the `Authorization` header and attaches the decoded payload to `req.user`
- `src/middleware/authorizeRole.ts` — middleware factory that restricts access to specific roles
- `src/middleware/logger.ts` — logs every incoming request with timestamp, method, and path
- `src/middleware/notFound.ts` — handles requests to undefined routes with a 404 response
- `src/middleware/errorHandler.ts` — global error handler; handles `AppError`, Mongoose validation errors, MongoDB duplicate key errors, and falls back to 500
- `src/models/task.model.ts` — Mongoose schema and model for the Task document
- `src/models/user.model.ts` — Mongoose schema and model for the User document
- `src/types/express.d.ts` — extends Express's `Request` interface to include `req.user`
- `src/types/types.ts` — shared TypeScript types and the `AppError` class

## Prerequisites

- Node.js installed — verify with `node -v`
- Yarn installed — verify with `yarn -v`
- A MongoDB instance — either local or MongoDB Atlas

## Setup

1. Clone or download the project folder
2. Navigate into the folder:
   ```
   cd task-manager-api-db
   ```
3. Install dependencies:
   ```
   yarn install
   ```
4. Create a `.env` file in the root with the following:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_long_random_secret
   ```

## Running the Project

**Development**
```
yarn dev
```
Starts the server with nodemon and tsx. Restarts automatically on any `.ts` file change in `src`.

**Production**
```
yarn build
yarn start
```
`yarn build` compiles TypeScript to JavaScript in the `dist` folder. `yarn start` runs the compiled output.

## Seeding the Database

To populate the database with sample tasks:
```
npx tsx src/scripts/seed.ts
```

## Authentication

All task routes are protected. Include the JWT in every request:

```
Authorization: Bearer <token>
```

**Flow:**
1. Register — `POST /api/auth/register`
2. Login — `POST /api/auth/login` — receive a token
3. Use the token on all `/api/tasks` requests

---

## Roles

| Role | Permissions |
|------|------------|
| `user` | CRUD on own tasks only |
| `admin` | All of the above + read all users' tasks |

Users are assigned the `user` role by default on registration. The `admin` role must be set directly in the database.

---

## API Endpoints

Base URL: `http://localhost:3000`

---

### Register
```
POST /api/auth/register
```

**Request body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `201`**
```json
{
  "message": "User created successfully",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "user" }
}
```

**Response `409`** — email already registered
```json
{ "message": "User already exists" }
```

---

### Login
```
POST /api/auth/login
```

**Request body**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "message": "Login successful",
  "token": "eyJhbGci..."
}
```

**Response `401`** — wrong email or password
```json
{ "message": "Invalid credentials" }
```

---

### Get all tasks
```
GET /api/tasks
```
Returns a paginated list of the authenticated user's tasks. Supports filtering and sorting via query parameters.

**Query parameters**

| Parameter   | Type    | Description                              | Default |
|-------------|---------|------------------------------------------|---------|
| `completed` | boolean | Filter by completion status              | —       |
| `priority`  | string  | Filter by priority (`low`, `medium`, `high`) | —   |
| `sort`      | string  | Field to sort by (e.g. `createdAt`)      | —       |
| `order`     | string  | Sort direction: `asc` or `desc`          | `asc`   |
| `page`      | number  | Page number                              | `1`     |
| `limit`     | number  | Number of results per page               | `10`    |

**Example requests**
```
GET /api/tasks?completed=true
GET /api/tasks?priority=high&sort=createdAt&order=desc
GET /api/tasks?page=2&limit=5
```

**Response `200`**
```json
{
  "tasks": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Fix login bug",
      "description": "Users are unable to log in with Google OAuth",
      "completed": false,
      "priority": "high",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

---

### Get a task by ID
```
GET /api/tasks/:id
```

**Response `200`**
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "title": "Fix login bug",
  "description": "Users are unable to log in with Google OAuth",
  "completed": false,
  "priority": "high",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Response `400`** — invalid ID format
```json
{ "message": "Invalid ID" }
```

**Response `404`**
```json
{ "message": "Task not found" }
```

---

### Create a task
```
POST /api/tasks
```

**Request body**
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium"
}
```

Both `title` and `description` are required. `priority` defaults to `"low"` if not provided. `completed` defaults to `false`.

**Response `201`**
```json
{
  "task": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "title": "New Task",
    "description": "Task description",
    "completed": false,
    "priority": "medium",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Task created successfully"
}
```

**Response `400`** — missing required fields
```json
{ "message": "Title and description are required" }
```

---

### Update a task
```
PUT /api/tasks/:id
```
Updates one or more fields on an existing task.

**Request body** — all fields optional
```json
{
  "title": "Updated title",
  "completed": true,
  "priority": "high"
}
```

**Response `200`**
```json
{ "message": "Task updated successfully" }
```

**Response `400`** — empty request body
```json
{ "message": "No fields to update" }
```

**Response `400`** — invalid ID format
```json
{ "message": "Invalid ID" }
```

**Response `404`**
```json
{ "message": "Task not found" }
```

---

### Delete a task
```
DELETE /api/tasks/:id
```

**Response `200`**
```json
{ "message": "Task deleted successfully" }
```

**Response `400`** — invalid ID format
```json
{ "message": "Invalid ID" }
```

**Response `403`** — task belongs to another user
```json
{ "message": "You are not authorized to update this task" }
```

**Response `404`**
```json
{ "message": "Task not found" }
```

---

### Get all tasks (admin only)
```
GET /api/tasks/admin/all
```
Returns all tasks across all users. Requires the `admin` role.

**Response `200`** — array of all task documents

**Response `403`** — user does not have the `admin` role
```json
{ "message": "Forbidden" }
```

---

## Data Models

### Task

```ts
{
  _id: ObjectId;
  title: string;           // required
  description: string;     // required
  completed: boolean;      // default: false
  priority: "low" | "medium" | "high";  // default: "low"
  createdBy: ObjectId;     // ref: User — set automatically from the token
  createdAt: Date;
  updatedAt: Date;
}
```

### User

```ts
{
  _id: ObjectId;
  name: string;            // required
  email: string;           // required, unique
  password: string;        // required, hashed with bcrypt
  role: "user" | "admin";  // default: "user"
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Missing, invalid, or expired token / wrong credentials |
| 403 | Valid token but insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict — duplicate resource (e.g. email already registered) |
| 500 | Internal server error |

---

## Middleware

**verifyToken** — validates the JWT from the `Authorization: Bearer <token>` header. Attaches `{ userId, role }` to `req.user`. Returns 401 if missing or invalid.

**authorizeRole** — middleware factory. Checks `req.user.role` against allowed roles. Returns 403 if the role doesn't match.

**Request Logger** — logs the HTTP method, path, and timestamp of every incoming request.

**404 Handler** — catches requests to undefined routes and returns a JSON error response.

**Global Error Handler** — handles `AppError` (custom status codes), Mongoose validation errors (400), MongoDB duplicate key errors (409), and falls back to 500.
