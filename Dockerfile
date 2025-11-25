# ============================================
# Jira SLA Tracker - Production Dockerfile
# ============================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_JIRA_INSTANCE_URL
ARG VITE_JIRA_PROJECT_KEY
ARG VITE_SLA_ALERT_EMAIL

# Set environment variables for build
ENV VITE_JIRA_INSTANCE_URL=$VITE_JIRA_INSTANCE_URL
ENV VITE_JIRA_PROJECT_KEY=$VITE_JIRA_PROJECT_KEY
ENV VITE_SLA_ALERT_EMAIL=$VITE_SLA_ALERT_EMAIL

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 slatracker

# Copy built application
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Set ownership
RUN chown -R slatracker:nodejs /app

# Switch to non-root user
USER slatracker

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]

