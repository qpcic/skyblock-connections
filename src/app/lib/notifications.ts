import { Redis } from '@upstash/redis';

// Initialize Redis
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL!,
  token: process.env.STORAGE_KV_REST_API_TOKEN!,
});

/**
 * Sends a Discord notification for the new daily board.
 * Uses a dedicated "Daily Announcement" webhook.
 */
export async function sendDailyBoardNotification(boardNumber: number) {
  // Use a specific env var for the daily announcements
  const dailyWebhookUrl = process.env.DISCORD_DAILY_WEBHOOK_URL;

  if (!dailyWebhookUrl) {
    throw new Error("Missing DISCORD_DAILY_WEBHOOK_URL environment variable.");
  }

  // 1. Fetch yesterday's solve count

  const yesterdayBoard = boardNumber - 1;
  let yesterdaySolves = 0;

  try {
    const count = await redis.get<number>(`solves:board:${yesterdayBoard}`);
    yesterdaySolves = count || 0;
  } catch (dbError) {
    console.error("Failed to fetch yesterday's solves from Redis:", dbError);
  }

  // 2. Format the message
  // Using the @everyone ping as requested
  const message = {
    content: `# 🧩 New Connections Board!\n` +
        `**Board #${boardNumber}** is now live!\n\n` +
        `🏆 **Yesterday's Stats:** \`${yesterdaySolves}\` players successfully solved Board #${yesterdayBoard}!\n\n` +
        `**Play here:** https://skyblock-connections.com/`,
  };

  // 3. Send the request
  try {
    const res = await fetch(dailyWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Discord API error (${res.status}): ${errorText}`);
    }

    return { success: true };
  } catch (fetchError: any) {
    console.error("Failed to send Daily Discord webhook:", fetchError);
    throw fetchError;
  }
}