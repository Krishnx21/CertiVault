# CertiVault Quick-Start Implementation Guide

## High-Priority Gap Implementation

This guide provides step-by-step instructions to address the most critical gaps identified in the technology stack analysis.

---

## 1. Docker Containerization

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: certivault
      MONGO_INITDB_ROOT_PASSWORD: changeme

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - PORT=5000
      - MONGODB_URI=mongodb://certivault:changeme@mongodb:27017/certivault?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_chars
      - JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars
    depends_on:
      - mongodb
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
  redis_data:
```

### .dockerignore Files

Create `backend/.dockerignore`:
```
node_modules
npm-debug.log
.git
.env
coverage
dist
```

Create `frontend/.dockerignore`:
```
node_modules
npm-debug.log
.git
dist
build
```

---

## 2. Deployment Configuration

### Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-api-url.onrender.com/api/v1"
  }
}
```

### Render Configuration

Create `render.yaml`:

```yaml
services:
  # Backend API
  - type: web
    name: certivault-api
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: MONGODB_URI
        sync: false
      - key: JWT_ACCESS_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: REDIS_URL
        sync: false
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: AWS_REGION
        value: us-east-1
      - key: AWS_S3_BUCKET
        sync: false
    healthCheckPath: /api/health

  # Background Workers
  - type: worker
    name: certivault-workers
    env: node
    region: oregon
    plan: free
    buildCommand: cd workers && npm install
    startCommand: cd workers && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: REDIS_URL
        sync: false
      - key: MONGODB_URI
        sync: false

databases:
  - name: certivault-db
    databaseName: certivault
    plan: free

disks:
  - name: certivault-data
    mountPath: /var/data
    sizeGB: 1
```

---

## 3. AWS S3 Setup

### S3 Bucket Creation

```bash
# Create bucket
aws s3api create-bucket --bucket certivault-documents-$(aws sts get-caller-identity --query Account --output text) --region us-east-1

# Block all public access
aws s3api put-public-access-block --bucket certivault-documents-$(aws sts get-caller-identity --query Account --output text) --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
aws s3api put-bucket-encryption --bucket certivault-documents-$(aws sts get-caller-identity --query Account --output text) --server-side-encryption-configuration '{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }
  ]
}'

# Enable versioning (optional)
aws s3api put-bucket-versioning --bucket certivault-documents-$(aws sts get-caller-identity --query Account --output text) --versioning-configuration Status=Enabled
```

### IAM Policy

Create IAM user/role with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::certivault-documents-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::certivault-documents-*"
    }
  ]
}
```

### Lifecycle Rules

Add to S3 bucket:
- Delete incomplete multipart uploads after 7 days
- Transition to IA storage after 30 days (optional)
- Delete old versions after 90 days (if versioning enabled)

---

## 4. Workers Implementation

### Workers Directory Structure

Create `workers/` directory with:

```
workers/
├── package.json
├── src/
│   ├── index.ts
│   ├── queues/
│   │   ├── documentQueue.ts
│   │   └── emailQueue.ts
│   ├── workers/
│   │   ├── documentProcessor.ts
│   │   └── emailSender.ts
│   └── config/
│       └── env.ts
└── .env.example
```

### Workers package.json

Create `workers/package.json`:

```json
{
  "name": "certivault-workers",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "bullmq": "^5.34.8",
    "ioredis": "^5.4.2",
    "mongoose": "^8.9.5",
    "nodemailer": "^6.9.16",
    "dotenv": "^16.4.7",
    "winston": "^3.17.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "@types/nodemailer": "^6.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

### Document Queue

Create `workers/src/queues/documentQueue.ts`:

```typescript
import { Queue } from 'bullmq';
import { redisConnection } from '../config/env.js';

export const documentQueue = new Queue('documents', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export enum DocumentJobTypes {
  PROCESS_UPLOAD = 'document.process_upload',
  GENERATE_THUMBNAIL = 'document.generate_thumbnail',
  EXTRACT_METADATA = 'document.extract_metadata',
}
```

### Document Processor Worker

Create `workers/src/workers/documentProcessor.ts`:

```typescript
import { Worker } from 'bullmq';
import { documentQueue, DocumentJobTypes } from '../queues/documentQueue.js';
import { redisConnection } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const documentProcessor = new Worker(
  'documents',
  async (job) => {
    logger.info(`Processing job ${job.id} of type ${job.name}`);
    
    switch (job.name) {
      case DocumentJobTypes.PROCESS_UPLOAD:
        await processDocumentUpload(job.data);
        break;
      case DocumentJobTypes.GENERATE_THUMBNAIL:
        await generateThumbnail(job.data);
        break;
      case DocumentJobTypes.EXTRACT_METADATA:
        await extractMetadata(job.data);
        break;
      default:
        logger.warn(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

async function processDocumentUpload(data: any) {
  // Implement document processing logic
  logger.info(`Processing document: ${data.documentId}`);
}

async function generateThumbnail(data: any) {
  // Implement thumbnail generation
  logger.info(`Generating thumbnail for: ${data.documentId}`);
}

async function extractMetadata(data: any) {
  // Implement metadata extraction
  logger.info(`Extracting metadata from: ${data.documentId}`);
}
```

### Main Workers Entry Point

Create `workers/src/index.ts`:

```typescript
import { documentProcessor } from './workers/documentProcessor.js';
import { logger } from './utils/logger.js';
import { connectDB } from './config/db.js';

async function main() {
  try {
    await connectDB();
    logger.info('Database connected');
    
    logger.info('Starting document processor worker...');
    
    process.on('SIGTERM', () => {
      logger.info('Shutting down workers...');
      documentProcessor.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

main();
```

---

## 5. Frontend Enhancements

### Add React Router

```bash
cd frontend
npm install react-router-dom@6
```

### Update App.tsx with Routing

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/documents/:id" element={
          <ProtectedRoute>
            <DocumentDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Add TanStack Query

```bash
cd frontend
npm install @tanstack/react-query axios
```

### Create API Client

Create `frontend/src/api/client.ts`:

```typescript
import axios from 'axios';
import { queryClient } from './queryClient';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// Request interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 6. CI/CD Deployment Workflows

### Add Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-workers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy Workers to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_WORKERS_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

---

## 7. Environment Setup Scripts

### Development Setup Script

Create `scripts/setup-dev.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up CertiVault development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }

