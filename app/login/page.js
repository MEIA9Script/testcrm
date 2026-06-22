"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#07090F", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif", padding: 16,
    }}>
      <form onSubmit={handleLogin} style={{
        background: "#0D1120", border: "1px solid #1E293B", borderRadius: 16, padding: 32, width: "100%", maxWidth: 360,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ background: "linear-gradient(135deg, #818CF8, #38BDF8)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#fff" }}>N</div>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#F1F5F9" }}>Nexsite CRM</div>
        </div>

        <label style={labelStyle}>E-mail</label>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          style={inputStyle} placeholder="voce@nexsite.com.br" autoFocus
        />

        <label style={labelStyle}>Senha</label>
        <input
          type="password" required value={password} onChange={e => setPassword(e.target.value)}
          style={inputStyle} placeholder="••••••••"
        />

        {error && <div style={{ color: "#F87171", fontSize: 12.5, marginTop: 10 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{
          marginTop: 20, width: "100%", padding: "11px", borderRadius: 9, border: "none",
          background: loading ? "#1E293B" : "linear-gradient(135deg, #6366F1, #38BDF8)",
          color: loading ? "#475569" : "#fff", fontWeight: 800, fontSize: 13.5, cursor: loading ? "default" : "pointer",
        }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <div style={{ fontSize: 11, color: "#334155", marginTop: 16, textAlign: "center", lineHeight: 1.6 }}>
          Acesso restrito. Se você ainda não tem login, peça pra criar sua conta no painel do Supabase.
        </div>
      </form>
    </div>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, marginTop: 14, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" };
const inputStyle = { width: "100%", background: "#070A12", border: "1px solid #1E293B", borderRadius: 8, padding: "10px 12px", color: "#E2E8F0", fontSize: 13.5, outline: "none" };
