# --- Build stage ---
FROM node:20 as builder

WORKDIR /app

# Install dependencies (needs dev deps for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine as runner

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server and built assets
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Default port used by server.js
EXPOSE 8080

CMD ["node", "server.js"]
