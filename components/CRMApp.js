"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Phone, MessageCircle, Mail, Plus, X, ChevronDown, ChevronRight,
  LayoutGrid, List, Settings, ArrowLeft, Check, Clock, Building2,
  Trash2, Edit3, GripVertical, CheckCircle2, Circle, AlertCircle,
  Sparkles, Search, Trophy, ThumbsDown, Upload, Download, FileSpreadsheet,
  LayoutDashboard, Briefcase, DollarSign, TrendingUp, TrendingDown, Target, LogOut
} from "lucide-react";
import * as XLSX from "xlsx";
import { useCRMData } from "../lib/useCRMData";
import { createClient } from "../lib/supabase-browser";
import { useRouter } from "next/navigation";

/* ============================================================
   CONSTANTS
   ============================================================ */

const CHANNELS = {
  whatsapp: { label: "WhatsApp", color: "#25D366", bg: "#052e16", Icon: MessageCircle },
  ligacao:  { label: "Ligação",  color: "#818CF8", bg: "#1e1b4b", Icon: Phone },
  email:    { label: "E-mail",   color: "#FB923C", bg: "#1c0f05", Icon: Mail },
};

const STAGE_COLORS = ["#818CF8", "#38BDF8", "#25D366", "#FB923C", "#F472B6", "#FBBF24", "#A78BFA"];

const DEFAULT_LOSS_REASONS = [
  "Sem orçamento no momento",
  "Já tem site",
  "Não respondeu / sumiu",
  "Achou caro",
  "Fechou com concorrente",
];

const SAMPLE_FLOW = {
  id: "flow_sample",
  name: "Cadência Padrão Nexsite",
  stages: [
    {
      id: "st1", name: "Confirmar Contato", color: "#818CF8",
      activities: [
        { id: "a1", day: 1, channel: "whatsapp", title: "Abertura", script: "Olá, bom dia! Tudo bem? 😊\nEsse número é da [Nome da Empresa]?" },
        { id: "a2", day: 1, channel: "email", title: "Abertura", script: "Assunto: Olá, tudo bem? — Nexsite\n\nOlá! Bom dia, tudo bem?\nGostaria de confirmar: esse é o e-mail da [Nome da Empresa]?\n\nAbraço,\nIuri — Nexsite" },
        { id: "a3", day: 1, channel: "ligacao", title: "Confirmação", script: "Oi, bom dia! Aqui é o Iuri, da Nexsite. Liguei pra confirmar se esse número é da [Nome da Empresa]. Tudo bem?" },
        { id: "a4", day: 2, channel: "whatsapp", title: "Follow-up", script: "Oi, bom dia! 👋 Iuri aqui, da Nexsite. Mandei uma mensagem ontem mas pode ter passado batido — só queria confirmar se esse é o contato certo da [Nome da Empresa]. 😊" },
        { id: "a5", day: 2, channel: "ligacao", title: "Tentativa 09h", script: "Bom dia! Aqui é o Iuri, da Nexsite. Tentei falar ontem — esse é o número da [Nome da Empresa]?" },
        { id: "a6", day: 2, channel: "ligacao", title: "Tentativa 12h30", script: "Boa tarde! Aqui é o Iuri, da Nexsite. Tentei mais cedo mas não consegui — tem um minutinho pra conversar agora?" },
        { id: "a7", day: 3, channel: "whatsapp", title: "Reforço", script: "Oi! Bom dia 🌅 Iuri da Nexsite aqui. Já tentei contato alguns dias seguidos — quero só entender se esse número realmente pertence à [Nome da Empresa]. Se não for, me avisa pra eu não incomodar mais. 😊" },
        { id: "a8", day: 3, channel: "ligacao", title: "Tentativa 09h", script: "Bom dia! Iuri da Nexsite, terceira vez que tento. Tô ligando pra [Nome da Empresa]?" },
        { id: "a9", day: 3, channel: "ligacao", title: "Tentativa 12h30", script: "Boa tarde! Aqui é o Iuri, da Nexsite. Você é da [Nome da Empresa]? Só levo 1 minuto." },
        { id: "a10", day: 4, channel: "whatsapp", title: "Pré-encerramento", script: "Oi! 👋 Iuri da Nexsite. Vou tentar mais uma vez hoje e amanhã — se não conseguir retorno vou encerrar por aqui. Se você é da [Nome da Empresa], é só responder. Sem pressão! 🙏" },
        { id: "a11", day: 4, channel: "ligacao", title: "Tentativa 09h", script: "Bom dia! Iuri da Nexsite, penúltimo dia tentando falar com vocês." },
        { id: "a12", day: 4, channel: "ligacao", title: "Tentativa 12h30", script: "Boa tarde! Iuri da Nexsite. Ainda tentando — tem um minutinho agora?" },
        { id: "a13", day: 5, channel: "whatsapp", title: "Breakup", script: "Oi! Iuri da Nexsite. Tentei contato essa semana, mas não consegui retorno. Vou encerrar por aqui pra não incomodar. 🙏\nSe um dia quiser conversar sobre presença digital pra [Nome da Empresa], me chama. Sucesso! 💪" },
        { id: "a14", day: 5, channel: "email", title: "Breakup", script: "Assunto: Encerrando por aqui — Nexsite\n\nOlá! Tentei contato essa semana por diferentes canais, mas não obtive retorno.\nVou encerrar por aqui. Se um dia fizer sentido conversar, é só responder esse e-mail.\n\nSucesso no negócio!\nIuri — Nexsite" },
        { id: "a15", day: 5, channel: "ligacao", title: "Tentativa 09h", script: "Bom dia! Iuri da Nexsite — última tentativa por aqui. Sucesso!" },
        { id: "a16", day: 5, channel: "ligacao", title: "Tentativa 12h30", script: "Boa tarde, última tentativa! Iuri da Nexsite. Abraço!" },
      ],
    },
    {
      id: "st2", name: "Chegar no Decisor", color: "#38BDF8",
      activities: [
        { id: "b1", day: 1, channel: "whatsapp", title: "Identificar decisor", script: "Oi, [Nome]! Que bom ter seu retorno 😊\nAqui é o Iuri, da Nexsite. Você é o responsável pelo [Nome da Empresa] ou tem outra pessoa que cuida da parte digital?" },
        { id: "b2", day: 1, channel: "email", title: "Apresentação", script: "Assunto: Re: próximo passo\n\nOlá, [Nome]! Obrigado pelo retorno 😊\nSou o Iuri, da Nexsite. Você é a pessoa que toma decisões sobre o negócio?\n\nAbraço,\nIuri — Nexsite" },
        { id: "b3", day: 1, channel: "ligacao", title: "Identificar decisor", script: "Oi [Nome], aqui é o Iuri da Nexsite! Você é o dono(a) da [Nome da Empresa]?" },
        { id: "b4", day: 2, channel: "whatsapp", title: "Qualificação", script: "Oi [Nome]! Iuri da Nexsite. A [Nome da Empresa] já tem site hoje ou ainda não tem presença online?" },
        { id: "b5", day: 2, channel: "ligacao", title: "Follow-up", script: "Oi [Nome], Iuri da Nexsite! Conseguiu verificar? Quero marcar 15 minutinhos." },
        { id: "b6", day: 3, channel: "whatsapp", title: "Prova social", script: "Oi [Nome]! 😊 Separei um exemplo de site parecido com o [Nome da Empresa]. Posso te mandar?" },
        { id: "b7", day: 3, channel: "ligacao", title: "Follow-up", script: "Oi [Nome], Iuri da Nexsite. Mandei exemplos por WhatsApp — conseguiu ver?" },
        { id: "b8", day: 4, channel: "whatsapp", title: "Agendar conversa", script: "Oi [Nome]! Tenho uma proposta acessível pra [Nome da Empresa]. Podemos bater um papo de 15 minutinhos essa semana?" },
        { id: "b9", day: 4, channel: "ligacao", title: "Agendar conversa", script: "Oi [Nome], Iuri da Nexsite! Quando você teria 15 minutos essa semana?" },
        { id: "b10", day: 5, channel: "whatsapp", title: "Breakup", script: "Oi [Nome]! Última tentativa de marcar um papo essa semana. Se não for o momento, tudo bem — só me avisa! 😊" },
        { id: "b11", day: 5, channel: "email", title: "Breakup", script: "Assunto: Proposta rápida — Nexsite\n\nOlá, [Nome]! Quero ser direto: acredito que um site pode ajudar a [Nome da Empresa]. Se quiser ver a proposta, me responde aqui.\n\nAbraço,\nIuri — Nexsite" },
        { id: "b12", day: 5, channel: "ligacao", title: "Breakup", script: "Oi [Nome], Iuri da Nexsite. Última tentativa essa semana — respeito qualquer resposta!" },
      ],
    },
  ],
};

const uid = (p = "id") => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   ROOT APP
   ============================================================ */

