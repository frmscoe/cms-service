import axios from 'axios';
import { loggerService } from '.';
import { config } from './config';
import { sendReportResult } from './services/nuxeo';

export const monitorQuote = async (reqObj: unknown): Promise<void> => {
  try {
    const request = reqObj ?? JSON.parse('');
    if (request.typologyResult)
      loggerService.log(
        `CMS received Interdiction from Typology ${request?.typologyResult?.id ?? 0}@${request?.typologyResult?.cfg ?? 0} - Score: ${request?.typologyResult?.result ?? 0
        }, Threshold: ${request?.typologyResult?.threshold ?? 0}.`,
      );
    else {
      loggerService.log('CMS received request from TADP.');

      if (config.nuxeoReport) {
        try {
          loggerService.log('Start - Execute Nuxeo report request');
          await sendReportResult(request);
        } catch (err) {
          const failMsg = 'Failed to send report';
          loggerService.error(failMsg, err, 'executeController');
        } finally {
          loggerService.log('END - Execute Nuxeo report request');
        }
      }

      if (config.forwardRequest) {
        try {
          loggerService.log('Start - Execute Sybrin request');
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
          loggerService.error('Failed to forward to Sybrin');
        } finally {
          loggerService.log('Start - Execute Sybrin request');
        }
      }
    }

  } catch (error) {
    loggerService.log(error as string);
  }
};

const executePost = async (endpoint: string, request: unknown) => {
  try {
    const cmsRes = await axios.post(endpoint, request);
    if (cmsRes.status !== 200 && cmsRes.status !== 201) {
      loggerService.error(`CMS Response unsuccessful with StatusCode: ${cmsRes.status}, request:\r\n${request}`);
    }
  } catch (error) {
    loggerService.error(`Error while sending request to CMS at ${endpoint ?? ''} with message: ${error}`);
  } finally {
    loggerService.trace(`CMS Error Request:\r\n${request}`);
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
    if (response.status === 200) return response.data.tokenString;
    else throw new Error(response.data);
  } catch (error) {
    loggerService.error(`Error while logging on to Sybrin with message: ${error}`);
    throw error;
  }
};
