exports.healthCheck = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      service: "backend",
      status: "healthy",
      timestamp: new Date(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};