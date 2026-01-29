# Edusphere Launchpad

An AI-powered platform that connects students with startups for micro-internships. Launchpad uses advanced AI matching and scoring to help students find opportunities that align with their skills and interests, while enabling startups to discover talented candidates.

## 🚀 Features

### For Students
- **AI-Powered Job Matching**: Get personalized job recommendations based on your profile, skills, and experience
- **Profile Management**: Create a comprehensive profile showcasing your education, skills, bio, and portfolio links
- **Application Tracking**: Track your applications with real-time status updates and AI-generated compatibility scores
- **Score Insights**: View detailed breakdowns of how well you match each opportunity (Skills Match, Experience Fit, Education Match)

### For Startups
- **Job Posting Management**: Create and manage job postings with markdown support for rich descriptions
- **AI Application Scoring**: Automatically receive compatibility scores and reasoning for each applicant
- **Candidate Review**: Browse applications with collapsible candidate cards for efficient review
- **Application Management**: Update application statuses (pending, reviewing, shortlisted, accepted, rejected)

### AI Capabilities
- **Semantic Matching**: Uses OpenAI embeddings (text-embedding-3-small) for semantic similarity matching
- **Hybrid Matching**: Combines vector similarity with direct skills matching for accurate results
- **Structured Scoring**: AI-generated scores (0-100) with detailed reasoning using OpenAI's structured output
- **Asynchronous Processing**: Background job queue using BullMQ and Redis for scalable scoring

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **TanStack Query** - Data fetching and caching
- **React Markdown** - Markdown rendering for job descriptions and bios

### Backend
- **Bun** - Fast JavaScript runtime (replacing Node.js)
- **Next.js API Routes** - Serverless API endpoints
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL 17** with **pgvector** - Vector database for embeddings
- **Redis 8.0 Alpine** - Job queue backend
- **BullMQ** - Job queue management

### AI & ML
- **OpenAI API** - LLM and embeddings
- **Structured Output** - Zod schemas for reliable AI responses
- **Vector Search** - pgvector for semantic similarity

### Infrastructure
- **Docker** & **Docker Compose** - Containerization and local development
- **JWT Authentication** - Custom auth with `jose` and `bcryptjs`
- **TypeScript** - Type safety throughout

