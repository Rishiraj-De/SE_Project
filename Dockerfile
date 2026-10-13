FROM node:20-slim

# Install Python 3 and Git for repository cloning and AST analysis
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors
COPY package.json ./
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm install

WORKDIR /app
# Copy analysis engine, demo repo, and backend source
COPY analysis-engine ./analysis-engine
COPY demo-repo ./demo-repo
COPY backend ./backend

WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
