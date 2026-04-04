# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy built static files to NGINX
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a default NGINX configuration if needed (or rely on default)
# The default serves index.html on 80.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
