import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Missing keys" }, { status: 500 });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from("crm_data").select("*").eq("id", 1).single();

  if (error || !data) {
    return NextResponse.json({ error: "Erro ao buscar dados no Supabase." }, { status: 500 });
  }

  const co = data.companies?.find(c => c.id === "co_1783988423345_yr9azd");

  if (!co) {
    return NextResponse.json({ error: "Company não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ company: co, flow: data.flows?.find(f => f.id === co.flowId) });
}
