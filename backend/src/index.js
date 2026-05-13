import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
  });
});

app.options("/api/scan", cors());

app.post("/api/scan", (req, res) => {
  console.log("SCAN WORKING");

  res.status(200).json({
    success: true,
    target: req.body.target,
    ports: [21, 22, 80, 443],
    vulnerabilities: [
      {
        severity: "Medium",
        title: "Open Port",
      },
    ],
  });
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on ${PORT}`);
});