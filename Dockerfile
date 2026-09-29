# Production Dockerfile — Express API server only
# Frontend is served separately (Vercel). This runs just the backend.

FROM node:18-slim
WORKDIR /app

# Copy & install server deps
COPY server/package*.json ./server/
# The lockfile may be generated inside Replit's package firewall. Northflank
# must resolve packages from the public registry instead.
RUN cd server && npm install --production --no-audit --no-fund --package-lock=false

# Copy server source
COPY server/ ./server/

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
