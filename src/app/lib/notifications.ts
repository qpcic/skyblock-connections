export async function sendDailyBoardNotification(boardNumber: number) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL");

  const message = {
    content: `# 🧩 New Connections Board!\n@everyone **Board #${boardNumber}** is now live!\n\n**Play here:** https://skyblock-connections.com/`,
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!res.ok) throw new Error(`Discord error: ${res.statusText}`);
  return true;
}