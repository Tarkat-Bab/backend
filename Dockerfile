# ----- Stage 1: Builder -----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install only production deps first if possible (much smaller)
RUN npm install --legacy-peer-deps

# Copy the source code
COPY . .

# Build the project
RUN npm run build


# ----- Stage 2: Runtime -----
FROM node:20-alpine
WORKDIR /app

# Copy only dist + node_modules needed for runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
