FROM node:20-alpine

RUN apk add --no-cache nmap nmap-scripts

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/index.js"]
