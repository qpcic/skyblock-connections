// app/submit/actions.ts
"use server";

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