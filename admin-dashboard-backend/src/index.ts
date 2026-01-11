import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDatabase from './config/database';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
