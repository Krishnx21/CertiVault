# Getting Started with CertiVault

This guide will help you set up and run CertiVault locally for development.

## Prerequisites

- **Node.js 20+** - [Download Node.js](https://nodejs.org/)
- **npm** or **pnpm** - Comes with Node.js
- **MongoDB Atlas account** - [Get free cluster](https://www.mongodb.com/cloud/atlas/register)
- **Git** - For cloning the repository

## Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/Krishnx21/CertiVault.git
cd CertiVault

# Windows users: Run the setup script
setup.bat

# Or manually install dependencies
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Environment

#### Backend Configuration

Copy the example environment file and configure:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
# Required: MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/certivault?retryWrites=true&w=majority

# Required: JWT Secrets (generate secure random strings, min 32 chars)
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_here_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here_min_32_chars

# Optional: Frontend Origin (default: http://localhost:5173)
FRONTEND_ORIGIN=http://localhost:5173
```

**Generate JWT Secrets:**
```bash
# Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))

# Linux/Mac
openssl rand -base64 48
```

#### Frontend Configuration

Create `frontend/.env`:

```bash
echo VITE_API_URL=http://localhost:5000/api/v1 > frontend/.env
```

### 3. Start Development Servers

From the project root:

```bash
npm start
```

This starts both servers:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

Or run them separately in different terminals:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Verify Installation

### Test Backend API

```bash
# Health check
curl http://localhost:5000/health/live

# Expected: {"status":"ok","version":"1.0.0","uptimeSeconds":...}

# Get documents
curl http://localhost:5000/api/documents

# Expected: {"data":[...],"total":3}

# Get dashboard summary
curl http://localhost:5000/api/dashboard/summary

# Expected: {"data":{"total":3,"verified":2,"pending":1,"storageBytes":...}}
```

### Test Frontend

Open http://localhost:5173 in your browser. You should see the CertiVault dashboard with sample documents.

## Development Commands

### Root Level

```bash
npm install          # Install all dependencies (root, backend, frontend)
npm start           # Start both backend and frontend
npm run dev         # Same as npm start
npm run build       # Build frontend for production
npm test            # Run backend tests
```

### Backend

```bash
cd backend
npm run dev         # Start with hot reload
npm run build       # Build for production
npm start           # Start production server
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Check code style
npm run format      # Format code
npm run seed        # Seed database with sample data
```

### Frontend

```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run typecheck   # Check TypeScript types
```

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add to `backend/.env` as `MONGODB_URI`

### Option 2: Local MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Or install MongoDB locally
# Then use: MONGODB_URI=mongodb://localhost:27017/certivault
```

## Troubleshooting

### "Cannot find module" errors

```bash
# Clean and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
rm -f package-lock.json backend/package-lock.json frontend/package-lock.json
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Port already in use

```bash
# Kill process on port 5000 (backend)
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### CORS errors

Make sure `FRONTEND_ORIGIN` in `backend/.env` matches your frontend URL.

### Database connection errors

1. Check your MongoDB connection string
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Verify database user has correct permissions

## Next Steps

- [Architecture Documentation](docs/architecture/)
- [API Documentation](docs/api/)
- [Contributing Guide](CONTRIBUTING.md)

## Support

- [GitHub Issues](https://github.com/Krishnx21/CertiVault/issues)
- [Discussions](https://github.com/Krishnx21/CertiVault/discussions)

---

**Happy coding! 🚀**