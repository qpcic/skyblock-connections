"use server";

import { Redis } from '@upstash/redis';

// Initialize Redis with Upstash credentials
const redis = new Redis({
    url: process.env.STORAGE_KV_REST_API_URL!,
    token: process.env.STORAGE_KV_REST_API_TOKEN!,
});

/**
 * Sends the daily board announcement to a dedicated Discord channel.
 * Includes @everyone ping and stats from the previous board.
 */
export async function sendDailyBoardNotification(boardNumber: number) {
    const dailyWebhookUrl = process.env.DISCORD_DAILY_WEBHOOK_URL;

    if (!dailyWebhookUrl) {
        console.error("Daily Webhook URL (DISCORD_DAILY_WEBHOOK_URL) is not defined.");
        return { success: false, error: "Missing Webhook URL" };
    }

    boardNumber++;
    // 1. Fetch yesterday's solve count
    const yesterdayBoard = boardNumber - 1;
    let yesterdaySolves = 0;
    try {
        yesterdaySolves = await redis.get<number>(`solves:board:${yesterdayBoard}`) || 0;
    } catch (e) {
        console.error("Redis fetch error for yesterday's stats:", e);
    }

    // 2. Construct the Message
    const message = {
        content: `# 🧩 New Connections Board!\n` +
            `**Board #${boardNumber}** is now live!\n\n` +
            `🏆 **Yesterday's Stats:** \`${yesterdaySolves}\` players solved Board #${yesterdayBoard}!\n\n` +
            `**Play here:** https://skyblock-connections.com/`,
    };

    // 3. Post to Discord
    try {
        const response = await fetch(dailyWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });
        return { success: response.ok };
    } catch (error) {
        console.error("Error sending daily notification:", error);
        return { success: false };
    }
}

/**
 * Sends user-submitted puzzle suggestions to the admin Discord channel.
 */
export async function sendToDiscord(data: any) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error("Suggestion Webhook URL is not defined.");
        return { success: false };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [
                    {
                        title: "🧩 New Skyblock Connection Suggestion",
                        color: 0x5865F2,
                        fields: [
                            {
                                name: "Category",
                                value: data.category || "No Category Provided",
                                inline: false,
                            },
                            {
                                name: "Words",
                                value: `\`${data.words.join("` • `")}\``,
                                inline: false,
                            },
                            {
                                name: "Author",
                                value: data.author || "Anonymous",
                                inline: true,
                            },
                            {
                                name: "Submitted On",
                                value: new Date().toLocaleDateString(),
                                inline: true,
                            },
                        ],
                        footer: {
                            text: "Skyblock Connections Admin Tools",
                        },
                        timestamp: new Date().toISOString(),
                    },
                ],
            }),
        });

        return { success: response.ok };
    } catch (error) {
        console.error("Error sending to Discord:", error);
        return { success: false };
    }
}

/**
 * Atomically increments the solve counter for the current board.
 */
export async function incrementSolveCount(boardNumber: number) {
    try {
        const newCount = await redis.incr(`solves:board:${boardNumber}`);
        return { success: true, newCount };
    } catch (error) {
        console.error("Failed to increment solves:", error);
        return { success: false };
    }
}

/**
 * Dev Tool: Manually triggers the Daily Notification logic.
 * This calls the logic directly to avoid loopback fetch errors on Vercel.
 */
export async function simulateCronWebhook() {
    // Safety check: Only allow in Dev mode
    if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Calculate the current active board number
        const now = new Date();
        const start = new Date("2026-04-18T22:00:00Z");
        const diff = now.getTime() - start.getTime();
        const boardNumber = Math.floor(diff / (1000 * 60 * 60 * 24));

        // Call the notification function directly
        const result = await sendDailyBoardNotification(boardNumber);
        return result;
    } catch (error: any) {
        console.error("Simulation failed:", error);
        return { success: false, error: error.message };
    }
}