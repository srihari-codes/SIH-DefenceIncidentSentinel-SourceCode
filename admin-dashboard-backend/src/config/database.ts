import mongoose from 'mongoose';
import logger from '../utils/logger';

const formatDbName = (dbName?: string) => (dbName ? ` (${dbName})` : '');

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URL;
  if (!mongoUri) {
    throw new Error('MONGODB_URL is not defined');
  }

  const dbName = process.env.MONGODB_DB_NAME;

  try {
    const connection = await mongoose.connect(mongoUri, {
      dbName
    });

    logger.info(`MongoDB connected${formatDbName(dbName)}`);
    return connection.connection;
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

export default connectDatabase;
