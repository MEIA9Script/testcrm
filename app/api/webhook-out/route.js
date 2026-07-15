import { NextResponse } from "next/server";
import https from "https";

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, payload } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: "URL do webhook não fornecida." }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      rejectUnauthorized: false, // Ignora erro de SSL do certificado do N8N
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let responseBody = "";
        res.on("data", (chunk) => { responseBody += chunk; });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(NextResponse.json({ success: true, data: responseBody }));
          } else {
            console.warn("Webhook retornou erro:", res.statusCode);
            resolve(NextResponse.json({ success: false, error: "Falha na resposta do webhook." }, { status: 502 }));
          }
        });
      });

      req.on("error", (err) => {
        console.error("Erro no envio do webhook proxy (https):", err);
        resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
      });

      req.write(postData);
      req.end();
    });
  } catch (err) {
    console.error("Erro interno ao despachar webhook:", err);
    return NextResponse.json({ success: false, error: "Erro interno do servidor." }, { status: 500 });
  }
}
