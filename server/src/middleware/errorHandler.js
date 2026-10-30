const errorHandler = (err, req, res, next) => {
  console.error("\n========== API ERROR ==========");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  console.error("================================\n");

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid identifier."
    });
  }

  // MongoDB validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Database validation failed."
    });
  }

  // Duplicate database entry
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate record."
    });
  }

  // Gemini timeout
  if (err.message?.includes("timed out")) {
    return res.status(504).json({
      success: false,
      message: "AI generation timed out. Please try again."
    });
  }

  // Gemini-related failures
  if (err.message?.startsWith("Gemini API error:")) {
    return res.status(502).json({
      success: false,
      message: "AI service is temporarily unavailable."
    });
  }

  // Other errors
  return res.status(500).json({
    success: false,
    message: "Internal server error. Please try again."
  });
};

export default errorHandler;