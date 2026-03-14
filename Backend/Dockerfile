FROM node:20-alpine

# Install Python3 using Alpine's pre-compiled packages (no C compiler needed)
# All packages below have pre-built Alpine binaries - no compilation required
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    py3-scikit-learn

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the Express server port
EXPOSE 5000

# Start the application with nodemon for auto-reloading
CMD ["npx", "nodemon", "server.js"]
