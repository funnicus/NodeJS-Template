FROM node:24-alpine AS base

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

# --- Dependencies stage ---
FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- Final stage ---
FROM base

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY src ./src
COPY migrations ./migrations

EXPOSE 3000

CMD ["node", "src/index.ts"]
