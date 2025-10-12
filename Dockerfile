# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install          # keep devDependencies for build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
