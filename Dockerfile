# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# 1️⃣ Install production dependencies only
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --omit=dev

# 2️⃣ Build stage - fresh install with ALL dependencies
FROM base AS builder
WORKDIR /app
COPY package*.json ./
# Don't copy node_modules from deps - do a fresh full install
RUN npm ci
COPY . .

# Build Next.js and compile scripts  
RUN npm run build
RUN npx tsc --outDir dist-scripts $(find scripts models -name "*.ts")

FROM base AS seeder
WORKDIR /app
COPY --from=builder /app/dist-scripts ./dist-scripts
COPY --from=builder /app/node_modules ./node_modules

# Keep as root user for seeding tasks
ENV NODE_ENV=production
CMD ["node", "dist-scripts/init-db.js"]

# 3️⃣ Runtime image
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist-scripts ./dist-scripts

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]