export default function CRMApp() {
  const router = useRouter();
  const { companies, flows, lossReasons, loaded, error, saveCompanies, saveFlows, saveLossReasons, setError } = useCRMData();
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
  const [view, setView] = useState("dashboard"); // dashboard | list | kanban | flows | negocios | config | company
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [showNewCompany, setShowNewCompany] = useState(false);

  useEffect(() => {
    if (!loaded || flows.length === 0 || companies.length === 0) return;
    let hasChanges = false;
    const nextCompanies = companies.map(c => {
      let flow = flows.find(f => f.id === c.flowId);
      let newFlowId = c.flowId;
      let newStageId = c.stageId;
      let changed = false;

      if (!flow) {
        flow = flows[0];
        newFlowId = flow.id;
        changed = true;
      }

      if (flow && flow.stages.length > 0) {
        const hasValidStage = flow.stages.some(s => s.id === newStageId);
        if (!hasValidStage) {
          newStageId = flow.stages[0].id;
          changed = true;
        }
      }

      if (changed) {
        hasChanges = true;
        return { ...c, flowId: newFlowId, stageId: newStageId, stageStartDate: c.stageStartDate || todayISO() };
      }
      return c;
    });

    if (hasChanges) {
      saveCompanies(nextCompanies);
    }
  }, [loaded, flows, companies, saveCompanies]);

  if (!loaded) {
    return (
      <div style={{ background: "#07090F", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "system-ui" }}>
        Carregando CRM…
      </div>
    );
  }

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  // Funil ativo = não ganho nem perdido. "Negócios" = ganho ou perdido.
  const pipelineCompanies = companies.filter(c => c.status !== "ganho" && c.status !== "perdido");
  const dealCompanies = companies.filter(c => c.status === "ganho" || c.status === "perdido");

  return (
    <div style={{ background: "#07090F", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", color: "#E2E8F0" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
        button { font-family: inherit; }
        input, textarea, select { font-family: inherit; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      {error && (
        <div style={{ background: "#7C2D12", color: "#FED7AA", padding: "8px 16px", fontSize: 12, textAlign: "center" }}>
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 10, background: "none", border: "none", color: "#FED7AA", textDecoration: "underline", cursor: "pointer", fontSize: 12 }}>fechar</button>
        </div>
      )}

      <TopBar view={view} setView={setView} onNewCompany={() => setShowNewCompany(true)} companyCount={pipelineCompanies.length} onLogout={handleLogout} />

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 16px 60px" }}>
        {view === "dashboard" && (
          <DashboardView companies={companies} flows={flows} setView={setView} onOpenCompany={(id) => { setActiveCompanyId(id); setView("company"); }} />
        )}
        {view === "list" && (
          <ListView companies={pipelineCompanies} allCompanies={companies} flows={flows} onOpenCompany={(id) => { setActiveCompanyId(id); setView("company"); }} saveCompanies={saveCompanies} />
        )}
        {view === "kanban" && (
          <KanbanView companies={pipelineCompanies} allCompanies={companies} flows={flows} onOpenCompany={(id) => { setActiveCompanyId(id); setView("company"); }} saveCompanies={saveCompanies} />
        )}
        {view === "flows" && (
          <FlowsView flows={flows} saveFlows={saveFlows} companies={companies} />
        )}
        {view === "negocios" && (
          <NegociosView companies={companies} onOpenCompany={(id) => { setActiveCompanyId(id); setView("company"); }} saveCompanies={saveCompanies} />
        )}
        {view === "config" && (
          <ConfigView
            companies={companies} flows={flows} lossReasons={lossReasons}
            saveCompanies={saveCompanies} saveFlows={saveFlows} saveLossReasons={saveLossReasons}
          />
        )}
        {view === "company" && activeCompany && (
          <CompanyView
            company={activeCompany}
            flows={flows}
            companies={companies}
            lossReasons={lossReasons}
            saveCompanies={saveCompanies}
            onBack={() => { setView("list"); setActiveCompanyId(null); }}
          />
        )}
        {view === "company" && !activeCompany && (
          <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>Empresa não encontrada.</div>
        )}
      </div>

      {showNewCompany && (
        <NewCompanyModal
          flows={flows}
          onClose={() => setShowNewCompany(false)}
          onCreate={async (newCo) => {
            await saveCompanies([...companies, newCo]);
            setShowNewCompany(false);
            setActiveCompanyId(newCo.id);
            setView("company");
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   TOP BAR
   ============================================================ */

function TopBar({ view, setView, onNewCompany, companyCount, onLogout }) {
  const tabs = [
    { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { key: "list", label: "Atividades", Icon: List },
    { key: "kanban", label: "Kanban", Icon: LayoutGrid },
    { key: "flows", label: "Fluxos", Icon: Settings },
    { key: "negocios", label: "Negócios", Icon: Briefcase },
    { key: "config", label: "Config", Icon: FileSpreadsheet },
  ];
  return (
    <div style={{ borderBottom: "1px solid #141A2B", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "sticky", top: 0, background: "#07090Fee", backdropFilter: "blur(8px)", zIndex: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "linear-gradient(135deg, #818CF8, #38BDF8)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff", flexShrink: 0 }}>N</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px" }}>Nexsite CRM</div>
          <div style={{ fontSize: 10.5, color: "#475569" }}>{companyCount} no funil ativo</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "#0D1120", border: "1px solid #141A2B", borderRadius: 10, padding: 3, gap: 2, flexWrap: "wrap" }}>
          {tabs.map(t => {
            const Icon = t.Icon;
            const active = view === t.key || (view === "company" && t.key === "list");
            return (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 7,
                  background: active ? "#1E293B" : "transparent", border: "none",
                  color: active ? "#F1F5F9" : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap",
                }}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onNewCompany}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #6366F1, #38BDF8)", border: "none", borderRadius: 9, padding: "9px 14px", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
        >
          <Plus size={14} /> Nova empresa
        </button>
        <button
          onClick={onLogout}
          title="Sair"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#0D1120", border: "1px solid #141A2B", borderRadius: 9, padding: "9px 11px", color: "#64748B", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ACTIVITY ENGINE — compute pending activities per company
   ============================================================ */

// Returns array of { activity, stage, dayDate, status: 'done'|'today'|'upcoming'|'overdue' }
function computeCompanyAgenda(company, flows) {
  const items = [];
  const flow = flows.find(f => f.id === company.flowId);

  if (flow) {
    const stageIdx = flow.stages.findIndex(s => s.id === company.stageId);
    if (stageIdx !== -1) {
      const stage = flow.stages[stageIdx];
      const stageStart = company.stageStartDate ? new Date(company.stageStartDate) : new Date();
      for (const act of stage.activities) {
        const dueDate = addBusinessDays(stageStart, act.day - 1);
        const log = (company.history || []).find(h => h.activityId === act.id && h.stageId === stage.id);
        items.push({
          activity: act,
          stage,
          flow,
          dueDate,
          done: !!log,
          doneAt: log?.at || null,
          isExtra: false,
        });
      }
    }
  }

  // Atividades avulsas adicionadas manualmente na ficha da empresa
  const extraStage = { id: "extra", name: "Atividade avulsa", color: "#F472B6" };
  for (const act of (company.extraActivities || [])) {
    const dueDate = act.dueDate ? new Date(act.dueDate) : new Date();
    const log = (company.history || []).find(h => h.activityId === act.id && h.stageId === "extra");
    items.push({
      activity: act,
      stage: extraStage,
      flow: null,
      dueDate,
      done: !!log,
      doneAt: log?.at || null,
      isExtra: true,
    });
  }

  return items.sort((a, b) => a.dueDate - b.dueDate);
}

function addBusinessDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

function fmtDate(d) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function activityStatus(item) {
  if (item.done) return "done";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(item.dueDate);
  due.setHours(0, 0, 0, 0);
  if (isSameDay(due, now)) return "today";
  if (due < now) return "overdue";
  return "upcoming";
}

/* ============================================================
   LIST VIEW — flat activities by row
   ============================================================ */

function ListView({ companies, allCompanies, flows, onOpenCompany, saveCompanies }) {
  const [filter, setFilter] = useState("pending"); // pending | all | done
  const [search, setSearch] = useState("");
  const [activeIdx, setActiveIdx] = useState(null); // índice dentro de `rows` aberto no drawer

  const rows = useMemo(() => {
    let all = [];
    for (const co of companies) {
      const agenda = computeCompanyAgenda(co, flows);
      for (const item of agenda) {
        all.push({ ...item, company: co });
      }
    }
    if (filter === "pending") all = all.filter(r => !r.done);
    if (filter === "done") all = all.filter(r => r.done);
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(r => r.company.name.toLowerCase().includes(q));
    }
    const order = { overdue: 0, today: 1, upcoming: 2, done: 3 };
    all.sort((a, b) => {
      const sa = a.done ? "done" : activityStatus(a);
      const sb = b.done ? "done" : activityStatus(b);
      if (order[sa] !== order[sb]) return order[sa] - order[sb];
      return a.dueDate - b.dueDate;
    });
    return all;
  }, [companies, flows, filter, search]);

  const toggleDone = async (row) => {
    const co = allCompanies.find(c => c.id === row.company.id);
    const stageId = row.isExtra ? "extra" : row.stage.id;
    const already = (co.history || []).some(h => h.activityId === row.activity.id && h.stageId === stageId);
    const history = already
      ? (co.history || []).filter(h => !(h.activityId === row.activity.id && h.stageId === stageId))
      : [...(co.history || []), { id: uid("h"), activityId: row.activity.id, stageId, channel: row.activity.channel, title: row.activity.title, at: new Date().toISOString() }];
    const next = allCompanies.map(c => c.id === co.id ? { ...c, history } : c);
    await saveCompanies(next);
  };

  if (companies.length === 0) {
    return <EmptyState text="Nenhuma empresa cadastrada ainda. Clique em “Nova empresa” pra começar a rodar a cadência." />;
  }

  const activeRow = activeIdx !== null ? rows[activeIdx] : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", background: "#0D1120", border: "1px solid #141A2B", borderRadius: 9, padding: 3, gap: 2 }}>
          {[["pending", "Pendentes"], ["all", "Todas"], ["done", "Concluídas"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: filter === k ? "#1E293B" : "transparent", color: filter === k ? "#F1F5F9" : "#64748B",
            }}>{l}</button>
          ))}
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: 9, color: "#475569" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa…"
            style={{ width: "100%", background: "#0D1120", border: "1px solid #141A2B", borderRadius: 9, padding: "7px 10px 7px 30px", color: "#E2E8F0", fontSize: 12.5, outline: "none" }}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState text={filter === "done" ? "Nenhuma atividade concluída ainda." : "Nenhuma atividade pendente. Tudo em dia! ✅"} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {rows.map((row, i) => (
            <ActivityRow
              key={row.company.id + row.activity.id + i}
              row={row}
              onOpenCompany={onOpenCompany}
              onMarkDone={() => toggleDone(row)}
              onOpenDetail={() => setActiveIdx(i)}
            />
          ))}
        </div>
      )}

      {activeRow && (
        <ActivityDetailDrawer
          row={activeRow}
          hasNext={activeIdx < rows.length - 1}
          hasPrev={activeIdx > 0}
          onNext={() => setActiveIdx(i => Math.min(i + 1, rows.length - 1))}
          onPrev={() => setActiveIdx(i => Math.max(i - 1, 0))}
          onToggleDone={() => toggleDone(activeRow)}
          onOpenCompany={() => onOpenCompany(activeRow.company.id)}
          onClose={() => setActiveIdx(null)}
        />
      )}
    </div>
  );
}

function ActivityRow({ row, onOpenCompany, onMarkDone, onOpenDetail }) {
  const ch = CHANNELS[row.activity.channel];
  const Icon = ch.Icon;
  const status = row.done ? "done" : activityStatus(row);
  const statusMeta = {
    overdue: { label: "Atrasada", color: "#F87171" },
    today: { label: "Hoje", color: "#FBBF24" },
    upcoming: { label: fmtDate(row.dueDate), color: "#475569" },
    done: { label: "Concluída", color: "#22C55E" },
  }[status];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, background: "#0D1120",
      border: `1px solid ${status === "overdue" ? "#F8717130" : status === "today" ? "#FBBF2430" : "#141A2B"}`,
      borderLeft: `3px solid ${row.done ? "#22C55E" : ch.color}`, borderRadius: 10, padding: "11px 14px",
      opacity: row.done ? 0.55 : 1,
    }}>
      <button
        onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
        title={row.done ? "Desmarcar" : "Marcar como feita"}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
      >
        {row.done ? <CheckCircle2 size={19} color="#22C55E" /> : <Circle size={19} color="#334155" />}
      </button>

      <div style={{ width: 30, height: 30, borderRadius: 8, background: ch.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={14} color={ch.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onOpenDetail}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: "#F1F5F9" }}>{row.company.name}</span>
          <span style={{ fontSize: 10.5, color: "#475569" }}>· {row.stage.name}</span>
        </div>
        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }}>
          {row.activity.title} {!row.isExtra && <span style={{ color: "#334155" }}>· Dia {row.activity.day}</span>}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: statusMeta.color, flexShrink: 0, whiteSpace: "nowrap" }}>
        {statusMeta.label}
      </div>

      <button onClick={onOpenDetail} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", flexShrink: 0, display: "flex" }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// Drawer (painel lateral) com o detalhe de uma atividade — script completo,
