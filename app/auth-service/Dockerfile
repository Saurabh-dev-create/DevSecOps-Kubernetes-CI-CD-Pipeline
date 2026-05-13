# FROM node:18

# WORKDIR /app
# COPY . .

# RUN npm install

# # Intentionally insecure
# USER root

# EXPOSE 3000

# CMD ["node", "index.js"]
# Above is intentinal insecure dockerfile to check Trivy working
FROM node:18-slim 

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

USER node

EXPOSE 3000

CMD ["node", "index.js"]