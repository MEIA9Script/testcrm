function trimStringsDeep(obj) {
  if (typeof obj === "string") return obj.replace(/\s+/g, ' ').trim();
  if (Array.isArray(obj)) return obj.map(trimStringsDeep);
  if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = trimStringsDeep(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export async function triggerWebhook(webhookConfig, eventName, payload) {
  if (!eventName) return;
  const cleanEvent = eventName.trim();

  if (!webhookConfig || !webhookConfig.url || !webhookConfig.events?.[cleanEvent]) {
    return;
  }

  try {
    const cleanPayload = trimStringsDeep(payload);
    const data = {
      event: cleanEvent,
      timestamp: new Date().toISOString(),
      payload: cleanPayload
    };
    await fetch("/api/webhook-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookConfig.url, payload: data }),
    });
  } catch (err) {
    console.error("Webhook falhou ao enviar para o proxy:", err);
  }
}
