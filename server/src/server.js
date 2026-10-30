import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("Starting AI Mystery Room...");

    console.log(
      "Gemini API key available:",
      Boolean(process.env.GEMINI_API_KEY)
    );

    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `AI Mystery Room server running on port ${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();