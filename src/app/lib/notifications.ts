import { Redis } from '@upstash/redis';

// Initialize Redis using your existing environment variables
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL!,
  token: process.env.STORAGE_KV_REST_API_TOKEN!,
});

/**
 * Sends a Discord notification for the new daily board,
 * including the solve statistics from the previous day.
 */
export async function sendDailyBoardNotification(boardNumber: number) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("Missing DISCORD_WEBHOOK_URL environment variable.");
  }

  // 1. Fetch yesterday's solve count from Upstash Redis
  const yesterdayBoard = boardNumber - 1;
  let yesterdaySolves = 0;

  try {
    // Matches your key format: "solves:board:N"
    const count = await redis.get<number>(`solves:board:${yesterdayBoard}`);
    yesterdaySolves = count || 0;
  } catch (dbError) {
    // Log the error but don't stop the notification from sending
    console.error("Failed to fetch yesterday's solves from Redis:", dbError);
  }

  // 2. Format the message with Discord Markdown
  const message = {
    content: `# 🧩 New Connections Board!\n` +
        `@everyone **Board #${boardNumber}** is now live!\n\n` +
        `🏆 **Yesterday's Stats:** \`${yesterdaySolves}\` players successfully solved Board #${yesterdayBoard}!\n\n` +
        `**Play here:** https://skyblock-connections.com/`,
  };

  // 3. Send the POST request to the Discord Webhook
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Discord API error (${res.status}): ${errorText}`);
    }

    return { success: true, board: boardNumber, historicalSolves: yesterdaySolves };
  } catch (fetchError: any) {
    console.error("Failed to send Discord webhook:", fetchError);
    throw fetchError;
  }
}