import mongoose from "mongoose";

export const connectDb = async (uri) => {
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

export const disconnectDb = async () => {
  await mongoose.disconnect();
};
