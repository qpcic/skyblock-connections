// app/submit/actions.ts

"use server";

import { Redis } from '@upstash/redis';
const redis = new Redis({
    url: process.env.STORAGE_KV_REST_API_URL,
    token: process.env.STORAGE_KV_REST_API_TOKEN,
});
export async function sendToDiscord(data: any) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error("Webhook URL is not defined.");
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
                        color: 0x5865F2, // Discord Blurple color (Hex: #5865F2)
                        fields: [
                            {
                                name: "Category",
                                value: data.category || "No Category Provided",
                                inline: false,
                            },
                            {
                                name: "Words",
                                value: `\`${data.words.join("` • `")}\``, // Inline code blocks for words
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

export async function incrementSolveCount(boardNumber: number) {
    try {
        // This atomically increases the counter for the current board
        const newCount = await redis.incr(`solves:board:${boardNumber}`);
        return { success: true, newCount };
    } catch (error) {
        console.error("Failed to increment solves:", error);
        return { success: false };
    }
}

export async function simulateCronWebhook() {
    // Only allow this if we are in development
    if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
        return { success: false, error: "Unauthorized" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    try {
        const response = await fetch(`${baseUrl}/api/cron`, {
            method: 'GET',
            headers: {
                // We simulate the Vercel Authorization header
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        });

        const data = await response.json();
        return { success: response.ok, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}