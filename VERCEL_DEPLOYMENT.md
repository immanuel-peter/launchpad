# Vercel Deployment Guide

This guide covers deploying the Next.js application to Vercel with external services.

## Architecture Overview

```
┌─────────────────┐
│   Vercel        │  ← Next.js app (serverless)
│   (Frontend +   │
│   API Routes)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌───▼────┐
│ Neon  │ │Upstash│ │Cloudflare│ │Railway │
│ (DB)  │ │Redis  │ │   R2     │ │Worker  │
└───────┘ └──────┘ └──────────┘ └────────┘
```

## Prerequisites

- Vercel account
- Neon account (for PostgreSQL with pgvector)
- Upstash account (for Redis)
- Cloudflare account (for R2 storage)
- Railway account (for worker)
- GitHub repository

## Step 1: Set Up External Services

### Neon Database

1. Create a new project in [Neon Console](https://console.neon.tech)
2. Create a database (e.g., `launchpad`)
3. Enable the `pgvector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy the connection string (format: `postgresql://user:pass@host/db?sslmode=require`)

### Upstash Redis

1. Create a new database in [Upstash Console](https://console.upstash.com)
2. Choose a region close to your Vercel deployment
3. Copy the Redis URL (format: `redis://default:password@host:port`)

### Cloudflare R2

1. Create an R2 bucket in [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Name it (e.g., `launchpad`)
3. Create an API token with R2 permissions:
   - Go to "Manage R2 API Tokens"
   - Create token with "Object Read & Write" permissions
4. Note down:
   - Account ID
   - Bucket name
   - Access Key ID
   - Secret Access Key
   - Public URL (if using custom domain) or `https://<account-id>.r2.cloudflarestorage.com/<bucket-name>`

## Step 2: Deploy to Vercel

### Via Vercel Dashboard

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `./` (if repo root)
   - Build Command: `npm run build` (Vercel uses Node.js, not Bun)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install`
   
   **Note**: Vercel uses Node.js by default. Your project uses Bun locally, but Next.js works fine with npm/node. The Railway worker will still use Bun via Docker.

3. **Set Environment Variables**
   Go to Project Settings → Environment Variables and add:

   ```env
   # Database (Neon)
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

   # Redis (Upstash)
   REDIS_URL=redis://default:password@host:port

   # Authentication
   JWT_SECRET=your-secret-key-change-this-in-production

   # OpenAI
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_API_KEY=sk-your-openai-api-key
   LLM_MODEL=gpt-5-mini
   EMBEDDING_MODEL=text-embedding-3-small

   # Storage (Cloudflare R2)
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_PUBLIC_URL=https://<account-id>.r2.cloudflarestorage.com/launchpad
   S3_ACCESS_KEY=<your-r2-access-key-id>
   S3_SECRET_KEY=<your-r2-secret-access-key>
   S3_BUCKET=launchpad
   S3_REGION=auto
   S3_FORCE_PATH_STYLE=false

   # Application
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add REDIS_URL
# ... add all other variables
```

## Step 3: Run Database Migrations

After deploying, run migrations to set up your database schema:

### Option 1: Via Vercel CLI

```bash
# Set DATABASE_URL locally (or use --env flag)
export DATABASE_URL=<your-neon-url>

# Run migrations
bun run db:migrate:sql
```

### Option 2: Via Neon SQL Editor

1. Go to Neon Console → SQL Editor
2. Copy contents of `drizzle/0000_init.sql` and `drizzle/0001_remove_shortlisted.sql` and `drizzle/0002_company_workflows.sql`
3. Run them in order

### Option 3: Create a Migration API Route

Create `src/app/api/migrate/route.ts` (temporary, remove after migration):

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db/index";
// Import your migration logic

export async function POST(request: Request) {
  // Add auth check
  // Run migrations
  return NextResponse.json({ success: true });
}
```

## Step 4: Deploy Worker to Railway

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

**Quick Summary:**
1. Create new Railway project
2. Deploy using `Dockerfile.worker`
3. Set same environment variables (except `NEXT_PUBLIC_APP_URL`)

## Step 5: Configure R2 CORS (if needed)

If you need to access R2 files directly from the browser:

1. Go to Cloudflare R2 → Your Bucket → Settings
2. Configure CORS:
   ```json
   [
     {
       "AllowedOrigins": ["https://your-app.vercel.app"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## Step 6: Set Up Vercel Integrations (Optional)

Vercel offers integrations that can simplify setup:

### Neon Integration
- Go to Project Settings → Integrations
- Add Neon integration
- Vercel will automatically set `DATABASE_URL`

### Upstash Integration
- Add Upstash integration
- Vercel will automatically set `REDIS_URL`

**Note**: These integrations make it easier to manage credentials, but you can also set variables manually.

## Environment Variables Reference

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | Neon | ✅ | PostgreSQL connection string |
| `REDIS_URL` | Upstash | ✅ | Redis connection string |
| `JWT_SECRET` | - | ✅ | Secret for JWT signing |
| `OPENAI_API_KEY` | OpenAI | ✅ | OpenAI API key |
| `OPENAI_BASE_URL` | OpenAI | ❌ | Default: `https://api.openai.com/v1` |
| `LLM_MODEL` | OpenAI | ❌ | Default: `gpt-5-mini` |
| `EMBEDDING_MODEL` | OpenAI | ❌ | Default: `text-embedding-3-small` |
| `S3_ENDPOINT` | R2 | ✅ | R2 endpoint URL |
| `S3_PUBLIC_URL` | R2 | ✅ | Public URL for files |
| `S3_ACCESS_KEY` | R2 | ✅ | R2 access key |
| `S3_SECRET_KEY` | R2 | ✅ | R2 secret key |
| `S3_BUCKET` | R2 | ✅ | Bucket name |
| `S3_REGION` | R2 | ❌ | Use `auto` for R2 |
| `S3_FORCE_PATH_STYLE` | R2 | ❌ | Use `false` for R2 |
| `NEXT_PUBLIC_APP_URL` | - | ✅ | Your Vercel app URL |

## Troubleshooting

### Build Failures

- **Bun not found**: Vercel uses Node.js by default. Since Next.js is compatible with both:
  - Use `npm` commands in Vercel build settings (already configured above)
  - Your local development can still use Bun
  - Railway worker uses Bun via Docker (no changes needed)

- **Missing dependencies**: Ensure all dependencies are in `package.json`

### Runtime Errors

- **Database connection**: Verify `DATABASE_URL` is correct and includes `?sslmode=require`
- **Redis connection**: Check `REDIS_URL` format (Upstash URLs work with ioredis)
- **S3 errors**: Verify R2 credentials and endpoint URL

### Worker Not Processing Jobs

- Check Railway worker logs
- Verify `REDIS_URL` matches between Vercel and Railway
- Ensure queue name matches (`application-scoring`)

## Monitoring

- **Vercel**: Check deployment logs, function logs, and analytics
- **Neon**: Monitor database connections and queries
- **Upstash**: Check Redis metrics and usage
- **Railway**: Monitor worker logs and resource usage

## Cost Optimization

- **Vercel**: Free tier includes generous limits for Next.js apps
- **Neon**: Free tier includes 0.5GB storage
- **Upstash**: Free tier includes 10K commands/day
- **R2**: Pay-as-you-go, very affordable
- **Railway**: $5/month starter plan, pay-as-you-go after

## Security Best Practices

1. **Never commit secrets**: Use environment variables only
2. **Rotate secrets regularly**: Especially `JWT_SECRET`
3. **Use Vercel's environment variable encryption**
4. **Enable R2 bucket policies**: Restrict public access if not needed
5. **Use Neon connection pooling**: For better performance
6. **Monitor API usage**: Set up alerts for OpenAI usage

## Next Steps

- Set up custom domain in Vercel
- Configure preview deployments for PRs
- Set up monitoring and alerts
- Enable Vercel Analytics
- Configure edge caching for static assets
