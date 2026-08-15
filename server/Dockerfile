FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma engine on Alpine Linux
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
