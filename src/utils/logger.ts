// SPDX-License-Identifier: Apache-2.0

import { config } from '../config';
import log4js from 'log4js';

if (config.nodeEnv !== 'dev' && config.nodeEnv !== 'test') {
  log4js.configure({
    appenders: {
      logstash: {
        type: '@log4js-node/logstash-http',
        url: `http://${config.logstashUrl}/_bulk`,
        application: 'logstash-log4js',
        logType: 'application',
        logChannel: config.functionName,
      },
    },
    categories: {
      default: { appenders: ['logstash'], level: 'info' },
    },
  });
}

const logger = config.nodeEnv === 'dev' || config.nodeEnv === 'test' ? console : log4js.getLogger();

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export abstract class LoggerService {
  static timeStamp(): string {
    const dateObj = new Date();

    let date = dateObj.toISOString();
    date = date.substring(0, date.indexOf('T'));

    const time = dateObj.toLocaleTimeString([], { hour12: false });

    return `${date} ${time}`;
  }

  static messageStamp(serviceOperation?: string): string {
    return `[${LoggerService.timeStamp()}][${config.functionName}${serviceOperation ? ' - ' + serviceOperation : ''}]`;
  }

  static trace(message: string, serviceOperation?: string): void {
    logger.trace(`${LoggerService.messageStamp(serviceOperation)}[TRACE] - ${message}`);
  }

  static log(message: string, serviceOperation?: string): void {
    logger.info(`${LoggerService.messageStamp(serviceOperation)}[INFO] - ${message}`);
  }

  static warn(message: string, serviceOperation?: string): void {
    logger.warn(`${LoggerService.messageStamp(serviceOperation)}[WARN] - ${message}`);
  }

  static error(message: string | Error, innerError?: unknown, serviceOperation?: string): void {
    let errMessage = typeof message === 'string' ? message : message.stack;

    if (innerError) {
      if (innerError instanceof Error) {
        errMessage += `\r\n${innerError.stack}`;
      }
    }

    logger.error(`${LoggerService.messageStamp(serviceOperation)}[ERROR] - ${errMessage}`);
  }
}
