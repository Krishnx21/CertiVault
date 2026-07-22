# =============================================================================
# CertiVault Frontend — Multi-Stage Dockerfile
# =============================================================================
# Build context: REPO ROOT (set in docker-compose.yml)
# This is required so Stage 2 can COPY nginx/nginx.conf from repo root.
#
# Stage 1 : builder  — installs deps + runs `tsc && vite build`
# Stage 2 : production — Nginx serves the static output
# =============================================================================

# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend package manifests first — maximise layer cache.
# Context is repo root, so prefix with frontend/
COPY frontend/package.json frontend/package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy the rest of the frontend source
COPY frontend/ .

# Build the React app (tsc type-check + vite bundle -> dist/)
RUN npm run build

# ─── Stage 2: Production (Nginx) ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config from repo root (context = repo root)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx serves on port 80
EXPOSE 80

# Nginx foreground mode required inside Docker
CMD ["nginx", "-g", "daemon off;"]
