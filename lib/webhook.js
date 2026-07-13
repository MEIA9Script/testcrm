export async function triggerWebhook(webhookConfig, eventName, payload) {
  if (!webhookConfig || !webhookConfig.url || !webhookConfig.events?.[eventName]) {
    return;
  }
  try {
    const data = {
      event: eventName,
      timestamp: new Date().toISOString(),
      payload
    };
    await fetch(webhookConfig.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      // no-cors or ignore response because we don't care and don't want to block
    });
  } catch (err) {
    console.error("Webhook falhou:", err);
  }
}
