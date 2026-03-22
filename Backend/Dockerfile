# Stage 1: Dependency Builder
FROM node:20-alpine as builder

# Install Python3 using Alpine's pre-compiled packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    py3-scikit-learn

WORKDIR /app

COPY package*.json ./
RUN npm install

# Stage 2: Final Runtime Image
FROM node:20-alpine

# Repeat installation of python runtime packages needed for execution
RUN apk add --no-cache \
    python3 \
    py3-numpy \
    py3-pandas \
    py3-scikit-learn

WORKDIR /app

# Copy node_modules and other binaries from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Fix Windows line endings and make entrypoint executable
RUN apk add --no-cache dos2unix && \
    dos2unix docker-entrypoint.sh && \
    chmod +x docker-entrypoint.sh && \
    apk del dos2unix

EXPOSE 5000

CMD ["sh", "docker-entrypoint.sh"]
