"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("crm_data")
          .select("companies, flows, loss_reasons")
          .eq("id", 1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          // Primeira vez — cria a linha inicial
          const initial = { id: 1, companies: [], flows: [], loss_reasons: DEFAULT_LOSS_REASONS };
          const { error: insertError } = await supabase.from("crm_data").insert(initial);
          if (insertError) throw insertError;
          if (!active) return;
          setCompanies([]);
          setFlows([]);
          setLossReasons(DEFAULT_LOSS_REASONS);
        } else {
          if (!active) return;
          setCompanies(data.companies || []);
          setFlows(data.flows || []);
          setLossReasons(data.loss_reasons || DEFAULT_LOSS_REASONS);
        }
        setLoaded(true);
      } catch (e) {
        console.error(e);
        if (!active) return;
        setError("Não foi possível carregar os dados do Supabase. Verifique a conexão.");
        setCompanies([]);
        setFlows([]);
        setLossReasons(DEFAULT_LOSS_REASONS);
        setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const saveCompanies = useCallback(async (next) => {
    setCompanies(next);
    const { error: saveError } = await supabase
      .from("crm_data")
      .update({ companies: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (saveError) {
      console.error(saveError);
      setError("Não foi possível salvar. Tente novamente.");
    }
  }, []);

  const saveFlows = useCallback(async (next) => {
    setFlows(next);
    const { error: saveError } = await supabase
      .from("crm_data")
      .update({ flows: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (saveError) {
      console.error(saveError);
      setError("Não foi possível salvar. Tente novamente.");
    }
  }, []);

  const saveLossReasons = useCallback(async (next) => {
    setLossReasons(next);
    const { error: saveError } = await supabase
      .from("crm_data")
      .update({ loss_reasons: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (saveError) {
      console.error(saveError);
      setError("Não foi possível salvar. Tente novamente.");
    }
  }, []);

  return { companies, flows, lossReasons, loaded, error, saveCompanies, saveFlows, saveLossReasons, setError };
}
