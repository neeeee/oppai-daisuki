import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ Connected to MongoDB successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Collection management utilities
 */
export const collections = {
  VIDEOS: "videos",
  PHOTOS: "photos",
  GALLERIES: "galleries",
  IDOLS: "idols",
  GENRES: "genres",
  NEWS: "news",
  USERS: "users",
  SESSIONS: "sessions",
  ACCOUNTS: "accounts",
  VERIFICATION_TOKENS: "verificationtokens",
};

/**
 * Database utilities
 */
export const dbUtils = {
  /**
   * Check if MongoDB connection is healthy
   */
  async isConnected() {
    try {
      const conn = await dbConnect();
      return conn.connection.readyState === 1;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  },

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const conn = await dbConnect();
      const db = conn.connection.db;
      const stats = await db.stats();
      return {
        database: db.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize,
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      return null;
    }
  },

  /**
   * Create indexes for better performance
   */
  async createIndexes() {
    try {
      const conn = await dbConnect();
      const db = conn.connection.db;

      // Create text indexes for search functionality
      await Promise.all([
        db.collection(collections.VIDEOS).createIndex({
          title: "text",
          channelName: "text",
        }),
        db.collection(collections.PHOTOS).createIndex({
          title: "text",
          description: "text",
          tags: "text",
        }),
        db.collection(collections.GALLERIES).createIndex({
          title: "text",
          description: "text",
          tags: "text",
        }),
        db.collection(collections.IDOLS).createIndex({
          name: "text",
          stageName: "text",
          bio: "text",
        }),
        db.collection(collections.NEWS).createIndex({
          title: "text",
          excerpt: "text",
          content: "text",
        }),
        db.collection(collections.GENRES).createIndex({
          name: "text",
          description: "text",
        }),
      ]);

      console.log("✅ Database indexes created successfully");
    } catch (error) {
      console.error("❌ Failed to create database indexes:", error);
    }
  },

  /**
   * Clean up database connections
   */
  async disconnect() {
    if (cached.conn) {
      await cached.conn.disconnect();
      cached.conn = null;
      cached.promise = null;
    }
  },
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("🟢 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟡 Mongoose disconnected from MongoDB");
});

// Handle process termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔴 Mongoose connection closed through app termination");
  process.exit(0);
});

export default dbConnect;
