# Use official Microsoft Playwright image with pre-installed Chromium & dependencies
FROM mcr.microsoft.com/playwright:v1.50.1-noble

WORKDIR /app

# Copy root and package descriptors
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source codes
COPY client ./client
COPY server ./server

# Build React client bundle
RUN cd client && npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/server

EXPOSE 3000

CMD ["npm", "start"]
