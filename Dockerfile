# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build applications
RUN cd backend && npm run build
RUN cd frontend && npm run build

# Expose port
EXPOSE 10000

# Start the application
CMD ["node", "backend/start.js"]
