# Install dependencies only when needed.
FROM node:lts-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed.
FROM node:lts-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_GRAPHQL_URL
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID

ENV NODE_ENV=production \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_API_GRAPHQL_URL=${NEXT_PUBLIC_API_GRAPHQL_URL} \
    NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID=${NEXT_PUBLIC_GOOGLE_ANALYTICS_TRACKING_ID}

COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Production image. Copy all the files and run the app.
FROM node:lts-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

ENV NODE_ENV=production

COPY --from=builder /app/.env ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
