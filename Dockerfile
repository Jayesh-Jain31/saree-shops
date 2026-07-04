# Production Dockerfile — Express API server only
# Frontend is served separately (Vercel). This runs just the backend.

FROM node:18-slim
WORKDIR /app

# Copy & install server deps
COPY server/package*.json ./server/
RUN cd server && npm install --production --no-audit --no-fund

# Copy server source
COPY server/ ./server/

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
