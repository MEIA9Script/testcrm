"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "../lib/supabase-browser";

const DEFAULT_LOSS_REASONS = [
  "Sem orçamento no momento",
  "Já tem site",
  "Não respondeu / sumiu",
  "Achou caro",
  "Fechou com concorrente",
];

/*
  Estrutura no Supabase (tudo numa linha só por simplicidade, workspace único):
  tabela crm_data:
    id (sempre 1, linha única compartilhada)
    companies (jsonb)
    flows (jsonb)
    loss_reasons (jsonb)
    updated_at (timestamptz)

  Isso reaproveita 100% da lógica de UI que já existia (que pensava em
  arrays simples de companies/flows), só trocando onde os dados são lidos/salvos.
*/

export function useCRMData() {
  const supabase = createClient();
  const [companies, setCompanies] = useState(null);
  const [flows, setFlows] = useState(null);
  const [lossReasons, setLossReasons] = useState(null);
  const [webhookConfig, setWebhookConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Refs for current state to allow reverting optimistic updates without triggering re-renders in useCallback
  const companiesRef = useRef(null);
  const flowsRef = useRef(null);
  const lossReasonsRef = useRef(null);
  const webhookConfigRef = useRef(null);
  const channelRef = useRef(null);
  const clientId = useRef(Math.random().toString(36).slice(2)).current;

  // Helper to update both state and ref
  const updateCompanies = (next) => { companiesRef.current = next; setCompanies(next); };
  const updateFlows = (next) => { flowsRef.current = next; setFlows(next); };
  const updateLossReasons = (next) => { lossReasonsRef.current = next; setLossReasons(next); };
  const updateWebhookConfig = (next) => { webhookConfigRef.current = next; setWebhookConfig(next); };

  const fetchCRMData = async () => {
    const { data, error: fetchError } = await supabase
      .from("crm_data")
      .select("companies, flows, loss_reasons, webhook_config")
      .eq("id", 1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    return data;
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await fetchCRMData();

        if (!data) {
          const initial = { id: 1, companies: [], flows: [], loss_reasons: DEFAULT_LOSS_REASONS, webhook_config: {} };
          const { error: insertError } = await supabase.from("crm_data").insert(initial);
          if (insertError) throw insertError;
          if (!active) return;
          updateCompanies([]);
          updateFlows([]);
          updateLossReasons(DEFAULT_LOSS_REASONS);
          updateWebhookConfig({});
        } else {
          if (!active) return;
          updateCompanies(data.companies || []);
          updateFlows(data.flows || []);
          updateLossReasons(data.loss_reasons || DEFAULT_LOSS_REASONS);
          updateWebhookConfig(data.webhook_config || {});
        }
        setLoaded(true);

        // Subscribes to Broadcast changes on the database
        channelRef.current = supabase.channel('crm-realtime')
          .on(
            'broadcast',
            { event: 'sync' },
            async (payload) => {
              if (payload.payload?.sender === clientId) return; // ignore our own broadcast
              if (active) {
                try {
                  const newData = await fetchCRMData();
                  if (newData && active) {
                    updateCompanies(newData.companies || []);
                    updateFlows(newData.flows || []);
                    updateLossReasons(newData.loss_reasons || DEFAULT_LOSS_REASONS);
                    updateWebhookConfig(newData.webhook_config || {});
                  }
                } catch (err) {
                  console.error("Erro ao sincronizar dados em tempo real:", err);
                }
              }
            }
          )
          .subscribe();

      } catch (e) {
        console.error(e);
        if (!active) return;
        setError("Não foi possível carregar os dados do Supabase. Verifique a conexão.");
        updateCompanies([]);
        updateFlows([]);
        updateLossReasons(DEFAULT_LOSS_REASONS);
        updateWebhookConfig({});
        setLoaded(true);
      }
    })();

    return () => {
      active = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [clientId]);

  const broadcastSync = () => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'sync', payload: { sender: clientId, ts: Date.now() } });
    }
  };

  const saveCompanies = useCallback(async (next) => {
    const prev = companiesRef.current;
    updateCompanies(next);
    const { error: saveError } = await supabase
      .from("crm_data")
      .update({ companies: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (saveError) {
      console.error(saveError);
      updateCompanies(prev);
      return { success: false, error: saveError };
    }
    broadcastSync();
    return { success: true };
  }, []);

  const saveFlows = useCallback(async (next) => {
    const prev = flowsRef.current;
    updateFlows(next);
    const { error: saveError } = await supabase
      .from("crm_data")
      .update({ flows: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (saveError) {
      console.error(saveError);
      updateFlows(prev);
      return { success: false, error: saveError };
    }
    broadcastSync();
    return { success: true };
  }, []);

  const saveLossReasons = useCallback(async (next) => {
    const prev = lossReasonsRef.current;
    updateLossReasons(next);
    const { error: saveError } = await supabase
      .from("crm_data")
      .update({ loss_reasons: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (saveError) {
      console.error(saveError);
      updateLossReasons(prev);
      return { success: false, error: saveError };
    }
    broadcastSync();
    return { success: true };
  }, []);

  const saveWebhookConfig = useCallback(async (next) => {
    const prev = webhookConfigRef.current;
    updateWebhookConfig(next);
    const { error: saveError } = await supabase
      .from("crm_data")
      .update({ webhook_config: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (saveError) {
      console.error(saveError);
      updateWebhookConfig(prev);
      return { success: false, error: saveError };
    }
    broadcastSync();
    return { success: true };
  }, []);

  return { companies, flows, lossReasons, webhookConfig, loaded, error, saveCompanies, saveFlows, saveLossReasons, saveWebhookConfig, setError };
}