// marcar como feita, ir pra ficha da empresa, e navegar pra próxima/anterior atividade da lista.
function ActivityDetailDrawer({ row, hasNext, hasPrev, onNext, onPrev, onToggleDone, onOpenCompany, hideOpenCompany, onClose }) {
  const ch = CHANNELS[row.activity.channel];
  const Icon = ch.Icon;
  const status = row.done ? "done" : activityStatus(row);
  const statusMeta = {
    overdue: { label: "Atrasada", color: "#F87171" },
    today: { label: "Hoje", color: "#FBBF24" },
    upcoming: { label: fmtDate(row.dueDate), color: "#475569" },
    done: { label: "Concluída", color: "#22C55E" },
  }[status];

  return (
    <DrawerShell
      title={row.company.name}
      subtitle={`${row.stage.name}${row.isExtra ? "" : " · Dia " + row.activity.day}`}
      onClose={onClose}
      headerExtra={
        !hideOpenCompany && (
          <button onClick={onOpenCompany} title="Abrir ficha da empresa" style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 8, padding: "6px 10px", color: "#94A3B8", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <Building2 size={12} /> Ver ficha
          </button>
        )
      }
      footer={
        <>
          <button onClick={onPrev} disabled={!hasPrev} style={{ ...navBtnStyle(hasPrev), flex: "0 0 auto" }}>
            <ChevronDown size={14} style={{ transform: "rotate(90deg)" }} />
          </button>
          <button
            onClick={onToggleDone}
            style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: row.done ? "#1E293B" : "linear-gradient(135deg, #22C55E, #16A34A)", color: row.done ? "#94A3B8" : "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            {row.done ? <><Circle size={14} /> Desmarcar como feita</> : <><Check size={14} /> Marcar como feita</>}
          </button>
          <button onClick={onNext} disabled={!hasNext} style={{ ...navBtnStyle(hasNext), flex: "0 0 auto", display: "flex", alignItems: "center", gap: 5, paddingLeft: 12, paddingRight: 12 }}>
            Próxima <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: ch.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={17} color={ch.color} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#F1F5F9" }}>{row.activity.title}</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: statusMeta.color }}>{statusMeta.label}</div>
        </div>
      </div>

      <FieldLabel>Script</FieldLabel>
      <div style={{ background: "#070A12", border: "1px solid #141A2B", borderRadius: 10, padding: "14px 16px", fontSize: 13.5, color: "#CBD5E1", whiteSpace: "pre-line", lineHeight: 1.8 }}>
        {row.activity.script ? row.activity.script.replace(/\[Nome da Empresa\]/g, row.company.name) : <span style={{ color: "#334155" }}>Sem script cadastrado pra essa atividade.</span>}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        {row.company.phone && <InfoChip label="Telefone" value={row.company.phone} />}
        {row.company.email && <InfoChip label="E-mail" value={row.company.email} />}
      </div>
    </DrawerShell>
  );
}

function navBtnStyle(enabled) {
  return { padding: "10px 14px", borderRadius: 9, border: "1px solid #1E293B", background: "#0D1120", color: enabled ? "#94A3B8" : "#1E293B", fontWeight: 700, fontSize: 13, cursor: enabled ? "pointer" : "default" };
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#334155" }}>
      <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
      <div style={{ fontSize: 13, color: "#475569" }}>{text}</div>
    </div>
  );
}

/* ============================================================
   KANBAN VIEW
   ============================================================ */

