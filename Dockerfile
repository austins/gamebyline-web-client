# Install dependencies only when needed.
FROM node:lts-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed.
FROM node:lts-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=secret,id=NEXT_PUBLIC_SITE_URL \
  --mount=type=secret,id=NEXT_PUBLIC_API_GRAPHQL_URL \
  --mount=type=secret,id=NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID \
   export NEXT_PUBLIC_SITE_URL=$(cat /run/secrets/NEXT_PUBLIC_SITE_URL) && \
   export NEXT_PUBLIC_API_GRAPHQL_URL=$(cat /run/secrets/NEXT_PUBLIC_API_GRAPHQL_URL) && \
   export NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID=$(cat /run/secrets/NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID) && \
   npm run build

# Production image. Copy all the files and run the app.
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.env ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder /app/package-lock.json ./package-lock.json

USER node

EXPOSE 3000

CMD ["node", "server.js"]
