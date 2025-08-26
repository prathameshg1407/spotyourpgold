import mongoose from 'mongoose';

// Global connection tracking for serverless
let isConnected = false;
let connectionPromise = null;

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  // Return existing connection promise to avoid race conditions
  if (connectionPromise) {
    return connectionPromise;
  }

  // Check if already connected and connection is ready
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB is already connected');
    return Promise.resolve();
  }

  try {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: "sypg",

      // ✅ Critical timeout configurations for Vercel
      serverSelectionTimeoutMS: 8000,   // Timeout after 8s instead of 30s
      socketTimeoutMS: 8000,            // Close sockets after 8s of inactivity
      connectTimeoutMS: 8000,           // Give up initial connection after 8s

      // ✅ Connection pool optimization for serverless
      maxPoolSize: 5,                   // Limit connections per instance
      minPoolSize: 1,                   // Keep minimum connections
      maxIdleTimeMS: 30000,             // Close connections after 30s idle

      // ✅ Performance optimizations
      autoIndex: false,                 // Don't build indexes in production
      bufferCommands: false,            // Disable mongoose buffering
      bufferMaxEntries: 0,              // Disable mongoose buffering

      // ✅ Reliability settings
      retryWrites: true,                // Retry failed writes
      retryReads: true,                 // Retry failed reads

      // ✅ Heartbeat optimization
      heartbeatFrequencyMS: 10000,      // Check server every 10s
    });

    await connectionPromise;
    isConnected = true;

    console.log('MongoDB connected successfully');

    // ✅ Handle connection events for better debugging
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
      connectionPromise = null;
    });

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
      connectionPromise = null;
    });

    return connectionPromise;

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    isConnected = false;
    connectionPromise = null;
    throw error; // Re-throw to handle in API routes
  }
}



