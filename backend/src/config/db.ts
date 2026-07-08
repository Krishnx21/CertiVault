import mongoose from "mongoose";

export const connectDB = async (uri: string): Promise<typeof mongoose> => {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
};
