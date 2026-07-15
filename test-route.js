const { POST } = require("./.next/server/app/api/webhook-in/route.js");
(async () => {
  // mock request
  const req = {
    headers: {
      get: (k) => k === "authorization" ? "Bearer test_key" : null
    },
    json: async () => ({
      action: "delete_activity",
      companyId: "co_123",
      matchTitle: "01 MENSAGEM"
    })
  };
  
  // mock process.env
  process.env.INCOMING_WEBHOOK_API_KEY = "test_key";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test_supabase_key";
  
  // we must mock supabase because we don't want to actually hit their DB or fail on invalid key
  const route = require("./.next/server/app/api/webhook-in/route.js");
  
  // Well, mocking supabase inside the compiled next.js server file is hard.
  // Instead, let's just read the route file and see if there's any JS quirk.
})();
