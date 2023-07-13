export interface IConfig {
  functionName: string;
  nodeEnv: string;
  restPort: number;
  logstashUrl: string;
  apmLogging: boolean;
  apmSecretToken: string;
  apmURL: string;
  forwardRequest: boolean;
  forwardURL: string;
  sybrinBaseURL:string;
  sybrinUsername:string;
  sybrinPassword:string;
  sybrinEnvironmentID:string;
  nuxeoReport: boolean;
  nuxeoAuth: string;
  nuxeoHost: string;
  nuxeoFolderPath: string;
  nuxeoFolderId: string;
}
