import { useState, useEffect } from "react";

const API = "https://vuln-scanner-platform-production.up.railway.app";

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, role: "VIEWER" };
    try {
      const res = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      if (isLogin) onLogin(data.token, data.user);
      else { setIsLogin(true); setError("Registered! Please login."); }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020c2b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <div style={{ background: "#081028", padding: "40px", borderRadius: "16px", width: "380px", border: "1px solid #1e3a5f" }}>
        <h1 style={{ color: "white", textAlign: "center", marginBottom: "8px", fontSize: "22px" }}>VulnScanner</h1>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "30px", fontSize: "13px" }}>
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </p>
        {!isLogin && (
          <input placeholder="Full Name" value={form.name}
            onChange={function(e) { setForm({ name: e.target.value, email: form.email, password: form.password }); }}
            style={inputStyle} />
        )}
        <input placeholder="Email" type="email" value={form.email}
          onChange={function(e) { setForm({ name: form.name, email: e.target.value, password: form.password }); }}
          style={inputStyle} />
        <input placeholder="Password" type="password" value={form.password}
          onChange={function(e) { setForm({ name: form.name, email: form.email, password: e.target.value }); }}
          onKeyDown={function(e) { if (e.key === "Enter") handleSubmit(); }}
          style={inputStyle} />
        {error && (
          <p style={{ color: error.includes("Registered") ? "#4ade80" : "#f87171", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </p>
        )}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "14px", background: loading ? "#334155" : "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", marginBottom: "16px" }}>
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>
        <p style={{ color: "#64748b", textAlign: "center", fontSize: "13px" }}>
          {isLogin ? "No account? " : "Have an account? "}
          <span onClick={function() { setIsLogin(!isLogin); setError(""); }}
            style={{ color: "#38bdf8", cursor: "pointer" }}>
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

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const res = await fetch(API + "/api/scans", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success) setHistory(data.scans);
    } catch (err) { console.error(err); }
    setHistLoading(false);
  };

  useEffect(function() {
    if (page === "history") fetchHistory();
  }, [page]);

  const handleScan = async () => {
    if (!target) { alert("Enter target"); return; }
    setLoading(true); setError(""); setResult(null); setScanId(null);
    try {
      const res = await fetch(API + "/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ target: target }),
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setResult(data);
      if (data.scanId) setScanId(data.scanId);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const downloadPDF = async (id) => {
    const res = await fetch(API + "/api/scans/" + id + "/pdf", {
      headers: { Authorization: "Bearer " + token },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scan-report-" + id + ".pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parsePorts = (raw) => {
    if (!raw) return [];
    return raw.split("\n")
      .filter(function(line) { return /^\d+\/tcp\s+(open|filtered|closed)/.test(line); })
      .map(function(line) {
        const parts = line.trim().split(/\s+/);
        const portProto = parts[0];
        const state = parts[1];
        const svc = parts.slice(2);
        const portParts = portProto.split("/");
        return { port: portParts[0], proto: portParts[1], state: state, service: svc.join(" ") || "unknown" };
      });
  };

  const ports = result ? parsePorts(result.scan_result) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#020c2b", color: "white", fontFamily: "monospace", display: "flex" }}>
      <div style={{ width: "220px", background: "#081028", borderRight: "1px solid #1e3a5f", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "16px", color: "white", marginBottom: "8px" }}>VulnScanner</h2>
        <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "30px" }}>{user.email}</p>
        <button onClick={function() { setPage("scan"); }}
          style={{ padding: "12px 16px", background: page === "scan" ? "#1e3a5f" : "transparent", color: page === "scan" ? "#38bdf8" : "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "14px", marginBottom: "6px" }}>
          New Scan
        </button>
        <button onClick={function() { setPage("history"); }}
          style={{ padding: "12px 16px", background: page === "history" ? "#1e3a5f" : "transparent", color: page === "history" ? "#38bdf8" : "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "14px", marginBottom: "6px" }}>
          History
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: "16px" }}>
          <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>{user.name}</p>
          <p style={{ color: "#3b82f6", fontSize: "11px", marginBottom: "12px" }}>{user.role}</p>
          <button onClick={onLogout}
            style={{ width: "100%", padding: "10px", background: "#1e3a5f", color: "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        {page === "scan" && (
          <div>
            <h1 style={{ fontSize: "24px", marginBottom: "30px" }}>New Scan</h1>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input type="text" placeholder="Enter domain or IP (e.g. scanme.nmap.org)"
                value={target}
                onChange={function(e) { setTarget(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") handleScan(); }}
                style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "1px solid #1e3a5f", background: "#081028", color: "white", fontSize: "15px" }} />
              <button onClick={handleScan} disabled={loading}
                style={{ padding: "15px 28px", borderRadius: "10px", border: "none", background: loading ? "#334155" : "#3b82f6", color: "white", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "15px" }}>
                {loading ? "Scanning..." : "Start Scan"}
              </button>
            </div>
            {error && <div style={{ color: "#f87171", marginBottom: "20px" }}>{error}</div>}
            {result && (
              <div style={{ background: "#081028", padding: "30px", borderRadius: "15px", border: "1px solid #1e3a5f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ color: "#38bdf8" }}>Results - {result.target}</h2>
                  {scanId && (
                    <button onClick={function() { downloadPDF(scanId); }}
                      style={{ padding: "10px 20px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
                      Download PDF
                    </button>
                  )}
                </div>
                <h3 style={{ color: "#94a3b8", marginBottom: "10px" }}>Open Ports</h3>
                {ports.length === 0 ? (
                  <p style={{ color: "#64748b" }}>No open ports found.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                    <thead>
                      <tr style={{ background: "#0f172a" }}>
                        <th style={thStyle}>Port</th>
                        <th style={thStyle}>Protocol</th>
                        <th style={thStyle}>State</th>
                        <th style={thStyle}>Service</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ports.map(function(p, i) {
                        return (
                          <tr key={i} style={{ background: i % 2 === 0 ? "#0a1628" : "#0d1f3c" }}>
                            <td style={tdStyle}><span style={{ color: "#38bdf8", fontWeight: "bold" }}>{p.port}</span></td>
                            <td style={tdStyle}>{p.proto}</td>
                            <td style={tdStyle}>
                              <span style={{ color: p.state === "open" ? "#4ade80" : p.state === "filtered" ? "#facc15" : "#f87171", fontWeight: "bold" }}>
                                {p.state.toUpperCase()}
                              </span>
                            </td>
                            <td style={tdStyle}>{p.service}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                <h3 style={{ color: "#94a3b8", marginBottom: "10px" }}>Raw Nmap Output</h3>
                <pre style={{ background: "#000", padding: "20px", borderRadius: "10px", overflow: "auto", color: "#22c55e", fontSize: "13px", lineHeight: "1.6" }}>
                  {result.scan_result}
                </pre>
              </div>
            )}
          </div>
        )}

        {page === "history" && (
          <div>
            <h1 style={{ fontSize: "24px", marginBottom: "30px" }}>Scan History</h1>
            {histLoading ? (
              <p style={{ color: "#64748b" }}>Loading...</p>
            ) : history.length === 0 ? (
              <p style={{ color: "#64748b" }}>No scans yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#081028" }}>
                    <th style={thStyle}>Target</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(function(s, i) {
                    return (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? "#081028" : "#0a1628" }}>
                        <td style={tdStyle}><span style={{ color: "#38bdf8" }}>{s.target}</span></td>
                        <td style={tdStyle}><span style={{ color: "#4ade80" }}>{s.status}</span></td>
                        <td style={tdStyle}>{new Date(s.createdAt).toLocaleString()}</td>
                        <td style={tdStyle}>
                          <button onClick={function() { downloadPDF(s.id); }}
                            style={{ padding: "6px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

var inputStyle = { width: "100%", padding: "13px", marginBottom: "14px", borderRadius: "10px", border: "1px solid #1e3a5f", background: "#0f172a", color: "white", fontSize: "14px", boxSizing: "border-box" };
var thStyle = { borderBottom: "1px solid #1e3a5f", padding: "12px", textAlign: "left", color: "#94a3b8" };
var tdStyle = { borderBottom: "1px solid #1e293b", padding: "12px", color: "#e2e8f0" };

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  if (!token) {
    return <AuthPage onLogin={function(t, u) { setToken(t); setUser(u); }} />;
  }
  return <ScannerPage token={token} user={user} onLogout={function() { setToken(null); setUser(null); }} />;
}
