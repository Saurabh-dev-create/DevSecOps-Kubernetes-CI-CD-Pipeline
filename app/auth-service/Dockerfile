FROM node:18

WORKDIR /app
COPY . .

RUN npm install

# Intentionally insecure
USER root

EXPOSE 3000

CMD ["node", "index.js"]