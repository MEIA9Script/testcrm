import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizePhone(phone) {
  if (!phone) return "";
  let p = String(phone).replace(/\D/g, "");
  if (p.startsWith("55") && p.length > 11) {
    p = p.substring(2);
  }
  return p;
}

function cleanString(str) {
  if (!str) return "";
  return String(str).replace(/\s+/g, ' ').trim().toLowerCase();
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.INCOMING_WEBHOOK_API_KEY;

    if (!expectedKey) {
      return NextResponse.json({ success: false, error: "API key (INCOMING_WEBHOOK_API_KEY) não configurada no servidor." }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ success: false, error: "Não autorizado. Verifique o header Authorization." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error: fetchError } = await supabase
      .from("crm_data")
      .select("companies, flows")
      .eq("id", 1)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ success: false, error: "Erro ao buscar dados no Supabase." }, { status: 500 });
    }

    let companies = data.companies || [];
    let flows = data.flows || [];

    // Pegar parâmetros da URL para filtragem
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("stageId");
    const status = searchParams.get("status");
    const flowId = searchParams.get("flowId");
    const stageName = searchParams.get("stageName");
    const flowName = searchParams.get("flowName");
    const phoneParam = searchParams.get("phone");

    // Enriquecer os leads com os nomes de etapa e funil primeiro
    let enrichedLeads = companies.map(c => {
      const flow = flows.find(f => f.id === c.flowId) || flows[0];
      const stage = flow ? flow.stages?.find(s => s.id === c.stageId) : null;
      return {
        ...c,
        flowName: flow ? flow.name : null,
        stageName: stage ? stage.name : null
      };
    });

    let filteredLeads = enrichedLeads;

    if (status) {
      filteredLeads = filteredLeads.filter(c => c.status === status);
    }
    if (stageId) {
      filteredLeads = filteredLeads.filter(c => c.stageId === stageId);
    }
    if (flowId) {
      filteredLeads = filteredLeads.filter(c => c.flowId === flowId);
    }
    if (stageName) {
      const cleanSearchStage = cleanString(stageName);
      filteredLeads = filteredLeads.filter(c => cleanString(c.stageName) === cleanSearchStage);
    }
    if (flowName) {
      const cleanSearchFlow = cleanString(flowName);
      filteredLeads = filteredLeads.filter(c => cleanString(c.flowName) === cleanSearchFlow);
    }
    if (phoneParam) {
      const searchPhone = normalizePhone(phoneParam);
      filteredLeads = filteredLeads.filter(c => normalizePhone(c.phone) === searchPhone);
    }

    return NextResponse.json({ 
      success: true, 
      count: filteredLeads.length, 
      leads: filteredLeads 
    });

  } catch (error) {
    console.error("GET Leads API Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor." }, { status: 500 });
  }
}
