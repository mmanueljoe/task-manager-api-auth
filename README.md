# Task Manager API

A RESTful API for managing tasks, built with Node.js, Express, and TypeScript. Data is persisted in MongoDB via Mongoose.

## Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Dev Runner:** tsx
- **Auto-restart:** nodemon
- **Environment:** dotenv
- **Package Manager:** Yarn

## Project Structure

```
task-manager-api-db/
├── src/
│   ├── app.ts
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   └── tasks.controller.ts
│   ├── routes/
│   │   └── tasks.routes.ts
│   ├── middleware/
│   │   ├── logger.ts
│   │   ├── notFound.ts
│   │   └── errorHandler.ts
│   ├── models/
│   │   └── task.model.ts
│   ├── scripts/
│   │   └── seed.ts
│   └── types/
│       └── types.ts
├── .env
├── tsconfig.json
├── tsconfig.dev.json
├── nodemon.json
└── package.json
```

- `src/app.ts` — entry point, Express setup, middleware registration, route mounting, and server start
- `src/config/db.ts` — MongoDB connection function using Mongoose
- `src/controllers/tasks.controller.ts` — business logic for all task operations
- `src/routes/tasks.routes.ts` — maps HTTP methods and paths to controller functions
- `src/middleware/logger.ts` — logs every incoming request with timestamp, method, and path
- `src/middleware/notFound.ts` — handles requests to undefined routes with a 404 response
- `src/middleware/errorHandler.ts` — global error handler, catches unhandled errors and returns 500
- `src/models/task.model.ts` — Mongoose schema and model for the Task document
- `src/scripts/seed.ts` — script to populate the database with sample tasks
- `src/types/types.ts` — shared TypeScript type definitions

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

## API Endpoints

Base URL: `http://localhost:3000`

---

### Get all tasks
```
GET /api/tasks
```
Returns a paginated list of tasks. Supports filtering and sorting via query parameters.

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

**Response `404`**
```json
{ "message": "Task not found" }
```

---

## Data Model

```ts
{
  _id: ObjectId;        // auto-generated by MongoDB
  title: string;        // required
  description: string;  // required
  completed: boolean;   // default: false
  priority: "low" | "medium" | "high";  // default: "low"
  createdAt: Date;      // auto-managed by Mongoose
  updatedAt: Date;      // auto-managed by Mongoose
}
```

## Middleware

**Request Logger** — logs the HTTP method, path, and timestamp of every incoming request.

**404 Handler** — catches requests to undefined routes and returns a JSON error response.

**Global Error Handler** — catches unhandled errors and returns a 500 response. Mongoose `ValidationError` is caught in the controller and returned as a 400 instead.
