import mongoose from "mongoose";

export async function connect() {
  const shouldSkip = process.env.SKIP_DB_CONNECT === "true";

  if (shouldSkip) {
    console.log("Skipping MongoDB connection during build...");
    return;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    connection.on('error', (err) => {
      console.log("MongoDB connection error: " + err);
      process.exit(1);
    });

  } catch (error) {
    console.log("MongoDB connection failed!");
    console.log(error);
  }
}
