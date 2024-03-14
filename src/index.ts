import './apm';
import { config } from './config';
import { monitorQuote } from './app.controller';
import { IStartupService, StartupFactory } from '@frmscoe/frms-coe-startup-lib';
import { LoggerService } from '@frmscoe/frms-coe-lib';

export let server: IStartupService;
export const loggerService: LoggerService = new LoggerService(config.sidecarHost);

export const runServer = async (): Promise<void> => {
  server = new StartupFactory();
  if (config.nodeEnv !== 'test') {
    let isConnected = false;
    for (let retryCount = 0; retryCount < 10; retryCount++) {
      loggerService.log('Connecting to nats server...');
      if (!(await server.init(monitorQuote))) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        loggerService.log('Connected to nats');
        isConnected = true;
        break;
      }
    }

    if (!isConnected) {
      throw new Error('Unable to connect to nats after 10 retries');
    }
  }
};

process.on('uncaughtException', (err) => {
  loggerService.error(`process on uncaughtException error: ${err}`);
});

process.on('unhandledRejection', (err) => {
  loggerService.error(`process on unhandledRejection error: ${err}`);
});

(async () => {
  try {
    await runServer();
  } catch (err) {
    loggerService.error('Error while starting services', err);
    process.exit(1);
  }
})();
