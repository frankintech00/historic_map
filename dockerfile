# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm ci

# Copy everything else and build
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./.nginx/default.conf /etc/nginx/conf.d/default.conf


# Simple healthcheck and SPA config
HEALTHCHECK CMD wget -qO- http://127.0.0.1:80/ || exit 1
