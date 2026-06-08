# Dockerfile for Moroccan Heritage Survey Platform
FROM node:18-alpine

# Install Python and build tools for SQLite compilation
RUN apk add --no-cache python3 make g++ sqlite

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_PATH=/data/survey_platform.db

# Initialize database and start
CMD ["sh", "-c", "node backend/utils/init-database.js && node backend/utils/seed-surveys.js && node backend/server.js"]
