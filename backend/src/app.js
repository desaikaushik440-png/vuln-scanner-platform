import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

/*
========================
MIDDLEWARE
========================
*/

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan("dev"));

app.use(express.json());

/*
========================
ROOT ROUTE
========================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Vulnerability Scanner Backend Running",
  });
});

/*
========================
HEALTH ROUTE
========================
*/

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    message: "Backend healthy",
  });
});

/*
========================
REAL SCAN ROUTE
========================
*/

app.post("/api/scan", async (req, res) => {
  console.log("SCAN REQUEST RECEIVED");

  try {
    const { target } = req.body;

    /*
    ========================
    VALIDATION
    ========================
    */

    if (!target || target.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Target is required",
      });
    }

    /*
    ========================
    CALL SCANNER ENGINE
    ========================
    */

    const response = await fetch(
      "http://scanner-engine:8000/scan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target,
        }),
      }
    );

    /*
    ========================
    HANDLE ENGINE ERRORS
    ========================
    */

    if (!response.ok) {
      const errorText = await response.text();

      console.error("SCANNER ENGINE ERROR:", errorText);

      return res.status(response.status).json({
        success: false,
        message: "Scanner engine failed",
        error: errorText,
      });
    }

    /*
    ========================
    GET RESULT
    ========================
    */

    const scanResult = await response.json();

    console.log("SCAN RESULT:", scanResult);

    /*
    ========================
    RETURN REAL RESULT
    ========================
    */

    return res.status(200).json(scanResult);

  } catch (error) {
    console.error("SCAN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/*
========================
404 ROUTE
========================
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
========================
EXPORT APP
========================
*/

export default app;