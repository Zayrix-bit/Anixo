FROM node:20-alpine

# The 'node' user is already provided by the base image with UID 1000
# Hugging Face recommends running as this user
USER node
ENV HOME=/home/node
WORKDIR $HOME/app

# Install dependencies
COPY --chown=node:node package*.json ./
RUN npm install --production

# Copy application files
COPY --chown=node:node . .

# Expose the default port for Hugging Face Spaces
EXPOSE 7860
ENV PORT=7860

# Start the application
CMD ["node", "server.js"]