## 📋 Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://www.docker.com/) and Docker Compose
- [Just](https://github.com/casey/just) - A modern alternative to Make
- OpenAI API key

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/eduspheretech/launchpad.git
cd launchpad
```

### 2. Install dependencies

```bash
just install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/launchpad

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-change-this-in-production

# OpenAI
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-5-mini
EMBEDDING_MODEL=text-embedding-3-small

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start services with Docker Compose

```bash
just start
```

This starts:
- PostgreSQL (port 5432) with pgvector extension
- Redis (port 6379)
- Next.js app (port 3000)
- BullMQ worker for background jobs

### 5. Run database migrations

```bash
bun run db:migrate:sql
```

Or using just:

```bash
just migrate
```

### 6. Start the development server

The app should already be running via Docker Compose. If you prefer to run locally:

```bash
bun --bun run dev
```

### 7. Start the worker (in a separate terminal)

If running locally (not in Docker):

```bash
bun --bun run worker
```

The worker processes application scoring jobs asynchronously.

## 📁 Project Structure

```
launchpad/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── jobs/           # Job management
│   │   │   ├── applications/   # Application handling
│   │   │   └── ...
│   │   ├── student/            # Student dashboard pages
│   │   ├── startup/            # Startup dashboard pages
│   │   └── auth/               # Auth pages
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── layout/             # Layout components
│   ├── db/                     # Database configuration
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   ├── index.ts            # Database connection
│   │   └── migrate.ts          # Migration utilities
│   ├── lib/                    # Shared utilities
│   │   ├── ai/                 # AI integration
│   │   │   ├── embeddings.ts   # Embedding generation
│   │   │   ├── matching.ts     # Job matching logic
│   │   │   ├── scoring.ts      # Application scoring
│   │   │   └── schemas.ts      # Zod schemas for AI
│   │   ├── auth/               # Authentication utilities
│   │   └── ...
│   └── queue/                  # Background job processing
│       ├── connection.ts       # Redis connection
│       ├── scoring.ts          # Scoring queue
│       └── worker.ts           # BullMQ worker
├── drizzle/                    # Database migrations
├── docker-compose.yml          # Docker services
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Development Docker image
└── package.json
```

## 🔧 Available Scripts

- `bun run dev` - Start Next.js development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:migrate` - Run Drizzle migrations
- `bun run db:migrate:sql` - Run SQL migration file
- `bun run worker` - Start BullMQ worker

### Using Just

- `just start` - Start Docker Compose and run migrations
- `just migrate` - Run database migrations
- `just clean` - Stop and remove Docker volumes
- `just install` - Install dependencies

## 🔐 Authentication

The platform uses custom JWT authentication:
- Passwords are hashed with `bcryptjs`
- JWTs are signed/verified with `jose`
- HTTP-only cookies for secure session management
- Role-based access control (student/startup)

## 🤖 AI Matching & Scoring

### Matching Algorithm
1. **Semantic Similarity**: Uses OpenAI embeddings to find jobs similar to student profiles
2. **Skills Overlap**: Direct matching of skills between student and job requirements
3. **Hybrid Scoring**: Combines both approaches for accurate matching

### Scoring System
When a student applies, the system:
1. Queues the application for scoring (BullMQ)
2. Worker fetches student and job data
3. Calls OpenAI API with structured output (Zod schema)
4. Returns scores (0-100) for:
   - Skills Match
   - Experience Fit
   - Education Match
   - Overall Recommendation
5. Updates application status and scores in database

### Embeddings
- Generated automatically when profiles/jobs are saved
- Uses `text-embedding-3-small` model (1536 dimensions)
- Stored in PostgreSQL using pgvector
- Indexed with IVFFlat for fast similarity search

## 🗄️ Database Schema

### Core Tables
- `profiles` - User accounts (students/startups)
- `student_profiles` - Student-specific data with embeddings
- `companies` - Company information
- `jobs` - Job postings with embeddings
- `applications` - Applications with scores and breakdowns

### Key Features
- Vector columns for semantic search
- JSONB for flexible score breakdowns
- Proper foreign keys and constraints
- Enum types for status management

## 🐳 Docker Development

The project includes Docker Compose for local development:

```bash
# Start all services
just start

# View logs
docker compose logs -f app

# Stop services
docker compose down

# Clean volumes (removes data)
just clean
```

Services:
- `postgres` - PostgreSQL with pgvector
- `redis` - Redis for job queue
- `app` - Next.js development server
- `worker` - BullMQ worker process

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `LLM_MODEL` | LLM model for scoring | `gpt-5-mini` |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

## 🧪 Development Workflow

1. **Start services**: `docker compose up -d`
2. **Run migrations**: `bun run db:migrate:sql`
3. **Start dev server**: Already running in Docker, or `bun run dev`
4. **Start worker**: Already running in Docker, or `bun run worker`
5. **Make changes**: Files are hot-reloaded automatically

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - List jobs (filtered by company if startup)
- `GET /api/jobs/matched` - Get AI-matched jobs (student only)
- `POST /api/jobs` - Create job (startup only)
- `GET /api/jobs/[id]` - Get job details
- `PATCH /api/jobs/[id]` - Update job (startup only)
- `DELETE /api/jobs/[id]` - Delete job (startup only)

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application (triggers scoring)
- `GET /api/applications/[id]` - Get application details
- `PATCH /api/applications/[id]` - Update application status

### Profiles
- `GET /api/profiles/[id]` - Get profile
- `PATCH /api/profiles/[id]` - Update profile
- `GET /api/student-profiles/[id]` - Get student profile
- `PATCH /api/student-profiles/[id]` - Update student profile
- `GET /api/companies/[id]` - Get company profile
- `PATCH /api/companies/[id]` - Update company profile
