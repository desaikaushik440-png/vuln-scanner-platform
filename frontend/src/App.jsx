import { useState, useEffect } from "react";

const API = "https://vuln-scanner-platform-production.up.railway.app";

const SEVERITY = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)"  },
  High:     { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)" },
  Medium:   { color: "#eab308", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)"  },
  Low:      { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)"  },
  Info:     { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" },
};

const SCAN_TYPES = [
  { id: "quick",   label: "⚡ Quick",   desc: "Common ports ~5s"     },
];

function AuthPage({ onLogin, dark }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const bg   = dark ? "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" : "linear-gradient(135deg,#e0e7ff,#f0f4ff)";
  const card = dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)";
  const text = dark ? "white" : "#1e1b4b";
  const sub  = dark ? "rgba(255,255,255,0.4)" : "rgba(30,27,75,0.5)";
  const inp  = dark
    ? { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.1)", color: "white" }
    : { bg: "rgba(30,27,75,0.04)",   border: "rgba(30,27,75,0.15)",   color: "#1e1b4b" };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, role: "VIEWER" };
    try {
      const res  = await fetch(API + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      if (isLogin) onLogin(data.token, data.user);
      else { setIsLogin(true); setError("Account created! Please login."); }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const iStyle = { width: "100%", padding: "12px 16px", background: inp.bg, border: "1px solid " + inp.border, borderRadius: "12px", color: inp.color, fontSize: "14px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif", padding: "20px" }}>
      <div style={{ background: card, backdropFilter: "blur(20px)", padding: "clamp(24px,5vw,48px)", borderRadius: "24px", width: "100%", maxWidth: "420px", border: "1px solid " + inp.border, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛡️</div>
          <h1 style={{ color: text, fontSize: "26px", fontWeight: "700", margin: "0 0 8px" }}>VulnScanner</h1>
          <p style={{ color: sub, fontSize: "14px", margin: 0 }}>{isLogin ? "Sign in to your account" : "Create your account"}</p>
        </div>
        {!isLogin && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: sub, fontSize: "13px", display: "block", marginBottom: "6px" }}>Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" style={iStyle} />
          </div>
        )}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: sub, fontSize: "13px", display: "block", marginBottom: "6px" }}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={iStyle} />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ color: sub, fontSize: "13px", display: "block", marginBottom: "6px" }}>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleSubmit()} style={iStyle} />
        </div>
        {error && (
          <div style={{ padding: "12px 16px", background: error.includes("created") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: "1px solid " + (error.includes("created") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"), borderRadius: "10px", color: error.includes("created") ? "#22c55e" : "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#667eea,#764ba2)", border: "none", borderRadius: "12px", color: "white", fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>
        <p style={{ color: sub, textAlign: "center", fontSize: "13px", marginTop: "20px" }}>
          {isLogin ? "No account? " : "Have account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: "#818cf8", cursor: "pointer", fontWeight: "600" }}>
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

function RiskMeter({ score, level }) {
  const colors = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e", SAFE: "#3b82f6" };
  const color = colors[level?.label] || "#3b82f6";
  return (
    <div style={{ textAlign: "center", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", minWidth: "140px" }}>
      <div style={{ position: "relative", display: "inline-block", marginBottom: "10px" }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 251} 251`} strokeLinecap="round"
            transform="rotate(-90 50 50)" style={{ transition: "all 1s ease" }} />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: "800", color }}>{score}</div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>/100</div>
        </div>
      </div>
      <div style={{ fontSize: "11px", fontWeight: "700", color, letterSpacing: "2px" }}>{level?.label}</div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Risk Score</div>
    </div>
  );
}

function ScannerPage({ token, user, onLogout, dark, toggleTheme }) {
  const [page, setPage]           = useState("scan");
  const [target, setTarget]       = useState("");
  const [scanType, setScanType]   = useState("quick");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [scanId, setScanId]       = useState(null);
  const [error, setError]         = useState("");
  const [history, setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [scanLog, setScanLog]     = useState([]);
  const [menuOpen, setMenuOpen]   = useState(false);

  const bg     = dark ? "#0f1117" : "#f8faff";
  const sidebar= dark ? "#161b27" : "#ffffff";
  const card   = dark ? "#161b27" : "#ffffff";
  const text   = dark ? "white"   : "#1e1b4b";
  const sub    = dark ? "rgba(255,255,255,0.4)" : "rgba(30,27,75,0.5)";
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(30,27,75,0.08)";
  const inp    = dark
    ? { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "white" }
    : { bg: "rgba(30,27,75,0.03)",   border: "rgba(30,27,75,0.12)",   color: "#1e1b4b" };

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const res  = await fetch(API + "/api/scans", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (data.success) setHistory(data.scans);
    } catch (e) { console.error(e); }
    setHistLoading(false);
  };

  useEffect(() => { if (page === "history") fetchHistory(); }, [page]);

  const handleScan = async () => {
    if (!target.trim()) return;
    setLoading(true); setError(""); setResult(null); setScanId(null); setScanLog([]);
    const logs = [
      "Initializing scan engine...",
      "Resolving: " + target,
      "Running " + scanType + " scan...",
      "Probing open ports...",
      "Looking up CVEs...",
      "Calculating risk score...",
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i < logs.length) { setScanLog(p => [...p, logs[i]]); i++; }
      else clearInterval(iv);
    }, 600);
    try {
      const res  = await fetch(API + "/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ target: target.trim(), scanType }),
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      clearInterval(iv);
      setScanLog(p => [...p, "✓ Scan complete"]);
      setResult(data);
      if (data.scanId) setScanId(data.scanId);
    } catch (err) { clearInterval(iv); setError(err.message); }
    setLoading(false);
  };

  const downloadReport = async (id) => {
    const res  = await fetch(API + "/api/scans/" + id + "/pdf", { headers: { Authorization: "Bearer " + token } });
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "vuln-report-" + id + ".txt"; a.click();
    window.URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: "scan",    icon: "🔍", label: "New Scan"  },
    { id: "history", icon: "📋", label: "History"   },
  ];

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: sidebar, borderBottom: "1px solid " + border, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 10px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: text, padding: "2px 6px" }}>☰</button>
          <span style={{ fontSize: "20px" }}>🛡️</span>
          <span style={{ fontWeight: "700", fontSize: "17px", color: text }}>VulnScanner</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={toggleTheme}
            style={{ background: "rgba(102,126,234,0.1)", border: "1px solid rgba(102,126,234,0.2)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "16px" }}>
            {dark ? "☀️" : "🌙"}
          </button>
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "white" }}>
            {user.name[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* SIDEBAR DRAWER */}
        <div style={{ width: "230px", background: sidebar, borderRight: "1px solid " + border, padding: "20px 12px", display: "flex", flexDirection: "column", position: "fixed", top: "61px", bottom: 0, left: 0, zIndex: 99, transform: menuOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease", overflowY: "auto" }}>
          <div style={{ fontSize: "10px", color: sub, letterSpacing: "1px", padding: "0 12px", marginBottom: "8px" }}>MENU</div>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setMenuOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: page === n.id ? "rgba(102,126,234,0.15)" : "transparent", color: page === n.id ? "#818cf8" : sub, border: "none", borderLeft: page === n.id ? "3px solid #667eea" : "3px solid transparent", borderRadius: "0 10px 10px 0", cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: page === n.id ? "600" : "400", marginBottom: "4px" }}>
              {n.icon} {n.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "12px", background: dark ? "rgba(255,255,255,0.03)" : "rgba(30,27,75,0.03)", borderRadius: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px", color: text }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: sub, marginBottom: "10px" }}>{user.email}</div>
            <button onClick={onLogout}
              style={{ width: "100%", padding: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* OVERLAY */}
        {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 98 }} />}

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, padding: "clamp(16px,3vw,40px)", maxWidth: "960px", margin: "0 auto", width: "100%" }}>

          {/* ── NEW SCAN ── */}
          {page === "scan" && (
            <div>
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: "700", margin: "0 0 6px", color: text }}>New Scan</h1>
                <p style={{ color: sub, margin: 0, fontSize: "14px" }}>Scan a domain or IP for open ports and vulnerabilities</p>
              </div>

              {/* SCAN TYPE */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: sub, letterSpacing: "1px", marginBottom: "8px" }}>SCAN TYPE</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {SCAN_TYPES.map(t => (
                    <button key={t.id} onClick={() => setScanType(t.id)}
                      style={{ padding: "10px 18px", background: scanType === t.id ? "linear-gradient(135deg,#667eea,#764ba2)" : inp.bg, border: "1px solid " + (scanType === t.id ? "transparent" : border), borderRadius: "10px", color: scanType === t.id ? "white" : sub, cursor: "pointer", fontSize: "13px", fontWeight: scanType === t.id ? "600" : "400", transition: "all 0.2s" }}>
                      <div>{t.label}</div>
                      <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* INPUT */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input type="text" placeholder="e.g. scanme.nmap.org or 192.168.1.1"
                  value={target} onChange={e => setTarget(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  style={{ flex: 1, minWidth: "200px", padding: "14px 18px", background: inp.bg, border: "1px solid " + inp.border, borderRadius: "12px", color: inp.color, fontSize: "15px", outline: "none" }} />
                <button onClick={handleScan} disabled={loading}
                  style={{ padding: "14px 24px", background: loading ? "rgba(102,126,234,0.3)" : "linear-gradient(135deg,#667eea,#764ba2)", border: "none", borderRadius: "12px", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", boxShadow: loading ? "none" : "0 4px 15px rgba(102,126,234,0.4)" }}>
                  {loading ? "⏳ Scanning..." : "🔍 Start Scan"}
                </button>
              </div>

              {/* SCAN LOG */}
              {scanLog.length > 0 && (
                <div style={{ background: dark ? "#0d1117" : "#f0f4ff", border: "1px solid " + border, borderRadius: "12px", padding: "16px", marginBottom: "20px", fontFamily: "monospace", fontSize: "12px" }}>
                  {scanLog.map((log, i) => (
                    <div key={i} style={{ color: log.includes("✓") ? "#22c55e" : sub, marginBottom: "4px" }}>
                      <span style={{ color: log.includes("✓") ? "#22c55e" : "#667eea", marginRight: "8px" }}>{log.includes("✓") ? "✓" : "›"}</span>{log}
                    </div>
                  ))}
                  {loading && <span style={{ color: "#667eea" }}>█</span>}
                </div>
              )}

              {error && (
                <div style={{ padding: "14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#ef4444", marginBottom: "20px" }}>
                  ❌ {error}
                </div>
              )}

              {result && (
                <div>
                  {/* HEADER + RISK */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
                    <div>
                      <h2 style={{ margin: "0 0 6px", fontSize: "clamp(16px,3vw,20px)", color: text }}>
                        Results for <span style={{ color: "#818cf8" }}>{result.target}</span>
                      </h2>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                        <span style={{ fontSize: "12px", color: sub }}>{(result.ports||[]).filter(p=>p.state==="open").length} open ports</span>
                        <span style={{ fontSize: "12px", color: sub }}>·</span>
                        <span style={{ fontSize: "12px", color: sub }}>{(result.vulnerabilities||[]).length} vulnerabilities</span>
                        <span style={{ fontSize: "12px", color: sub }}>·</span>
                        <span style={{ fontSize: "12px", color: "#818cf8" }}>{result.scanTypeLabel || scanType}</span>
                      </div>
                      {scanId && (
                        <button onClick={() => downloadReport(scanId)}
                          style={{ padding: "8px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", color: "#22c55e", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                          📄 Export Report
                        </button>
                      )}
                    </div>
                    <RiskMeter score={result.riskScore || 0} level={result.riskLevel || { label: "SAFE" }} />
                  </div>

                  {/* VULNERABILITIES */}
                  {result.vulnerabilities && result.vulnerabilities.length > 0 && (
                    <div style={{ marginBottom: "24px" }}>
                      <div style={{ fontSize: "11px", color: sub, letterSpacing: "1px", marginBottom: "12px" }}>VULNERABILITIES</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px" }}>
                        {result.vulnerabilities.map((v, i) => {
                          const s = SEVERITY[v.severity] || SEVERITY.Info;
                          return (
                            <div key={i} style={{ background: s.bg, border: "1px solid " + s.border, borderRadius: "12px", padding: "14px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "8px" }}>
                                <span style={{ fontSize: "13px", fontWeight: "600", color: text }}>{v.title}</span>
                                <span style={{ fontSize: "10px", color: s.color, border: "1px solid " + s.border, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>{v.severity}</span>
                              </div>
                              {v.cve && (
                                <div style={{ fontSize: "11px", color: "#f97316", marginBottom: "4px", fontFamily: "monospace" }}>
                                  🔖 {v.cve}{v.cvssScore ? " | CVSS: " + v.cvssScore : ""}
                                </div>
                              )}
                              <p style={{ fontSize: "11px", color: sub, margin: 0, lineHeight: "1.6" }}>{v.liveDescription || v.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PORTS */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "11px", color: sub, letterSpacing: "1px", marginBottom: "12px" }}>OPEN PORTS</div>
                    {(!result.ports || result.ports.length === 0) ? (
                      <p style={{ color: sub }}>No open ports detected.</p>
                    ) : (
                      <div style={{ background: card, borderRadius: "12px", overflowX: "auto", border: "1px solid " + border }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "400px" }}>
                          <thead>
                            <tr style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(30,27,75,0.03)" }}>
                              {["Port","Proto","State","Service","Version"].map(h => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: sub, fontSize: "11px", letterSpacing: "1px", fontWeight: "600" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.ports.map((p, i) => (
                              <tr key={i} style={{ borderTop: "1px solid " + border }}>
                                <td style={{ padding: "12px 16px", color: "#818cf8", fontWeight: "700", fontFamily: "monospace" }}>{p.port}</td>
                                <td style={{ padding: "12px 16px", color: sub }}>{p.proto}</td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>● {p.state.toUpperCase()}</span>
                                </td>
                                <td style={{ padding: "12px 16px", color: "#38bdf8" }}>{p.service}</td>
                                <td style={{ padding: "12px 16px", color: sub, fontSize: "11px" }}>{p.version || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* RAW OUTPUT */}
                  <div>
                    <div style={{ fontSize: "11px", color: sub, letterSpacing: "1px", marginBottom: "12px" }}>RAW NMAP OUTPUT</div>
                    <pre style={{ background: dark ? "#0d1117" : "#f0f4ff", border: "1px solid " + border, borderRadius: "12px", padding: "16px", overflow: "auto", color: "#22c55e", fontSize: "12px", lineHeight: "1.8", margin: 0, fontFamily: "monospace" }}>
                      {result.scan_result}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY ── */}
          {page === "history" && (
            <div>
              <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: "700", margin: "0 0 6px", color: text }}>Scan History</h1>
                <p style={{ color: sub, margin: 0, fontSize: "14px" }}>All your previous vulnerability scans</p>
              </div>
              {histLoading ? (
                <p style={{ color: sub }}>Loading...</p>
              ) : history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: sub }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                  <p>No scans yet. Run your first scan!</p>
                </div>
              ) : (
                <div style={{ background: card, borderRadius: "12px", overflowX: "auto", border: "1px solid " + border }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "480px" }}>
                    <thead>
                      <tr style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(30,27,75,0.03)" }}>
                        {["Target","Type","Risk","Date","Report"].map(h => (
                          <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: sub, fontSize: "11px", letterSpacing: "1px", fontWeight: "600" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((s) => {
                        const rs = parseInt(s.risk_score) || 0;
                        const rc = rs >= 70 ? "#ef4444" : rs >= 45 ? "#f97316" : rs >= 20 ? "#eab308" : "#22c55e";
                        return (
                          <tr key={s.id} style={{ borderTop: "1px solid " + border }}>
                            <td style={{ padding: "14px 16px", color: "#818cf8", fontWeight: "600" }}>{s.target}</td>
                            <td style={{ padding: "14px 16px", color: sub, fontSize: "12px" }}>{s.scan_type || "Quick"}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ color: rc, fontWeight: "700", fontFamily: "monospace" }}>{rs}/100</span>
                            </td>
                            <td style={{ padding: "14px 16px", color: sub, fontSize: "12px" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <button onClick={() => downloadReport(s.id)}
                                style={{ padding: "6px 12px", background: "rgba(102,126,234,0.1)", border: "1px solid rgba(102,126,234,0.2)", borderRadius: "8px", color: "#818cf8", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                                Export
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user,  setUser]  = useState(null);
  const [dark,  setDark]  = useState(true);
  return !token
    ? <AuthPage onLogin={(t, u) => { setToken(t); setUser(u); }} dark={dark} />
    : <ScannerPage token={token} user={user} onLogout={() => { setToken(null); setUser(null); }} dark={dark} toggleTheme={() => setDark(d => !d)} />;
}
