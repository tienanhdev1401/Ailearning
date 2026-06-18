# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Pass build arg to build process
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL="https://api.aelang.online"

# Build the React app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
