FROM node:lts-stretch

LABEL project-name ='Permit2'

WORKDIR /home/permit/

RUN chown -R 1001:1001 /home/permit/

COPY node_modules/ ./node_modules/
COPY dist/src ./
COPY dist/conf ./conf
COPY package.json ./
COPY version.json ./

EXPOSE 8080

USER 1001

ENTRYPOINT ["node", "./index.js"]