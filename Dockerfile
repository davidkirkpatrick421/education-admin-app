FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests first for better layer caching.
COPY package*.json ./

# Production dependencies only.
RUN npm ci --omit=dev

# Copy the source tree (both web and api servers share src/shared).
COPY src/ ./src/

# web: 4000, api: 5000 (only web is published in compose).
EXPOSE 4000 5000

# Default command; overridden per service in docker-compose.yml.
CMD ["node", "src/web/server.js"]
