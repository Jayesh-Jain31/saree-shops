# Multi-stage build for full-stack Node.js app
# Stage 1: Build frontend
FROM node:18-alpine AS client-build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm ci --legacy-peer-deps
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Production server
FROM node:18-alpine
WORKDIR /app

# Copy server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy server source
COPY server/ ./server/

# Copy built frontend from stage 1
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
