# =============================================================================
# CertiVault Backend — Multi-Stage Dockerfile
# =============================================================================
# Stage 1 : builder  — installs ALL deps + compiles TypeScript
# Stage 2 : production — only production deps + compiled output
# =============================================================================

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install build dependencies needed by some native npm packages (sharp, bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy manifests first — maximise layer cache (only re-runs npm ci when
# package-lock.json changes, not on every source file change)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for tsc)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript -> dist/
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S certivault && adduser -S certivault -G certivault

WORKDIR /app

# Set NODE_ENV so that packages like express skip dev-only paths
ENV NODE_ENV=production

# Copy only the package manifests and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory (used when S3 is not configured)
RUN mkdir -p uploads && chown -R certivault:certivault /app

# Switch to non-root user
USER certivault

# Expose API port
EXPOSE 5000

# Health check - Docker will mark the container unhealthy if this fails
# Uses wget (available in alpine) to hit the liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/health/live || exit 1

# Start the compiled server
CMD ["node", "dist/server.js"]
