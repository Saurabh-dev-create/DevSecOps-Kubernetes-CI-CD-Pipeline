FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev \
    && npm cache clean --force

COPY . .

USER node

EXPOSE 3001

CMD ["npm", "start"]
