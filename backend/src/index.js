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
  } catch (err) { res.status(500).json({ success: false, message: "Registration failed" }); }
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
  } catch (err) { res.status(500).json({ success: false, message: "Login failed" }); }
});

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Unauthorized" });
  try { req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET || "secret"); next(); }
  catch { res.status(401).json({ success: false, message: "Invalid token" }); }
};

const parseNmapOutput = (output) => {
  const ports = [];
  for (const line of output.split("\n")) {
    const match = line.match(/^(\d+)\/(tcp|udp)\s+(open|filtered|closed)\s+(\S+)\s*(.*)$/);
    if (match) ports.push({ port: match[1], proto: match[2], state: match[3], service: match[4], version: match[5].trim() });
  }
  return ports;
};

const vulnDb = {
  "21":    { title: "FTP Open",              severity: "High",     cve: "CVE-2011-2523",  score: 25, description: "FTP transmits credentials in plaintext. Risk of brute force." },
  "22":    { title: "SSH Exposed",           severity: "Medium",   cve: "CVE-2023-38408", score: 15, description: "SSH open to public. Use key-based auth only." },
  "23":    { title: "Telnet Open",           severity: "Critical", cve: "CVE-2020-10188", score: 40, description: "Telnet transmits data in plaintext. Disable immediately." },
  "25":    { title: "SMTP Open",             severity: "Medium",   cve: "CVE-2020-7247",  score: 15, description: "SMTP exposed. Risk of open relay abuse." },
  "80":    { title: "HTTP Unencrypted",      severity: "Low",      cve: "CVE-2021-41773", score: 8,  description: "Unencrypted HTTP. Redirect all traffic to HTTPS." },
  "443":   { title: "HTTPS Open",            severity: "Info",     cve: null,             score: 2,  description: "HTTPS running. Verify SSL/TLS version and cipher strength." },
  "3306":  { title: "MySQL Exposed",         severity: "Critical", cve: "CVE-2012-2122",  score: 40, description: "MySQL publicly exposed. Restrict to localhost immediately." },
  "5432":  { title: "PostgreSQL Exposed",    severity: "Critical", cve: "CVE-2019-10164", score: 40, description: "PostgreSQL exposed. Restrict to trusted IPs only." },
  "6379":  { title: "Redis Exposed",         severity: "Critical", cve: "CVE-2022-0543",  score: 40, description: "Redis without auth. Can lead to full system compromise." },
  "8080":  { title: "HTTP Proxy Open",       severity: "Medium",   cve: null,             score: 15, description: "Alt HTTP port open. Often misconfigured dev servers." },
  "8443":  { title: "HTTPS Alt Port",        severity: "Low",      cve: null,             score: 8,  description: "Alt HTTPS port. Verify certificate validity." },
  "27017": { title: "MongoDB Exposed",       severity: "Critical", cve: "CVE-2017-15535", score: 40, description: "MongoDB exposed with no auth by default." },
};

const SCAN_TYPES = {
  quick:  { flags: "-sT -Pn --open -p 21,22,23,25,80,443,3306,5432,6379,8080,8443,27017", label: "Quick Scan",  desc: "Common ports only (~5s)" },
  full:   { flags: "-sT -Pn --open -p 1-1000", label: "Full Scan", desc: "Top 1000 ports (~30s)" },
  stealth:{ flags: "-sT -Pn --open -p 21,22,23,25,53,80,110,143,443,445,3306,3389,5432,6379,8080,8443,8888,27017", label: "Stealth Scan", desc: "Common attack surfaces (~10s)" },
};

const calculateRiskScore = (ports, vulns) => {
  let score = 0;
  for (const v of vulns) {
    const db = Object.values(vulnDb).find(d => d.title === v.title);
    if (db) score += db.score;
  }
  score += ports.filter(p => p.state === "open").length * 2;
  return Math.min(score, 100);
};

const getRiskLevel = (score) => {
  if (score >= 70) return { label: "CRITICAL", color: "#ef4444" };
  if (score >= 45) return { label: "HIGH",     color: "#f97316" };
  if (score >= 20) return { label: "MEDIUM",   color: "#eab308" };
  if (score >= 5)  return { label: "LOW",      color: "#22c55e" };
  return                   { label: "SAFE",    color: "#3b82f6" };
};

