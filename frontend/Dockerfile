# Dockerfile for VeloRoute Vientiane React client
# Architecture Focus: Fast Node alpine container configured to run Vite dev server.

FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package.json /app/

# Install npm packages
RUN npm install

# Copy frontend source code
COPY . /app/

# Expose Vite server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
