# syntax=docker/dockerfile:1
# Development image for the Racletty frontend and Workshop styling.
FROM node:22-bookworm-slim

WORKDIR /workspace/Frontend

ENV NODE_ENV=development \
    CHOKIDAR_USEPOLLING=true

COPY Frontend/package.json Frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund && npm cache clean --force

COPY Frontend /workspace/Frontend
COPY ["Frontend 2", "/workspace/Frontend 2"]

EXPOSE 5385

# The development node_modules directory is a persistent Compose volume. Keep it
# synchronized with the bind-mounted lockfile whenever the container starts so a
# dependency change does not leave Vite running against a stale volume.
CMD ["sh", "-c", "npm install --no-audit --no-fund && npm run dev"]
