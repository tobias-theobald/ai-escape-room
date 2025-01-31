FROM node:22-bookworm
WORKDIR /app

COPY ./package.json ./package-lock.json README /app/
RUN npm install
COPY ./src /app/src

CMD ["node", "src/bin/query.js"]