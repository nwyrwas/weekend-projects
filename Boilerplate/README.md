# Express API Boilerplate

A production-grade REST API boilerplate built with Node.js, TypeScript, Express, PostgreSQL, and Prisma ORM. Features JWT authentication, role-based access control, comprehensive testing, and Docker support.

[![CI](https://github.com/yourusername/express-api-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/express-api-boilerplate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT REQUEST                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MIDDLEWARE STACK                                   │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │
│  │ Helmet  │→│   CORS   │→│Request │→│  Logger  │→│  Rate  │→│ Sanitize │  │
│  │         │ │          │ │   ID   │ │  (Pino)  │ │ Limit  │ │          │  │
│  └─────────┘ └──────────┘ └────────┘ └──────────┘ └────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROUTES                                          │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐         │
│  │         /auth               │    │         /users              │         │
│  │  ├── POST /register         │    │  ├── GET    / (ADMIN)       │         │
│  │  ├── POST /login            │    │  ├── GET    /:id            │         │
│  │  ├── POST /refresh          │    │  ├── PATCH  /:id            │         │
│  │  └── POST /logout           │    │  └── DELETE /:id (ADMIN)    │         │
│  └─────────────────────────────┘    └─────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTH MIDDLEWARE                                      │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐         │
│  │     authenticate()      │    │     authorize(...roles)         │         │
│  │   (Verify JWT Token)    │    │   (Check User Role)             │         │
│  └─────────────────────────┘    └─────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VALIDATION                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    express-validator                                 │    │
│  │            (Request body, params, query validation)                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTROLLERS                                        │
│  ┌───────────────────┐              ┌───────────────────┐                   │
│  │  authController   │              │  usersController  │                   │
│  │  - register       │              │  - getUsers       │                   │
│  │  - login          │              │  - getUserById    │                   │
│  │  - refresh        │              │  - updateUser     │                   │
│  │  - logout         │              │  - deleteUser     │                   │
│  └───────────────────┘              └───────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICES                                          │
│  ┌───────────────────┐              ┌───────────────────┐                   │
│  │   authService     │              │   usersService    │                   │
│  │  (Business Logic) │              │  (Business Logic) │                   │
│  └───────────────────┘              └───────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRISMA ORM                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Prisma Client                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL                                           │
│  ┌────────────────────────┐    ┌────────────────────────┐                   │
│  │        users           │    │    refresh_tokens      │                   │
│  │  - id (UUID)           │    │  - id (UUID)           │                   │
│  │  - email               │    │  - token               │                   │
│  │  - password_hash       │    │  - user_id (FK)        │                   │
│  │  - role                │    │  - expires_at          │                   │
│  │  - created_at          │    │  - created_at          │                   │
│  │  - updated_at          │    └────────────────────────┘                   │
│  └────────────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

- **Authentication**: JWT access tokens (15min) + refresh tokens (7d) with httpOnly cookies
- **Authorization**: Role-based access control (USER, ADMIN, MODERATOR)
- **Security**: Helmet, CORS, rate limiting, input sanitization, request IDs
- **Logging**: Structured JSON logging with Pino (sensitive data redaction)
- **Validation**: Express-validator with custom error formatting
- **Database**: PostgreSQL with Prisma ORM, migrations, and seeding
- **Testing**: Jest + Supertest with 80%+ coverage enforcement
- **Docker**: Multi-stage builds, health checks, non-root user
- **CI/CD**: GitHub Actions workflow for lint, type-check, test, and build

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Docker (optional)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/express-api-boilerplate.git
   cd express-api-boilerplate
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start PostgreSQL** (using Docker)
   ```bash
   docker run -d \
     --name postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=api_db \
     -p 5432:5432 \
     postgres:16-alpine
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database** (optional)
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## API Reference

### Authentication

| Method | Endpoint         | Description                          | Auth Required |
|--------|------------------|--------------------------------------|---------------|
| POST   | `/auth/register` | Register a new user                  | No            |
| POST   | `/auth/login`    | Login and receive tokens             | No            |
| POST   | `/auth/refresh`  | Refresh access token                 | Cookie        |
| POST   | `/auth/logout`   | Logout and clear refresh token       | No            |

### Users

| Method | Endpoint      | Description               | Auth Required | Role Required |
|--------|---------------|---------------------------|---------------|---------------|
| GET    | `/users`      | List all users (paginated)| Yes           | ADMIN         |
| GET    | `/users/:id`  | Get user by ID            | Yes           | Own or ADMIN  |
| PATCH  | `/users/:id`  | Update user               | Yes           | Own or ADMIN  |
| DELETE | `/users/:id`  | Delete user               | Yes           | ADMIN         |

### Health Check

| Method | Endpoint  | Description        | Auth Required |
|--------|-----------|-------------------|---------------|
| GET    | `/health` | Health check      | No            |

### Request/Response Examples

**Register**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER"
    },
    "accessToken": "eyJhbG..."
  }
}
```

**Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

**Get Users (Admin)**
```bash
curl http://localhost:3000/users?page=1&limit=10 \
  -H "Authorization: Bearer <access_token>"
```

**Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    }
  },
  "requestId": "uuid"
}
```

## Environment Variables

| Variable                    | Description                         | Default              | Required |
|-----------------------------|-------------------------------------|----------------------|----------|
| `PORT`                      | Server port                         | `3000`               | No       |
| `NODE_ENV`                  | Environment mode                    | `development`        | No       |
| `LOG_LEVEL`                 | Pino log level                      | `info`               | No       |
| `DATABASE_URL`              | PostgreSQL connection string        | -                    | Yes      |
| `JWT_ACCESS_SECRET`         | Access token signing secret         | -                    | Yes      |
| `JWT_REFRESH_SECRET`        | Refresh token signing secret        | -                    | Yes      |
| `JWT_ACCESS_EXPIRES_IN`     | Access token expiration             | `15m`                | No       |
| `JWT_REFRESH_EXPIRES_IN`    | Refresh token expiration            | `7d`                 | No       |
| `CORS_ORIGIN`               | Allowed CORS origins (comma-sep)    | `http://localhost:3000` | No    |
| `RATE_LIMIT_WINDOW_MS`      | Rate limit window (ms)              | `900000` (15 min)    | No       |
| `RATE_LIMIT_MAX_REQUESTS`   | Max requests per window             | `100`                | No       |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Auth rate limit window (ms)         | `900000` (15 min)    | No       |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | Max auth requests per window     | `5`                  | No       |
| `COOKIE_DOMAIN`             | Cookie domain                       | -                    | No       |
| `COOKIE_SECURE`             | Secure cookies (HTTPS)              | `false`              | No       |
| `COOKIE_SAME_SITE`          | SameSite cookie attribute           | `lax`                | No       |

