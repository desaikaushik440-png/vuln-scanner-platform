import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

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
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
        <h1 style={{ color: "white", textAlign: "center", marginBottom: "8px", fontSize: "22px" }}>🛡️ VulnScanner</h1>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "30px", fontSize: "13px" }}>
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </p>
        {!isLogin && <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />}
        <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inputStyle} />
        {error && <p style={{ color: error.includes("Registered") ? "#4ade80" : "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#334155" : "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", marginBottom: "16px" }}>
          {loading ? "⏳ Please wait..." : isLogin ? "Login" : "Register"}
        </button>
        <p style={{ color: "#64748b", textAlign: "center", fontSize: "13px" }}>
          {isLogin ? "No account? " : "Have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: "#38bdf8", cursor: "pointer" }}>
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
      const res = await fetch(`${API}/api/scans`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setHistory(data.scans);
    } catch (err) { console.error(err); }
    setHistLoading(false);
  };

  useEffect(() => { if (page === "history") fetchHistory(); }, [page]);

  const handleScan = async () => {
    if (!target) { alert("Enter target"); return; }
    setLoading(true); setError(""); setResult(null); setScanId(null);
    try {
      const res = await fetch(`${API}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target }),
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setResult(data);
      if (data.scanId) setScanId(data.scanId);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const downloadPDF = async (id) => {
    const res = await fetch(`${API}/api/scans/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `scan-report-${id}.pdf`;
    a.click(); window.URL.revokeObjectURL(url);
  };

  const parsePorts = (raw) => {
    if (!raw) return [];
    return raw.split("\n")
      .filter(line => /^\d+\/tcp\s+(open|filtered|closed)/.test(line))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const [portProto, state, ...svc] = parts;
        const [port, proto] = portProto.split("/");
        return { port, proto, state, service: svc.join(" ") || "unknown" };
      });
  };

  const ports = result ? parsePorts(result.scan_result) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#020c2b", color: "white", fontFamily: "monospace", display: "flex" }}>
      <div style={{ width: "220px", background: "#081028", borderRight: "1px solid #1e3a5f", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "16px", color: "white", marginBottom: "8px" }}>🛡️ VulnScanner</h2>
        <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "30px" }}>{user.email}</p>
        {[{ id: "scan", label: "🔍 New Scan" }, { id: "history", label: "📋 History" }].map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ padding: "12px 16px", background: page === n.id ? "#1e3a5f" : "transparent", color: page === n.id ? "#38bdf8" : "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "14px", marginBottom: "6px" }}>
            {n.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: "16px" }}>
          <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>👤 {user.name}</p>
          <p style={{ color: "#3b82f6", fontSize: "11px", marginBottom: "12px" }}>{user.role}</p>
          <button onClick={onLogout} style={{ width: "100%", padding: "10px", background: "#1e3a5f", color: "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Logout</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        {page === "scan" && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "30px" }}>🔍 New Scan</h1>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input type="text" placeholder="Enter domain or IP (e.g. scanme.nmap.org)"
                value={target} onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "1px solid #1e3a5f", background: "#081028", color: "white", fontSize: "15px" }} />
              <button onClick={handleScan} disabled={loading}
                style={{ padding: "15px 28px", borderRadius: "10px", border: "none", background: loading ? "#334155" : "#3b82f6", color: "white", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "15px" }}>
                {loading ? "⏳ Scanning..." : "Start Scan"}
              </button>
            </div>
            {error && <div style={{ color: "#f87171", marginBottom: "20px" }}>❌ {error}</div>}
            {result && (
              <div style={{ background: "#081028", padding: "30px", borderRadius: "15px", border: "1px solid #1e3a5f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ color: "#38bdf8" }}>🎯 Results — <span style={{ color: "white" }}>{result.target}</span></h2>
                  {scanId && (
                    <button onClick={() => downloadPDF(scanId)}
                      style={{ padding: "10px 20px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
                      📄 Download PDF
                    </button>
                  )}
                </div>
                <h3 style={{ color: "#94a3b8", marginBottom: "10px" }}>📡 Open Ports</h3>
                {ports.length === 0 ? <p style={{ color: "#64748b" }}>No open ports found.</p> : (
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                    <thead>
                      <tr style={{ background: "#0f172a" }}>
                        {["Port","Protocol","State","Service"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ports.map((p, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#0a1628" : "#0d1f3c" }}>
                          <td style={tdStyle}><span style={{ color: "#38bdf8", fontWeight: "bold" }}>{p.port}</span></td>
                          <td style={tdStyle}>{p.proto}</td>
                          <td style={tdStyle}>
                            <span style={{ color: p.state === "open" ? "#4ade80" : p.state === "filtered" ? "#facc15" : "#f87171", fontWeight: "bold" }}>
                              {p.state === "open" ? "🟢" : p.state === "filtered" ? "🟡" : "🔴"} {p.state.toUpperCase()}
                            </span>
                          </td>
                          <td style={tdStyle}>{p.service}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <h3 style={{ color: "#94a3b8", marginBottom: "10px" }}>📄 Raw Nmap Output</h3>
                <pre style={{ background: "#000", padding: "20px", borderRadius: "10px", overflow: "auto", color: "#22c55e", fontSize: "13px", lineHeight: "1.6" }}>
                  {result.scan_result}
                </pre>
              </div>
            )}
          </>
        )}

        {page === "history" && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "30px" }}>📋 Scan History</h1>
            {histLoading ? <p style={{ color: "#64748b" }}>Loading...</p>
              : history.length === 0 ? <p style={{ color: "#64748b" }}>No scans yet.</p>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#081028" }}>
                      {["Target","Status","Date","Report"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? "#081028" : "#0a1628" }}>
                        <td style={tdStyle}><span style={{ color: "#38bdf8" }}>{s.target}</span></td>
                        <td style={tdStyle}><span style={{ color: "#4ade80" }}>✅ {s.status}</span></td>
                        <td style={tdStyle}>{new Date(s.createdAt).toLocaleString()}</td>
                        <td style={tdStyle}>
                          <button onClick={() => downloadPDF(s.id)}
                            style={{ padding: "6px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                            📄 PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "13px", marginBottom: "14px", borderRadius: "10px", border: "1px solid #1e3a5f", background: "#0f172a", color: "white", fontSize: "14px", boxSizing: "border-box" };
const thStyle = { borderBottom: "1px solid #1e3a5f", padding: "12px", textAlign: "left", color: "#94a3b8" };
const tdStyle = { borderBottom: "1px solid #1e293b", padding: "12px", color: "#e2e8f0" };

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  return !token
    ? <AuthPage onLogin={(t, u) => { setToken(t); setUser(u); }} />
    : <ScannerPage token={token} user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}
EOFcat > ~/vuln-scanner/frontend/src/App.jsx << 'EOF'
import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

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
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
        <h1 style={{ color: "white", textAlign: "center", marginBottom: "8px", fontSize: "22px" }}>🛡️ VulnScanner</h1>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "30px", fontSize: "13px" }}>
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </p>
        {!isLogin && <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />}
        <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleSubmit()} style={inputStyle} />
        {error && <p style={{ color: error.includes("Registered") ? "#4ade80" : "#f87171", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#334155" : "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", marginBottom: "16px" }}>
          {loading ? "⏳ Please wait..." : isLogin ? "Login" : "Register"}
        </button>
        <p style={{ color: "#64748b", textAlign: "center", fontSize: "13px" }}>
          {isLogin ? "No account? " : "Have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: "#38bdf8", cursor: "pointer" }}>
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
      const res = await fetch(`${API}/api/scans`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setHistory(data.scans);
    } catch (err) { console.error(err); }
    setHistLoading(false);
  };

  useEffect(() => { if (page === "history") fetchHistory(); }, [page]);

  const handleScan = async () => {
    if (!target) { alert("Enter target"); return; }
    setLoading(true); setError(""); setResult(null); setScanId(null);
    try {
      const res = await fetch(`${API}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target }),
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setResult(data);
      if (data.scanId) setScanId(data.scanId);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const downloadPDF = async (id) => {
    const res = await fetch(`${API}/api/scans/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `scan-report-${id}.pdf`;
    a.click(); window.URL.revokeObjectURL(url);
  };

  const parsePorts = (raw) => {
    if (!raw) return [];
    return raw.split("\n")
      .filter(line => /^\d+\/tcp\s+(open|filtered|closed)/.test(line))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const [portProto, state, ...svc] = parts;
        const [port, proto] = portProto.split("/");
        return { port, proto, state, service: svc.join(" ") || "unknown" };
      });
  };

  const ports = result ? parsePorts(result.scan_result) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#020c2b", color: "white", fontFamily: "monospace", display: "flex" }}>
      <div style={{ width: "220px", background: "#081028", borderRight: "1px solid #1e3a5f", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontSize: "16px", color: "white", marginBottom: "8px" }}>🛡️ VulnScanner</h2>
        <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "30px" }}>{user.email}</p>
        {[{ id: "scan", label: "🔍 New Scan" }, { id: "history", label: "📋 History" }].map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ padding: "12px 16px", background: page === n.id ? "#1e3a5f" : "transparent", color: page === n.id ? "#38bdf8" : "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", textAlign: "left", fontSize: "14px", marginBottom: "6px" }}>
            {n.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: "16px" }}>
          <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>👤 {user.name}</p>
          <p style={{ color: "#3b82f6", fontSize: "11px", marginBottom: "12px" }}>{user.role}</p>
          <button onClick={onLogout} style={{ width: "100%", padding: "10px", background: "#1e3a5f", color: "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>Logout</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "40px" }}>
        {page === "scan" && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "30px" }}>🔍 New Scan</h1>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input type="text" placeholder="Enter domain or IP (e.g. scanme.nmap.org)"
                value={target} onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleScan()}
                style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "1px solid #1e3a5f", background: "#081028", color: "white", fontSize: "15px" }} />
              <button onClick={handleScan} disabled={loading}
                style={{ padding: "15px 28px", borderRadius: "10px", border: "none", background: loading ? "#334155" : "#3b82f6", color: "white", cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "15px" }}>
                {loading ? "⏳ Scanning..." : "Start Scan"}
              </button>
            </div>
            {error && <div style={{ color: "#f87171", marginBottom: "20px" }}>❌ {error}</div>}
            {result && (
              <div style={{ background: "#081028", padding: "30px", borderRadius: "15px", border: "1px solid #1e3a5f" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ color: "#38bdf8" }}>🎯 Results — <span style={{ color: "white" }}>{result.target}</span></h2>
                  {scanId && (
                    <button onClick={() => downloadPDF(scanId)}
                      style={{ padding: "10px 20px", background: "#16a34a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>
                      📄 Download PDF
                    </button>
                  )}
                </div>
                <h3 style={{ color: "#94a3b8", marginBottom: "10px" }}>📡 Open Ports</h3>
                {ports.length === 0 ? <p style={{ color: "#64748b" }}>No open ports found.</p> : (
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                    <thead>
                      <tr style={{ background: "#0f172a" }}>
                        {["Port","Protocol","State","Service"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {ports.map((p, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#0a1628" : "#0d1f3c" }}>
                          <td style={tdStyle}><span style={{ color: "#38bdf8", fontWeight: "bold" }}>{p.port}</span></td>
                          <td style={tdStyle}>{p.proto}</td>
                          <td style={tdStyle}>
                            <span style={{ color: p.state === "open" ? "#4ade80" : p.state === "filtered" ? "#facc15" : "#f87171", fontWeight: "bold" }}>
                              {p.state === "open" ? "🟢" : p.state === "filtered" ? "🟡" : "🔴"} {p.state.toUpperCase()}
                            </span>
                          </td>
                          <td style={tdStyle}>{p.service}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <h3 style={{ color: "#94a3b8", marginBottom: "10px" }}>📄 Raw Nmap Output</h3>
                <pre style={{ background: "#000", padding: "20px", borderRadius: "10px", overflow: "auto", color: "#22c55e", fontSize: "13px", lineHeight: "1.6" }}>
                  {result.scan_result}
                </pre>
              </div>
            )}
          </>
        )}

        {page === "history" && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "30px" }}>📋 Scan History</h1>
            {histLoading ? <p style={{ color: "#64748b" }}>Loading...</p>
              : history.length === 0 ? <p style={{ color: "#64748b" }}>No scans yet.</p>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#081028" }}>
                      {["Target","Status","Date","Report"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? "#081028" : "#0a1628" }}>
                        <td style={tdStyle}><span style={{ color: "#38bdf8" }}>{s.target}</span></td>
                        <td style={tdStyle}><span style={{ color: "#4ade80" }}>✅ {s.status}</span></td>
                        <td style={tdStyle}>{new Date(s.createdAt).toLocaleString()}</td>
                        <td style={tdStyle}>
                          <button onClick={() => downloadPDF(s.id)}
                            style={{ padding: "6px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                            📄 PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "13px", marginBottom: "14px", borderRadius: "10px", border: "1px solid #1e3a5f", background: "#0f172a", color: "white", fontSize: "14px", boxSizing: "border-box" };
const thStyle = { borderBottom: "1px solid #1e3a5f", padding: "12px", textAlign: "left", color: "#94a3b8" };
const tdStyle = { borderBottom: "1px solid #1e293b", padding: "12px", color: "#e2e8f0" };

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  return !token
    ? <AuthPage onLogin={(t, u) => { setToken(t); setUser(u); }} />
    : <ScannerPage token={token} user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}
