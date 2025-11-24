# ------------ Base ------------
FROM node:20 AS base
WORKDIR /app

# ------------ Install deps using workspaces ------------
FROM base AS deps

# Copy root package.json and lockfile
COPY package.json package-lock.json ./

# Copy workspace package.json files to install dependencies
# We need to preserve the directory structure for workspaces to work
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

# Install dependencies including devDependencies (needed for build)
RUN npm install

# ------------ Build backend ------------
FROM deps AS build

# Copy source code
COPY . .

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build backend
RUN npm run build

# ------------ Final runtime ------------
FROM node:20-slim AS runner
WORKDIR /app

# Install production dependencies only
# We do this in a separate step or copy from build if we want to be minimal
# For simplicity and correctness with workspaces, we'll copy the necessary parts

# Copy package.json files again for production install
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/backend/package.json ./apps/backend/package.json

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy built artifacts
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# Copy Prisma generated client
COPY --from=build /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY --from=build /app/apps/backend/node_modules/@prisma ./apps/backend/node_modules/@prisma

# Set working directory to backend
WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["node", "dist/app.js"]