function KanbanView({ companies, allCompanies, flows, onOpenCompany, saveCompanies }) {
  const [flowFilter, setFlowFilter] = useState(flows[0]?.id || null);
  const [dragId, setDragId] = useState(null);

  if (flows.length === 0) {
    return <EmptyState text="Nenhum fluxo criado ainda. Vá em “Fluxos” pra criar o primeiro." />;
  }

  const flow = flows.find(f => f.id === flowFilter) || flows[0];
  const flowCompanies = companies.filter(c => c.flowId === flow.id);

  const moveCompany = async (companyId, newStageId) => {
    const next = allCompanies.map(c => c.id === companyId
      ? { ...c, stageId: newStageId, stageStartDate: todayISO() }
      : c
    );
    await saveCompanies(next);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {flows.map(f => (
          <button key={f.id} onClick={() => setFlowFilter(f.id)} style={{
            padding: "7px 13px", borderRadius: 9, border: `1px solid ${flowFilter === f.id || (!flowFilter && f === flows[0]) ? "#38BDF860" : "#141A2B"}`,
            background: flow.id === f.id ? "#0D1120" : "#070A12", color: flow.id === f.id ? "#F1F5F9" : "#64748B",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer",
          }}>{f.name}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {flow.stages.map(stage => {
          const stageCompanies = flowCompanies.filter(c => c.stageId === stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) moveCompany(dragId, stage.id); setDragId(null); }}
              style={{ minWidth: 260, width: 260, flexShrink: 0, background: "#070A12", border: "1px solid #141A2B", borderRadius: 12, padding: 10, minHeight: 200 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 6px 12px" }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: stage.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "#CBD5E1" }}>{stage.name}</span>
                <span style={{ fontSize: 10.5, color: "#334155", marginLeft: "auto" }}>{stageCompanies.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {stageCompanies.map(co => (
                  <div
                    key={co.id}
                    draggable
                    onDragStart={() => setDragId(co.id)}
                    onClick={() => onOpenCompany(co.id)}
                    style={{
                      background: "#0D1120", border: "1px solid #141A2B", borderRadius: 9, padding: "10px 11px",
                      cursor: "grab", borderLeft: `3px solid ${stage.color}`,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#F1F5F9", marginBottom: 3 }}>{co.name}</div>
                    <div style={{ fontSize: 10.5, color: "#475569" }}>{co.segment || "Sem segmento"}</div>
                    <KanbanCardProgress company={co} flow={flow} />
                  </div>
                ))}
                {stageCompanies.length === 0 && (
                  <div style={{ fontSize: 11, color: "#1E293B", textAlign: "center", padding: "16px 4px" }}>Arraste aqui</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCardProgress({ company, flow }) {
  const agenda = computeCompanyAgenda(company, [flow]);
  const done = agenda.filter(a => a.done).length;
  const total = agenda.length;
  if (total === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 4, background: "#141A2B", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(done / total) * 100}%`, background: "#38BDF8", borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 9.5, color: "#334155", marginTop: 3 }}>{done}/{total} atividades</div>
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */

function fmtBRL(v) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DashboardView({ companies, flows, setView, onOpenCompany }) {
  const ganhos = companies.filter(c => c.status === "ganho");
  const perdidos = companies.filter(c => c.status === "perdido");
  const ativos = companies.filter(c => c.status !== "ganho" && c.status !== "perdido");
  const totalGanho = ganhos.reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
  const totalFechados = ganhos.length + perdidos.length;
  const taxaConversao = totalFechados > 0 ? Math.round((ganhos.length / totalFechados) * 100) : null;
  const ticketMedio = ganhos.length > 0 ? totalGanho / ganhos.length : 0;

  // Motivos de perda mais comuns
  const lossCount = {};
  for (const c of perdidos) {
    const r = c.lossReason || "Sem motivo registrado";
    lossCount[r] = (lossCount[r] || 0) + 1;
  }
  const topLossReasons = Object.entries(lossCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recentDeals = [...ganhos, ...perdidos]
    .sort((a, b) => new Date(b.dealAt || b.createdAt || 0) - new Date(a.dealAt || a.createdAt || 0))
    .slice(0, 6);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        <StatCard label="Total ganho" value={fmtBRL(totalGanho)} sub={`${ganhos.length} venda${ganhos.length !== 1 ? "s" : ""}`} color="#25D366" Icon={DollarSign} />
        <StatCard label="Ticket médio" value={fmtBRL(ticketMedio)} sub="por venda" color="#38BDF8" Icon={TrendingUp} />
        <StatCard label="Perdidos" value={perdidos.length} sub="negócios" color="#F87171" Icon={TrendingDown} />
        <StatCard label="Taxa de conversão" value={taxaConversao !== null ? `${taxaConversao}%` : "—"} sub="ganho vs. fechados" color="#FBBF24" Icon={Target} />
        <StatCard label="No funil ativo" value={ativos.length} sub="empresas" color="#A78BFA" Icon={Building2} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
        <div style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 12, padding: 16 }}>
          <SectionTitle>🏆 Negócios fechados recentemente</SectionTitle>
          {recentDeals.length === 0 ? (
            <div style={{ fontSize: 12, color: "#334155" }}>Nenhum negócio fechado (ganho ou perdido) ainda.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentDeals.map(c => (
                <div key={c.id} onClick={() => onOpenCompany(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: "#070A12", border: "1px solid #141A2B", borderRadius: 9, padding: "9px 12px", cursor: "pointer" }}>
                  {c.status === "ganho" ? <Trophy size={14} color="#25D366" style={{ flexShrink: 0 }} /> : <ThumbsDown size={14} color="#F87171" style={{ flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#E2E8F0" }}>{c.name}</div>
                    <div style={{ fontSize: 10.5, color: "#475569" }}>{c.status === "ganho" ? fmtBRL(c.dealValue) : (c.lossReason || "Sem motivo registrado")}</div>
                  </div>
                  <ChevronRight size={14} color="#334155" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 12, padding: 16 }}>
          <SectionTitle>📉 Principais motivos de perda</SectionTitle>
          {topLossReasons.length === 0 ? (
            <div style={{ fontSize: 12, color: "#334155" }}>Nenhum negócio perdido ainda.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topLossReasons.map(([reason, count]) => (
                <div key={reason}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#94A3B8", marginBottom: 4 }}>
                    <span>{reason}</span>
                    <span style={{ fontWeight: 700, color: "#F87171" }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: "#141A2B", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / perdidos.length) * 100}%`, background: "#F87171", borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {companies.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <EmptyState text="Nenhuma empresa cadastrada ainda. Clique em “Nova empresa” ou importe uma planilha em Configurações." />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, Icon }) {
  return (
    <div style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 12, padding: "14px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <Icon size={13} color={color} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: "#F1F5F9", letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "#334155", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ============================================================
   NEGÓCIOS VIEW — won/lost companies, separate from pipeline
   ============================================================ */

function NegociosView({ companies, onOpenCompany, saveCompanies }) {
  const [filter, setFilter] = useState("all"); // all | criado | ganho | perdido
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const filtered = filter === "all" ? companies : filter === "criado" ? companies.filter(c => c.status !== "ganho" && c.status !== "perdido") : companies.filter(c => c.status === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.dealAt || b.createdAt || 0) - new Date(a.dealAt || a.createdAt || 0));

  const totalGanho = companies.filter(c => c.status === "ganho").reduce((s, c) => s + (Number(c.dealValue) || 0), 0);

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  
  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length && sorted.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map(c => c.id)));
  };

  const deleteSelected = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} empresa(s)?`)) return;
    const next = companies.filter(c => !selectedIds.has(c.id));
    await saveCompanies(next);
    setSelectedIds(new Set());
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", background: "#0D1120", border: "1px solid #141A2B", borderRadius: 9, padding: 3, gap: 2 }}>
          {[["all", "Todos"], ["criado", "🆕 Criados"], ["ganho", "🏆 Ganhos"], ["perdido", "❌ Perdidos"]].map(([k, l]) => (
            <button key={k} onClick={() => { setFilter(k); setSelectedIds(new Set()); }} style={{
              padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: filter === k ? "#1E293B" : "transparent", color: filter === k ? "#F1F5F9" : "#64748B",
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 12.5, color: "#25D366", fontWeight: 800 }}>Total ganho: {fmtBRL(totalGanho)}</div>
          {selectedIds.size > 0 && (
            <button onClick={deleteSelected} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 6, border: "1px solid #F8717140", background: "#F8717115", color: "#FCA5A5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              <Trash2 size={13} /> Excluir ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState text="Nenhum negócio aqui ainda." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 14px", marginBottom: 4 }}>
            <button onClick={toggleSelectAll} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6, color: "#64748B", fontSize: 11, fontWeight: 700 }}>
              {selectedIds.size === sorted.length && sorted.length > 0 ? <CheckCircle2 size={16} color="#38BDF8" /> : <Circle size={16} />}
              Selecionar todos
            </button>
          </div>
          {sorted.map(c => {
            const isGanho = c.status === "ganho";
            const isPerdido = c.status === "perdido";
            const isCriado = !isGanho && !isPerdido;
            const borderColor = isGanho ? "#25D366" : isPerdido ? "#F87171" : "#38BDF8";
            const badgeBg = isGanho ? "#25D36620" : isPerdido ? "#F8717120" : "#38BDF820";
            const badgeColor = isGanho ? "#25D366" : isPerdido ? "#F87171" : "#38BDF8";
            const isSelected = selectedIds.has(c.id);
            
            return (
              <div key={c.id} onClick={() => onOpenCompany(c.id)} style={{
                display: "flex", alignItems: "center", gap: 12, background: isSelected ? "#1E293B" : "#0D1120", border: "1px solid #141A2B",
                borderLeft: `3px solid ${borderColor}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer",
              }}>
                <button onClick={(e) => toggleSelect(c.id, e)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                  {isSelected ? <CheckCircle2 size={18} color="#38BDF8" /> : <Circle size={18} color="#475569" />}
                </button>
                {isGanho ? <Trophy size={17} color="#25D366" style={{ flexShrink: 0 }} /> : isPerdido ? <ThumbsDown size={17} color="#F87171" style={{ flexShrink: 0 }} /> : <Building2 size={17} color="#38BDF8" style={{ flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                    {c.name}
                    <span style={{ padding: "3px 7px", borderRadius: 5, fontSize: 9, fontWeight: 800, background: badgeBg, color: badgeColor, textTransform: "uppercase" }}>
                      {isGanho ? "Ganho" : isPerdido ? "Perdido" : "Criado"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3 }}>
                    {isGanho ? `Vendido por ${fmtBRL(c.dealValue)}` : isPerdido ? (c.lossReason || "Sem motivo registrado") : "No funil ativo"}
                    {c.dealAt && ` · ${new Date(c.dealAt).toLocaleDateString("pt-BR")}`}
                  </div>
                </div>
                <ChevronRight size={16} color="#334155" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   IMPORT / EXPORT HELPERS (xlsx / csv via SheetJS)
   ============================================================ */

function downloadWorkbook(rows, filename, sheetName = "Dados") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

function readWorkbookFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsArrayBuffer(file);
  });
}

const COMPANY_EXPORT_HEADERS = ["Nome", "Telefone", "Email", "Segmento", "Fluxo", "Etapa", "Status"];
const ACTIVITY_EXPORT_HEADERS = ["Etapa", "Canal", "Dia", "Titulo", "Script"];

function companiesToRows(companies, flows) {
  return companies.map(c => {
    const flow = flows.find(f => f.id === c.flowId);
    const stage = flow?.stages.find(s => s.id === c.stageId);
    return {
      Nome: c.name, Telefone: c.phone || "", Email: c.email || "", Segmento: c.segment || "",
      Fluxo: flow?.name || "", Etapa: stage?.name || "", Status: c.status || "ativo",
    };
  });
}

function activitiesToRows(flow) {
  const rows = [];
  for (const stage of flow.stages) {
    for (const act of stage.activities) {
      rows.push({ Etapa: stage.name, Canal: CHANNELS[act.channel]?.label || act.channel, Dia: act.day, Titulo: act.title, Script: act.script });
    }
  }
  return rows;
}

function sampleCompanyRows() {
  return [
    { Nome: "Salão Beleza Pura", Telefone: "11999990001", Email: "contato@belezapura.com.br", Segmento: "Salão de beleza", Fluxo: "", Etapa: "", Status: "ativo" },
    { Nome: "Pizzaria do Bairro", Telefone: "11999990002", Email: "pizzariadobairro@gmail.com", Segmento: "Restaurante", Fluxo: "", Etapa: "", Status: "ativo" },
    { Nome: "Pet Shop Amigo Fiel", Telefone: "11999990003", Email: "contato@amigofiel.com.br", Segmento: "Pet shop", Fluxo: "", Etapa: "", Status: "ativo" },
    { Nome: "Loja Estilo & Cia", Telefone: "11999990004", Email: "vendas@estiloecia.com", Segmento: "Loja de roupas", Fluxo: "", Etapa: "", Status: "ativo" },
    { Nome: "Barbearia Navalha de Ouro", Telefone: "11999990005", Email: "", Segmento: "Barbearia", Fluxo: "", Etapa: "", Status: "ativo" },
  ];
}

function sampleActivityRows() {
  return [
    { Etapa: "Confirmar Contato", Canal: "WhatsApp", Dia: 1, Titulo: "Abertura", Script: "Olá, bom dia! Tudo bem? 😊\nEsse número é da [Nome da Empresa]?" },
    { Etapa: "Confirmar Contato", Canal: "E-mail", Dia: 1, Titulo: "Abertura", Script: "Assunto: Olá, tudo bem? — Nexsite\n\nOlá! Gostaria de confirmar: esse é o e-mail da [Nome da Empresa]?" },
    { Etapa: "Confirmar Contato", Canal: "Ligação", Dia: 1, Titulo: "Confirmação", Script: "Oi, bom dia! Aqui é o Iuri, da Nexsite. Esse número é da [Nome da Empresa]?" },
    { Etapa: "Confirmar Contato", Canal: "WhatsApp", Dia: 2, Titulo: "Follow-up", Script: "Oi, bom dia! Mandei mensagem ontem — só confirmando se é o contato certo da [Nome da Empresa]." },
    { Etapa: "Chegar no Decisor", Canal: "Ligação", Dia: 1, Titulo: "Identificar decisor", Script: "Oi! Você é o responsável pela [Nome da Empresa]?" },
  ];
}

/* ============================================================
   CONFIG VIEW — import/export companies & activities, loss reasons
   ============================================================ */

function ConfigView({ companies, flows, lossReasons, saveCompanies, saveFlows, saveLossReasons }) {
  const [importResult, setImportResult] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <LossReasonsConfig lossReasons={lossReasons} saveLossReasons={saveLossReasons} />
      <ImportCompaniesConfig companies={companies} flows={flows} saveCompanies={saveCompanies} onResult={setImportResult} />
      <ExportCompaniesConfig companies={companies} flows={flows} />
      <ImportActivitiesConfig flows={flows} saveFlows={saveFlows} onResult={setImportResult} />
      <ExportActivitiesConfig flows={flows} />

      {importResult && (
        <div style={{ background: importResult.error ? "#7C2D1230" : "#052e1640", border: `1px solid ${importResult.error ? "#F8717140" : "#25D36640"}`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: importResult.error ? "#FCA5A5" : "#86EFAC" }}>
          {importResult.message}
          {importResult.skipped?.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 11.5, color: "#94A3B8" }}>Pulados (já existiam): {importResult.skipped.join(", ")}</div>
          )}
        </div>
      )}
    </div>
  );
}

function ConfigCard({ icon: Icon, color, title, description, children }) {
  return (
    <div style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 14, color: "#F1F5F9" }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.6 }}>{description}</div>
      {children}
    </div>
  );
}

function LossReasonsConfig({ lossReasons, saveLossReasons }) {
  const [newReason, setNewReason] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState("");

  const add = async () => {
    const v = newReason.trim();
    if (!v || lossReasons.includes(v)) return;
    await saveLossReasons([...lossReasons, v]);
    setNewReason("");
  };

  const remove = async (idx) => {
    if (!confirm("Excluir esse motivo?")) return;
    await saveLossReasons(lossReasons.filter((_, i) => i !== idx));
  };

  const saveEdit = async (idx) => {
    const v = editValue.trim();
    if (!v) return;
    await saveLossReasons(lossReasons.map((r, i) => i === idx ? v : r));
    setEditingIdx(null);
  };

  return (
    <ConfigCard icon={ThumbsDown} color="#F87171" title="Motivos de perda" description="Lista usada no botão “Perdido” da ficha da empresa. Adicione, edite ou exclua à vontade.">
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {lossReasons.map((r, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, background: "#070A12", border: "1px solid #141A2B", borderRadius: 8, padding: "7px 10px" }}>
            {editingIdx === idx ? (
              <>
                <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus style={{ ...inputStyle, flex: 1, padding: "5px 8px" }} />
                <button onClick={() => saveEdit(idx)} style={smallBtnStyle("#25C99E")}>Salvar</button>
                <button onClick={() => setEditingIdx(null)} style={smallBtnStyle("#475569")}>Cancelar</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 12.5, color: "#CBD5E1" }}>{r}</span>
                <button onClick={() => { setEditingIdx(idx); setEditValue(r); }} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex" }}><Edit3 size={13} /></button>
                <button onClick={() => remove(idx)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex" }}><Trash2 size={13} /></button>
              </>
            )}
          </div>
        ))}
        {lossReasons.length === 0 && <div style={{ fontSize: 11.5, color: "#334155" }}>Nenhum motivo cadastrado.</div>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newReason} onChange={e => setNewReason(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Novo motivo…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={add} disabled={!newReason.trim()} style={{ ...smallBtnStyle("#38BDF8"), padding: "8px 14px", opacity: newReason.trim() ? 1 : 0.4 }}>
          <Plus size={12} /> Adicionar
        </button>
      </div>
    </ConfigCard>
  );
}

function ImportCompaniesConfig({ companies, flows, saveCompanies, onResult }) {
  const fileRef = useRef(null);
  const [targetFlow, setTargetFlow] = useState(flows[0]?.id || "");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await readWorkbookFile(file);
      const flow = flows.find(f => f.id === targetFlow);
      const firstStageId = flow?.stages[0]?.id;
      const existingNames = new Set(companies.map(c => c.name.trim().toLowerCase()));
      const skipped = [];
      const newCompanies = [];

      for (const row of rows) {
        const name = String(row.Nome || row.nome || row.Name || row["Nome da empresa"] || "").trim();
        if (!name) continue;
        if (existingNames.has(name.toLowerCase())) { skipped.push(name); continue; }
        existingNames.add(name.toLowerCase());
        newCompanies.push({
          id: uid("co"),
          name,
          phone: String(row.Telefone || row.telefone || ""),
          email: String(row.Email || row.email || ""),
          segment: String(row.Segmento || row.segmento || row.Nicho || row.nicho || ""),
          flowId: targetFlow || null,
          stageId: firstStageId || null,
          stageStartDate: todayISO(),
          history: [],
          createdAt: new Date().toISOString(),
        });
      }

      if (newCompanies.length > 0) {
        await saveCompanies([...companies, ...newCompanies]);
      }
      onResult({
        message: `✅ ${newCompanies.length} empresa(s) importada(s)${skipped.length > 0 ? `, ${skipped.length} pulada(s) por já existir` : ""}.`,
        skipped,
      });
    } catch (err) {
      onResult({ error: true, message: "⚠️ Não foi possível importar o arquivo. Verifique se é um .csv ou .xlsx válido." });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <ConfigCard icon={Upload} color="#38BDF8" title="Importar empresas" description="Envie um .csv ou .xlsx com as colunas Nome, Telefone, Email, Segmento. Empresas com nome já cadastrado são puladas automaticamente.">
      {flows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#F87171" }}>Crie um fluxo primeiro na aba “Fluxos” pra poder importar.</div>
      ) : (
        <>
          <FieldLabel>Fluxo de destino</FieldLabel>
          <select value={targetFlow} onChange={e => setTargetFlow(e.target.value)} style={{ ...selectStyle, marginBottom: 12 }}>
            {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: "1px solid #38BDF840", background: "#38BDF815", color: "#7DD3FC", fontSize: 12.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
            <Upload size={13} /> {busy ? "Importando…" : "Escolher arquivo (.csv ou .xlsx)"}
          </button>
        </>
      )}
    </ConfigCard>
  );
}

