import mongoose from 'mongoose';

let mongoMemoryServerInstance = null;

/**
 * Connect to MongoDB
 * Attempts to connect to the provided MONGO_URI. If connection fails
 * (e.g., local MongoDB service is not running), it falls back to an
 * in-memory MongoDB server in development mode (or local evaluation) so that the system remains fully functional.
 */
export const connectDB = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/employee_payroll_db';

    // Try connecting to configured MongoDB URI
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`⚠️ Could not connect to primary MongoDB (${err.message}).`);

    // In development, test, or local evaluation with localhost URI, fall back to mongodb-memory-server
    const isLocalHost = !process.env.MONGO_URI || process.env.MONGO_URI.includes('localhost') || process.env.MONGO_URI.includes('127.0.0.1');

    if (process.env.NODE_ENV !== 'production' || isLocalHost) {
      try {
        console.log('🔄 Initializing in-memory MongoDB server for demonstration / local testing...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServerInstance = await MongoMemoryServer.create();
        const memoryUri = mongoMemoryServerInstance.getUri();

        const conn = await mongoose.connect(memoryUri);
        console.log(`✅ Connected to in-memory MongoDB: ${conn.connection.host}`);
        return conn;
      } catch (memErr) {
        console.error(`❌ Failed to start in-memory MongoDB: ${memErr.message}`);
        throw memErr;
      }
    } else {
      console.error(`❌ Production MongoDB connection error: ${err.message}`);
      process.exit(1);
    }
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
    console.log('🔌 MongoDB Disconnected gracefully');
  } catch (err) {
    console.error(`Error during MongoDB disconnect: ${err.message}`);
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection lost');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB runtime error: ${err.message}`);
});

export default connectDB;
