FROM public.ecr.aws/docker/library/node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build || true

# Expose port 3001
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