// Real CVE lookup from NVD API
const lookupCVE = async (cveId) => {
  try {
    const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`, { headers: { "User-Agent": "VulnScanner/1.0" } });
    const data = await res.json();
    const vuln = data?.vulnerabilities?.[0]?.cve;
    if (!vuln) return null;
    const cvss = vuln.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore
               || vuln.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore
               || null;
    const desc = vuln.descriptions?.find(d => d.lang === "en")?.value || null;
    return { cvssScore: cvss, description: desc };
  } catch { return null; }
};

app.get("/api/cve/:cveId", authMiddleware, async (req, res) => {
  const data = await lookupCVE(req.params.cveId);
  if (!data) return res.status(404).json({ success: false, message: "CVE not found" });
  res.json({ success: true, ...data });
});

app.post("/api/scan", authMiddleware, async (req, res) => {
  const { target, scanType = "quick" } = req.body;
  if (!target) return res.status(400).json({ success: false, message: "Target required" });
  const safeTarget = target.replace(/[^a-zA-Z0-9.\-_]/g, "");
  const scan = SCAN_TYPES[scanType] || SCAN_TYPES.quick;

  try {
    const { stdout } = await execAsync(`nmap ${scan.flags} ${safeTarget}`, { timeout: 90000 });
    const ports = parseNmapOutput(stdout);
    const vulns = ports.filter(p => p.state === "open" && vulnDb[p.port]).map(p => vulnDb[p.port]);

    // Enrich with live CVE data
    const enrichedVulns = await Promise.all(vulns.map(async (v) => {
      if (!v.cve) return v;
      const live = await lookupCVE(v.cve);
      return { ...v, cvssScore: live?.cvssScore || null, liveDescription: live?.description || null };
    }));

    const riskScore = calculateRiskScore(ports, vulns);
    const riskLevel = getRiskLevel(riskScore);

    const scanResult = { success: true, target: safeTarget, scanType, scanTypeLabel: scan.label, scan_result: stdout, ports, vulnerabilities: enrichedVulns, riskScore, riskLevel };

    const saved = await pool.query(
      "INSERT INTO scans (target, result, status, user_id) VALUES ($1,$2,$3,$4) RETURNING id",
      [safeTarget, JSON.stringify(scanResult), "completed", req.user.id]
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
      "SELECT id, target, status, result->>'riskScore' as risk_score, result->>'scanTypeLabel' as scan_type, created_at as \"createdAt\" FROM scans WHERE user_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ success: true, scans: result.rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get("/api/scans/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scans WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    const scan = result.rows[0];
    const data = scan.result || {};
    const risk = data.riskLevel || { label: "UNKNOWN" };
    const lines = [
      "VULNSCANNER SECURITY REPORT", "===========================",
      "Target     : " + scan.target,
      "Scan Type  : " + (data.scanTypeLabel || "Quick"),
      "Risk Score : " + (data.riskScore || 0) + "/100 [" + risk.label + "]",
      "Date       : " + new Date(scan.created_at).toLocaleString(),
      "Scan ID    : " + scan.id,
      "", "OPEN PORTS", "----------",
    ];
    (data.ports || []).forEach(p => lines.push(`${p.port}/${p.proto}  ${p.state}  ${p.service}  ${p.version}`));
    lines.push("", "VULNERABILITIES", "---------------");
    (data.vulnerabilities || []).forEach(v => {
      lines.push(`[${v.severity}] ${v.title}`);
      if (v.cve) lines.push(`CVE: ${v.cve}${v.cvssScore ? " | CVSS: " + v.cvssScore : ""}`);
      lines.push(v.liveDescription || v.description, "");
    });
    lines.push("RAW NMAP OUTPUT", "---------------", data.scan_result || "");
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename=vuln-report-${scan.id}.txt`);
    res.send(lines.join("\n"));
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`Backend running on port ${PORT}`));
