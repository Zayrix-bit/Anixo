# Use lightweight Node.js image
FROM node:20-slim

# The node:20-slim image already has a non-root user named 'node' with UID 1000.
# Hugging Face runs as UID 1000, so we just use the built-in 'node' user.

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker caching)
COPY --chown=node package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy all source code
COPY --chown=node . .

# Switch to the non-root user
USER node

# Hugging Face requires port 7860
EXPOSE 7860

# Set production environment
ENV NODE_ENV=production
ENV PORT=7860

# Start both server and bot worker via npm start
CMD ["npm", "start"]
