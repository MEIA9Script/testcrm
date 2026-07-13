"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";

export function WebhookConfigPanel({ webhookConfig, saveWebhookConfig }) {
  const config = webhookConfig || {};
  const [url, setUrl] = useState(config.url || "");
  const [events, setEvents] = useState(config.events || {
    on_lead_created: true,
    on_status_changed: true,
    on_stage_changed: true,
    on_activity_done: true,
  });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = async () => {
    if (!saveWebhookConfig) return;
    await saveWebhookConfig({ url, events });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!url) {
      setTestResult({ ok: false, msg: "Insira uma URL primeiro." });
      setTimeout(() => setTestResult(null), 3000);
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          payload: { message: "Teste de conexão do Nexsite CRM" },
        }),
      });
      setTestResult({ ok: true, msg: `Enviado! Status: ${res.status}` });
    } catch (err) {
      setTestResult({ ok: false, msg: `Erro: ${err.message}` });
    }
    setTesting(false);
    setTimeout(() => setTestResult(null), 4000);
  };

  const toggleEvent = (key) => setEvents({ ...events, [key]: !events[key] });

  const EVENT_LABELS = [
    { key: "on_lead_created", label: "Nova empresa cadastrada" },
    { key: "on_status_changed", label: "Empresa ganhou/perdeu" },
    { key: "on_stage_changed", label: "Empresa mudou de etapa" },
    { key: "on_activity_done", label: "Atividade concluída" },
  ];

  return (
    <div style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#052e16", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={16} color="#22C55E" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#F1F5F9" }}>Integração via Webhook</div>
          <div style={{ fontSize: 11.5, color: "#64748B" }}>Envie dados para Zapier, Make, n8n, etc.</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>URL do Webhook</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hooks.zapier.com/hooks/catch/..."
          style={{ width: "100%", background: "#07090F", border: "1px solid #141A2B", borderRadius: 8, padding: "10px 12px", color: "#E2E8F0", fontSize: 13, outline: "none" }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Disparar quando:</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EVENT_LABELS.map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "#CBD5E1" }}>
              <input type="checkbox" checked={!!events[key]} onChange={() => toggleEvent(key)} style={{ cursor: "pointer" }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1, background: saved ? "#052e16" : "linear-gradient(135deg, #22C55E, #16A34A)",
            border: saved ? "1px solid #25D366" : "none", borderRadius: 8, padding: "10px",
            color: saved ? "#86EFAC" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s",
          }}
        >
          {saved ? <><Check size={14} /> Salvo!</> : <><Zap size={14} /> Salvar Webhook</>}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          style={{
            background: "#0D1120", border: "1px solid #141A2B", borderRadius: 8, padding: "10px 16px",
            color: testing ? "#475569" : "#94A3B8", fontWeight: 700, fontSize: 13,
            cursor: testing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {testing ? "Enviando…" : "Testar"}
        </button>
      </div>

      {testResult && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: testResult.ok ? "#052e1640" : "#7C2D1230",
          border: `1px solid ${testResult.ok ? "#25D36640" : "#F8717140"}`,
          color: testResult.ok ? "#86EFAC" : "#FCA5A5",
        }}>
          {testResult.msg}
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #141A2B" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Documentação do Payload</div>
        <div style={{ background: "#07090F", border: "1px solid #141A2B", borderRadius: 8, padding: 12, fontSize: 11, color: "#94A3B8", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" }}>
{`// O webhook envia um POST JSON:
{
  "event": "on_lead_created", // Eventos possíveis:
  // on_lead_created — nova empresa
  // on_status_changed — ganhou ou perdeu
  // on_stage_changed — mudou de etapa
  // on_activity_done — atividade concluída
  "timestamp": "2025-10-01T12:00:00.000Z",
  "payload": {
    "company": {
      "id": "...",
      "name": "Nome da Empresa",
      "email": "contato@empresa.com",
      "phone": "11999990001",
      "status": "ativo", // "ganho", "perdido", "ativo"
      "stageId": "st1",
      "flowId": "flow_...",
      "segment": "Restaurante",
      "decisor": "João Silva",
      "cnpj": "12.345.678/0001-90",
      "obs": "Observações..."
    },
    // Se for on_activity_done, inclui:
    "activity": {
      "id": "h_...",
      "activityId": "a1",
      "stageId": "st1",
      "channel": "whatsapp",
      "title": "Primeira mensagem",
      "at": "2025-10-01T12:00:00.000Z"
    }
  }
}`}
        </div>
      </div>
    </div>
  );
}
