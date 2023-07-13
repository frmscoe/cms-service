import axios from 'axios';
import { Context } from 'koa';
import { config } from './config';
import { sendReportResult } from './services/nuxeo';
import { LoggerService } from './utils';

export const monitorQuote = async (ctx: Context): Promise<Context> => {
  try {
    const request = ctx.request.body ?? JSON.parse('');
    if (request.typologyResult)
      LoggerService.log(
        `CMS received Interdiction from Typology ${request?.typologyResult?.id ?? 0}@${request?.typologyResult?.cfg ?? 0} - Score: ${
          request?.typologyResult?.result ?? 0
        }, Threshold: ${request?.typologyResult?.threshold ?? 0}.`,
      );
    else {
      LoggerService.log('CMS received request from TADP.');

      if (config.nuxeoReport) {
        try {
          LoggerService.log('Start - Execute Nuxeo report request');
          await sendReportResult(request);
        } catch (err) {
          const failMsg = 'Failed to send report';
          LoggerService.error(failMsg, err, 'executeController');
        } finally {
          LoggerService.log('END - Execute Nuxeo report request');
        }
      }

      if (config.forwardRequest) {
        try {
          LoggerService.log('Start - Execute Sybrin request');
          const token = await sendAuthRequest();
          const toSend = {
            ProcessID: 'a8868aed-e1a8-4ca8-88e5-da8d4b5df94d',
            MicroFlowName: 'ReceiveAlert',
            BaseUrl: config.sybrinBaseURL,
            Token: token,
            Data: [
              {
                properties: request,
              },
            ],
          };
          await executePost(config.forwardURL, toSend);
        } catch (error) {
          LoggerService.error('Failed to forward to Sybrin');
        } finally {
          LoggerService.log('Start - Execute Sybrin request');
        }
      }
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Transaction is valid',
      data: request,
    };
  } catch (error) {
    LoggerService.log(error as string);

    ctx.status = 500;
    ctx.body = {
      error: error,
    };
  }
  return ctx;
};

const executePost = async (endpoint: string, request: any) => {
  try {
    const cmsRes = await axios.post(endpoint, request);
    if (cmsRes.status !== 200 && cmsRes.status !== 201) {
      LoggerService.error(`CMS Response unsuccessful with StatusCode: ${cmsRes.status}, request:\r\n${request}`);
    }
  } catch (error) {
    LoggerService.error(`Error while sending request to CMS at ${endpoint ?? ''} with message: ${error}`);
    LoggerService.trace(`CMS Error Request:\r\n${request}`);
  }
};

const sendAuthRequest = async () => {
  try {
    const request = {
      username: config.sybrinUsername,
      password: config.sybrinPassword,
      environmentID: config.sybrinEnvironmentID,
    };
    const response = await axios.post(`${config.sybrinBaseURL}/Logon/Logon`, request);
    if (response.status == 200) return response.data.tokenString;
    else throw new Error(response.data);
  } catch (error) {
    LoggerService.error(`Error while logging on to Sybrin with message: ${error}`);
    throw error;
  }
};
