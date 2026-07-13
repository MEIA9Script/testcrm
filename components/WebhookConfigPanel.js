import { useState } from "react";
import { Webhook, Save, Check } from "lucide-react";

export function WebhookConfigPanel({ webhookConfig, saveWebhookConfig }) {
  const [url, setUrl] = useState(webhookConfig?.url || "");
  const [events, setEvents] = useState(webhookConfig?.events || {
    on_lead_created: true,
    on_status_changed: true,
    on_stage_changed: true,
    on_activity_done: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveWebhookConfig({ url, events });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleEvent = (key) => setEvents({ ...events, [key]: !events[key] });

  return (
    <div style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#052e16", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Webhook size={16} color="#22C55E" />
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
          <EventCheckbox label="Nova empresa cadastrada" checked={events.on_lead_created} onChange={() => toggleEvent('on_lead_created')} />
          <EventCheckbox label="Empresa ganhou/perdeu" checked={events.on_status_changed} onChange={() => toggleEvent('on_status_changed')} />
          <EventCheckbox label="Empresa mudou de etapa" checked={events.on_stage_changed} onChange={() => toggleEvent('on_stage_changed')} />
          <EventCheckbox label="Atividade concluída" checked={events.on_activity_done} onChange={() => toggleEvent('on_activity_done')} />
        </div>
      </div>

      <button 
        onClick={handleSave}
        style={{ width: "100%", background: saved ? "#052e16" : "linear-gradient(135deg, #22C55E, #16A34A)", border: saved ? "1px solid #25D366" : "none", borderRadius: 8, padding: "10px", color: saved ? "#86EFAC" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}
      >
        {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar Webhook</>}
      </button>
      
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #141A2B" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Documentação do Payload</div>
        <div style={{ background: "#07090F", border: "1px solid #141A2B", borderRadius: 8, padding: 12, fontSize: 11, color: "#94A3B8", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" }}>
{`// O webhook envia um POST JSON:
{
  "event": "on_lead_created", // O nome do evento
  "timestamp": "2023-10-01T12:00:00.000Z",
  "payload": {
    "company": {
      "id": "...",
      "name": "Nome",
      "email": "...",
      "phone": "...",
      "status": "...", // "ganho", "perdido", "novo"
      "stageId": "...",
      "flowId": "...",
      "obs": "..."
    },
    // Se for atividade concluída, inclui:
    "activity": { ... }
  }
}`}
        </div>
      </div>
    </div>
  );
}

function EventCheckbox({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "#CBD5E1" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ cursor: "pointer" }} />
      {label}
    </label>
  );
}
