ARG BUILD_IMAGE=node:20-bullseye
ARG RUN_IMAGE=gcr.io/distroless/nodejs20-debian11:nonroot

FROM ${BUILD_IMAGE} AS builder
LABEL stage=build
# TS -> JS stage

WORKDIR /home/app
COPY ./src ./src
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY .npmrc ./
ARG GH_TOKEN

RUN npm ci --ignore-scripts
RUN npm run build

FROM ${BUILD_IMAGE} AS dep-resolver
LABEL stage=pre-prod
# To filter out dev dependencies from final build

COPY package*.json ./
COPY .npmrc ./
ARG GH_TOKEN
RUN npm ci --omit=dev --ignore-scripts

FROM ${RUN_IMAGE} AS run-env
USER nonroot

WORKDIR /home/app
COPY --from=dep-resolver /node_modules ./node_modules
COPY --from=builder /home/app/build ./build
COPY package.json ./
COPY deployment.yaml ./
COPY service.yaml ./

# Turn down the verbosity to default level.
ENV NPM_CONFIG_LOGLEVEL warn

ENV mode="http"
ENV upstream_url="http://127.0.0.1:3000"

ENV prefix_logs="false"
# Service-Based Enviroment Variables
ENV FUNCTION_NAME="cms-service"
ENV NODE_ENV="production"
ENV REST_PORT=3000
ENV LOGSTASH_URL=logstash.development:8080
ENV LOGSTASH_LEVEL='info'
ENV APM_LOGGING=true
ENV APM_URL=http://apm-server.development:8200
ENV APM_SECRET_TOKEN=
ENV FORWARD_REQUEST=true
ENV FORWARD_URL=
ENV SYBRIN_BASE_URL=/Sybrin.Core.API/api
ENV SYBRIN_USERNAME=
ENV SYBRIN_PASSWORD=
ENV SYBRIN_ENVIRONMENT_ID=
ENV NUXEO_AUTH=
ENV NUXEO_HOST=
ENV NUXEO_FOLDER_PATH=
ENV NUXEO_FOLDER_ID=
ENV NUXEO_REPORT=false
# Nats
ENV STARTUP_TYPE=nats
ENV SERVER_URL=0.0.0.0:4222
ENV PRODUCER_STREAM=
ENV CONSUMER_STREAM=
ENV STREAM_SUBJECT=
ENV ACK_POLICY=Explicit
ENV PRODUCER_STORAGE=File
ENV PRODUCER_RETENTION_POLICY=Workqueue

ENV SIDECAR_HOST=0.0.0.0:5000

# Set healthcheck command
HEALTHCHECK --interval=3s CMD [ -e /tmp/.lock ] || exit 1

# Execute watchdog command
CMD ["build/index.js"]
