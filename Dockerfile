FROM node:22.14.0-alpine

WORKDIR /appeal

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]