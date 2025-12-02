# cell

# OS
FROM node:24-alpine

# allow node user to open port 80
RUN apk add libcap && setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

# home directory
WORKDIR /home/app

# node packages
COPY package.json .
RUN npm install -g pm2 && \
	npm install --production --no-package-lock

# copy app
COPY . .

# last build id (automated stem git commit)
ARG build_id
ENV BUILD_ID=$build_id

# switch user
USER node

# start
CMD pm2-runtime init.js
