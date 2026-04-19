"use server";

export async function sendToDiscord(data: { category: string, words: string[], author: string }) {
    // Hardcoded URL as requested
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1495224796227698728/GNQRsK-vAYteTyERpj0pH1W1vM3M-P5ToqDutX2pcMlKOCasaOVCIx65S8TUSrPTo2Og";

    // Direct link to your PNG on GitHub (Raw version)
    const GITHUB_AVATAR = "https://raw.githubusercontent.com/qpcic/skyblock-connections/main/public/icon.png";

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Skyblock Connections",
                avatar_url: GITHUB_AVATAR,
                embeds: [{
                    title: "✨ New Category Submission",
                    color: 0x55FFFF, // Minecraft Diamond Blue
                    fields: [
                        {
                            name: "Category Title",
                            value: `\`${data.category || "Untitled"}\``,
                            inline: false
                        },
                        {
                            name: "Words",
                            value: data.words.map(w => `**${w}**`).join(" • "),
                            inline: false
                        },
                        {
                            name: "Suggested by",
                            value: `👤 ${data.author || "Anonymous"}`,
                            inline: true
                        }
                    ],
                    footer: { text: "Skyblock Connections Review System" },
                    timestamp: new Date().toISOString()
                }]
            })
        });

        return { success: response.ok };
    } catch (error) {
        console.error("Discord Webhook Error:", error);
        return { success: false };
    }
}