# Start infrastructure services
echo "📦 Starting MongoDB and Redis..."
docker-compose up -d mongodb redis

# Install dependencies
echo "📥 Installing dependencies..."
npm run install:all

# Copy environment files
echo "📝 Setting up environment files..."
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Seed database
echo "🌱 Seeding database..."
cd backend && npm run seed

echo "✅ Development environment ready!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend: http://localhost:5000"
echo "📍 MongoDB: localhost:27017"
echo "📍 Redis: localhost:6379"
```

---

## Implementation Checklist

Use this checklist to track progress:

- [ ] **Docker Containerization**
  - [ ] Backend Dockerfile created
  - [ ] Frontend Dockerfile created
  - [ ] docker-compose.yml created
  - [ ] .dockerignore files added
  - [ ] Local testing successful

- [ ] **Deployment Configuration**
  - [ ] Vercel configuration created
  - [ ] Render configuration created
  - [ ] Environment variables configured
  - [ ] Staging environment set up

- [ ] **AWS S3 Setup**
  - [ ] S3 bucket created
  - [ ] IAM policies configured
  - [ ] Bucket policies applied
  - [ ] Lifecycle rules configured
  - [ ] Backend integration tested

- [ ] **Workers Implementation**
  - [ ] Workers directory structure created
  - [ ] Document queue implemented
  - [ ] Worker processors implemented
  - [ ] Background jobs tested

- [ ] **Frontend Enhancements**
  - [ ] React Router added
  - [ ] TanStack Query integrated
  - [ ] API client configured
  - [ ] Protected routes implemented

- [ ] **CI/CD Deployment**
  - [ ] Deployment workflows created
  - [ ] Secrets configured in GitHub
  - [ ] Automated deployment tested
  - [ ] Rollback procedures documented

---

## Testing the Implementation

### Local Testing

```bash
# Start all services
docker-compose up

# Run tests
npm test

# Check health endpoints
curl http://localhost:5000/api/health
```

### Production Testing

1. Deploy to staging environment first
2. Run smoke tests
3. Monitor logs and metrics
4. Gradually roll out to production

---

## Next Steps

After completing these high-priority items:

1. **Implement observability** (Prometheus + Grafana)
2. **Add API documentation** (Swagger/OpenAPI)
3. **Set up monitoring and alerting**
4. **Implement database migrations**
5. **Add comprehensive testing**

---

## Support and Resources

- **Docker Documentation:** https://docs.docker.com/
- **Vercel Deployment:** https://vercel.com/docs
- **Render Deployment:** https://render.com/docs
- **AWS S3 Guide:** https://docs.aws.amazon.com/s3/
- **BullMQ Documentation:** https://docs.bullmq.io/

---

*This guide should be updated as the implementation progresses and new best practices emerge.*