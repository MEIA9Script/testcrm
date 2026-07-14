const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from("crm_data").select("team").eq("id", 1).maybeSingle();
  console.log(error ? "Error: " + error.message : "Success: " + JSON.stringify(data));
}
run();
