import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, payload } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: "URL do webhook não fornecida." }, { status: 400 });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("Webhook retornou erro:", response.status, response.statusText);
      return NextResponse.json({ success: false, error: "Falha na resposta do webhook." }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro interno ao despachar webhook:", err);
    return NextResponse.json({ success: false, error: "Erro interno do servidor." }, { status: 500 });
  }
}
