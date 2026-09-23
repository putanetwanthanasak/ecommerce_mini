# Backend image — LOCAL DEVELOPMENT ONLY (docker-compose.yml at the repo root).
# Production does not use this file: Render runs the native Node runtime from
# render.yaml. See CLAUDE.md, backend invariant 11.
#
# node:22-slim rather than alpine: Prisma's query engine is built against glibc,
# and alpine's musl needs extra binaryTargets in schema.prisma to work at all.

# ---------------------------------------------------------------------------
# base — shared by every stage. slim ships without openssl, which the Prisma
# engine needs to detect its binary target and to load at all.
# ---------------------------------------------------------------------------
FROM node:22-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------------------------------------------------------------------------
# build — full install (devDependencies included), generate, compile.
#
# This stage is ALSO the compose `migrate` target, which is why it is not
# pruned: `prisma migrate deploy` needs the pinned Prisma CLI and the seed needs
# ts-node, both devDependencies. Pruning here would make `npx prisma` fetch the
# latest Prisma from the registry instead — a major version this repo is not on.
# NODE_ENV is deliberately unset: npm reads production as "omit dev".
# ---------------------------------------------------------------------------
FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
# tsconfig.build.json type-checks and emits in one pass; a type error fails the build.
RUN npm run build

# ---------------------------------------------------------------------------
# prod-deps — the same node_modules minus devDependencies. Pruning (rather than
# a fresh `npm ci --omit=dev`) keeps the generated client in
# node_modules/.prisma, which a fresh install would not have.
#
# The prune alone leaves the Prisma CLI and TypeScript behind: @prisma/client
# lists both as peer dependencies, so npm keeps them (~126 MB, measured). The
# server never loads them — the generated client in .prisma/ plus
# @prisma/client/runtime is all it needs — so they are removed explicitly. That
# also makes "the runtime cannot migrate" a fact about the image, not a promise.
# ---------------------------------------------------------------------------
FROM build AS prod-deps
RUN npm prune --omit=dev \
 && rm -rf node_modules/prisma node_modules/@prisma/engines node_modules/typescript \
           node_modules/.bin/prisma node_modules/.bin/tsc node_modules/.bin/tsserver

# ---------------------------------------------------------------------------
# runtime — compiled output and production deps only. No src/, no .env, and no
# migration step: the container starts the server and nothing else.
# ---------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node prisma/schema.prisma ./prisma/schema.prisma
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
