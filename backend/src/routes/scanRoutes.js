import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  const { target } = req.body;

  res.json({
    success: true,
    message: "Scan started",
    target,
    ports: [22, 80, 443],
    vulnerabilities: [],
  });
});

export default router;