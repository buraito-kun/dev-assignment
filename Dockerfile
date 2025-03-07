FROM node:22 AS build

WORKDIR /usr/app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

# --------------------------

FROM node:22-slim

WORKDIR /usr/app

COPY package.json .

RUN npm install --omit=dev

COPY --from=build /usr/app/dist /usr/app/dist

CMD [ "node", "dist/index.js" ]
