FROM node:latest

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run prisma:gen

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]