function ExportCompaniesConfig({ companies, flows }) {
  const exportAs = (format) => {
    const rows = companies.length > 0 ? companiesToRows(companies, flows) : [Object.fromEntries(COMPANY_EXPORT_HEADERS.map(h => [h, ""]))];
    downloadWorkbook(rows, `nexsite-empresas.${format}`, "Empresas");
  };
  const downloadSample = (format) => downloadWorkbook(sampleCompanyRows(), `exemplo-importacao-empresas.${format}`, "Exemplo");

  return (
    <ConfigCard icon={Download} color="#25D366" title="Exportar empresas" description="Baixe todas as empresas cadastradas, ou um modelo de exemplo já no formato certo pra importar depois.">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => exportAs("xlsx")} style={exportBtnStyle("#25D366")}><FileSpreadsheet size={13} /> Exportar .xlsx</button>
        <button onClick={() => exportAs("csv")} style={exportBtnStyle("#25D366")}><FileSpreadsheet size={13} /> Exportar .csv</button>
      </div>
      <div style={{ height: 1, background: "#141A2B", margin: "14px 0" }} />
      <div style={{ fontSize: 11.5, color: "#475569", marginBottom: 8 }}>Planilha de exemplo (com dados de demonstração):</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => downloadSample("xlsx")} style={exportBtnStyle("#A78BFA")}><Sparkles size={13} /> Exemplo .xlsx</button>
        <button onClick={() => downloadSample("csv")} style={exportBtnStyle("#A78BFA")}><Sparkles size={13} /> Exemplo .csv</button>
      </div>
    </ConfigCard>
  );
}

function ImportActivitiesConfig({ flows, saveFlows, onResult }) {
  const fileRef = useRef(null);
  const [targetFlow, setTargetFlow] = useState(flows[0]?.id || "");
  const [busy, setBusy] = useState(false);

  const CHANNEL_BY_LABEL = Object.fromEntries(Object.entries(CHANNELS).map(([key, ch]) => [ch.label.toLowerCase(), key]));

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await readWorkbookFile(file);
      const flow = flows.find(f => f.id === targetFlow);
      if (!flow) throw new Error("Fluxo não encontrado.");

      const stagesByName = new Map(flow.stages.map(s => [s.name.trim().toLowerCase(), s]));
      let created = 0;
      let createdStages = 0;
      const updatedStages = [...flow.stages];

      for (const row of rows) {
        const stageName = String(row.Etapa || row.etapa || "").trim();
        const title = String(row.Titulo || row.Título || row.titulo || "").trim();
        if (!stageName || !title) continue;

        let stage = stagesByName.get(stageName.toLowerCase());
        if (!stage) {
          stage = { id: uid("st"), name: stageName, color: STAGE_COLORS[updatedStages.length % STAGE_COLORS.length], activities: [] };
          updatedStages.push(stage);
          stagesByName.set(stageName.toLowerCase(), stage);
          createdStages++;
        }

        const channelLabel = String(row.Canal || row.canal || "whatsapp").trim().toLowerCase();
        const channel = CHANNEL_BY_LABEL[channelLabel] || (CHANNELS[channelLabel] ? channelLabel : "whatsapp");
        const day = Number(row.Dia || row.dia || 1) || 1;
        const script = String(row.Script || row.script || "");

        stage.activities = [...stage.activities, { id: uid("act"), channel, day, title, script }];
        created++;
      }

      await saveFlows(flows.map(f => f.id === flow.id ? { ...f, stages: updatedStages } : f));
      onResult({ message: `✅ ${created} atividade(s) importada(s)${createdStages > 0 ? `, ${createdStages} etapa(s) nova(s) criada(s)` : ""} no fluxo "${flow.name}".` });
    } catch (err) {
      onResult({ error: true, message: "⚠️ Não foi possível importar o arquivo. Verifique se é um .csv ou .xlsx válido com as colunas Etapa, Canal, Dia, Titulo, Script." });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <ConfigCard icon={Upload} color="#FB923C" title="Importar atividades" description="Envie um .csv ou .xlsx com as colunas Etapa, Canal, Dia, Titulo, Script. Etapas que não existem no fluxo são criadas automaticamente.">
      {flows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#F87171" }}>Crie um fluxo primeiro na aba “Fluxos” pra poder importar.</div>
      ) : (
        <>
          <FieldLabel>Fluxo de destino</FieldLabel>
          <select value={targetFlow} onChange={e => setTargetFlow(e.target.value)} style={{ ...selectStyle, marginBottom: 12 }}>
            {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: "1px solid #FB923C40", background: "#FB923C15", color: "#FDBA74", fontSize: 12.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
            <Upload size={13} /> {busy ? "Importando…" : "Escolher arquivo (.csv ou .xlsx)"}
          </button>
        </>
      )}
    </ConfigCard>
  );
}

function ExportActivitiesConfig({ flows }) {
  const [targetFlow, setTargetFlow] = useState(flows[0]?.id || "");
  const flow = flows.find(f => f.id === targetFlow);

  const exportAs = (format) => {
    if (!flow) return;
    const rows = activitiesToRows(flow).length > 0 ? activitiesToRows(flow) : [Object.fromEntries(ACTIVITY_EXPORT_HEADERS.map(h => [h, ""]))];
    downloadWorkbook(rows, `nexsite-atividades-${flow.name.toLowerCase().replace(/\s+/g, "-")}.${format}`, "Atividades");
  };
  const downloadSample = (format) => downloadWorkbook(sampleActivityRows(), `exemplo-importacao-atividades.${format}`, "Exemplo");

  return (
    <ConfigCard icon={Download} color="#FBBF24" title="Exportar atividades" description="Baixe as atividades de um fluxo específico, ou um modelo de exemplo já no formato certo.">
      {flows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#334155" }}>Nenhum fluxo criado ainda.</div>
      ) : (
        <>
          <FieldLabel>Fluxo</FieldLabel>
          <select value={targetFlow} onChange={e => setTargetFlow(e.target.value)} style={{ ...selectStyle, marginBottom: 12 }}>
            {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => exportAs("xlsx")} style={exportBtnStyle("#FBBF24")}><FileSpreadsheet size={13} /> Exportar .xlsx</button>
            <button onClick={() => exportAs("csv")} style={exportBtnStyle("#FBBF24")}><FileSpreadsheet size={13} /> Exportar .csv</button>
          </div>
        </>
      )}
      <div style={{ height: 1, background: "#141A2B", margin: "14px 0" }} />
      <div style={{ fontSize: 11.5, color: "#475569", marginBottom: 8 }}>Planilha de exemplo (com dados de demonstração):</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => downloadSample("xlsx")} style={exportBtnStyle("#A78BFA")}><Sparkles size={13} /> Exemplo .xlsx</button>
        <button onClick={() => downloadSample("csv")} style={exportBtnStyle("#A78BFA")}><Sparkles size={13} /> Exemplo .csv</button>
      </div>
    </ConfigCard>
  );
}

