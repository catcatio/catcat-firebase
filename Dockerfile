FROM node:8-alpine
ENV NODE_ENV develop

RUN apk add --no-cache \
    build-base \
    g++ \
    python \
    curl

RUN mkdir -p /usr/app \
    && npm i -g nodemon firebase-tools

WORKDIR /usr/app
VOLUME ["/usr/app"]
