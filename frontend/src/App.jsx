import { useState, useEffect, useRef } from "react";

const API = "https://vuln-scanner-platform-production.up.railway.app";

const SEVERITY_COLOR = { Critical: "#ff0040", High: "#ff6b00", Medium: "#ffcc00", Low: "#00ff88", Info: "#00cfff" };

function MatrixRain() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 20);
    const drops = Array(cols).fill(1);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()アイウエオカキクケコ";
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = "15px monospace";
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 20, y * 20);
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, zIndex: 0, opacity: 0.15 }} />;
}

function GlitchText({ text }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ color: "#00ff41", textShadow: "0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 40px #00ff41" }}>{text}</span>
    </span>
  );
}

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
  const fullText = isLogin ? "AUTHENTICATE_ACCESS" : "CREATE_NEW_AGENT";

  useEffect(() => {
    setTyped("");
    let i = 0;
    const interval = setInterval(() => {
      setTyped(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [isLogin]);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email: form.email, password: form.password } : { ...form, role: "VIEWER" };
    try {
      const res = await fetch(API + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }
      if (isLogin) onLogin(data.token, data.user);
      else { setIsLogin(true); setError("AGENT REGISTERED. PROCEED TO LOGIN."); }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden" }}>
      <MatrixRain />
      <div style={{ position: "relative", zIndex: 1, background: "rgba(0,10,0,0.9)", padding: "40px", borderRadius: "4px", width: "420px", border: "1px solid #00ff41", boxShadow: "0 0 30px rgba(0,255,65,0.3), inset 0 0 30px rgba(0,255,65,0.05)" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "11px", color: "#00ff41", letterSpacing: "4px", marginBottom: "8px" }}>[ VULNSCANNER v2.0 ]</div>
          <div style={{ fontSize: "18px", color: "#00ff41", letterSpacing: "2px", minHeight: "28px" }}>
            {typed}<span style={{ animation: "blink 1s infinite", color: "#00ff41" }}>_</span>
          </div>
        </div>

        {!isLogin && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#00ff41", letterSpacing: "2px", marginBottom: "4px" }}>AGENT_NAME:</div>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", background: "rgba(0,255,65,0.05)", border: "1px solid #00ff41", color: "#00ff41", padding: "10px", fontFamily: "monospace", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#00ff41", letterSpacing: "2px", marginBottom: "4px" }}>EMAIL_ADDRESS:</div>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ width: "100%", background: "rgba(0,255,65,0.05)", border: "1px solid #00ff41", color: "#00ff41", padding: "10px", fontFamily: "monospace", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "10px", color: "#00ff41", letterSpacing: "2px", marginBottom: "4px" }}>PASSPHRASE:</div>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ width: "100%", background: "rgba(0,255,65,0.05)", border: "1px solid #00ff41", color: "#00ff41", padding: "10px", fontFamily: "monospace", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
        </div>

        {error && <div style={{ color: error.includes("REGISTERED") ? "#00ff41" : "#ff0040", fontSize: "12px", marginBottom: "16px", letterSpacing: "1px" }}>⚠ {error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "14px", background: loading ? "rgba(0,255,65,0.1)" : "rgba(0,255,65,0.15)", border: "1px solid #00ff41", color: "#00ff41", fontFamily: "monospace", fontSize: "14px", letterSpacing: "3px", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s", boxShadow: loading ? "none" : "0 0 15px rgba(0,255,65,0.3)" }}>
          {loading ? "[ AUTHENTICATING... ]" : isLogin ? "[ INITIATE LOGIN ]" : "[ CREATE AGENT ]"}
        </button>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#005500" }}>
          {isLogin ? "NO ACCOUNT? " : "HAVE ACCOUNT? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: "#00ff41", cursor: "pointer", textDecoration: "underline" }}>
            {isLogin ? "REGISTER" : "LOGIN"}
          </span>
        </div>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
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
    setLoading(true); setError(""); setResult(null); setScanId(null);
    setScanLog([]);

    const logs = [
      "[*] Initializing scan engine...",
      "[*] Resolving target: " + target,
      "[*] Running Nmap -sV -T4 --open...",
      "[*] Probing open ports...",
      "[*] Detecting service versions...",
      "[*] Analyzing vulnerabilities...",
      "[*] Generating report...",
    ];
    let i = 0;
    const logInterval = setInterval(() => {
      if (i < logs.length) { setScanLog(prev => [...prev, logs[i]]); i++; }
      else clearInterval(logInterval);
    }, 600);

    try {
      const res = await fetch(API + "/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ target }),
      });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      clearInterval(logInterval);
      setScanLog(prev => [...prev, "[+] SCAN COMPLETE"]);
      setResult(data);
      if (data.scanId) setScanId(data.scanId);
    } catch (err) {
      clearInterval(logInterval);
      setError(err.message);
    }
    setLoading(false);
  };

  const downloadReport = async (id) => {
    const res = await fetch(API + "/api/scans/" + id + "/pdf", { headers: { Authorization: "Bearer " + token } });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "vuln-report-" + id + ".txt";
    a.click(); window.URL.revokeObjectURL(url);
  };

  const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#00ff41", fontFamily: "'Courier New', monospace", display: "flex", position: "relative" }}>
      <MatrixRain />

      {/* SIDEBAR */}
      <div style={{ width: "240px", background: "rgba(0,10,0,0.95)", borderRight: "1px solid #00ff41", padding: "20px 16px", display: "flex", flexDirection: "column", position: "relative", zIndex: 1, boxShadow: "2px 0 20px rgba(0,255,65,0.1)" }}>
        <div style={{ marginBottom: "30px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#005500", marginBottom: "4px" }}>[ SYSTEM ]</div>
          <div style={{ fontSize: "16px", letterSpacing: "2px", textShadow: "0 0 10px #00ff41" }}>VULNSCANNER</div>
          <div style={{ fontSize: "10px", color: "#005500", marginTop: "4px" }}>v2.0 // ACTIVE</div>
        </div>

        <div style={{ fontSize: "10px", color: "#005500", letterSpacing: "2px", marginBottom: "8px" }}>NAVIGATION:</div>
        {[
          { id: "scan", label: "[ NEW_SCAN ]", icon: "⬡" },
          { id: "history", label: "[ SCAN_LOG ]", icon: "⬡" },
        ].map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ padding: "12px", background: page === n.id ? "rgba(0,255,65,0.15)" : "transparent", color: page === n.id ? "#00ff41" : "#005500", border: page === n.id ? "1px solid #00ff41" : "1px solid transparent", cursor: "pointer", textAlign: "left", fontSize: "12px", letterSpacing: "1px", marginBottom: "4px", fontFamily: "monospace", transition: "all 0.2s", boxShadow: page === n.id ? "0 0 10px rgba(0,255,65,0.2)" : "none" }}>
            {n.icon} {n.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid #003300", paddingTop: "16px" }}>
          <div style={{ fontSize: "10px", color: "#005500", marginBottom: "4px" }}>AGENT: {user.name}</div>
          <div style={{ fontSize: "10px", color: "#005500", marginBottom: "4px" }}>ROLE: {user.role}</div>
          <div style={{ fontSize: "10px", color: "#005500", marginBottom: "12px", wordBreak: "break-all" }}>{user.email}</div>
          <button onClick={onLogout}
            style={{ width: "100%", padding: "8px", background: "transparent", color: "#ff0040", border: "1px solid #ff0040", cursor: "pointer", fontSize: "11px", letterSpacing: "2px", fontFamily: "monospace" }}>
            [ LOGOUT ]
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "30px", position: "relative", zIndex: 1, overflowY: "auto" }}>
        {page === "scan" && (
          <div>
            <div style={{ marginBottom: "30px" }}>
              <div style={{ fontSize: "10px", color: "#005500", letterSpacing: "3px", marginBottom: "8px" }}>// TARGET ACQUISITION</div>
              <h1 style={{ fontSize: "24px", letterSpacing: "4px", textShadow: "0 0 20px #00ff41", margin: 0 }}>VULNERABILITY_SCAN</h1>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#005500", fontSize: "14px" }}>TARGET:~$</span>
                <input type="text" placeholder="scanme.nmap.org" value={target}
                  onChange={e => setTarget(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  style={{ width: "100%", padding: "14px 14px 14px 100px", background: "rgba(0,255,65,0.05)", border: "1px solid #00ff41", color: "#00ff41", fontFamily: "monospace", fontSize: "14px", outline: "none", boxSizing: "border-box", boxShadow: "0 0 10px rgba(0,255,65,0.1)" }} />
              </div>
              <button onClick={handleScan} disabled={loading}
                style={{ padding: "14px 28px", background: loading ? "rgba(0,255,65,0.05)" : "rgba(0,255,65,0.15)", border: "1px solid #00ff41", color: "#00ff41", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: "13px", letterSpacing: "2px", boxShadow: loading ? "none" : "0 0 15px rgba(0,255,65,0.3)", whiteSpace: "nowrap" }}>
                {loading ? "[ SCANNING... ]" : "[ INITIATE SCAN ]"}
              </button>
            </div>

            {/* SCAN LOG */}
            {scanLog.length > 0 && (
              <div style={{ background: "rgba(0,10,0,0.8)", border: "1px solid #003300", padding: "16px", marginBottom: "20px", fontFamily: "monospace", fontSize: "12px" }}>
                {scanLog.map((log, i) => (
                  <div key={i} style={{ color: log.includes("[+]") ? "#00ff41" : "#005500", marginBottom: "4px" }}>
                    {log}
                  </div>
                ))}
                {loading && <span style={{ color: "#00ff41", animation: "blink 1s infinite" }}>█</span>}
              </div>
            )}

            {error && <div style={{ color: "#ff0040", marginBottom: "20px", fontSize: "12px" }}>⚠ ERROR: {error}</div>}

            {result && (
              <div>
                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #003300" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#005500", letterSpacing: "2px" }}>// SCAN RESULTS</div>
                    <div style={{ fontSize: "20px", letterSpacing: "3px", textShadow: "0 0 10px #00ff41" }}>TARGET: {result.target}</div>
                  </div>
                  {scanId && (
                    <button onClick={() => downloadReport(scanId)}
                      style={{ padding: "10px 20px", background: "rgba(0,255,65,0.1)", border: "1px solid #00ff41", color: "#00ff41", cursor: "pointer", fontFamily: "monospace", fontSize: "12px", letterSpacing: "2px", boxShadow: "0 0 10px rgba(0,255,65,0.2)" }}>
                      [ EXPORT_REPORT ]
                    </button>
                  )}
                </div>

                {/* VULNERABILITY SUMMARY */}
                {result.vulnerabilities && result.vulnerabilities.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "11px", color: "#005500", letterSpacing: "3px", marginBottom: "12px" }}>// THREAT ASSESSMENT</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
                      {result.vulnerabilities.sort((a,b) => (severityOrder[a.severity]||5) - (severityOrder[b.severity]||5)).map((v, i) => (
                        <div key={i} style={{ background: "rgba(0,10,0,0.8)", border: "1px solid " + (SEVERITY_COLOR[v.severity] || "#00ff41"), padding: "16px", boxShadow: "0 0 10px " + (SEVERITY_COLOR[v.severity] || "#00ff41") + "33" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "bold", letterSpacing: "1px" }}>{v.title}</span>
                            <span style={{ fontSize: "11px", color: SEVERITY_COLOR[v.severity], letterSpacing: "1px", border: "1px solid " + SEVERITY_COLOR[v.severity], padding: "2px 8px" }}>{v.severity}</span>
                          </div>
                          {v.cve && <div style={{ fontSize: "11px", color: "#ff6b00", marginBottom: "6px", letterSpacing: "1px" }}>⚑ {v.cve}</div>}
                          <div style={{ fontSize: "11px", color: "#005500", lineHeight: "1.6" }}>{v.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PORTS TABLE */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", color: "#005500", letterSpacing: "3px", marginBottom: "12px" }}>// PORT_SCAN_RESULTS</div>
                  {(!result.ports || result.ports.length === 0) ? (
                    <div style={{ color: "#005500", fontSize: "12px" }}>[!] No open ports detected.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #003300" }}>
                          {["PORT", "PROTO", "STATE", "SERVICE", "VERSION"].map(h => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#005500", letterSpacing: "2px", fontSize: "10px" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.ports.map((p, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #001100" }}>
                            <td style={{ padding: "10px 12px", color: "#00ff41", fontWeight: "bold" }}>{p.port}</td>
                            <td style={{ padding: "10px 12px", color: "#005500" }}>{p.proto}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{ color: p.state === "open" ? "#00ff41" : "#ff0040", letterSpacing: "1px" }}>
                                ● {p.state.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", color: "#00cfff" }}>{p.service}</td>
                            <td style={{ padding: "10px 12px", color: "#005500", fontSize: "11px" }}>{p.version}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* RAW OUTPUT */}
                <div>
                  <div style={{ fontSize: "11px", color: "#005500", letterSpacing: "3px", marginBottom: "12px" }}>// RAW_NMAP_OUTPUT</div>
                  <pre style={{ background: "rgba(0,10,0,0.8)", border: "1px solid #003300", padding: "20px", overflow: "auto", color: "#00ff41", fontSize: "12px", lineHeight: "1.8", margin: 0 }}>
                    {result.scan_result}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {page === "history" && (
          <div>
            <div style={{ marginBottom: "30px" }}>
              <div style={{ fontSize: "10px", color: "#005500", letterSpacing: "3px", marginBottom: "8px" }}>// MISSION ARCHIVE</div>
              <h1 style={{ fontSize: "24px", letterSpacing: "4px", textShadow: "0 0 20px #00ff41", margin: 0 }}>SCAN_HISTORY</h1>
            </div>
            {histLoading ? (
              <div style={{ color: "#005500", fontSize: "12px" }}>[*] Loading archive...</div>
            ) : history.length === 0 ? (
              <div style={{ color: "#005500", fontSize: "12px" }}>[!] No scans in archive.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #003300" }}>
                    {["TARGET", "STATUS", "TIMESTAMP", "REPORT"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#005500", letterSpacing: "2px", fontSize: "10px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #001100" }}>
                      <td style={{ padding: "10px 12px", color: "#00ff41" }}>{s.target}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ color: "#00ff41", letterSpacing: "1px" }}>● {s.status.toUpperCase()}</span></td>
                      <td style={{ padding: "10px 12px", color: "#005500", fontSize: "11px" }}>{new Date(s.createdAt).toLocaleString()}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <button onClick={() => downloadReport(s.id)}
                          style={{ padding: "6px 12px", background: "transparent", border: "1px solid #00ff41", color: "#00ff41", cursor: "pointer", fontFamily: "monospace", fontSize: "11px", letterSpacing: "1px" }}>
                          [ EXPORT ]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} } * { scrollbar-width: thin; scrollbar-color: #003300 #000; }`}</style>
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
