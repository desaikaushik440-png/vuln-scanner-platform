# 🛡️ VulnScanner — Cybersecurity Vulnerability Scanner Platform

A full-stack SaaS cybersecurity platform for real-time vulnerability scanning.

🔗 **Live Demo**: https://diligent-friendship-production.up.railway.app

## Features
- ✅ JWT Authentication (Register/Login)
- ✅ Real Nmap TCP scanning
- ✅ CVE detection with live CVSS scores from NVD
- ✅ Risk Score (0-100) per scan
- ✅ Quick + Stealth scan modes
- ✅ Scan history + exportable reports
- ✅ Dark/Light mode
- ✅ Mobile responsive

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Scanner | Nmap |
| Auth | JWT + bcrypt |
| Deploy | Docker, Railway |

## Screenshots
> Login → Scan → Results with CVEs → Export Report

## Run Locally
```bash
git clone https://github.com/desaikaushik440-png/vuln-scanner-platform
cd vuln-scanner-platform
docker compose up -d
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login + JWT |
| POST | /api/scan | Run Nmap scan |
| GET | /api/scans | Scan history |
| GET | /api/scans/:id/pdf | Export report |

## Author
Kaushik Jayshingdesai
