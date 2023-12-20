ARG BASE_IMAGE=node:20.9.0-bullseye-slim
ARG PROJECT_NAME=api-server

FROM $BASE_IMAGE as deps
ARG PROJECT_NAME
RUN corepack enable && corepack prepare pnpm@8.12.1 --activate
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        openssh-client \
        build-essential\
        make \
        gcc \
        python3 \
        python3-pip \
        python3-setuptools \
        python3-wheel && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY dist/packages/apps/$PROJECT_NAME/package.json dist/packages/apps/$PROJECT_NAME/pnpm-lock.yaml /build/
RUN pnpm install && \
    du -hs node_modules

# Production image, copy all the files and run nest
FROM $BASE_IMAGE as runner
ARG PROJECT_NAME
WORKDIR /app
ENV NODE_ENV production
COPY --from=deps /build/node_modules /app/node_modules
COPY --from=deps /build/package.json /app/package.json
COPY dist/packages/apps/$PROJECT_NAME /app/
RUN chown -R node:node .
USER node
CMD ["node", "main.js"]
