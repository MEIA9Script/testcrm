import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: "mock-user" } } }, error: null }),
        getUser: async () => ({ data: { user: { id: "mock-user" } }, error: null }),
        signInWithPassword: async () => ({ data: { user: { id: "mock-user" } }, error: null }),
        signOut: async () => ({ error: null }),
      },
      // no modo local não existe realtime: devolve um canal que não faz nada,
      // senão o useCRMData quebra e apaga os dados já carregados
      channel: () => {
        const canal = { on: () => canal, subscribe: () => canal, send: async () => {} };
        return canal;
      },
      removeChannel: () => {},
      from: (table) => {
        return {
          select: (columns) => {
            return {
              eq: (col, val) => {
                return {
                  maybeSingle: async () => {
                    if (typeof window === "undefined") return { data: null, error: null };
                    const localData = localStorage.getItem(`mock_${table}_${val}`);
                    if (localData) {
                      return { data: JSON.parse(localData), error: null };
                    }
                    return { data: null, error: null };
                  }
                };
              }
            };
          },
          insert: async (row) => {
            if (typeof window !== "undefined") {
              localStorage.setItem(`mock_${table}_${row.id}`, JSON.stringify(row));
            }
            return { error: null };
          },
          update: (fields) => {
            return {
              eq: (col, val) => {
                if (typeof window !== "undefined") {
                  const localData = localStorage.getItem(`mock_${table}_${val}`);
                  const current = localData ? JSON.parse(localData) : { id: val };
                  const next = { ...current, ...fields };
                  localStorage.setItem(`mock_${table}_${val}`, JSON.stringify(next));
                }
                return Promise.resolve({ error: null });
              }
            };
          }
        };
      }
    };
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
