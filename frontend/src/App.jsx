import { useState } from "react";

function App() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleScan = async () => {
    if (!target) {
      alert("Please enter a target");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:3001/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      console.log("SCAN RESULT:", data);

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020c2b",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <h1>Vulnerability Scanner Platform</h1>

      <input
        type="text"
        placeholder="Enter domain or IP"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        style={{
          padding: "12px",
          width: "350px",
          borderRadius: "10px",
          border: "none",
        }}
      />

      <button
        onClick={handleScan}
        style={{
          padding: "12px 20px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Scanning..." : "Start Scan"}
      </button>

      {error && (
        <div
          style={{
            color: "red",
            background: "#fff",
            padding: "10px",
            borderRadius: "10px",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <pre
          style={{
            background: "#0f172a",
            padding: "20px",
            borderRadius: "10px",
            width: "600px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;