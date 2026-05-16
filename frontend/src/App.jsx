import { useState, useEffect } from "react";

const API = "https://vuln-scanner-platform-production.up.railway.app";

const SEVERITY = {
  Critical: { color: "#ff4757", bg: "rgba(255,71,87,0.08)",   border: "rgba(255,71,87,0.25)"   },
  High:     { color: "#ff6b35", bg: "rgba(255,107,53,0.08)",  border: "rgba(255,107,53,0.25)"  },
  Medium:   { color: "#ffd32a", bg: "rgba(255,211,42,0.08)",  border: "rgba(255,211,42,0.25)"  },
  Low:      { color: "#2ed573", bg: "rgba(46,213,115,0.08)",  border: "rgba(46,213,115,0.25)"  },
  Info:     { color: "#1e90ff", bg: "rgba(30,144,255,0.08)",  border: "rgba(30,144,255,0.25)"  },
};

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email: form.email, password: form.password } : { ...form, role: "VIEWER" };
    try {
      const res = await fetch(API + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      if (isLogin) onLogin(data.token, data.user);
      else { setIsLogin(true); setError("Account created! Please login."); }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif", padding: "20px", position: "relative", overflow: "hidden" }}>
      {/* BG GRID */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)", backgroundSize: "40px 40px", zIndex: 0 }} />
      {/* GLOW */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse,rgba(99,102,241,0.15) 0%,transparent 70%)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: "20px", fontSize: "32px", marginBottom: "16px", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>🛡️</div>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: "800", margin: "0 0 6px", letterSpacing: "-0.5px" }}>VulnScanner</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", margin: 0 }}>Cybersecurity Intelligence Platform</p>
        </div>

        {/* CARD */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "32px", backdropFilter: "blur(20px)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
          {/* TABS */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px", marginBottom: "28px" }}>
            {["Login","Register"].map((t, i) => (
              <button key={t} onClick={() => { setIsLogin(i === 0); setError(""); }}
                style={{ flex: 1, padding: "10px", background: (isLogin ? i===0 : i===1) ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s", boxShadow: (isLogin ? i===0 : i===1) ? "0 4px 15px rgba(99,102,241,0.3)" : "none" }}>
                {t}
              </button>
            ))}
          </div>

          {!isLogin && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>FULL NAME</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe"
                style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box", transition: "border 0.2s" }} />
            </div>
          )}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>EMAIL</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>PASSWORD</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: error.includes("created") ? "rgba(46,213,115,0.1)" : "rgba(255,71,87,0.1)", border: "1px solid " + (error.includes("created") ? "rgba(46,213,115,0.3)" : "rgba(255,71,87,0.3)"), borderRadius: "10px", color: error.includes("created") ? "#2ed573" : "#ff4757", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "12px", color: "white", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 25px rgba(99,102,241,0.4)", transition: "all 0.2s", letterSpacing: "0.3px" }}>
            {loading ? "Authenticating..." : isLogin ? "Sign In →" : "Create Account →"}
          </button>
        </div>

        <p style={{ color: "rgba(255,255,255,0.2)", textAlign: "center", fontSize: "12px", marginTop: "20px" }}>
          Secured with JWT · End-to-end encrypted
        </p>
      </div>
    </div>
  );
}

function RiskMeter({ score, level }) {
  const colors = { CRITICAL: "#ff4757", HIGH: "#ff6b35", MEDIUM: "#ffd32a", LOW: "#2ed573", SAFE: "#1e90ff" };
  const color = colors[level?.label] || "#1e90ff";
  const circumference = 2 * Math.PI * 45;
  return (
    <div style={{ textAlign: "center", padding: "24px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.06)", minWidth: "150px" }}>
      <div style={{ position: "relative", display: "inline-block", marginBottom: "12px" }}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="55" cy="55" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
            strokeLinecap="round" transform="rotate(-90 55 55)"
            style={{ transition: "stroke-dasharray 1.2s ease", filter: "drop-shadow(0 0 6px " + color + ")" }} />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "900", color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>/100</div>
        </div>
      </div>
      <div style={{ fontSize: "11px", fontWeight: "800", color, letterSpacing: "2px" }}>{level?.label || "SAFE"}</div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>Risk Score</div>
    </div>
  );
}

function ScannerPage({ token, user, onLogout }) {
  const [page, setPage] = useState("scan");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [scanId, setScanId] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [scanLog, setScanLog] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const res = await fetch(API + "/api/scans", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (data.success) setHistory(data.scans);
    } catch (e) { console.error(e); }
    setHistLoading(false);
  };

  useEffect(() => { if (page === "history") fetchHistory(); }, [page]);

  const handleScan = async () => {
    if (!target.trim()) return;
    setLoading(true); setError(""); setResult(null); setScanId(null); setScanLog([]);
    const logs = ["Initializing scan engine...", "Resolving target: " + target, "Running TCP port scan...", "Probing open ports...", "Looking up CVE database...", "Calculating risk score..."];
    let i = 0;
    const iv = setInterval(() => { if (i < logs.length) { setScanLog(p => [...p, logs[i]]); i++; } else clearInterval(iv); }, 600);
    try {
      const res = await fetch(API + "/api/scan", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ target: target.trim(), scanType: "quick" }) });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      clearInterval(iv); setScanLog(p => [...p, "✓ Scan complete"]);
      setResult(data); if (data.scanId) setScanId(data.scanId);
    } catch (err) { clearInterval(iv); setError(err.message); }
    setLoading(false);
  };

  const downloadReport = async (id) => {
    const res = await fetch(API + "/api/scans/" + id + "/pdf", { headers: { Authorization: "Bearer " + token } });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "vuln-report-" + id + ".txt"; a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", color: "white", fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* BG */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse,rgba(99,102,241,0.08) 0%,transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

      {/* TOPBAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(7,11,20,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "18px", padding: "4px", display: "flex" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🛡️</div>
            <span style={{ fontWeight: "800", fontSize: "16px", letterSpacing: "-0.3px" }}>VulnScanner</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ padding: "6px 14px", background: "rgba(46,213,115,0.1)", border: "1px solid rgba(46,213,115,0.2)", borderRadius: "20px", fontSize: "11px", color: "#2ed573", fontWeight: "600", letterSpacing: "0.5px" }}>● LIVE</div>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", cursor: "pointer" }}
            onClick={() => setMenuOpen(!menuOpen)}>
            {user.name[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 1 }}>
        {/* SIDEBAR */}
        <div style={{ position: "fixed", top: "60px", left: 0, bottom: 0, width: "240px", background: "rgba(7,11,20,0.95)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 12px", display: "flex", flexDirection: "column", zIndex: 99, transform: menuOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease" }}>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "2px", padding: "0 12px", marginBottom: "8px" }}>NAVIGATION</div>
          {[{ id: "scan", icon: "⬡", label: "New Scan" }, { id: "history", icon: "◈", label: "Scan History" }].map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setMenuOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: page === n.id ? "rgba(99,102,241,0.15)" : "transparent", color: page === n.id ? "#818cf8" : "rgba(255,255,255,0.4)", border: "none", borderRadius: "12px", cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: page === n.id ? "700" : "400", marginBottom: "4px", transition: "all 0.2s", borderLeft: page === n.id ? "3px solid #6366f1" : "3px solid transparent" }}>
              <span style={{ fontSize: "16px" }}>{n.icon}</span>{n.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "800", flexShrink: 0 }}>{user.name[0].toUpperCase()}</div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              </div>
            </div>
            <button onClick={onLogout}
              style={{ width: "100%", padding: "9px", background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: "10px", color: "#ff4757", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}>
              Sign Out
            </button>
          </div>
        </div>

        {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 98, backdropFilter: "blur(4px)" }} />}

        {/* MAIN */}
        <div style={{ flex: 1, padding: "clamp(20px,3vw,48px)", maxWidth: "980px", margin: "0 auto", width: "100%" }}>

          {page === "scan" && (
            <div>
              {/* HEADER */}
              <div style={{ marginBottom: "36px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", color: "#818cf8", fontWeight: "600", marginBottom: "16px", letterSpacing: "0.5px" }}>
                  ⚡ VULNERABILITY SCANNER
                </div>
                <h1 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", margin: "0 0 10px", letterSpacing: "-1px", lineHeight: 1.1 }}>
                  Scan for{" "}
                  <span style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Vulnerabilities
                  </span>
                </h1>
                <p style={{ color: "rgba(255,255,255,0.35)", margin: 0, fontSize: "15px" }}>Enter a domain or IP address to detect open ports and security risks</p>
              </div>

              {/* SCAN BOX */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px", marginBottom: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
                    <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", fontSize: "14px", fontFamily: "monospace" }}>$</div>
                    <input type="text" placeholder="scanme.nmap.org or 192.168.1.1"
                      value={target} onChange={e => setTarget(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleScan()}
                      style={{ width: "100%", padding: "16px 16px 16px 36px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", color: "white", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "monospace", letterSpacing: "0.3px" }} />
                  </div>
                  <button onClick={handleScan} disabled={loading}
                    style={{ padding: "16px 28px", background: loading ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: "14px", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: "700", whiteSpace: "nowrap", boxShadow: loading ? "none" : "0 8px 25px rgba(99,102,241,0.4)", transition: "all 0.2s", letterSpacing: "0.3px" }}>
                    {loading ? "⏳ Scanning..." : "🔍 Start Scan"}
                  </button>
                </div>

                {/* SCAN LOG */}
                {scanLog.length > 0 && (
                  <div style={{ marginTop: "20px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "16px", fontFamily: "monospace", fontSize: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    {scanLog.map((log, i) => (
                      <div key={i} style={{ color: log.includes("✓") ? "#2ed573" : "rgba(255,255,255,0.4)", marginBottom: "5px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: log.includes("✓") ? "#2ed573" : "#6366f1", fontSize: "10px" }}>{log.includes("✓") ? "✓" : "▸"}</span>
                        {log}
                      </div>
                    ))}
                    {loading && <span style={{ color: "#6366f1", animation: "blink 1s infinite" }}>█</span>}
                  </div>
                )}
              </div>

              {error && <div style={{ padding: "16px", background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: "14px", color: "#ff4757", marginBottom: "24px", fontSize: "14px" }}>⚠ {error}</div>}

              {result && (
                <div>
                  {/* STATS ROW */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "12px", marginBottom: "24px" }}>
                    {[
                      { label: "Target", value: result.target, color: "#818cf8" },
                      { label: "Open Ports", value: (result.ports||[]).filter(p=>p.state==="open").length, color: "#2ed573" },
                      { label: "Vulnerabilities", value: (result.vulnerabilities||[]).length, color: "#ff6b35" },
                      { label: "Scan Type", value: "Quick", color: "#1e90ff" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "16px 20px" }}>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "6px", letterSpacing: "0.5px" }}>{s.label.toUpperCase()}</div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: s.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* RISK + EXPORT */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <RiskMeter score={result.riskScore || 0} level={result.riskLevel || { label: "SAFE" }} />
                    {scanId && (
                      <button onClick={() => downloadReport(scanId)}
                        style={{ padding: "12px 24px", background: "rgba(46,213,115,0.1)", border: "1px solid rgba(46,213,115,0.25)", borderRadius: "12px", color: "#2ed573", cursor: "pointer", fontSize: "14px", fontWeight: "700", transition: "all 0.2s", letterSpacing: "0.3px" }}>
                        📄 Export Report
                      </button>
                    )}
                  </div>

                  {/* VULNS */}
                  {result.vulnerabilities && result.vulnerabilities.length > 0 && (
                    <div style={{ marginBottom: "28px" }}>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "2px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                        THREAT ASSESSMENT
                        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "12px" }}>
                        {result.vulnerabilities.map((v, i) => {
                          const s = SEVERITY[v.severity] || SEVERITY.Info;
                          return (
                            <div key={i} style={{ background: s.bg, border: "1px solid " + s.border, borderRadius: "16px", padding: "18px", position: "relative", overflow: "hidden" }}>
                              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: s.color, opacity: 0.6 }} />
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "8px" }}>
                                <span style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>{v.title}</span>
                                <span style={{ fontSize: "10px", color: s.color, border: "1px solid " + s.border, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", fontWeight: "700", letterSpacing: "0.5px" }}>{v.severity}</span>
                              </div>
                              {v.cve && (
                                <div style={{ fontSize: "11px", color: "#ff6b35", marginBottom: "8px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>🔖</span>{v.cve}{v.cvssScore ? <span style={{ color: "rgba(255,255,255,0.3)" }}> · CVSS {v.cvssScore}</span> : ""}
                                </div>
                              )}
                              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: "1.7" }}>{v.liveDescription || v.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PORTS */}
                  <div style={{ marginBottom: "28px" }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "2px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                      PORT SCAN RESULTS
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                    </div>
                    {(!result.ports || result.ports.length === 0) ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)" }}>No open ports detected</div>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "400px" }}>
                            <thead>
                              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                {["Port","Protocol","State","Service","Version"].map(h => (
                                  <th key={h} style={{ padding: "14px 18px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: "10px", letterSpacing: "1.5px", fontWeight: "700" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.ports.map((p, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                                  <td style={{ padding: "14px 18px", color: "#818cf8", fontWeight: "800", fontFamily: "monospace", fontSize: "15px" }}>{p.port}</td>
                                  <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{p.proto}</td>
                                  <td style={{ padding: "14px 18px" }}>
                                    <span style={{ color: "#2ed573", background: "rgba(46,213,115,0.1)", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.5px", border: "1px solid rgba(46,213,115,0.2)" }}>● {p.state.toUpperCase()}</span>
                                  </td>
                                  <td style={{ padding: "14px 18px", color: "#38bdf8", fontWeight: "600" }}>{p.service}</td>
                                  <td style={{ padding: "14px 18px", color: "rgba(255,255,255,0.25)", fontSize: "12px", fontFamily: "monospace" }}>{p.version || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RAW */}
                  <div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "2px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                      RAW NMAP OUTPUT
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                    </div>
                    <pre style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px", overflow: "auto", color: "#2ed573", fontSize: "12px", lineHeight: "1.9", margin: 0, fontFamily: "monospace" }}>
                      {result.scan_result}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {page === "history" && (
            <div>
              <div style={{ marginBottom: "36px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", color: "#818cf8", fontWeight: "600", marginBottom: "16px" }}>◈ SCAN ARCHIVE</div>
                <h1 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: "900", margin: "0 0 10px", letterSpacing: "-1px" }}>Scan History</h1>
                <p style={{ color: "rgba(255,255,255,0.35)", margin: 0, fontSize: "15px" }}>All your previous vulnerability scans</p>
              </div>
              {histLoading ? (
                <p style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</p>
              ) : history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>📭</div>
                  <p style={{ fontSize: "16px" }}>No scans yet. Run your first scan!</p>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "500px" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          {["Target","Risk Score","Date","Report"].map(h => (
                            <th key={h} style={{ padding: "16px 20px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: "10px", letterSpacing: "1.5px", fontWeight: "700" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((s) => {
                          const rs = parseInt(s.risk_score) || 0;
                          const rc = rs >= 70 ? "#ff4757" : rs >= 45 ? "#ff6b35" : rs >= 20 ? "#ffd32a" : "#2ed573";
                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "16px 20px", color: "#818cf8", fontWeight: "700", fontFamily: "monospace" }}>{s.target}</td>
                              <td style={{ padding: "16px 20px" }}>
                                <span style={{ color: rc, fontWeight: "800", fontFamily: "monospace", fontSize: "16px" }}>{rs}</span>
                                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>/100</span>
                              </td>
                              <td style={{ padding: "16px 20px", color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: "16px 20px" }}>
                                <button onClick={() => downloadReport(s.id)}
                                  style={{ padding: "7px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", color: "#818cf8", cursor: "pointer", fontSize: "12px", fontWeight: "700", transition: "all 0.2s" }}>
                                  Export
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}} *{scrollbar-width:thin;scrollbar-color:#6366f1 transparent}`}</style>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  return !token
    ? <AuthPage onLogin={(t, u) => { setToken(t); setUser(u); }} />
    : <ScannerPage token={token} user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}
