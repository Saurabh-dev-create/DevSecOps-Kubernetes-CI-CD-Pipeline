FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY index.js .

USER node

EXPOSE 3000

CMD ["node", "index.js"]
