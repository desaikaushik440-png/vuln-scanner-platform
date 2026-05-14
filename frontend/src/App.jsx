import { useState, useEffect } from "react";

const API = "https://vuln-scanner-platform-production.up.railway.app";

const SEVERITY = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  High:     { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)" },
  Medium:   { color: "#eab308", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)" },
  Low:      { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)" },
  Info:     { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)" },
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", padding: "48px", borderRadius: "24px", width: "420px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛡️</div>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: "700", margin: "0 0 8px" }}>VulnScanner</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        {!isLogin && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "6px" }}>Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe"
              style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "6px" }}>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"
            style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "6px" }}>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </div>

        {error && <div style={{ padding: "12px 16px", background: error.includes("created") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: "1px solid " + (error.includes("created") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"), borderRadius: "10px", color: error.includes("created") ? "#22c55e" : "#ef4444", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #667eea, #764ba2)", border: "none", borderRadius: "12px", color: "white", fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.2s" }}>
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>

        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", fontSize: "13px", marginTop: "20px" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: "#818cf8", cursor: "pointer", fontWeight: "600" }}>
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
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

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const res = await fetch(API + "/api/scans", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (data.success) setHistory(data.scans);
    } catch (err) { console.error(err); }
    setHistLoading(false);
  };

  useEffect(() => { if (page === "history") fetchHistory(); }, [page]);

  const handleScan = async () => {
    if (!target) return;
    setLoading(true); setError(""); setResult(null); setScanId(null); setScanLog([]);
    const logs = ["Initializing scan engine...", "Resolving target: " + target, "Running Nmap TCP scan...", "Probing open ports...", "Analyzing vulnerabilities...", "Generating report..."];
    let i = 0;
    const iv = setInterval(() => { if (i < logs.length) { setScanLog(p => [...p, logs[i]]); i++; } else clearInterval(iv); }, 500);
    try {
      const res = await fetch(API + "/api/scan", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ target }) });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      clearInterval(iv);
      setScanLog(p => [...p, "✓ Scan complete"]);
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

  const navItems = [
    { id: "scan", icon: "🔍", label: "New Scan" },
    { id: "history", icon: "📋", label: "History" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "white", fontFamily: "'Segoe UI', sans-serif", display: "flex" }}>
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#161b27", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "12px 16px", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🛡️</span>
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "white" }}>VulnScanner</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Security Platform</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "1px", padding: "0 16px", marginBottom: "8px" }}>MENU</div>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: page === n.id ? "rgba(102,126,234,0.15)" : "transparent", color: page === n.id ? "#818cf8" : "rgba(255,255,255,0.5)", border: "none", borderRadius: "10px", cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: page === n.id ? "600" : "400", marginBottom: "4px", transition: "all 0.2s", borderLeft: page === n.id ? "3px solid #667eea" : "3px solid transparent" }}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700" }}>
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>{user.name}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{user.role}</div>
            </div>
          </div>
          <button onClick={onLogout}
            style={{ width: "100%", padding: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {page === "scan" && (
          <div style={{ maxWidth: "900px" }}>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px" }}>New Scan</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>Enter a domain or IP address to scan for vulnerabilities</p>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
              <input type="text" placeholder="e.g. scanme.nmap.org or 192.168.1.1"
                value={target} onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                style={{ flex: 1, padding: "14px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white", fontSize: "15px", outline: "none" }} />
              <button onClick={handleScan} disabled={loading}
                style={{ padding: "14px 28px", background: loading ? "rgba(102,126,234,0.3)" : "linear-gradient(135deg, #667eea, #764ba2)", border: "none", borderRadius: "12px", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: "600", whiteSpace: "nowrap", boxShadow: loading ? "none" : "0 4px 15px rgba(102,126,234,0.4)" }}>
                {loading ? "⏳ Scanning..." : "🔍 Start Scan"}
              </button>
            </div>

            {scanLog.length > 0 && (
              <div style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", marginBottom: "24px", fontFamily: "monospace", fontSize: "13px" }}>
                {scanLog.map((log, i) => (
                  <div key={i} style={{ color: log.includes("✓") ? "#22c55e" : "rgba(255,255,255,0.5)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: log.includes("✓") ? "#22c55e" : "#667eea" }}>{log.includes("✓") ? "✓" : "›"}</span>
                    {log}
                  </div>
                ))}
                {loading && <span style={{ color: "#667eea" }}>█</span>}
              </div>
            )}

            {error && <div style={{ padding: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#ef4444", marginBottom: "24px" }}>❌ {error}</div>}

            {result && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <div>
                    <h2 style={{ margin: "0 0 4px", fontSize: "20px" }}>Results for <span style={{ color: "#818cf8" }}>{result.target}</span></h2>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{(result.ports || []).filter(p => p.state === "open").length} open ports · {(result.vulnerabilities || []).length} vulnerabilities found</p>
                  </div>
                  {scanId && (
                    <button onClick={() => downloadReport(scanId)}
                      style={{ padding: "10px 20px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", color: "#22c55e", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                      📄 Export Report
                    </button>
                  )}
                </div>

                {result.vulnerabilities && result.vulnerabilities.length > 0 && (
                  <div style={{ marginBottom: "28px" }}>
                    <h3 style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: "16px" }}>VULNERABILITIES</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                      {result.vulnerabilities.map((v, i) => {
                        const s = SEVERITY[v.severity] || SEVERITY.Info;
                        return (
                          <div key={i} style={{ background: s.bg, border: "1px solid " + s.border, borderRadius: "12px", padding: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>{v.title}</span>
                              <span style={{ fontSize: "11px", color: s.color, background: s.bg, border: "1px solid " + s.border, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", marginLeft: "8px" }}>{v.severity}</span>
                            </div>
                            {v.cve && <div style={{ fontSize: "11px", color: "#f97316", marginBottom: "6px", fontFamily: "monospace" }}>🔖 {v.cve}</div>}
                            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: "1.6" }}>{v.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: "16px" }}>OPEN PORTS</h3>
                  {(!result.ports || result.ports.length === 0) ? (
                    <p style={{ color: "rgba(255,255,255,0.3)" }}>No open ports detected.</p>
                  ) : (
                    <div style={{ background: "#161b27", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                            {["Port", "Protocol", "State", "Service", "Version"].map(h => (
                              <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: "11px", letterSpacing: "1px" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.ports.map((p, i) => (
                            <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "12px 16px", color: "#818cf8", fontWeight: "700", fontFamily: "monospace" }}>{p.port}</td>
                              <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)" }}>{p.proto}</td>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                                  ● {p.state.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", color: "#38bdf8" }}>{p.service}</td>
                              <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>{p.version || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: "16px" }}>RAW NMAP OUTPUT</h3>
                  <pre style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px", overflow: "auto", color: "#22c55e", fontSize: "12px", lineHeight: "1.8", margin: 0, fontFamily: "monospace" }}>
                    {result.scan_result}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {page === "history" && (
          <div style={{ maxWidth: "900px" }}>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: "700", margin: "0 0 8px" }}>Scan History</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "14px" }}>All your previous vulnerability scans</p>
            </div>
            {histLoading ? (
              <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                <p>No scans yet. Run your first scan!</p>
              </div>
            ) : (
              <div style={{ background: "#161b27", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      {["Target", "Status", "Date", "Report"].map(h => (
                        <th key={h} style={{ padding: "14px 20px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: "600", fontSize: "11px", letterSpacing: "1px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((s, i) => (
                      <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "14px 20px", color: "#818cf8", fontWeight: "600" }}>{s.target}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>✓ {s.status}</span>
                        </td>
                        <td style={{ padding: "14px 20px", color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{new Date(s.createdAt).toLocaleString()}</td>
                        <td style={{ padding: "14px 20px" }}>
                          <button onClick={() => downloadReport(s.id)}
                            style={{ padding: "6px 14px", background: "rgba(102,126,234,0.1)", border: "1px solid rgba(102,126,234,0.3)", borderRadius: "8px", color: "#818cf8", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                            Export
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
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
