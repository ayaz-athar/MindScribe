# ==============================================================================
# Production Multi-Stage Dockerfile for Google Cloud Run
# 1. Build Client (React + Vite)
# 2. Package Backend (Node.js + Express)
# 3. Secure Minimal Alpine Runtime
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm ci --silent

# Copy frontend source code and build production assets
COPY client/ ./
# Build arguments for public Firebase config if baked at build time (optional)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_API_BASE_URL=""

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Install Backend Production Dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS server-deps
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --only=production --silent

# ------------------------------------------------------------------------------
# Stage 3: Final Production Runtime Container
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Security: Install dumb-init to handle PID 1 signal forwarding properly
RUN apk add --no-cache dumb-init

# Copy server dependencies and source
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Copy compiled frontend assets to be served by Express in production
COPY --from=client-builder /app/client/dist ./server/public

# Run as non-root unprivileged user for container security
USER node

# Cloud Run injects PORT (default 8080)
EXPOSE 8080

# Use dumb-init to properly handle SIGTERM signals sent by Cloud Run during scaling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/src/index.js"]
