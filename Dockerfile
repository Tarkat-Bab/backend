# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000

# Run the compilerd code
CMD ["node", "dist/main.js"]
