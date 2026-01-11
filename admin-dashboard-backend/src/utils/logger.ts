import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.simple()),
  transports: [new transports.Console()],
});

export default logger;