## Project Structure

```
src/
├── config/                 # Environment validation and constants
│   ├── env.ts             # Zod schema for environment variables
│   ├── constants.ts       # Application constants
│   └── index.ts
├── middleware/            # Express middleware
│   ├── auth.ts            # JWT authentication & authorization
│   ├── errorHandler.ts    # Global error handling
│   ├── logging.ts         # Pino HTTP logger
│   ├── rateLimit.ts       # Rate limiting
│   ├── requestId.ts       # Request ID generation
│   ├── sanitize.ts        # Input sanitization
│   ├── validate.ts        # Validation error formatter
│   └── index.ts
├── modules/
│   ├── auth/              # Authentication module
│   │   ├── controller.ts
│   │   ├── service.ts
│   │   ├── routes.ts
│   │   ├── validators.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── users/             # Users module
│       ├── controller.ts
│       ├── service.ts
│       ├── routes.ts
│       ├── validators.ts
│       ├── types.ts
│       └── index.ts
├── prisma/
│   └── client.ts          # Prisma client instance
├── utils/
│   ├── AppError.ts        # Custom error class
│   ├── asyncWrapper.ts    # Async error wrapper
│   ├── tokenUtils.ts      # JWT utilities
│   ├── passwordUtils.ts   # Bcrypt utilities
│   └── index.ts
├── app.ts                 # Express app setup
└── server.ts              # Server entry point

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── helpers/               # Test utilities
    ├── setup.ts
    ├── testDb.ts
    ├── authHelper.ts
    ├── factories.ts
    └── index.ts
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Database Setup

Integration tests require a PostgreSQL database. The test setup will:
1. Connect to the test database specified in `DATABASE_URL`
2. Clean all tables between tests
3. Create test data using factories

```bash
# Using Docker for test database
docker run -d \
  --name postgres-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=api_test_db \
  -p 5433:5432 \
  postgres:16-alpine

# Set test DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/api_test_db"

# Run migrations
npx prisma migrate deploy

# Run tests
npm test
```

## Deployment

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a PostgreSQL database
3. Connect your GitHub repository
4. Set environment variables in Railway dashboard
5. Deploy

```bash
# Railway CLI deployment
railway login
railway init
railway add postgresql
railway up
```

### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm ci && npm run build && npx prisma migrate deploy`
   - Start Command: `npm start`
4. Add a PostgreSQL database
5. Set environment variables
6. Deploy

### Docker Production

```bash
# Build production image
docker build -t express-api:latest .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  express-api:latest
```

## Scripts

| Script              | Description                           |
|---------------------|---------------------------------------|
| `npm run dev`       | Start development server with hot reload |
| `npm run build`     | Build TypeScript to JavaScript        |
| `npm start`         | Start production server               |
| `npm run lint`      | Run ESLint                            |
| `npm run lint:fix`  | Fix ESLint errors                     |
| `npm run format`    | Format code with Prettier             |
| `npm run type-check`| TypeScript type checking              |
| `npm test`          | Run all tests                         |
| `npm run test:coverage` | Run tests with coverage report    |
| `npm run db:generate` | Generate Prisma Client              |
| `npm run db:migrate`  | Run database migrations (dev)       |
| `npm run db:migrate:prod` | Run database migrations (prod)  |
| `npm run db:seed`     | Seed the database                   |
| `npm run db:reset`    | Reset database and re-run migrations |
| `npm run db:studio`   | Open Prisma Studio                  |
| `npm run docker:up`   | Start Docker services               |
| `npm run docker:down` | Stop Docker services                |
| `npm run docker:test` | Run tests in Docker                 |

## Seeded Users

After running `npm run db:seed`:

| Email              | Password       | Role  |
|--------------------|----------------|-------|
| admin@example.com  | Admin123!@#    | ADMIN |
| user1@example.com  | User123!@#     | USER  |
| user2@example.com  | User123!@#     | USER  |
| user3@example.com  | User123!@#     | USER  |
| user4@example.com  | User123!@#     | USER  |
| user5@example.com  | User123!@#     | USER  |

## License

MIT License - see [LICENSE](LICENSE) for details.
