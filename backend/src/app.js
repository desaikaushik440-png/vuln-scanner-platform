import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/scans", async (req, res) => {
  res.json({ success: true, scans: [] });
});

app.post("/api/scan", async (req, res) => {
  res.json({ success: true, message: "Scanner not available in production yet" });
});

export default app;