function exportBtnStyle(color) {
  return { display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: `1px solid ${color}40`, background: color + "15", color, fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
}

/* ============================================================
   NEW COMPANY MODAL
   ============================================================ */

function NewCompanyModal({ flows, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState("");
  const [flowId, setFlowId] = useState(flows[0]?.id || "");

  const canSave = name.trim() && flowId;

  const save = () => {
    if (!canSave) return;
    const flow = flows.find(f => f.id === flowId);
    onCreate({
      id: uid("co"), name: name.trim(), phone: phone.trim(), email: email.trim(), segment: segment.trim(),
      flowId, stageId: flow.stages[0]?.id, stageStartDate: todayISO(), history: [],
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <ModalShell onClose={onClose} title="Nova empresa">
      <FieldLabel>Nome da empresa *</FieldLabel>
      <TextInput value={name} onChange={setName} placeholder="Ex: Salão Beleza Pura" autoFocus />

      <FieldLabel>Telefone / WhatsApp</FieldLabel>
      <TextInput value={phone} onChange={setPhone} placeholder="(00) 00000-0000" />

      <FieldLabel>E-mail</FieldLabel>
      <TextInput value={email} onChange={setEmail} placeholder="contato@empresa.com" />

      <FieldLabel>Segmento</FieldLabel>
      <TextInput value={segment} onChange={setSegment} placeholder="Ex: Salão de beleza, Restaurante…" />

      <FieldLabel>Fluxo</FieldLabel>
      {flows.length === 0 ? (
        <div style={{ fontSize: 12, color: "#F87171", background: "#7C2D1220", border: "1px solid #7C2D1240", borderRadius: 8, padding: "8px 10px" }}>
          Crie um fluxo primeiro na aba "Fluxos".
        </div>
      ) : (
        <select value={flowId} onChange={e => setFlowId(e.target.value)} style={selectStyle}>
          {flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      )}

      <button
        onClick={save} disabled={!canSave}
        style={{ marginTop: 18, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: canSave ? "linear-gradient(135deg, #6366F1, #38BDF8)" : "#1E293B", color: canSave ? "#fff" : "#475569", fontWeight: 800, fontSize: 13.5, cursor: canSave ? "pointer" : "not-allowed" }}
      >
        Criar empresa
      </button>
    </ModalShell>
  );
}

/* ============================================================
   COMPANY VIEW — detail with history + agenda
   ============================================================ */

function CompanyView({ company, flows, companies, lossReasons, saveCompanies, onBack }) {
  const [editing, setEditing] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const flow = flows.find(f => f.id === company.flowId);
  const agenda = useMemo(() => computeCompanyAgenda(company, flows), [company, flows]);
  const stageIdx = flow ? flow.stages.findIndex(s => s.id === company.stageId) : -1;

  const update = async (patch) => {
    const next = companies.map(c => c.id === company.id ? { ...c, ...patch } : c);
    await saveCompanies(next);
  };

  const toggleDone = async (item) => {
    const stageId = item.isExtra ? "extra" : item.stage.id;
    const already = (company.history || []).some(h => h.activityId === item.activity.id && h.stageId === stageId);
    const history = already
      ? (company.history || []).filter(h => !(h.activityId === item.activity.id && h.stageId === stageId))
      : [...(company.history || []), { id: uid("h"), activityId: item.activity.id, stageId, channel: item.activity.channel, title: item.activity.title, at: new Date().toISOString() }];
    await update({ history });
  };

  const advanceStage = async () => {
    if (!flow || stageIdx === -1 || stageIdx >= flow.stages.length - 1) return;
    const nextStage = flow.stages[stageIdx + 1];
    await update({ stageId: nextStage.id, stageStartDate: todayISO() });
  };

  const markFrio = async () => { await update({ status: "frio" }); };
  const reactivate = async () => { await update({ status: "ativo", dealValue: null, lossReason: null, dealAt: null }); };

  const markWin = async (value) => {
    await update({ status: "ganho", dealValue: value, dealAt: new Date().toISOString(), lossReason: null });
    setShowWinModal(false);
  };

  const markLoss = async (reason) => {
    await update({ status: "perdido", lossReason: reason, dealAt: new Date().toISOString(), dealValue: null });
    setShowLossModal(false);
  };

  const deleteCompany = async () => {
    if (!confirm(`Excluir "${company.name}"? Essa ação não pode ser desfeita.`)) return;
    await saveCompanies(companies.filter(c => c.id !== company.id));
    onBack();
  };

  const addExtraActivity = async (act) => {
    await update({ extraActivities: [...(company.extraActivities || []), act] });
    setAddingActivity(false);
  };

  const deleteExtraActivity = async (actId) => {
    await update({
      extraActivities: (company.extraActivities || []).filter(a => a.id !== actId),
      history: (company.history || []).filter(h => !(h.activityId === actId && h.stageId === "extra")),
    });
  };

  const fullHistory = [...(company.history || [])].sort((a, b) => new Date(b.at) - new Date(a.at));
  const activeItem = activeIdx !== null ? agenda[activeIdx] : null;
  // "row" precisa do campo company pra reaproveitar o ActivityDetailDrawer
  const activeRow = activeItem ? { ...activeItem, company } : null;
  const isClosed = company.status === "ganho" || company.status === "perdido";

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748B", fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#0D1120", border: "1px solid #141A2B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={17} color="#38BDF8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#F1F5F9" }}>{company.name}</div>
              <div style={{ fontSize: 11.5, color: "#475569" }}>{company.segment || "Sem segmento"}{company.status === "frio" && <span style={{ color: "#38BDF8", fontWeight: 700 }}> · ❄️ Frio</span>}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <IconButton onClick={() => setEditing(true)} icon={Edit3} label="Editar" />
          {!isClosed && (
            <>
              <IconButton onClick={() => setShowWinModal(true)} icon={Trophy} label="Ganho" accent="#25D366" />
              <IconButton onClick={() => setShowLossModal(true)} icon={ThumbsDown} label="Perdido" accent="#F87171" />
              {company.status === "frio" ? (
                <IconButton onClick={reactivate} icon={Sparkles} label="Reativar" accent="#38BDF8" />
              ) : (
                <IconButton onClick={markFrio} icon={Clock} label="Marcar frio" accent="#38BDF8" />
              )}
            </>
          )}
          {isClosed && (
            <IconButton onClick={reactivate} icon={Sparkles} label="Reabrir negócio" accent="#38BDF8" />
          )}
          <IconButton onClick={deleteCompany} icon={Trash2} label="Excluir" accent="#F87171" />
        </div>
      </div>

      {company.status === "ganho" && (
        <div style={{ background: "#052e1640", border: "1px solid #25D36640", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Trophy size={18} color="#25D366" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#86EFAC" }}><strong>Venda ganha</strong> — {fmtBRL(company.dealValue)}{company.dealAt && ` em ${new Date(company.dealAt).toLocaleDateString("pt-BR")}`}</div>
        </div>
      )}
      {company.status === "perdido" && (
        <div style={{ background: "#7C2D1230", border: "1px solid #F8717140", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <ThumbsDown size={18} color="#F87171" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#FCA5A5" }}><strong>Negócio perdido</strong> — {company.lossReason || "Sem motivo registrado"}{company.dealAt && ` em ${new Date(company.dealAt).toLocaleDateString("pt-BR")}`}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
        <InfoChip label="Telefone" value={company.phone || "—"} />
        <InfoChip label="E-mail" value={company.email || "—"} />
        <InfoChip label="Fluxo" value={flow?.name || "—"} />
        <InfoChip label="Etapa atual" value={flow?.stages[stageIdx]?.name || "—"} accent={flow?.stages[stageIdx]?.color} />
      </div>

      {flow && stageIdx > -1 && stageIdx < flow.stages.length - 1 && (
        <div style={{ background: "#0D1120", border: "1px solid #25C99E30", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>Lead respondeu? Avance pra próxima etapa do fluxo manualmente.</span>
          <button onClick={advanceStage} style={{ background: "#1E293B", border: "1px solid #25C99E40", borderRadius: 7, padding: "7px 12px", color: "#25C99E", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            Avançar etapa <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Two columns: agenda + history */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <SectionTitle>📋 Atividades</SectionTitle>
            <button onClick={() => setAddingActivity(true)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px dashed #334155", borderRadius: 7, padding: "5px 9px", color: "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={11} /> Adicionar atividade
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {agenda.length === 0 && <div style={{ fontSize: 12, color: "#334155" }}>Nenhuma atividade ainda.</div>}
            {agenda.map((item, i) => {
              const ch = CHANNELS[item.activity.channel];
              const Icon = ch.Icon;
              const status = activityStatus(item);
              return (
                <div
                  key={item.activity.id + i}
                  onClick={() => setActiveIdx(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
                    background: "#0D1120", border: "1px solid #141A2B", borderLeft: `3px solid ${item.done ? "#22C55E" : ch.color}`,
                    borderRadius: 9, padding: "10px 12px", opacity: item.done ? 0.6 : 1,
                  }}
                >
                  {item.done ? <CheckCircle2 size={16} color="#22C55E" style={{ flexShrink: 0 }} /> : <Circle size={16} color="#334155" style={{ flexShrink: 0 }} />}
                  <Icon size={13} color={ch.color} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#E2E8F0", display: "flex", alignItems: "center", gap: 5 }}>
                      {item.activity.title}
                      {item.isExtra ? <span style={{ fontSize: 9, color: "#F472B6", background: "#F472B615", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>avulsa</span> : <span style={{ color: "#334155", fontWeight: 500 }}>· Dia {item.activity.day}</span>}
                    </div>
                    <div style={{ fontSize: 10.5, color: status === "overdue" ? "#F87171" : status === "today" ? "#FBBF24" : "#475569" }}>
                      {item.done ? `Feito em ${new Date(item.doneAt).toLocaleDateString("pt-BR")}` : fmtDate(item.dueDate)}
                    </div>
                  </div>
                  {item.isExtra && (
                    <button onClick={(e) => { e.stopPropagation(); deleteExtraActivity(item.activity.id); }} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", display: "flex", flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  )}
                  <ChevronRight size={14} color="#334155" style={{ flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>🕓 Histórico</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {fullHistory.length === 0 && <div style={{ fontSize: 12, color: "#334155" }}>Nenhuma atividade registrada ainda.</div>}
            {fullHistory.map(h => {
              const ch = CHANNELS[h.channel];
              const Icon = ch.Icon;
              return (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 9, background: "#0D1120", border: "1px solid #141A2B", borderRadius: 9, padding: "9px 12px" }}>
                  <Icon size={13} color={ch.color} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#CBD5E1" }}>{h.title}</div>
                    <div style={{ fontSize: 10.5, color: "#475569" }}>{new Date(h.at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editing && (
        <EditCompanyModal company={company} flows={flows} onClose={() => setEditing(false)} onSave={async (patch) => { await update(patch); setEditing(false); }} />
      )}

      {addingActivity && (
        <ExtraActivityModal onClose={() => setAddingActivity(false)} onSave={addExtraActivity} />
      )}

      {showWinModal && (
        <WinModal companyName={company.name} onClose={() => setShowWinModal(false)} onConfirm={markWin} />
      )}

      {showLossModal && (
        <LossModal companyName={company.name} lossReasons={lossReasons} onClose={() => setShowLossModal(false)} onConfirm={markLoss} />
      )}

      {activeRow && (
        <ActivityDetailDrawer
          row={activeRow}
          hasNext={activeIdx < agenda.length - 1}
          hasPrev={activeIdx > 0}
          onNext={() => setActiveIdx(i => Math.min(i + 1, agenda.length - 1))}
          onPrev={() => setActiveIdx(i => Math.max(i - 1, 0))}
          onToggleDone={() => toggleDone(activeItem)}
          onOpenCompany={() => {}}
          hideOpenCompany
          onClose={() => setActiveIdx(null)}
        />
      )}
    </div>
  );
}

// Modal simples pra adicionar uma atividade avulsa (fora do fluxo) direto na ficha da empresa.
function ExtraActivityModal({ onClose, onSave }) {
  const [channel, setChannel] = useState("whatsapp");
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [date, setDate] = useState(todayISO());

  const canSave = title.trim();

  const save = () => {
    if (!canSave) return;
    onSave({ id: uid("ext"), channel, title: title.trim(), script, dueDate: date });
  };

  return (
    <ModalShell onClose={onClose} title="Nova atividade avulsa">
      <FieldLabel>Canal</FieldLabel>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.entries(CHANNELS).map(([key, ch]) => {
          const Icon = ch.Icon;
          const active = channel === key;
          return (
            <button key={key} onClick={() => setChannel(key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 6px",
              borderRadius: 9, border: `1px solid ${active ? ch.color + "70" : "#141A2B"}`, background: active ? ch.color + "15" : "#070A12",
              cursor: "pointer",
            }}>
              <Icon size={15} color={active ? ch.color : "#475569"} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? ch.color : "#475569" }}>{ch.label}</span>
            </button>
          );
        })}
      </div>

      <FieldLabel>Data</FieldLabel>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: 160 }} />

      <FieldLabel>Título</FieldLabel>
      <TextInput value={title} onChange={setTitle} placeholder="Ex: Ligação de retorno, follow-up extra…" autoFocus />

      <FieldLabel>Script / anotação (opcional)</FieldLabel>
      <textarea
        value={script} onChange={e => setScript(e.target.value)}
        placeholder="O que falar ou anotar sobre essa atividade…"
        rows={5}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
      />

      <button
        onClick={save} disabled={!canSave}
        style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: canSave ? "linear-gradient(135deg, #6366F1, #38BDF8)" : "#1E293B", color: canSave ? "#fff" : "#475569", fontWeight: 800, fontSize: 13.5, cursor: canSave ? "pointer" : "not-allowed" }}
      >
        Adicionar atividade
      </button>
    </ModalShell>
  );
}

// Modal de confirmação de venda — pede o valor fechado.
function WinModal({ companyName, onClose, onConfirm }) {
  const [value, setValue] = useState("");
  const numeric = Number(String(value).replace(",", "."));
  const canSave = value !== "" && !isNaN(numeric) && numeric >= 0;

  return (
    <ModalShell onClose={onClose} title="🏆 Marcar como ganho">
      <div style={{ fontSize: 12.5, color: "#94A3B8", marginBottom: 4 }}>
        Por quanto foi vendido o site pra <strong style={{ color: "#E2E8F0" }}>{companyName}</strong>?
      </div>
      <FieldLabel>Valor da venda (R$)</FieldLabel>
      <input
        type="number" min={0} step="0.01" inputMode="decimal" autoFocus
        value={value} onChange={e => setValue(e.target.value)} placeholder="Ex: 800"
        style={inputStyle}
      />
      <button
        onClick={() => canSave && onConfirm(numeric)} disabled={!canSave}
        style={{ marginTop: 16, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: canSave ? "linear-gradient(135deg, #25D366, #16A34A)" : "#1E293B", color: canSave ? "#fff" : "#475569", fontWeight: 800, fontSize: 13.5, cursor: canSave ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
      >
        <Trophy size={14} /> Confirmar venda
      </button>
    </ModalShell>
  );
}

// Modal de confirmação de perda — escolhe motivo de uma lista editável (gerenciada em Configurações).
function LossModal({ companyName, lossReasons, onClose, onConfirm }) {
  const [reason, setReason] = useState(lossReasons[0] || "");
  const [customReason, setCustomReason] = useState("");
  const useCustom = reason === "__custom__";
  const finalReason = useCustom ? customReason.trim() : reason;
  const canSave = finalReason.length > 0;

  return (
    <ModalShell onClose={onClose} title="❌ Marcar como perdido">
      <div style={{ fontSize: 12.5, color: "#94A3B8", marginBottom: 4 }}>
        Qual o motivo de perder <strong style={{ color: "#E2E8F0" }}>{companyName}</strong>?
      </div>
      <FieldLabel>Motivo</FieldLabel>
      <select value={reason} onChange={e => setReason(e.target.value)} style={selectStyle}>
        {lossReasons.map(r => <option key={r} value={r}>{r}</option>)}
        <option value="__custom__">Outro motivo…</option>
      </select>

      {useCustom && (
        <>
          <FieldLabel>Descreva o motivo</FieldLabel>
          <TextInput value={customReason} onChange={setCustomReason} placeholder="Ex: Negócio fechou" autoFocus />
        </>
      )}

      <div style={{ fontSize: 10.5, color: "#334155", marginTop: 10 }}>
        Quer editar a lista de motivos? Vá em <strong>Config → Motivos de perda</strong>.
      </div>

      <button
        onClick={() => canSave && onConfirm(finalReason)} disabled={!canSave}
        style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: canSave ? "linear-gradient(135deg, #F87171, #DC2626)" : "#1E293B", color: canSave ? "#fff" : "#475569", fontWeight: 800, fontSize: 13.5, cursor: canSave ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
      >
        <ThumbsDown size={14} /> Confirmar perda
      </button>
    </ModalShell>
  );
}

function EditCompanyModal({ company, flows, onClose, onSave }) {
  const [name, setName] = useState(company.name);
  const [phone, setPhone] = useState(company.phone || "");
  const [email, setEmail] = useState(company.email || "");
  const [segment, setSegment] = useState(company.segment || "");

  return (
    <ModalShell onClose={onClose} title="Editar empresa">
      <FieldLabel>Nome</FieldLabel>
      <TextInput value={name} onChange={setName} autoFocus />
      <FieldLabel>Telefone</FieldLabel>
      <TextInput value={phone} onChange={setPhone} />
      <FieldLabel>E-mail</FieldLabel>
      <TextInput value={email} onChange={setEmail} />
      <FieldLabel>Segmento</FieldLabel>
      <TextInput value={segment} onChange={setSegment} />
      <button
        onClick={() => onSave({ name: name.trim() || company.name, phone, email, segment })}
        style={{ marginTop: 18, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #6366F1, #38BDF8)", color: "#fff", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}
      >
        Salvar alterações
      </button>
    </ModalShell>
  );
}

/* ============================================================
   FLOWS VIEW — create/edit flows + stages + activities
   ============================================================ */

function FlowsView({ flows, saveFlows, companies }) {
  const [activeFlowId, setActiveFlowId] = useState(flows[0]?.id || null);
  const [showNewFlow, setShowNewFlow] = useState(false);

  const activeFlow = flows.find(f => f.id === activeFlowId);

  const createFlow = async (name) => {
    const newFlow = { id: uid("flow"), name, stages: [] };
    await saveFlows([...flows, newFlow]);
    setActiveFlowId(newFlow.id);
    setShowNewFlow(false);
  };

  const loadSample = async () => {
    const exists = flows.some(f => f.id === SAMPLE_FLOW.id);
    if (exists) { setActiveFlowId(SAMPLE_FLOW.id); return; }
    const clone = { ...SAMPLE_FLOW, id: uid("flow") };
    await saveFlows([...flows, clone]);
    setActiveFlowId(clone.id);
  };

  const deleteFlow = async (flowId) => {
    const inUse = companies.some(c => c.flowId === flowId);
    if (inUse) { alert("Esse fluxo está em uso por empresas cadastradas. Mova as empresas pra outro fluxo antes de excluir."); return; }
    if (!confirm("Excluir esse fluxo e todas as suas etapas?")) return;
    const next = flows.filter(f => f.id !== flowId);
    await saveFlows(next);
    setActiveFlowId(next[0]?.id || null);
  };

  const updateFlow = async (patch) => {
    await saveFlows(flows.map(f => f.id === activeFlow.id ? { ...f, ...patch } : f));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {flows.map(f => (
          <button key={f.id} onClick={() => setActiveFlowId(f.id)} style={{
            padding: "7px 13px", borderRadius: 9, border: `1px solid ${activeFlowId === f.id ? "#38BDF860" : "#141A2B"}`,
            background: activeFlowId === f.id ? "#0D1120" : "#070A12", color: activeFlowId === f.id ? "#F1F5F9" : "#64748B",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer",
          }}>{f.name}</button>
        ))}
        <button onClick={() => setShowNewFlow(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 9, border: "1px dashed #334155", background: "transparent", color: "#64748B", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={13} /> Novo fluxo
        </button>
        {flows.length === 0 && (
          <button onClick={loadSample} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid #818CF840", background: "#818CF815", color: "#A5B4FC", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <Sparkles size={13} /> Carregar fluxo de exemplo
          </button>
        )}
      </div>

      {flows.length === 0 && (
        <EmptyState text="Nenhum fluxo criado ainda. Crie um novo fluxo do zero, ou carregue o fluxo de exemplo da cadência Nexsite pra editar a partir dele." />
      )}

      {activeFlow && (
        <FlowEditor flow={activeFlow} onUpdate={updateFlow} onDelete={() => deleteFlow(activeFlow.id)} />
      )}

      {showNewFlow && (
        <NewFlowModal onClose={() => setShowNewFlow(false)} onCreate={createFlow} />
      )}
    </div>
  );
}

function NewFlowModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <ModalShell onClose={onClose} title="Novo fluxo">
      <FieldLabel>Nome do fluxo</FieldLabel>
      <TextInput value={name} onChange={setName} placeholder="Ex: Cadência Restaurantes" autoFocus />
      <button
        onClick={() => name.trim() && onCreate(name.trim())}
        disabled={!name.trim()}
        style={{ marginTop: 18, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: name.trim() ? "linear-gradient(135deg, #6366F1, #38BDF8)" : "#1E293B", color: name.trim() ? "#fff" : "#475569", fontWeight: 800, fontSize: 13.5, cursor: name.trim() ? "pointer" : "not-allowed" }}
      >
        Criar fluxo vazio
      </button>
    </ModalShell>
  );
}

function FlowEditor({ flow, onUpdate, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(flow.name);
  const [activityModal, setActivityModal] = useState(null); // { stageId, activity? }
  const [stageModal, setStageModal] = useState(false);

  const addStage = async (name) => {
    const color = STAGE_COLORS[flow.stages.length % STAGE_COLORS.length];
    const newStage = { id: uid("st"), name, color, activities: [] };
    await onUpdate({ stages: [...flow.stages, newStage] });
    setStageModal(false);
  };

  const renameStage = async (stageId, name) => {
    await onUpdate({ stages: flow.stages.map(s => s.id === stageId ? { ...s, name } : s) });
  };

  const deleteStage = async (stageId) => {
    if (!confirm("Excluir essa etapa e todas as suas atividades?")) return;
    await onUpdate({ stages: flow.stages.filter(s => s.id !== stageId) });
  };

  const moveStage = async (idx, dir) => {
    const next = [...flow.stages];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    await onUpdate({ stages: next });
  };

  const saveActivity = async (stageId, activity) => {
    const stage = flow.stages.find(s => s.id === stageId);
    const exists = stage.activities.some(a => a.id === activity.id);
    const activities = exists
      ? stage.activities.map(a => a.id === activity.id ? activity : a)
      : [...stage.activities, activity];
    await onUpdate({ stages: flow.stages.map(s => s.id === stageId ? { ...s, activities } : s) });
    setActivityModal(null);
  };

  const deleteActivity = async (stageId, activityId) => {
    const stage = flow.stages.find(s => s.id === stageId);
    await onUpdate({ stages: flow.stages.map(s => s.id === stageId ? { ...s, activities: stage.activities.filter(a => a.id !== activityId) } : s) });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        {renaming ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <TextInput value={nameInput} onChange={setNameInput} autoFocus style={{ width: 220 }} />
            <button onClick={() => { onUpdate({ name: nameInput.trim() || flow.name }); setRenaming(false); }} style={smallBtnStyle("#25C99E")}>Salvar</button>
            <button onClick={() => { setNameInput(flow.name); setRenaming(false); }} style={smallBtnStyle("#475569")}>Cancelar</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 17, color: "#F1F5F9" }}>{flow.name}</span>
            <button onClick={() => setRenaming(true)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex" }}><Edit3 size={14} /></button>
          </div>
        )}
        <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #7C2D1240", borderRadius: 8, padding: "6px 11px", color: "#F87171", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
          <Trash2 size={12} /> Excluir fluxo
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {flow.stages.map((stage, idx) => (
          <div key={stage.id} style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, background: stage.color, flexShrink: 0 }} />
              <StageNameEditor stage={stage} onRename={(name) => renameStage(stage.id, name)} />
              <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                <button onClick={() => moveStage(idx, -1)} disabled={idx === 0} style={ghostIconStyle(idx === 0)}><ChevronDown size={13} style={{ transform: "rotate(180deg)" }} /></button>
                <button onClick={() => moveStage(idx, 1)} disabled={idx === flow.stages.length - 1} style={ghostIconStyle(idx === flow.stages.length - 1)}><ChevronDown size={13} /></button>
                <button onClick={() => deleteStage(stage.id)} style={ghostIconStyle(false, "#F87171")}><Trash2 size={13} /></button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {stage.activities.sort((a, b) => a.day - b.day).map(act => {
                const ch = CHANNELS[act.channel];
                const Icon = ch.Icon;
                return (
                  <div key={act.id} onClick={() => setActivityModal({ stageId: stage.id, activity: act })} style={{ display: "flex", alignItems: "center", gap: 9, background: "#070A12", border: "1px solid #141A2B", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#334155", width: 32, flexShrink: 0 }}>D{act.day}</span>
                    <Icon size={13} color={ch.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#CBD5E1", flex: 1 }}>{act.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteActivity(stage.id, act.id); }} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", display: "flex" }}><X size={13} /></button>
                  </div>
                );
              })}
              <button onClick={() => setActivityModal({ stageId: stage.id })} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", padding: "8px", borderRadius: 8, border: "1px dashed #334155", background: "transparent", color: "#475569", fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginTop: 3 }}>
                <Plus size={12} /> Adicionar atividade
              </button>
            </div>
          </div>
        ))}

        <button onClick={() => setStageModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", padding: "12px", borderRadius: 12, border: "1px dashed #334155", background: "transparent", color: "#64748B", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={14} /> Adicionar etapa
        </button>
      </div>

      {activityModal && (
        <ActivityModal
          stageId={activityModal.stageId}
          activity={activityModal.activity}
          onClose={() => setActivityModal(null)}
          onSave={(act) => saveActivity(activityModal.stageId, act)}
        />
      )}
      {stageModal && (
        <NewStageModal onClose={() => setStageModal(false)} onCreate={addStage} />
      )}
    </div>
  );
}

function StageNameEditor({ stage, onRename }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(stage.name);
  if (editing) {
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <TextInput value={val} onChange={setVal} autoFocus style={{ width: 160, padding: "5px 8px", fontSize: 13 }} />
        <button onClick={() => { onRename(val.trim() || stage.name); setEditing(false); }} style={smallBtnStyle("#25C99E")}>OK</button>
      </div>
    );
  }
  return (
    <span onClick={() => setEditing(true)} style={{ fontWeight: 800, fontSize: 13.5, color: "#F1F5F9", cursor: "pointer" }}>
      {stage.name}
    </span>
  );
}

function NewStageModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <ModalShell onClose={onClose} title="Nova etapa">
      <FieldLabel>Nome da etapa</FieldLabel>
      <TextInput value={name} onChange={setName} placeholder="Ex: Confirmar contato" autoFocus />
      <button
        onClick={() => name.trim() && onCreate(name.trim())}
        disabled={!name.trim()}
        style={{ marginTop: 18, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: name.trim() ? "linear-gradient(135deg, #6366F1, #38BDF8)" : "#1E293B", color: name.trim() ? "#fff" : "#475569", fontWeight: 800, fontSize: 13.5, cursor: name.trim() ? "pointer" : "not-allowed" }}
      >
        Adicionar etapa
      </button>
    </ModalShell>
  );
}

function ActivityModal({ stageId, activity, onClose, onSave }) {
  const [channel, setChannel] = useState(activity?.channel || "whatsapp");
  const [day, setDay] = useState(activity?.day || 1);
  const [title, setTitle] = useState(activity?.title || "");
  const [script, setScript] = useState(activity?.script || "");

  const canSave = title.trim() && day >= 1;

  const save = () => {
    if (!canSave) return;
    onSave({ id: activity?.id || uid("act"), channel, day: Number(day), title: title.trim(), script });
  };

  return (
    <ModalShell onClose={onClose} title={activity ? "Editar atividade" : "Nova atividade"}>
      <FieldLabel>Canal</FieldLabel>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.entries(CHANNELS).map(([key, ch]) => {
          const Icon = ch.Icon;
          const active = channel === key;
          return (
            <button key={key} onClick={() => setChannel(key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 6px",
              borderRadius: 9, border: `1px solid ${active ? ch.color + "70" : "#141A2B"}`, background: active ? ch.color + "15" : "#070A12",
              cursor: "pointer",
            }}>
              <Icon size={15} color={active ? ch.color : "#475569"} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? ch.color : "#475569" }}>{ch.label}</span>
            </button>
          );
        })}
      </div>

      <FieldLabel>Dia da cadência (dia útil)</FieldLabel>
      <input type="number" min={1} value={day} onChange={e => setDay(e.target.value)} style={{ ...inputStyle, width: 90 }} />

      <FieldLabel>Título da atividade</FieldLabel>
      <TextInput value={title} onChange={setTitle} placeholder="Ex: Abertura, Follow-up, Breakup…" />

      <FieldLabel>Script / conteúdo</FieldLabel>
      <textarea
        value={script} onChange={e => setScript(e.target.value)}
        placeholder="Escreva a mensagem. Use [Nome da Empresa] como variável."
        rows={6}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
      />

      <button
        onClick={save} disabled={!canSave}
        style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 9, border: "none", background: canSave ? "linear-gradient(135deg, #6366F1, #38BDF8)" : "#1E293B", color: canSave ? "#fff" : "#475569", fontWeight: 800, fontSize: 13.5, cursor: canSave ? "pointer" : "not-allowed" }}
      >
        {activity ? "Salvar alterações" : "Adicionar atividade"}
      </button>
    </ModalShell>
  );
}

/* ============================================================
   SHARED UI PRIMITIVES
   ============================================================ */

function ModalShell({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000000a0", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0B0E18", border: "1px solid #1E293B", borderRadius: 16, padding: 22, width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 15.5, color: "#F1F5F9" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Painel lateral — ocupa metade da tela (desktop) ou tela quase toda (mobile).
// header/footer ficam fixos, content rola.
function DrawerShell({ title, subtitle, onClose, headerExtra, footer, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000000a0", backdropFilter: "blur(3px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0B0E18", borderLeft: "1px solid #1E293B", height: "100%",
          width: "100%", maxWidth: 560, display: "flex", flexDirection: "column",
          boxShadow: "-20px 0 50px #00000060",
        }}
      >
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #141A2B", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0, gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#F1F5F9" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>{subtitle}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {headerExtra}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", display: "flex" }}><X size={19} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {children}
        </div>

        {footer && (
          <div style={{ padding: "14px 22px", borderTop: "1px solid #141A2B", flexShrink: 0, display: "flex", gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>{children}</div>;
}

const inputStyle = {
  width: "100%", background: "#0D1120", border: "1px solid #1E293B", borderRadius: 8,
  padding: "9px 11px", color: "#E2E8F0", fontSize: 13, outline: "none",
};
const selectStyle = { ...inputStyle, appearance: "none", cursor: "pointer" };

function TextInput({ value, onChange, placeholder, autoFocus, style }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
      style={{ ...inputStyle, ...style }}
    />
  );
}

function InfoChip({ label, value, accent }) {
  return (
    <div style={{ background: "#0D1120", border: "1px solid #141A2B", borderRadius: 9, padding: "8px 13px", minWidth: 110 }}>
      <div style={{ fontSize: 9.5, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: accent || "#CBD5E1", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 12.5, fontWeight: 800, color: "#94A3B8", marginBottom: 10 }}>{children}</div>;
}

function IconButton({ onClick, icon: Icon, label, accent }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0D1120", border: `1px solid ${accent ? accent + "40" : "#141A2B"}`, borderRadius: 9, padding: "8px 12px", color: accent || "#94A3B8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
      <Icon size={13} /> {label}
    </button>
  );
}

function smallBtnStyle(color) {
  return { background: "none", border: `1px solid ${color}40`, borderRadius: 7, padding: "5px 10px", color, fontSize: 11.5, fontWeight: 700, cursor: "pointer" };
}

function ghostIconStyle(disabled, color) {
  return { background: "none", border: "none", color: disabled ? "#1E293B" : (color || "#475569"), cursor: disabled ? "default" : "pointer", display: "flex", padding: 4 };
}
