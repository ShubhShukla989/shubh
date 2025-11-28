FROM node:18-alpine

# Install ImageMagick and Ghostscript
RUN apk add --no-cache \
    imagemagick \
    ghostscript

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Expose port
EXPOSE 3333

# Start the service
CMD ["npm", "start"]
