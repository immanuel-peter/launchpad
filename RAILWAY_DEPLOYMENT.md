# Railway Worker Deployment Guide

This guide explains how to deploy the BullMQ worker to Railway for processing background jobs.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository connected to Railway
- Environment variables configured (see below)

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Create a New Project**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Create a New Service for the Worker**
   - In your project, click "New Service"
   - Select "GitHub Repo" again (or use the same repo)
   - Railway will auto-detect the project

3. **Configure the Service**
   - Go to the service settings
   - Under "Source", set:
     - **Root Directory**: `/` (root of repo)
     - **Dockerfile Path**: `Dockerfile.worker`
   - Under "Deploy", set:
     - **Start Command**: `bun --bun run src/queue/worker.ts`

4. **Set Environment Variables**
   - Go to the "Variables" tab
   - Add the following environment variables:

   ```
   DATABASE_URL=<your-neon-database-url>
   REDIS_URL=<your-upstash-redis-url>
   JWT_SECRET=<your-jwt-secret>
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_API_KEY=<your-openai-api-key>
   LLM_MODEL=gpt-5-mini
   EMBEDDING_MODEL=text-embedding-3-small
   NODE_ENV=production
   ```

   **Note**: You can reference variables from other Railway services or use Railway's variable management.

5. **Deploy**
   - Railway will automatically detect changes and deploy
   - Check the "Deployments" tab to see build logs
   - Monitor logs in the "Logs" tab

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway in your project**
   ```bash
   railway init
   ```

4. **Link to existing project or create new**
   ```bash
   railway link
   ```

5. **Set environment variables**
   ```bash
   railway variables set DATABASE_URL=<your-neon-database-url>
   railway variables set REDIS_URL=<your-upstash-redis-url>
   railway variables set JWT_SECRET=<your-jwt-secret>
   railway variables set OPENAI_API_KEY=<your-openai-api-key>
   # ... set other variables
   ```

6. **Deploy**
   ```bash
   railway up
   ```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (from Neon) | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string (from Upstash) | `redis://default:pass@host:port` |
| `JWT_SECRET` | Secret for JWT signing (same as Vercel) | `your-secret-key` |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `LLM_MODEL` | LLM model for scoring | `gpt-5-mini` |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `NODE_ENV` | Environment | `production` |

## Connecting to External Services

### Neon Database
1. Get your connection string from Neon dashboard
2. Format: `postgresql://user:password@host:5432/database?sslmode=require`
3. Add `DATABASE_URL` environment variable

### Upstash Redis
1. Create a Redis database in Upstash
2. Copy the connection URL (format: `redis://default:password@host:port`)
3. Add `REDIS_URL` environment variable

**Note**: Upstash Redis uses TLS by default. Make sure your Redis client supports TLS connections. The `ioredis` library should handle this automatically.

## Monitoring

- **Logs**: View real-time logs in Railway dashboard under "Logs" tab
- **Metrics**: Check CPU/Memory usage in the "Metrics" tab
- **Deployments**: View deployment history and status in "Deployments" tab

## Troubleshooting

### Worker not processing jobs
- Check that `REDIS_URL` is correctly set and accessible
- Verify Redis connection in logs
- Ensure the queue name matches (`application-scoring`)

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check that Neon database allows connections from Railway IPs
- Ensure SSL mode is set if required

### Build failures
- Check that `Dockerfile.worker` exists
- Verify Bun version compatibility
- Review build logs for specific errors

## Scaling

Railway allows you to:
- Scale horizontally (multiple worker instances)
- Adjust resource limits (CPU/Memory)
- Set up auto-scaling based on metrics

**Note**: BullMQ workers with the same queue name will automatically share work. You can deploy multiple instances for higher throughput.

## Cost Optimization

- Railway charges based on usage (CPU/Memory/Network)
- Worker runs continuously, so consider:
  - Using Railway's sleep mode for development
  - Right-sizing resources (start small, scale up as needed)
  - Monitoring usage in the dashboard

## Alternative: Using Railway's Redis

Instead of Upstash, you can also use Railway's Redis service:
1. Add Redis service in Railway
2. Railway will automatically provide `REDIS_URL` via environment variable
3. Reference it in your worker service
