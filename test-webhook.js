require("dotenv").config({ path: ".env.local" });
const { POST } = require("./.next/server/app/api/webhook-in/route.js");
(async () => {
  const req = {
    headers: new Map([["authorization", `Bearer ${process.env.INCOMING_WEBHOOK_API_KEY}`]]),
    json: async () => ({
      action: "delete_activity",
      companyId: "co_1784064013976_mhxsxi",
      matchTitle: "01 MENSAGEM"
    })
  };
  const res = await POST(req);
  const data = await res.json();
  console.log("RESPONSE:", JSON.stringify(data, null, 2));
})();
