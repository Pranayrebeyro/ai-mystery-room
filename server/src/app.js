import express from "express";
import cors from "cors";

import caseRoutes from "./routes/caseRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Mystery Room API is running"
  });
});

// Case routes
app.use("/api/cases", caseRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;