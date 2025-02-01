FROM node:22-bookworm
WORKDIR /app

# install docker cli
RUN curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh ./get-docker.sh && \
    rm ./get-docker.sh

COPY ./package.json ./package-lock.json /app/
RUN npm install
COPY ./src /app/src
COPY README /app

CMD ["node", "src/bin/query.js"]