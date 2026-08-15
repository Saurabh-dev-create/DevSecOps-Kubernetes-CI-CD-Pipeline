FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force


FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk upgrade --no-cache

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY index.html ./

RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx

USER node

EXPOSE 3001

CMD ["./node_modules/.bin/serve", "-l", "3001", "."]
