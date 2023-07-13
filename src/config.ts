/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'path';
import { config as dotenv } from 'dotenv';
import { IConfig } from './interfaces';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv({
  path: path.resolve(__dirname, '../.env'),
});

const config: IConfig = {
  functionName: <string>process.env.FUNCTION_NAME,
  nodeEnv: <string>process.env.NODE_ENV,
  restPort: parseInt(process.env.REST_PORT!, 10) || 3000,
  logstashUrl: <string>process.env.LOGSTASH_URL,
  apmLogging: <boolean>(process.env.APM_LOGGING === 'true'),
  apmSecretToken: <string>process.env.APM_SECRET_TOKEN,
  apmURL: <string>process.env.APM_URL,
  forwardRequest: <boolean>(process.env.FORWARD_REQUEST === 'true'),
  forwardURL: <string>process.env.FORWARD_URL,
  sybrinBaseURL: <string>process.env.SYBRIN_BASE_URL,
  sybrinUsername: <string>process.env.SYBRIN_USERNAME,
  sybrinPassword: <string>process.env.SYBRIN_PASSWORD,
  sybrinEnvironmentID: <string>process.env.SYBRIN_ENVIRONMENT_ID,
  nuxeoReport: <boolean>(process.env.NUXEO_RERPORT === 'true'),
  nuxeoAuth: <string>process.env.NUXEO_AUTH,
  nuxeoHost: <string>process.env.NUXEO_HOST,
  nuxeoFolderPath: <string>process.env.NUXEO_FOLDER_PATH,
  nuxeoFolderId: <string>process.env.NUXEO_FOLDER_ID,
};

export { config };
