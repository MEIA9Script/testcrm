import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      .select("companies")
      .eq("id", 1)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ success: false, error: "Erro ao buscar dados no Supabase." }, { status: 500 });
    }

    let companies = data.companies || [];

    // Pegar parâmetros da URL para filtragem (ex: ?stageId=st1&status=ativo)
    const { searchParams } = new URL(request.url);
    const stageId = searchParams.get("stageId");
    const status = searchParams.get("status");
    const flowId = searchParams.get("flowId");

    let filteredLeads = companies;

    // Filtrar os leads de acordo com os parâmetros enviados
    if (stageId) {
      filteredLeads = filteredLeads.filter(c => c.stageId === stageId);
    }
    if (status) {
      // Ex: se o n8n pedir ?status=ativo, vai pegar tudo que seja 'ativo' (ou pode ser customizado pelo user)
      filteredLeads = filteredLeads.filter(c => c.status === status);
    }
    if (flowId) {
      filteredLeads = filteredLeads.filter(c => c.flowId === flowId);
    }

    // Retorna todos os dados úteis das empresas encontradas (incluindo stageStartDate)
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
