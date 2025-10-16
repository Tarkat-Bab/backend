# Use official Node.js image
FROM node:18-alpine

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
>>>>>>> a6cb87a268103f28ce11f60468527ee0dc4ff995
