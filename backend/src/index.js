import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const { Pool } = pg;
const app = express();

app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'VIEWER',
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    target TEXT NOT NULL,
    result JSONB,
    status TEXT DEFAULT 'completed',
    user_id TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
`).then(() => console.log("DB ready")).catch(e => console.error("DB error:", e.message));

app.get("/api/health", (req, res) => res.json({ status: "OK" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ success: false, message: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, email, role",
      [name, email, hashed, role || "VIEWER"]
    );
    res.status(201).json({ success: true, message: "User registered successfully", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET || "secret");
    next();
  } catch { res.status(401).json({ success: false, message: "Invalid token" }); }
};

const parseNmapOutput = (output) => {
  const ports = [];
  const lines = output.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\d+)\/(tcp|udp)\s+(open|filtered|closed)\s+(\S+)(.*)$/);
    if (match) {
      ports.push({
        port: match[1],
        proto: match[2],
        state: match[3],
        service: match[4],
        version: match[5].trim()
      });
    }
  }
  return ports;
};

const getVulnerabilities = (ports) => {
  const vulns = [];
  const vulnDb = {
    "21": { title: "FTP Open", severity: "High", cve: "CVE-2011-2523", description: "FTP port open. Credentials sent in plaintext. Risk of brute force and sniffing attacks." },
    "22": { title: "SSH Exposed", severity: "Medium", cve: "CVE-2023-38408", description: "SSH port open to public. Ensure key-based auth only. Disable root login." },
    "23": { title: "Telnet Open", severity: "Critical", cve: "CVE-2020-10188", description: "Telnet transmits data in plaintext including credentials. Immediately disable." },
    "25": { title: "SMTP Open", severity: "Medium", cve: "CVE-2020-7247", description: "SMTP port exposed. Risk of open relay and spam abuse." },
    "80": { title: "HTTP Unencrypted", severity: "Low", cve: "CVE-2021-41773", description: "Unencrypted HTTP traffic. Redirect all HTTP to HTTPS to prevent MITM attacks." },
    "443": { title: "HTTPS Open", severity: "Info", cve: null, description: "HTTPS running. Check SSL/TLS version and cipher suites for weak configurations." },
    "3306": { title: "MySQL Exposed", severity: "Critical", cve: "CVE-2012-2122", description: "MySQL database port publicly exposed. Restrict to localhost immediately." },
    "5432": { title: "PostgreSQL Exposed", severity: "Critical", cve: "CVE-2019-10164", description: "PostgreSQL port publicly exposed. Restrict access to trusted IPs only." },
    "6379": { title: "Redis Exposed", severity: "Critical", cve: "CVE-2022-0543", description: "Redis port exposed without auth. Can lead to full system compromise." },
    "8080": { title: "HTTP Proxy Open", severity: "Medium", cve: null, description: "Alternative HTTP port open. Often used by dev servers without proper security." },
    "8443": { title: "HTTPS Alt Port", severity: "Low", cve: null, description: "Alternative HTTPS port open. Verify SSL certificate validity." },
    "27017": { title: "MongoDB Exposed", severity: "Critical", cve: "CVE-2017-15535", description: "MongoDB port exposed. No auth by default. Critical data exposure risk." },
  };
  for (const p of ports) {
    if (p.state === "open" && vulnDb[p.port]) {
      vulns.push(vulnDb[p.port]);
    }
  }
  return vulns;
};

app.post("/api/scan", authMiddleware, async (req, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).json({ success: false, message: "Target required" });

  const safetarget = target.replace(/[^a-zA-Z0-9.\-_]/g, "");

  try {
    const { stdout, stderr } = await execAsync(
      `nmap -sV -T4 --open ${safetarget}`,
      { timeout: 60000 }
    );

    const output = stdout || stderr;
    const ports = parseNmapOutput(output);
    const vulnerabilities = getVulnerabilities(ports);

    const scanResult = {
      success: true,
      target: safetarget,
      scan_result: output,
      ports,
      vulnerabilities
    };

    const saved = await pool.query(
      "INSERT INTO scans (target, result, status, user_id) VALUES ($1,$2,$3,$4) RETURNING id",
      [safetarget, JSON.stringify(scanResult), "completed", req.user.id]
    );

    res.json({ ...scanResult, scanId: saved.rows[0].id });
  } catch (err) {
    console.error("Scan error:", err.message);
    res.status(500).json({ success: false, error: "Scan failed: " + err.message });
  }
});

app.get("/api/scans", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, target, status, created_at as \"createdAt\" FROM scans WHERE user_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ success: true, scans: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/scans/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM scans WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    const scan = result.rows[0];
    const data = scan.result || {};
    const lines = [
      "VULNSCANNER SECURITY REPORT",
      "===========================",
      "Target   : " + scan.target,
      "Date     : " + new Date(scan.created_at).toLocaleString(),
      "Status   : " + scan.status.toUpperCase(),
      "Scan ID  : " + scan.id,
      "",
      "OPEN PORTS",
      "----------",
    ];
    (data.ports || []).forEach(p => {
      lines.push(`${p.port}/${p.proto}  ${p.state}  ${p.service}  ${p.version}`);
    });
    lines.push("", "VULNERABILITIES", "---------------");
    (data.vulnerabilities || []).forEach(v => {
      lines.push(`[${v.severity}] ${v.title}`);
      if (v.cve) lines.push(`CVE: ${v.cve}`);
      lines.push(v.description);
      lines.push("");
    });
    lines.push("RAW NMAP OUTPUT", "---------------", data.scan_result || "");
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename=vuln-report-${scan.id}.txt`);
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Backend running on port ${PORT}`));
