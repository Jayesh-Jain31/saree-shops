# Production Dockerfile — builds and serves the frontend + Express API.

# Build the frontend first. If VITE_BACKEND_URL is omitted, the app uses
# same-origin relative API calls, which works when Northflank serves both.
FROM node:18-slim AS client-build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm ci --no-audit --no-fund
COPY client/ ./client/
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN cd client && npm run build

FROM node:18-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --production --no-audit --no-fund --package-lock=false

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
