# Backend Development Guide & Troubleshooting

This guide covers setup, operations, testing, and troubleshooting for the CertiVault backend API.

## Quick Start

### 1. Installation
Navigate to the `backend/` directory and install the necessary dependencies:
```bash
cd backend
npm install
```

### 2. Configuration
The API relies on environment variables. Copy the example configuration to create your local environment file:
```bash
cp .env.example .env
```
> [!IMPORTANT]
> Never commit the `.env` file to version control. It is ignored by git to protect local secrets and credentials.

### 3. Running the Server (Development)
To start the development server with automatic file watching enabled:
```bash
npm run dev
```
The API is available at `http://localhost:5000` by default.

### 4. Running Tests
Run the test runner to execute the test suite (integration and unit tests):
```bash
npm test
```

### 5. Code Formatting
Check the formatting using Prettier:
```bash
npm run format:check
```
To auto-format the files:
```bash
npm run format
```

### 6. Health Checks
Verify that the service is running and healthy:
- **Liveness:** `GET http://localhost:5000/health/live`
- **Readiness:** `GET http://localhost:5000/health/ready`

---

## Troubleshooting Common Setup Issues

### Port Conflicts (Address already in use)
If you see an error like `Error: listen EADDRINUSE: address already in use :::5000`:
- **Why it happens:** Another service or a dangling Node process is already listening on port 5000.
- **Resolution:**
  1. Find and terminate the conflicting process:
     - On Windows (PowerShell):
       ```powershell
       Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
       ```
     - On macOS/Linux:
       ```bash
       kill -9 $(lsof -t -i:5000)
       ```
  2. Alternatively, configure a different port by setting `API_PORT` in your `.env` file:
     ```env
     API_PORT=5001
     ```

### Missing Dependencies
If you get errors like `Error: Cannot find module '...'`:
- **Why it happens:** Package dependencies have changed or were not fully installed.
- **Resolution:**
  Clean install dependencies by running:
  ```bash
  npm ci
  ```

### Invalid Port Validation
If you get `Error: API_PORT must be an integer between 1 and 65535` on startup:
- **Why it happens:** Your `API_PORT` environment variable is defined but contains non-numeric characters, fractional numbers, is zero/negative, or exceeds 65535.
- **Resolution:** Ensure `API_PORT` in `.env` is set to a valid integer (e.g. `5000`, `8080`) or comment it out to default to `5000`.
