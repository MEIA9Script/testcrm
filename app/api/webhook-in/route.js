import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizePhone(phone) {
  if (!phone) return "";
  let p = String(phone).replace(/\D/g, "");
  // Se tiver DDI 55 e for maior que 11 dígitos (ex: 5511999999999), tira o 55
  if (p.startsWith("55") && p.length > 11) {
    p = p.substring(2);
  }
  return p;
}

export async function POST(request) {
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

    const body = await request.json();
    const { action, companyId, phone, stageId, activity } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "Ação não especificada." }, { status: 400 });
    }
    if (action !== "update_stage" && action !== "add_activity") {
      return NextResponse.json({ success: false, error: "Ação inválida." }, { status: 400 });
    }
    if (!companyId && !phone) {
      return NextResponse.json({ success: false, error: "companyId ou phone é obrigatório." }, { status: 400 });
    }
    if (action === "update_stage" && !stageId) {
      return NextResponse.json({ success: false, error: "stageId é obrigatório para update_stage." }, { status: 400 });
    }
    if (action === "add_activity" && !activity) {
      return NextResponse.json({ success: false, error: "activity é obrigatório para add_activity." }, { status: 400 });
    }

    // Como os webhooks externos não têm sessão de usuário (não têm o cookie do CRM logado),
    // a proteção RLS do Supabase barraria a requisição.
    // Para contornar, usamos a SUPABASE_SERVICE_ROLE_KEY que bypassa o RLS.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Passo 1: Ler os dados atuais
    const { data, error: fetchError } = await supabase
      .from("crm_data")
      .select("companies")
      .eq("id", 1)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ success: false, error: "Erro ao buscar dados no Supabase." }, { status: 500 });
    }

    let companies = data.companies || [];

    // Passo 2: Localizar a empresa
    let targetIndex = -1;
    if (companyId) {
      targetIndex = companies.findIndex(c => String(c.id) === String(companyId));
    }

    // Fallback pra buscar por telefone se não achou pelo ID
    if (targetIndex === -1 && phone) {
      const normalizedSearch = normalizePhone(phone);
      targetIndex = companies.findIndex(c => {
        return normalizePhone(c.phone) === normalizedSearch;
      });
    }

    if (targetIndex === -1) {
      return NextResponse.json({ success: false, error: "Empresa não encontrada." }, { status: 404 });
    }

    // Copia do objeto pra fazer a alteração
    let targetCompany = { ...companies[targetIndex] };

    // Passo 3: Executar a ação
    if (action === "update_stage") {
      targetCompany.stageId = stageId;
      targetCompany.stageStartDate = new Date().toISOString().slice(0, 10);
    } else if (action === "add_activity") {
      const newActivity = {
        id: activity.id || `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        activityId: activity.activityId || "ext",
        stageId: activity.stageId || targetCompany.stageId,
        channel: activity.channel || "ext",
        title: activity.title || "Atividade externa",
        at: activity.at || new Date().toISOString()
      };

      const history = targetCompany.history || [];
      targetCompany.history = [...history, newActivity];
    }

    // Passo 4: Salvar no array
    companies[targetIndex] = targetCompany;

    const { error: updateError } = await supabase
      .from("crm_data")
      .update({
        companies,
        updated_at: new Date().toISOString()
      })
      .eq("id", 1);

    if (updateError) {
      return NextResponse.json({ success: false, error: "Erro ao salvar alterações no Supabase." }, { status: 500 });
    }

    return NextResponse.json({ success: true, company: targetCompany });

  } catch (error) {
    console.error("Webhook In Error:", error);
    return NextResponse.json({ success: false, error: "Erro interno do servidor." }, { status: 500 });
  }
}
