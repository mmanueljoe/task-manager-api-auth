import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env["MONGODB_URI"]) {
    console.error("Database URI is not defined");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env["MONGODB_URI"]);
    console.log("Connected to Database...");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
