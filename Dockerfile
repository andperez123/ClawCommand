FROM node:18-alpine AS base
WORKDIR /app

# Install native deps for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy workspace config
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/parser/package.json packages/parser/
COPY packages/scanner/package.json packages/scanner/
COPY packages/api/package.json packages/api/
COPY packages/dashboard/package.json packages/dashboard/

# Install all deps (including devDependencies for building)
RUN npm ci

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/parser/ packages/parser/
COPY packages/scanner/ packages/scanner/
COPY packages/api/ packages/api/
COPY packages/dashboard/ packages/dashboard/

# Build backend packages
RUN npm run build

# Build dashboard static export (API_URL empty = same-origin requests)
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build -w @clawcommand/dashboard

# ─── Production image ────────────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

RUN apk add --no-cache tini curl
ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/packages/parser/dist ./packages/parser/dist
COPY --from=base /app/packages/parser/package.json ./packages/parser/
COPY --from=base /app/packages/api/dist ./packages/api/dist
COPY --from=base /app/packages/api/package.json ./packages/api/
COPY --from=base /app/packages/scanner/dist ./packages/scanner/dist
COPY --from=base /app/packages/scanner/package.json ./packages/scanner/
COPY --from=base /app/package.json ./

# Copy dashboard static export next to API dist
COPY --from=base /app/packages/dashboard/out ./packages/api/dist/dashboard-static

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=4000
ENV CLAWCOMMAND_DB_PATH=/app/data/clawcommand.db

EXPOSE 4000
VOLUME ["/app/data"]

CMD ["node", "packages/api/dist/index.js"]
